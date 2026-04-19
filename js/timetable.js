/**
 * Timetable Manager - File Upload, Extraction & Smart Suggestions
 */

class TimetableManager {
    constructor() {
        this.timetables = this.loadTimetables();
        this.lectures   = this.loadLectures();
        this.settings   = this.loadSettings();
        this.initializeEventListeners();
        this.renderUI();
        this.startDailyAlertCheck();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover',  (e) => this.handleDragOver(e));
            uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadArea.addEventListener('drop',      (e) => this.handleDrop(e));
        }
        const dailyToggle = document.getElementById('dailyAlertsToggle');
        if (dailyToggle && this.settings.dailyAlerts) dailyToggle.classList.add('on');
        const soundToggle = document.getElementById('soundNotifToggle');
        if (soundToggle && this.settings.soundNotif)  soundToggle.classList.add('on');
    }

    handleDragOver(e)  { e.preventDefault(); document.getElementById('uploadArea').classList.add('drag-over'); }
    handleDragLeave(e) { e.preventDefault(); document.getElementById('uploadArea').classList.remove('drag-over'); }
    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) this.processFile(e.dataTransfer.files[0]);
    }

    handleFileUpload(file) { this.processFile(file); }

    processFile(file) {
        const fileName = file.name;
        const fileExt  = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
        const validExts = ['.pdf', '.png', '.jpg', '.jpeg', '.csv'];
        if (!validExts.includes(fileExt)) {
            this.showToast('Invalid file format. Use PDF, PNG, JPG, or CSV', 'error');
            return;
        }

        this.showToast('Reading file…', 'info');
        const reader = new FileReader();

        reader.onload = (e) => {
            const fileData = e.target.result;
            if (fileExt === '.csv') {
                this.parseCSVFile(fileData, fileName);
            } else {
                // Store file and open the extraction editor so user can fill in courses
                // while viewing their uploaded timetable image/PDF
                this.storeAndExtract(fileData, fileName, file.type, fileExt);
            }
        };
        reader.onerror = () => this.showToast('Error reading file', 'error');
        fileExt === '.csv' ? reader.readAsText(file) : reader.readAsDataURL(file);
    }

    /* ── CSV PARSING ────────────────────────────────────────────────────── */

    parseCSVFile(csvData, fileName) {
        try {
            const lines = csvData.trim().split(/\r?\n/);
            const added = [];

            // Flexible CSV: Course,Time,Room,Days  (header row skipped)
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                if (parts.length < 2 || !parts[0]) continue;

                const course = parts[0];
                const time   = parts[1] || '';
                const room   = parts[2] || 'TBA';
                const daysRaw = parts[3] || 'Mon,Tue,Wed,Thu,Fri';

                const timeParts = time.split(/[-–]/);
                const startTime = timeParts[0]?.trim() || '';
                const endTime   = timeParts[1]?.trim() || '';

                // Accept any time-like string
                if (course) {
                    added.push({
                        id:          'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                        course,
                        room,
                        startTime,
                        endTime,
                        days:        daysRaw.split(/[|,]/).map(d => d.trim()).filter(Boolean),
                        dateAdded:   new Date().toLocaleDateString(),
                        uploadedFile: fileName
                    });
                }
            }

            if (added.length === 0) {
                this.showToast('No valid courses found in CSV. Check the format.', 'warning');
            } else {
                added.forEach(l => this.lectures.push(l));
                this.saveLectures();
                this.showToast(`Added ${added.length} lecture(s) from CSV!`, 'success');
            }
        } catch (err) {
            this.showToast('Error parsing CSV file', 'error');
            console.error(err);
        }

        this.saveTimetable(fileName, csvData, 'csv');
        this.renderUI();
    }

    /* ── IMAGE / PDF UPLOAD → AUTO-EXTRACTION ──────────────────────────────── */

    async storeAndExtract(fileData, fileName, fileType, fileExt) {
        const timetable = {
            id:        Date.now(),
            name:      fileName,
            type:      fileType.includes('pdf') ? 'pdf' : 'image',
            data:      fileData,
            dateAdded: new Date().toLocaleDateString(),
            size:      (fileData.length / 1024).toFixed(0) + ' KB'
        };
        this.timetables.push(timetable);
        this.saveTimetables();
        this.renderUI();

        // Show scanning overlay
        this._showScanModal(fileName);
        let detected = [];
        try {
            if (timetable.type === 'image') {
                detected = await this._ocrImage(fileData);
            } else {
                detected = await this._pdfExtractText(fileData);
            }
        } catch(e) {
            console.warn('Auto-extraction failed:', e);
        }
        document.getElementById('_kairosDetectModal')?.remove();

        if (detected.length > 0) {
            this.showToast(`Detected ${detected.length} course(s) from "${fileName}". Review below.`, 'success');
        } else {
            this.showToast(`Could not auto-detect courses from "${fileName}". Enter them manually.`, 'info');
        }
        this.openExtractionEditor(timetable, detected);
    }

    _showScanModal(fileName) {
        document.getElementById('_kairosDetectModal')?.remove();
        const m = document.createElement('div');
        m.id = '_kairosDetectModal';
        m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;';
        m.innerHTML = `<div style="background:#fff;border-radius:18px;padding:36px 40px;text-align:center;max-width:340px;width:90%;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
            <div style="font-size:2.8rem;margin-bottom:14px;">🔍</div>
            <h3 style="margin:0 0 6px;font-family:Poppins,sans-serif;color:#1a1a2e;">Scanning Timetable</h3>
            <p style="color:#6b7280;font-size:0.88rem;margin-bottom:20px;">Auto-detecting courses from<br><strong>${fileName}</strong></p>
            <div style="height:5px;background:#f0eeff;border-radius:3px;overflow:hidden;">
              <div id="_kairosDetectBar" style="height:100%;background:linear-gradient(90deg,#6C63FF,#a39bff);border-radius:3px;width:30%;animation:_kScan 1.4s ease-in-out infinite;"></div>
            </div>
            <style>@keyframes _kScan{0%,100%{width:20%;margin-left:0}50%{width:50%;margin-left:30%}}</style>
        </div>`;
        document.body.appendChild(m);
    }

    async _ocrImage(dataUrl) {
        if (!window.Tesseract) throw new Error('Tesseract not loaded');
        const bar = document.getElementById('_kairosDetectBar');
        const result = await Tesseract.recognize(dataUrl, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text' && bar) {
                    const pct = Math.round(m.progress * 100);
                    bar.style.cssText = `height:100%;background:linear-gradient(90deg,#6C63FF,#a39bff);border-radius:3px;width:${pct}%;animation:none;transition:width 0.3s;`;
                }
            }
        });
        return this._parseTimetableText(result.data.text);
    }

    async _pdfExtractText(dataUrl) {
        if (!window.pdfjsLib) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                s.onload = s.onerror = resolve;
                document.head.appendChild(s);
            });
        }
        if (!window.pdfjsLib) return [];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const b64 = dataUrl.split(',')[1];
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        let text = '';
        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            text += tc.items.map(i => i.str).join(' ') + '\n';
        }
        return this._parseTimetableText(text);
    }

    _parseTimetableText(text) {
        const courses = [], seen = new Set();
        const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 2);

        const codeRx   = /\b([A-Z]{2,5}\s?\d{3,4}[A-Z]?)\b/g;
        const t24Rx    = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
        const t12Rx    = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([AaPp][Mm])\b/g;
        const dayRx    = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi;

        for (let i = 0; i < lines.length; i++) {
            const block = lines.slice(Math.max(0, i - 1), i + 3).join(' ');
            let m; codeRx.lastIndex = 0;
            while ((m = codeRx.exec(block)) !== null) {
                const code = m[1].replace(/\s+/, '');
                if (seen.has(code)) continue;
                seen.add(code);

                const times = [];
                let tm; t24Rx.lastIndex = 0;
                while ((tm = t24Rx.exec(block)) !== null)
                    times.push(`${tm[1].padStart(2,'0')}:${tm[2]}`);
                if (!times.length) {
                    t12Rx.lastIndex = 0;
                    while ((tm = t12Rx.exec(block)) !== null) {
                        let h = parseInt(tm[1]);
                        const mn = tm[2] || '00', ap = tm[3].toUpperCase();
                        if (ap === 'PM' && h !== 12) h += 12;
                        if (ap === 'AM' && h === 12) h = 0;
                        times.push(`${String(h).padStart(2,'0')}:${mn}`);
                    }
                }

                const days = [];
                dayRx.lastIndex = 0;
                while ((tm = dayRx.exec(block)) !== null) {
                    const d = tm[1].slice(0,3);
                    const nd = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
                    if (!days.includes(nd)) days.push(nd);
                }

                const roomM = block.match(/\b(Room\s*\w+|Hall\s*[A-Z]?\d*|Lab\s*\w+|[A-Z]{1,2}\d{2,4})\b/i);
                const st = times[0] || '08:00';
                const et = times[1] || this._addHours(st, 2);
                courses.push({
                    course: code, room: roomM ? roomM[1].trim() : 'TBA',
                    startTime: st, endTime: et,
                    days: days.length ? days : ['Mon']
                });
            }
        }
        return courses;
    }

    _addHours(t, h) {
        const [hh, mm] = t.split(':').map(Number);
        return `${String(Math.min(23, hh + h)).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
    }

    /* ── EXTRACTION EDITOR MODAL ─────────────────────────────────────────── */

    openExtractionEditor(timetable, preDetected = []) {
        document.getElementById('extractionModal')?.remove();
        this._pendingExtracted = [...preDetected];

        const isImage = timetable.type === 'image';
        const previewHTML = isImage
            ? `<img src="${timetable.data}" style="max-width:100%;border-radius:8px;display:block;">`
            : `<iframe src="${timetable.data}" style="width:100%;height:380px;border:none;border-radius:8px;"></iframe>`;

        const hasDetected = preDetected.length > 0;

        const modal = document.createElement('div');
        modal.id = 'extractionModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px;';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:16px;max-width:980px;width:100%;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                <div style="padding:18px 24px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <div>
                        <h2 style="margin:0;font-size:1.2rem;color:#1a1a2e;font-family:Poppins,sans-serif;">
                            ${hasDetected ? '✅ Courses Auto-Detected' : '📅 Timetable Editor'}
                        </h2>
                        <p style="margin:3px 0 0;font-size:0.82rem;color:#6b7280;">
                            ${hasDetected ? `Found ${preDetected.length} course(s). Review, edit, or add more below.` : 'View your timetable and add courses manually.'}
                        </p>
                    </div>
                    <button onclick="document.getElementById('extractionModal').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#999;">✕</button>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;flex:1;overflow:hidden;min-height:0;">
                    <div style="padding:14px;overflow-y:auto;border-right:1px solid #eee;background:#f8f9ff;">
                        <div style="font-weight:700;margin-bottom:10px;color:#6C63FF;font-size:0.8rem;letter-spacing:0.06em;">YOUR TIMETABLE</div>
                        ${previewHTML}
                    </div>
                    <div style="padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
                        <div style="font-weight:700;color:#6C63FF;font-size:0.8rem;letter-spacing:0.06em;">
                            ${hasDetected ? 'AUTO-DETECTED COURSES (tap to remove)' : 'ADD COURSES'}
                        </div>
                        <div id="extractedCoursesList" style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;"></div>
                        <details style="margin-top:4px;" ${hasDetected ? '' : 'open'}>
                            <summary style="cursor:pointer;font-size:0.85rem;font-weight:600;color:#6C63FF;padding:6px 0;list-style:none;">
                                <span>+ Add / Edit a Course Manually</span>
                            </summary>
                            <div style="background:#f8f9ff;border-radius:10px;padding:14px;margin-top:8px;display:grid;gap:8px;">
                                <input id="exCourse" type="text" placeholder="Course code (e.g. ACC301)" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:0.88rem;width:100%;">
                                <input id="exRoom" type="text" placeholder="Room (e.g. Hall A)" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:0.88rem;width:100%;">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                                    <div><label style="font-size:0.78rem;color:#6b7280;display:block;margin-bottom:3px;">Start Time</label><input id="exStart" type="time" value="08:00" style="padding:7px;border:1px solid #e5e7eb;border-radius:8px;width:100%;font-size:0.88rem;"></div>
                                    <div><label style="font-size:0.78rem;color:#6b7280;display:block;margin-bottom:3px;">End Time</label><input id="exEnd" type="time" value="10:00" style="padding:7px;border:1px solid #e5e7eb;border-radius:8px;width:100%;font-size:0.88rem;"></div>
                                </div>
                                <div>
                                    <label style="font-size:0.78rem;color:#6b7280;display:block;margin-bottom:5px;">Days</label>
                                    <div style="display:flex;flex-wrap:wrap;gap:5px;">
                                        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
                                            `<label style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:0.82rem;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:3px 8px;">
                                                <input type="checkbox" class="ex-day" value="${d}"> ${d}
                                            </label>`).join('')}
                                    </div>
                                </div>
                                <button onclick="timetableManager.addExtractedCourse()" style="background:#6C63FF;color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.88rem;">
                                    + Add Course
                                </button>
                            </div>
                        </details>
                    </div>
                </div>

                <div style="padding:14px 24px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;gap:12px;">
                    <span id="exCountBadge" style="font-size:0.85rem;color:#6b7280;"></span>
                    <div style="display:flex;gap:10px;">
                        <button onclick="document.getElementById('extractionModal').remove()" style="padding:9px 18px;background:#f3f4f6;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.88rem;">Cancel</button>
                        <button onclick="timetableManager.saveExtractedCourses()" style="padding:9px 22px;background:#6C63FF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.88rem;">
                            Save ${hasDetected ? preDetected.length : ''} Course(s)
                        </button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(modal);

        // Render pre-detected courses
        preDetected.forEach((c, idx) => this._renderExtractedItem(c, idx));
        this._updateExCount();
    }

    _renderExtractedItem(entry, idx) {
        const list = document.getElementById('extractedCoursesList');
        if (!list) return;
        const item = document.createElement('div');
        item.id = `exItem_${idx}`;
        item.style.cssText = 'background:#f0eeff;border-left:3px solid #6C63FF;padding:8px 12px;border-radius:7px;font-size:0.83rem;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;cursor:pointer;';
        item.title = 'Tap to remove';
        item.innerHTML = `<div>
            <strong>${entry.course}</strong> <span style="color:#6b7280;font-size:0.75rem;">${entry.room}</span><br>
            <span style="color:#6C63FF;">${entry.startTime}${entry.endTime ? ' - ' + entry.endTime : ''}</span>
            <span style="color:#6b7280;margin-left:6px;font-size:0.75rem;">${(entry.days||[]).join(', ')}</span>
        </div><button onclick="timetableManager.removeExtractedItem(${idx})" style="background:none;border:none;color:#FF4757;cursor:pointer;font-size:0.95rem;padding:0 2px;">✕</button>`;
        list.appendChild(item);
        this._updateExCount();
    }

    removeExtractedItem(idx) {
        this._pendingExtracted.splice(idx, 1);
        // Re-render list
        const list = document.getElementById('extractedCoursesList');
        if (!list) return;
        list.innerHTML = '';
        this._pendingExtracted.forEach((c, i) => this._renderExtractedItem(c, i));
        this._updateExCount();
    }

    _updateExCount() {
        const badge = document.getElementById('exCountBadge');
        if (badge) badge.textContent = `${(this._pendingExtracted||[]).length} course(s) ready to save`;
    }

    addExtractedCourse() {
        const course = document.getElementById('exCourse').value.trim();
        const room   = document.getElementById('exRoom').value.trim() || 'TBA';
        const start  = document.getElementById('exStart').value;
        const end    = document.getElementById('exEnd').value;
        const days   = Array.from(document.querySelectorAll('.ex-day:checked')).map(c => c.value);

        if (!course) { this.showToast('Please enter a course name', 'warning'); return; }

        const entry = { course, room, startTime: start, endTime: end, days };
        if (!this._pendingExtracted) this._pendingExtracted = [];
        this._pendingExtracted.push(entry);
        this._renderExtractedItem(entry, this._pendingExtracted.length - 1);

        // Clear form
        document.getElementById('exCourse').value = '';
        document.getElementById('exRoom').value = '';
        document.getElementById('exStart').value = '08:00';
        document.getElementById('exEnd').value = '10:00';
        document.querySelectorAll('.ex-day').forEach(c => c.checked = false);
    }

    saveExtractedCourses() {
        const pending = this._pendingExtracted || [];
        if (pending.length === 0) {
            this.showToast('Add at least one course first', 'warning');
            return;
        }
        pending.forEach(entry => {
            this.lectures.push({
                id:          'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                course:      entry.course,
                room:        entry.room,
                startTime:   entry.startTime,
                endTime:     entry.endTime,
                days:        entry.days,
                dateAdded:   new Date().toLocaleDateString(),
                uploadedFile: 'Extracted from upload'
            });
        });
        this.saveLectures();
        document.getElementById('extractionModal')?.remove();
        this._pendingExtracted = [];
        this.renderUI();
        this.showToast(`Saved ${pending.length} course(s) to your timetable!`, 'success');

        // Prompt to generate study plan
        setTimeout(() => {
            if (confirm(`${pending.length} course(s) saved!\n\nWould you like Kairos to suggest a personal study timetable based on your lectures?`)) {
                this.generateStudyPlan();
            }
        }, 400);
    }

    /* ── SMART STUDY PLAN GENERATOR ──────────────────────────────────────── */

    generateStudyPlan() {
        if (this.lectures.length === 0) {
            this.showToast('Add your lectures first before generating a study plan', 'warning');
            return;
        }

        const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
        const suggestions = [];

        // For each lecture, suggest a pre-lecture study session and a post-lecture review
        this.lectures.forEach(lec => {
            (lec.days || []).forEach(day => {
                const dayIdx = dayMap[day] ?? dayMap[day.slice(0, 3)];
                if (dayIdx === undefined) return;

                // Pre-study: 1 hour before class (if class has a start time)
                if (lec.startTime) {
                    const [h, m] = lec.startTime.split(':').map(Number);
                    const preHour = Math.max(6, h - 1);
                    const preHourIdx = preHour - 6; // timetable grid starts at 6AM (index 0)
                    if (preHourIdx >= 0 && preHourIdx < 17) {
                        suggestions.push({
                            title:    `Study: ${lec.course}`,
                            type:     'study',
                            dayIndex: dayIdx,
                            hourIndex: preHourIdx
                        });
                    }
                }

                // Post-review: 1 hour after class
                if (lec.endTime && lec.endTime !== 'TBA') {
                    const [h2, m2] = lec.endTime.split(':').map(Number);
                    const reviewHour = h2 + (m2 > 0 ? 1 : 0);
                    const reviewHourIdx = reviewHour - 6;
                    if (reviewHourIdx >= 0 && reviewHourIdx < 17) {
                        suggestions.push({
                            title:    `Review: ${lec.course}`,
                            type:     'study',
                            dayIndex: dayIdx,
                            hourIndex: reviewHourIdx
                        });
                    }
                }
            });
        });

        if (suggestions.length === 0) {
            this.showToast('Could not generate suggestions  -  make sure your lectures have times and days set', 'warning');
            return;
        }

        // Show the suggestion preview modal
        this.showStudyPlanModal(suggestions);
    }

    showStudyPlanModal(suggestions) {
        document.getElementById('studyPlanModal')?.remove();

        const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const HOURS = ['6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM'];

        const rows = suggestions.map(s => `
            <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:8px 12px;font-weight:500">${s.title}</td>
                <td style="padding:8px 12px;color:#6b7280">${DAYS[s.dayIndex]}</td>
                <td style="padding:8px 12px;color:#6b7280">${HOURS[s.hourIndex] || ''}</td>
            </tr>`).join('');

        const modal = document.createElement('div');
        modal.id = 'studyPlanModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:16px;max-width:600px;width:100%;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
                <div style="padding:20px 24px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h2 style="margin:0;font-size:1.15rem;color:#1a1a2e;">✨ Suggested Study Timetable</h2>
                        <p style="margin:4px 0 0;font-size:0.85rem;color:#6b7280;">Based on your ${this.lectures.length} lecture(s)  -  edit to your preference in the Planner</p>
                    </div>
                    <button onclick="document.getElementById('studyPlanModal').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#999;">✕</button>
                </div>
                <div style="overflow-y:auto;flex:1;padding:16px 24px;">
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <thead>
                            <tr style="background:#f8f9ff;">
                                <th style="padding:8px 12px;text-align:left;color:#6C63FF;font-size:0.8rem;">SESSION</th>
                                <th style="padding:8px 12px;text-align:left;color:#6C63FF;font-size:0.8rem;">DAY</th>
                                <th style="padding:8px 12px;text-align:left;color:#6C63FF;font-size:0.8rem;">TIME</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <p style="margin:0;font-size:0.82rem;color:#6b7280;">These will be added to your Planner. You can edit or delete them there.</p>
                    <div style="display:flex;gap:10px;flex-shrink:0;">
                        <button onclick="document.getElementById('studyPlanModal').remove()" style="padding:10px 18px;background:#f3f4f6;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.9rem;">Dismiss</button>
                        <button onclick="timetableManager.applyStudyPlan()" style="padding:10px 22px;background:#6C63FF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.9rem;">
                            Apply to Planner
                        </button>
                    </div>
                </div>
            </div>`;

        this._pendingSuggestions = suggestions;
        document.body.appendChild(modal);
    }

    applyStudyPlan() {
        const suggestions = this._pendingSuggestions || [];
        suggestions.forEach(s => {
            const existing = JSON.parse(localStorage.getItem('kairos_events') || '[]');
            const conflict = existing.some(e => e.dayIndex === s.dayIndex && e.hourIndex === s.hourIndex);
            if (!conflict) {
                const events = JSON.parse(localStorage.getItem('kairos_events') || '[]');
                events.push({
                    id:        'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
                    title:     s.title,
                    type:      s.type,
                    dayIndex:  s.dayIndex,
                    hourIndex: s.hourIndex,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('kairos_events', JSON.stringify(events));
            }
        });

        document.getElementById('studyPlanModal')?.remove();
        this._pendingSuggestions = [];
        this.showToast(`Study plan added to your Planner! Go to Planner to edit.`, 'success');
    }

    /* ── MANUAL LECTURE (upload tab) ─────────────────────────────────────── */

    addManualLecture() {
        const course    = document.getElementById('courseName').value.trim();
        const room      = document.getElementById('roomLocation').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime   = document.getElementById('endTime').value;
        const days      = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(c => c.value);

        if (!course || !startTime || days.length === 0) {
            this.showToast('Please fill in course name, start time, and select at least one day', 'warning');
            return;
        }

        this.lectures.push({
            id:          'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            course,
            room:        room || 'TBA',
            startTime,
            endTime:     endTime || 'TBA',
            days,
            dateAdded:   new Date().toLocaleDateString(),
            uploadedFile: 'Manual Entry'
        });
        this.saveLectures();

        document.getElementById('courseName').value    = '';
        document.getElementById('roomLocation').value  = '';
        document.getElementById('startTime').value     = '';
        document.getElementById('endTime').value       = '';
        document.querySelectorAll('.day-checkbox').forEach(c => c.checked = false);

        this.showToast('Lecture added!', 'success');
        this.renderUI();
    }

    /* ── CREATE TAB (quick add) ──────────────────────────────────────────── */

    quickAddLecture() {
        const course    = document.getElementById('quickCourseName').value.trim();
        const room      = document.getElementById('quickRoom').value.trim();
        const startTime = document.getElementById('quickStartTime').value;
        const endTime   = document.getElementById('quickEndTime').value;
        const days      = Array.from(document.querySelectorAll('.quick-day-checkbox:checked')).map(c => c.value);

        if (!course || !startTime || days.length === 0) {
            this.showToast('Please fill in required fields', 'warning');
            return;
        }

        this.lectures.push({
            id:          'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            course,
            room:        room || 'TBA',
            startTime,
            endTime:     endTime || 'TBA',
            days,
            dateAdded:   new Date().toLocaleDateString(),
            uploadedFile: 'Created',
            isCustom:    true
        });
        this.saveLectures();

        document.getElementById('quickCourseName').value = '';
        document.getElementById('quickRoom').value       = '';
        document.getElementById('quickStartTime').value  = '';
        document.getElementById('quickEndTime').value    = '';
        document.querySelectorAll('.quick-day-checkbox').forEach(c => c.checked = false);

        this.renderCreateUI();
        this.showToast('Lecture added to timetable!', 'success');
    }

    saveTimetableAsNew() {
        const customLectures = this.lectures.filter(l => l.isCustom);
        if (customLectures.length === 0) {
            this.showToast('Add at least one lecture first', 'warning');
            return;
        }
        const name = prompt('Enter a name for your timetable:', `My Timetable - ${new Date().toLocaleDateString()}`);
        if (!name) return;

        this.timetables.push({
            id:           Date.now(),
            name,
            type:         'custom',
            lectureCount: customLectures.length,
            dateAdded:    new Date().toLocaleDateString()
        });
        this.saveTimetables();
        this.showToast(`Timetable "${name}" saved!`, 'success');
        this.renderUI();
    }

    clearCreateTimetable() {
        if (!confirm('Clear all custom lectures?')) return;
        this.lectures = this.lectures.filter(l => !l.isCustom);
        this.saveLectures();
        document.getElementById('quickCourseName').value = '';
        document.getElementById('quickRoom').value       = '';
        document.getElementById('quickStartTime').value  = '';
        document.getElementById('quickEndTime').value    = '';
        document.querySelectorAll('.quick-day-checkbox').forEach(c => c.checked = false);
        this.renderCreateUI();
        this.showToast('Custom timetable cleared', 'info');
    }

    /* ── ALERTS ──────────────────────────────────────────────────────────── */

    startDailyAlertCheck() {
        setInterval(() => { if (this.settings.dailyAlerts) this.checkUpcomingLectures(); }, 60000);
        if (this.settings.dailyAlerts) this.checkUpcomingLectures();
    }

    checkUpcomingLectures() {
        const now = new Date();
        const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
        const todayLectures = this.lectures.filter(l => l.days && l.days.some(d => today.startsWith(d)));
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const advance = parseInt(this.settings.alertAdvanceTime);

        todayLectures.forEach(lec => {
            if (!lec.startTime) return;
            const [h, m] = lec.startTime.split(':').map(Number);
            const lectureMin = h * 60 + m;
            const alertMin   = lectureMin - advance;

            if (currentMin >= alertMin && currentMin < lectureMin) {
                const key = `notif_${lec.id}_${now.toDateString()}`;
                if (!sessionStorage.getItem(key)) {
                    this.sendLectureAlert(lec);
                    sessionStorage.setItem(key, '1');
                }
            }
        });
    }

    sendLectureAlert(lecture) {
        this.showToast(`🔔 ${lecture.course} starts at ${lecture.startTime} (${lecture.room})`, 'info');
        if (this.settings.soundNotif) this.playAlertSound();
        if (Notification.permission === 'granted') {
            new Notification('Lecture Alert – Kairos', {
                body: `${lecture.course} starts at ${lecture.startTime} in ${lecture.room}`,
                icon: '1000669890-Photoroom.png',
                tag:  `lec_${lecture.id}`
            });
        }
    }

    playAlertSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 800; osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(); osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    toggleDailyAlerts() {
        this.settings.dailyAlerts = !this.settings.dailyAlerts;
        this.saveSettings();
        document.getElementById('dailyAlertsToggle').classList.toggle('on');
        document.getElementById('alertStatus').textContent = this.settings.dailyAlerts ? 'ON' : 'OFF';
        this.showToast(`Daily alerts ${this.settings.dailyAlerts ? 'enabled' : 'disabled'}`, 'info');
        if (this.settings.dailyAlerts) {
            if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
            this.checkUpcomingLectures();
        }
    }

    toggleSoundNotif() {
        this.settings.soundNotif = !this.settings.soundNotif;
        this.saveSettings();
        document.getElementById('soundNotifToggle').classList.toggle('on');
        this.showToast(`Sound ${this.settings.soundNotif ? 'enabled' : 'disabled'}`, 'info');
    }

    /* ── CRUD ACTIONS ────────────────────────────────────────────────────── */

    deleteTimetable(id) {
        if (!confirm('Delete this timetable?')) return;
        this.timetables = this.timetables.filter(t => t.id !== id);
        this.saveTimetables();
        this.showToast('Timetable deleted', 'info');
        this.renderUI();
    }

    viewTimetable(id) {
        const t = this.timetables.find(t => t.id === id);
        if (!t || !t.data) return;
        const w = window.open('', '_blank');
        w.document.write(`<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;">
            <img src="${t.data}" style="max-width:95%;max-height:95vh;border-radius:8px;">
        </body></html>`);
    }

    downloadTimetable(id) {
        const t = this.timetables.find(t => t.id === id);
        if (!t || !t.data) return;
        const a = document.createElement('a');
        a.href = t.data; a.download = t.name; a.click();
    }

    deleteLecture(id) {
        if (!confirm('Delete this lecture?')) return;
        this.lectures = this.lectures.filter(l => String(l.id) !== String(id));
        this.saveLectures();
        this.showToast('Lecture deleted', 'info');
        this.renderUI();
    }

    /* ── TODAY'S LECTURES ────────────────────────────────────────────────── */

    getTodayLectures() {
        const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
        return this.lectures
            .filter(l => l.days && l.days.some(d => today.startsWith(d)))
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }

    /* ── RENDER ──────────────────────────────────────────────────────────── */

    renderUI() {
        // Stats
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('totalTimetables', this.timetables.length);
        setEl('totalLectures',   this.lectures.length);
        setEl('alertStatus',     this.settings.dailyAlerts ? 'ON' : 'OFF');

        // Uploaded files
        const fc = document.getElementById('uploadedFiles');
        if (fc) {
            if (this.timetables.length === 0) {
                fc.innerHTML = '<p style="color:var(--text-secondary);text-align:center;margin:0;">No timetables uploaded yet</p>';
            } else {
                fc.innerHTML = this.timetables.map(t => `
                    <div class="file-item">
                        <div class="file-icon"><i class="fas ${t.type === 'pdf' ? 'fa-file-pdf' : t.type === 'custom' ? 'fa-calendar-check' : 'fa-image'}"></i></div>
                        <div class="file-info">
                            <p class="file-name" title="${t.name}">${t.name}</p>
                            <p class="file-time">${t.dateAdded}${t.size ? ' · ' + t.size : ''}</p>
                        </div>
                        <div class="file-actions">
                            ${t.data ? `<button class="btn-view" onclick="timetableManager.viewTimetable(${t.id})" title="View"><i class="fas fa-eye"></i></button>` : ''}
                            ${t.data ? `<button class="btn-download-file" onclick="timetableManager.downloadTimetable(${t.id})" title="Download"><i class="fas fa-download"></i></button>` : ''}
                            <button class="btn-delete-file" onclick="timetableManager.deleteTimetable(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('');
            }
        }

        // Today's lectures
        const lc = document.getElementById('lectureSchedule');
        if (lc) {
            const today = this.getTodayLectures();
            if (this.lectures.length === 0) {
                lc.innerHTML = '<p style="color:var(--text-secondary);text-align:center;margin:0;">No lectures scheduled yet</p>';
            } else if (today.length === 0) {
                lc.innerHTML = `<p style="color:var(--text-secondary);text-align:center;margin:0;">No lectures today</p>
                    <p style="color:var(--text-secondary);font-size:0.85rem;text-align:center;margin:var(--spacing-md) 0 0 0;">You have ${this.lectures.length} lecture(s) this week</p>`;
            } else {
                lc.innerHTML = today.map(l => this.renderLectureItem(l)).join('');
            }
        }
    }

    renderLectureItem(l) {
        return `<div class="lecture-item">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div>
                    <div class="lecture-time">${l.startTime || '?'} – ${l.endTime || '?'}</div>
                    <p class="lecture-course">${l.course}</p>
                    <p class="lecture-room"><i class="fas fa-map-marker-alt" style="margin-right:4px;"></i>${l.room}</p>
                    <p style="font-size:0.8rem;color:var(--text-secondary);margin:4px 0 0 0;">${(l.days || []).join(', ')}</p>
                </div>
                <button class="btn-delete-file" onclick="timetableManager.deleteLecture('${l.id}')" style="padding:4px 8px;" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>`;
    }

    renderCreateUI() {
        this.renderDaysGrid();
        this.renderTimetablePreview();
    }

    renderDaysGrid() {
        const grid = document.getElementById('daysGrid');
        if (!grid) return;
        const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        grid.innerHTML = days.map(day => {
            const count = this.lectures.filter(l => l.days && l.days.some(d => day.startsWith(d))).length;
            return `<div class="day-card ${count > 0 ? 'has-lectures' : ''}">
                <div class="day-name">${day.slice(0, 3)}</div>
                <div class="lecture-count">${count} lecture${count !== 1 ? 's' : ''}</div>
            </div>`;
        }).join('');
    }

    renderTimetablePreview() {
        const preview = document.getElementById('timetablePreview');
        if (!preview) return;
        const custom = this.lectures.filter(l => l.isCustom).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        if (custom.length === 0) {
            preview.innerHTML = '<p style="color:var(--text-secondary);text-align:center;margin:0;">No lectures added yet</p>';
            return;
        }
        preview.innerHTML = custom.map(l => this.renderLectureItem(l)).join('');
    }

    /* ── TOAST ───────────────────────────────────────────────────────────── */

    showToast(message, type = 'info') {
        // Use global showToast from app.js if available
        if (typeof showToast === 'function') { showToast(message, type); return; }
        const c = document.getElementById('toastContainer');
        if (!c) return;
        const t = document.createElement('div');
        const bg = { success: '#2ED573', error: '#FF4757', warning: '#FFA502', info: '#6C63FF' }[type] || '#6C63FF';
        t.style.cssText = `background:${bg};color:#fff;padding:14px 18px;margin-bottom:10px;border-radius:8px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
        t.textContent = message;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    /* ── PERSISTENCE ─────────────────────────────────────────────────────── */

    loadTimetables() { try { return JSON.parse(localStorage.getItem('kairos_timetables')) || []; } catch { return []; } }
    saveTimetables() { localStorage.setItem('kairos_timetables', JSON.stringify(this.timetables)); }
    loadLectures()   { try { return JSON.parse(localStorage.getItem('kairos_lectures'))   || []; } catch { return []; } }
    saveLectures()   { localStorage.setItem('kairos_lectures',   JSON.stringify(this.lectures)); }

    loadSettings() {
        const defaults = { dailyAlerts: false, soundNotif: false, alertAdvanceTime: '15' };
        try { return { ...defaults, ...JSON.parse(localStorage.getItem('kairos_timetable_settings') || '{}') }; }
        catch { return defaults; }
    }
    saveSettings() { localStorage.setItem('kairos_timetable_settings', JSON.stringify(this.settings)); }
}

/* ── INIT ─────────────────────────────────────────────────────────────────── */

let timetableManager;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    timetableManager = new TimetableManager();
});

/* ── GLOBAL HANDLERS for HTML onclick ────────────────────────────────────── */

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && timetableManager) timetableManager.handleFileUpload(file);
    event.target.value = '';  // allow re-uploading same file
}
function addManualLecture()    { timetableManager?.addManualLecture(); }
function quickAddLecture()     { timetableManager?.quickAddLecture(); }
function saveTimetableAsNew()  { timetableManager?.saveTimetableAsNew(); }
function clearCreateTimetable(){ timetableManager?.clearCreateTimetable(); }
function toggleDailyAlerts()   { timetableManager?.toggleDailyAlerts(); }
function toggleSoundNotif()    { timetableManager?.toggleSoundNotif(); }
function generateStudyPlan()   { timetableManager?.generateStudyPlan(); }

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    event.target.classList.add('active');
    if (tabName === 'create' && timetableManager) timetableManager.renderCreateUI();
}
