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

                const timeParts = time.split(/[-]/);
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
        m.style.cssText = 'position:fixed;inset:0;background:rgba(10, 10, 20, 0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;';
        m.innerHTML = `
            <div style="position:relative;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:50px;text-align:center;max-width:400px;width:90%;box-shadow:0 0 40px rgba(108,99,255,0.2), inset 0 0 20px rgba(108,99,255,0.05);overflow:hidden;">
                <!-- Scanning Beam Effect -->
                <div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:conic-gradient(from 0deg, transparent 70%, rgba(108,99,255,0.3) 100%);animation:spin 4s linear infinite;z-index:0;opacity:0.5;"></div>
                <div style="position:absolute;inset:2px;background:#1a1a2e;border-radius:22px;z-index:1;"></div>
                
                <div style="position:relative;z-index:2;">
                    <div style="position:relative;width:80px;height:80px;margin:0 auto 20px;">
                        <div style="position:absolute;inset:0;border:3px solid rgba(108,99,255,0.3);border-radius:50%;border-top-color:#6C63FF;animation:spin 1s linear infinite;"></div>
                        <i class="fas fa-crosshairs" style="font-size:2rem;color:#6C63FF;line-height:80px;"></i>
                    </div>
                    <h3 style="margin:0 0 8px;color:#fff;font-size:1.5rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Kairos AI Scanner</h3>
                    <p style="color:#a0a0b0;font-size:0.9rem;margin-bottom:25px;line-height:1.4;">Extracting scheduling data from<br><strong style="color:#fff;">${fileName}</strong></p>
                    
                    <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,0.5);">
                        <div id="_kairosDetectBar" style="position:absolute;top:0;left:0;height:100%;background:linear-gradient(90deg, #6C63FF, #00d2ff, #6C63FF);background-size:200% 100%;border-radius:10px;width:15%;animation:kScan 2s ease-in-out infinite, pulseGlow 1.5s infinite;"></div>
                    </div>
                    <div style="margin-top:12px;color:#6C63FF;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;animation:pulseText 1s infinite alternate;">Analyzing Document...</div>
                </div>
            </div>
            <style>
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes kScan { 0% { left: 0%; width: 15%; } 50% { left: 85%; width: 15%; } 100% { left: 0%; width: 15%; } }
                @keyframes pulseGlow { 0% { box-shadow: 0 0 5px #6C63FF; } 50% { box-shadow: 0 0 15px #00d2ff, 0 0 5px #6C63FF; } 100% { box-shadow: 0 0 5px #6C63FF; } }
                @keyframes pulseText { 0% { opacity: 0.5; } 100% { opacity: 1; } }
            </style>
        `;
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
        
        // Extract 2D bounding boxes from Tesseract
        const items = [];
        if (result.data && result.data.words) {
            for (const word of result.data.words) {
                items.push({
                    text: word.text,
                    x: word.bbox.x0,
                    y: word.bbox.y0,
                    w: word.bbox.x1 - word.bbox.x0,
                    h: word.bbox.y1 - word.bbox.y0
                });
            }
        }
        
        const courses2D = this._parseTimetable2D(items);
        if (courses2D && courses2D.length > 0) return courses2D;

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
        let items = [];
        let yOffset = 0; // stack pages vertically for 2D parsing
        
        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });
            
            for (const item of tc.items) {
                // In PDF.js, item.transform is [scaleX, skewY, skewX, scaleY, translateX, translateY]
                // Origin is bottom-left. We convert to top-left.
                const tx = item.transform[4];
                const ty = viewport.height - item.transform[5];
                items.push({
                    text: item.str,
                    x: tx,
                    y: ty + yOffset,
                    w: item.width,
                    h: item.height
                });
            }
            text += tc.items.map(i => i.str).join(' ') + '\n';
            yOffset += viewport.height;
        }
        
        const courses2D = this._parseTimetable2D(items);
        if (courses2D && courses2D.length > 0) return courses2D;

        return this._parseTimetableText(text);
    }

    _parseTimetable2D(items) {
        if (!items || items.length === 0) return [];

        const courses = [];
        const courseRegex = /^([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)$/i;
        const courseInTextRegex = /\b([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)\b/i;
        const timeRegex24 = /^(?:[01]?\d|2[0-3])[:.][0-5]\d$/;
        const timeRegex12 = /^(?:1[0-2]|0?[1-9])[:.]?(?:[0-5]\d)?\s*(?:AM|PM)$/i;
        const dayRegex = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su)$/i;
        const DAY_NORMALIZE = {
            'mo':'Mon','tu':'Tue','we':'Wed','th':'Thu','fr':'Fri','sa':'Sat','su':'Sun',
            'mon':'Mon','tue':'Tue','wed':'Wed','thu':'Thu','fri':'Fri','sat':'Sat','sun':'Sun',
            'monday':'Mon','tuesday':'Tue','wednesday':'Wed','thursday':'Thu',
            'friday':'Fri','saturday':'Sat','sunday':'Sun',
        };
        const MWF_MAP = {
            'mwf':['Mon','Wed','Fri'], 'mw':['Mon','Wed'], 'wf':['Wed','Fri'],
            'tth':['Tue','Thu'], 'tuth':['Tue','Thu'], 'tueth':['Tue','Thu'],
            'mf':['Mon','Fri'], 'tw':['Tue','Wed'], 'wth':['Wed','Thu'],
            'thf':['Thu','Fri'], 'mtwthf':['Mon','Tue','Wed','Thu','Fri'],
            'mtuth':['Mon','Tue','Thu'], 'mtw':['Mon','Tue','Wed'],
            'mtwf':['Mon','Tue','Wed','Fri'], 'twf':['Tue','Wed','Fri'],
        };

        // Merge nearby words into longer phrases (useful for "8:00 - 10:00")
        const mergedItems = [];
        let currentGroup = [];
        const sortedItems = [...items].sort((a,b) => a.y - b.y || a.x - b.x);
        for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            if (!item.text.trim()) continue;
            if (currentGroup.length === 0) {
                currentGroup.push(item);
            } else {
                const last = currentGroup[currentGroup.length - 1];
                // Same row if y-diff < 15, horizontal gap < 60 (wider threshold handles PDFs)
                if (Math.abs(item.y - last.y) < 15 && (item.x - (last.x + last.w)) < 60) {
                    currentGroup.push(item);
                } else {
                    mergedItems.push(this._mergeGroup(currentGroup));
                    currentGroup = [item];
                }
            }
        }
        if (currentGroup.length > 0) mergedItems.push(this._mergeGroup(currentGroup));

        const dayRowZones = [];
        const timeColZones = [];
        const courseItems = [];
        const uncategorized = [];

        for (const item of mergedItems) {
            // Check if exact day name
            let dMatch = item.text.match(dayRegex);
            if (!dMatch) {
                const words = item.text.split(' ');
                if (words.length === 1) dMatch = words[0].match(dayRegex);
            }
            if (dMatch) {
                const normalized = DAY_NORMALIZE[dMatch[1].toLowerCase()] ||
                    (dMatch[1].slice(0,3).charAt(0).toUpperCase() + dMatch[1].slice(0,3).slice(1).toLowerCase());
                dayRowZones.push({ day: normalized, y: item.y, h: item.h });
                continue;
            }

            // Check multi-day shorthand (MWF, TTh, TuTh, MW, etc.)
            const lowerClean = item.text.trim().toLowerCase().replace(/[^a-z]/g, '');
            if (MWF_MAP[lowerClean]) {
                MWF_MAP[lowerClean].forEach(d => dayRowZones.push({ day: d, y: item.y, h: item.h }));
                continue;
            }

            // Check if time range (e.g. "8:00 - 10:00" or just "8:00")
            const times = [];
            const timeTokens = item.text.split(/\s*[-–to]+\s*/);
            for (const tk of timeTokens) {
                const t = tk.trim();
                if (t.match(timeRegex24) || t.match(timeRegex12)) times.push(t.replace('.', ':'));
            }
            if (times.length > 0) {
                const st = this._formatTime(times[0]);
                const et = times.length > 1 ? this._formatTime(times[1]) : this._addHours(st, 2);
                timeColZones.push({ startTime: st, endTime: et, x: item.x, w: item.w });
                continue;
            }

            // Check if course code — exact match first
            let cMatch = item.text.match(courseRegex);
            let detectedRoom = null;

            if (!cMatch) {
                // Try combining adjacent word pairs (handles "CS 101" → "CS101")
                const words = item.text.split(/\s+/);
                for (let w = 0; w < words.length - 1; w++) {
                    const comb = words[w] + words[w+1];
                    const cbMatch = comb.match(/^([A-Z]{2,5})(\d{3,4}[A-Z]?)$/i);
                    if (cbMatch) { cMatch = [comb, cbMatch[1], cbMatch[2]]; break; }
                }
            }

            if (!cMatch) {
                // Try finding course code embedded inside longer text (e.g. "CS101 Room205")
                const embedded = item.text.match(courseInTextRegex);
                if (embedded) {
                    cMatch = embedded;
                    // Also try to extract a room code from the same item
                    const roomPart = item.text.replace(embedded[0], '').trim();
                    const rmMatch = roomPart.match(/\b([A-Z]{0,3}[0-9]{1,4}[A-Z]?)\b/);
                    if (rmMatch) detectedRoom = rmMatch[0];
                }
            }

            if (cMatch) {
                courseItems.push({
                    code: `${cMatch[1].toUpperCase()}${cMatch[2]}`,
                    x: item.x + item.w / 2,
                    y: item.y + item.h / 2,
                    room: detectedRoom
                });
                continue;
            }

            uncategorized.push(item);
        }

        if (dayRowZones.length === 0 || timeColZones.length === 0 || courseItems.length === 0) {
            return [];
        }

        // Project courses onto day/time grid
        for (const cItem of courseItems) {
            let closestDay = null, minDy = Infinity;
            for (const rz of dayRowZones) {
                const dy = Math.abs(cItem.y - rz.y);
                if (dy < minDy && dy < 150) { minDy = dy; closestDay = rz.day; }
            }

            let closestTime = null, minDx = Infinity;
            for (const cz of timeColZones) {
                const dx = Math.abs(cItem.x - (cz.x + cz.w / 2));
                if (dx < minDx && dx < 300) { minDx = dx; closestTime = cz; }
            }

            if (closestDay && closestTime) {
                // Try to extract room from nearby uncategorized items if not already found
                let room = cItem.room || 'TBA';
                if (!cItem.room) {
                    for (const ui of uncategorized) {
                        const dx = Math.abs(cItem.x - (ui.x + ui.w / 2));
                        const dy = Math.abs(cItem.y - (ui.y + ui.h / 2));
                        if (dx < 200 && dy < 50) {
                            const rm = ui.text.match(/\b(?:(?:Room|Rm|Hall|Lab|Bldg?)\.?\s*#?\s*)?([A-Z]{0,3}[0-9]{1,4}[A-Z]?)\b/i);
                            if (rm) { room = rm[0].trim(); break; }
                        }
                    }
                }
                courses.push({ course: cItem.code, room, startTime: closestTime.startTime, endTime: closestTime.endTime, days: [closestDay] });
            }
        }

        // Remove exact duplicates
        return courses.filter((v,i,a) => a.findIndex(v2 =>
            v2.course === v.course && v2.startTime === v.startTime && v2.days.join() === v.days.join()
        ) === i);
    }

    _mergeGroup(group) {
        const x = Math.min(...group.map(g => g.x));
        const y = Math.min(...group.map(g => g.y));
        const maxRight = Math.max(...group.map(g => g.x + g.w));
        const maxBottom = Math.max(...group.map(g => g.y + g.h));
        return {
            text: group.map(g => g.text).join(' '),
            x: x,
            y: y,
            w: maxRight - x,
            h: maxBottom - y
        };
    }

    _formatTime(t) {
        if (!t) return "08:00";
        t = t.toUpperCase().replace('.', ':');
        let isPM = t.includes('PM');
        let timePart = t.replace(/\s*(AM|PM)/, '').trim();
        if (!timePart.includes(':')) timePart += ':00';
        let parts = timePart.split(':');
        let h = parseInt(parts[0]);
        let m = parts[1] || '00';
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return `${String(h).padStart(2,'0')}:${m}`;
    }

    _parseTimetableText(text) {
        const courses = [];
        const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 1);

        // Improved heuristics for course extraction
        const courseRegex = /\b([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)\b/i; // E.g. CS 101, MATH-201, PHY3000
        const timeRegex24 = /\b(?:[01]?\d|2[0-3])[:.][0-5]\d\b/g;
        const timeRegex12 = /\b(?:1[0-2]|0?[1-9])[:.]?(?:[0-5]\d)?\s*(?:AM|PM)\b/gi;
        const dayRegex = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su)\b/i;
        const DAY_NORM_TEXT = {
            'mo':'Mon','tu':'Tue','we':'Wed','th':'Thu','fr':'Fri','sa':'Sat','su':'Sun',
            'mon':'Mon','tue':'Tue','wed':'Wed','thu':'Thu','fri':'Fri','sat':'Sat','sun':'Sun',
        };
        const roomRegex = /\b(?:Room|Rm|Hall|Lab|Classroom|Building)\s*#?[A-Z0-9-]+\b|\b[A-Z]{1,2}[0-9]{2,4}\b/i;

        let currentDayContext = 'Mon';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Context tracking: If a line explicitly names a day, assume subsequent courses belong to it
            const dayMatch = line.match(dayRegex);
            if (dayMatch) {
                const raw = dayMatch[1].toLowerCase();
                currentDayContext = DAY_NORM_TEXT[raw] ||
                    (raw.charAt(0).toUpperCase() + raw.slice(1, 3).toLowerCase());
            }

            // Look for a course code in the current or adjacent lines
            const block = lines.slice(Math.max(0, i - 1), i + 2).join(' ');
            const codeMatch = line.match(courseRegex);
            
            if (codeMatch) {
                const code = `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;
                
                // Avoid extracting the exact same course on the exact same line twice
                if (courses.some(c => c.course === code && c._lineIdx === i)) continue;

                // Extract Times
                let times = [];
                let tm; 
                timeRegex24.lastIndex = 0;
                while ((tm = timeRegex24.exec(block)) !== null) times.push(tm[0].replace('.', ':'));
                
                if (times.length < 2) {
                    timeRegex12.lastIndex = 0;
                    while ((tm = timeRegex12.exec(block)) !== null) {
                        let tstr = tm[0].toUpperCase().replace('.', ':');
                        // Normalize 12h to 24h for consistency
                        let isPM = tstr.includes('PM');
                        let timePart = tstr.replace(/\s*(AM|PM)/, '').trim();
                        if (!timePart.includes(':')) timePart += ':00';
                        let [h, m] = timePart.split(':');
                        h = parseInt(h);
                        if (isPM && h !== 12) h += 12;
                        if (!isPM && h === 12) h = 0;
                        times.push(`${String(h).padStart(2,'0')}:${m}`);
                    }
                }

                // Extract Days from block, fallback to context
                const MWF_EXPAND = {
                    'MWF':['Mon','Wed','Fri'], 'MW':['Mon','Wed'], 'WF':['Wed','Fri'],
                    'TTH':['Tue','Thu'], 'TUTH':['Tue','Thu'], 'TUETH':['Tue','Thu'],
                    'MF':['Mon','Fri'], 'TW':['Tue','Wed'], 'WTH':['Wed','Thu'],
                    'THF':['Thu','Fri'], 'MTWTHF':['Mon','Tue','Wed','Thu','Fri'],
                    'MTW':['Mon','Tue','Wed'], 'MTWF':['Mon','Tue','Wed','Fri'],
                };
                let days = [];
                // Check for multi-day shorthands first (e.g. MWF, TTh, TuTh)
                const mwfMatches = [...block.matchAll(/\b(MWF|MW|WF|TuTh|TTh|MF|TW|WTh|ThF|MTWTHF|MTW|MTWF)\b/gi)];
                for (const mm of mwfMatches) {
                    const key = mm[1].toUpperCase().replace(/[^A-Z]/g,'');
                    if (MWF_EXPAND[key]) {
                        for (const d of MWF_EXPAND[key]) { if (!days.includes(d)) days.push(d); }
                    }
                }
                if (days.length === 0) {
                    const blockDays = [...block.matchAll(new RegExp(dayRegex.source, 'gi'))];
                    for (const bd of blockDays) {
                        const raw = bd[1].toLowerCase();
                        const nd = DAY_NORM_TEXT[raw] ||
                            (raw.charAt(0).toUpperCase() + raw.slice(1, 3).toLowerCase());
                        if (!days.includes(nd)) days.push(nd);
                    }
                }
                if (days.length === 0) days.push(currentDayContext);

                // Extract Room
                const rmMatch = block.match(roomRegex);
                const room = rmMatch ? rmMatch[0].trim() : 'TBA';

                // Deduce start and end
                // Sort times to guess start and end
                times.sort();
                const st = times[0] || '08:00';
                const et = times[1] || this._addHours(st, 2);

                courses.push({
                    course: code,
                    room: room,
                    startTime: st,
                    endTime: et,
                    days: days,
                    _lineIdx: i // internal tracker
                });
            }
        }
        
        // Cleanup internal trackers
        courses.forEach(c => delete c._lineIdx);
        
        // Remove duplicates (same course, same day, same time)
        const uniqueCourses = courses.filter((v,i,a)=>a.findIndex(v2=>(v2.course===v.course && v2.startTime===v.startTime && v2.days.join()===v.days.join()))===i);
        
        return uniqueCourses;
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
            ? `<div style="width:100%;height:100%;background:url('${timetable.data}') center/contain no-repeat;border-radius:12px;"></div>`
            : `<iframe src="${timetable.data}#zoom=FitH" style="width:100%;height:100%;border:none;border-radius:12px;"></iframe>`;

        const hasDetected = preDetected.length > 0;
        const subtitleText = hasDetected ? "AI identified <strong style='color:#6C63FF;'>" + preDetected.length + "</strong> potential courses. Please verify and refine." : "Add your courses manually alongside your timetable.";

        const modal = document.createElement('div');
        modal.id = 'extractionModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(15, 15, 25, 0.85);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,sans-serif;animation:modalFadeIn 0.3s ease-out;';
        
        modal.innerHTML = `
            <style>
                @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .k-editor-glass { background: rgba(255, 255, 255, 0.95); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; }
                .k-course-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; transition: all 0.2s; position:relative; overflow:hidden; }
                .k-course-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-color:#6C63FF; }
                .k-course-card::before { content:''; position:absolute; top:0; left:0; width:4px; height:100%; background: linear-gradient(to bottom, #6C63FF, #00d2ff); }
                .k-input { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:0.85rem; width:100%; transition:all 0.2s; box-sizing:border-box;}
                .k-input:focus { outline:none; border-color:#6C63FF; box-shadow:0 0 0 3px rgba(108,99,255,0.1); background:#fff; }
                .k-day-chip { display:inline-block; padding:3px 8px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:12px; font-size:0.75rem; color:#475569; cursor:pointer; transition:all 0.2s; margin:2px; }
                .k-day-chip input:checked + span { color:#fff; }
                .k-day-chip:has(input:checked) { background:#6C63FF; border-color:#6C63FF; }
                .k-btn-primary { background:linear-gradient(135deg, #6C63FF, #5a52d5); color:#fff; border:none; padding:10px 24px; border-radius:10px; font-weight:600; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 6px -1px rgba(108,99,255,0.3); }
                .k-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 8px -1px rgba(108,99,255,0.4); }
                .k-btn-ghost { background:transparent; color:#64748b; border:1px solid #cbd5e1; padding:10px 20px; border-radius:10px; font-weight:600; cursor:pointer; transition:all 0.2s; }
                .k-btn-ghost:hover { background:#f1f5f9; color:#334155; }
            </style>
            
            <div class="k-editor-glass" style="max-width:1100px;width:100%;height:90vh;display:flex;flex-direction:column;overflow:hidden;">
                <!-- Header -->
                <div style="padding:20px 30px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(to right, #ffffff, #f8fafc);">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:40px;height:40px;border-radius:10px;background:rgba(108,99,255,0.1);display:flex;align-items:center;justify-content:center;color:#6C63FF;font-size:1.2rem;">
                            <i class="fas fa-magic"></i>
                        </div>
                        <div>
                            <h2 style="margin:0;font-size:1.25rem;color:#0f172a;font-weight:700;">Extraction Results</h2>
                            <p style="margin:2px 0 0;font-size:0.85rem;color:#64748b;">${subtitleText}</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('extractionModal').remove()" style="background:none;border:none;font-size:1.5rem;color:#94a3b8;cursor:pointer;padding:5px;border-radius:50%;transition:all 0.2s;" onmouseover="this.style.backgroundColor='#f1f5f9';this.style.color='#0f172a'" onmouseout="this.style.backgroundColor='transparent';this.style.color='#94a3b8'">✕</button>
                </div>

                <!-- Body -->
                <div style="display:flex; flex:1; overflow:hidden;">
                    <!-- Left: Original View -->
                    <div style="flex:5; padding:20px; background:#f8fafc; border-right:1px solid #e2e8f0; display:flex; flex-direction:column;">
                        <div style="font-size:0.75rem; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; display:flex; justify-content:space-between;">
                            <span>Original Source</span>
                            <span style="color:#6C63FF;"><i class="fas fa-search-plus"></i> Use this to verify times</span>
                        </div>
                        <div style="flex:1; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:4px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            ${previewHTML}
                        </div>
                    </div>
                    
                    <!-- Right: Editor Panel -->
                    <div style="flex:4; display:flex; flex-direction:column; background:#ffffff;">
                        <div style="padding:15px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.75rem; font-weight:700; color:#0f172a; letter-spacing:1px; text-transform:uppercase;">Extracted Courses</span>
                            <span id="exCountBadge" style="background:#e0e7ff; color:#4338ca; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">0 Valid</span>
                        </div>
                        
                        <!-- List -->
                        <div id="extractedCoursesList" style="flex:1; overflow-y:auto; padding:15px 20px; display:flex; flex-direction:column; gap:12px; background:#fafafa;"></div>
                        
                        <!-- Add Manual -->
                        <div style="padding:15px 20px; background:#fff; border-top:1px solid #e2e8f0;">
                            <details id="addCourseDetails">
                                <summary style="cursor:pointer; font-size:0.85rem; font-weight:600; color:#6C63FF; list-style:none; display:flex; align-items:center; gap:8px;">
                                    <i class="fas fa-plus-circle"></i> Add Missing Course Manually
                                </summary>
                                <div style="margin-top:12px; padding:12px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px;">
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                                        <input id="exCourse" type="text" placeholder="Course Code" class="k-input">
                                        <input id="exRoom" type="text" placeholder="Room/Loc" class="k-input">
                                    </div>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                                        <div><div style="font-size:0.7rem;color:#64748b;margin-bottom:2px;">Start</div><input id="exStart" type="time" value="08:00" class="k-input"></div>
                                        <div><div style="font-size:0.7rem;color:#64748b;margin-bottom:2px;">End</div><input id="exEnd" type="time" value="10:00" class="k-input"></div>
                                    </div>
                                    <div style="margin-bottom:10px;">
                                        <div style="font-size:0.7rem;color:#64748b;margin-bottom:4px;">Days</div>
                                        <div style="display:flex; flex-wrap:wrap;">
                                            <label class="k-day-chip"><input type="checkbox" class="ex-day" value="Mon" style="display:none;"><span>Mon</span></label>
                                            <label class="k-day-chip"><input type="checkbox" class="ex-day" value="Tue" style="display:none;"><span>Tue</span></label>
                                            <label class="k-day-chip"><input type="checkbox" class="ex-day" value="Wed" style="display:none;"><span>Wed</span></label>
                                            <label class="k-day-chip"><input type="checkbox" class="ex-day" value="Thu" style="display:none;"><span>Thu</span></label>
                                            <label class="k-day-chip"><input type="checkbox" class="ex-day" value="Fri" style="display:none;"><span>Fri</span></label>
                                        </div>
                                    </div>
                                    <button onclick="timetableManager.addExtractedCourse()" style="width:100%; background:#0f172a; color:#fff; border:none; padding:8px; border-radius:8px; cursor:pointer; font-weight:500; font-size:0.85rem;"><i class="fas fa-check"></i> Add Course</button>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding:15px 30px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.8rem; color:#64748b;">
                        <i class="fas fa-info-circle" style="color:#6C63FF"></i> Review your courses carefully before saving.
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="k-btn-ghost" onclick="document.getElementById('extractionModal').remove()">Cancel</button>
                        <button class="k-btn-primary" onclick="timetableManager.saveExtractedCourses()">
                            <i class="fas fa-save"></i> Save to Planner
                        </button>
                    </div>
                </div>
            </div>
        `;

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
        item.className = 'k-course-card';
        
        // Format days for display
        const dayString = (entry.days||[]).map(d => `<span style="background:rgba(108,99,255,0.1);color:#6C63FF;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:600;margin-right:4px;">${d}</span>`).join('');

        item.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="background:#f1f5f9;color:#0f172a;padding:4px 8px;border-radius:6px;font-weight:700;font-size:0.9rem;letter-spacing:0.5px;">${entry.course}</div>
                    <div style="color:#64748b;font-size:0.8rem;"><i class="fas fa-map-marker-alt" style="color:#cbd5e1;"></i> ${entry.room}</div>
                </div>
                <button onclick="timetableManager.removeExtractedItem(${idx})" style="background:#fee2e2;border:none;color:#ef4444;width:24px;height:24px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fas fa-times" style="font-size:0.75rem;"></i></button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:0.85rem;color:#334155;font-weight:500;">
                    <i class="far fa-clock" style="color:#94a3b8;margin-right:4px;"></i> ${entry.startTime}${entry.endTime ? ' - ' + entry.endTime : ''}
                </div>
                <div>${dayString}</div>
            </div>
        `;
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

        // Group suggestions by day for better presentation
        const byDay = {};
        suggestions.forEach(s => {
            if(!byDay[s.dayIndex]) byDay[s.dayIndex] = [];
            byDay[s.dayIndex].push(s);
        });
        
        // Sort days
        const sortedDays = Object.keys(byDay).sort((a,b) => parseInt(a) - parseInt(b));
        
        let timelineHTML = '';
        sortedDays.forEach(dIdx => {
            timelineHTML += `<div style="margin-bottom:15px;">
                <div style="font-weight:700;color:#0f172a;border-bottom:2px solid #f1f5f9;padding-bottom:5px;margin-bottom:10px;font-size:0.9rem;">${DAYS[dIdx]}</div>
                <div style="display:flex;flex-direction:column;gap:8px;padding-left:10px;border-left:2px solid #e0e7ff;">`;
            
            byDay[dIdx].sort((a,b) => a.hourIndex - b.hourIndex).forEach(s => {
                timelineHTML += `
                    <div style="display:flex;align-items:center;gap:12px;background:#fff;padding:8px 12px;border-radius:8px;border:1px solid #f1f5f9;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                        <div style="background:#e0e7ff;color:#4338ca;padding:4px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;width:55px;text-align:center;">${HOURS[s.hourIndex]}</div>
                        <div style="font-size:0.85rem;font-weight:500;color:#334155;">${s.title}</div>
                        <div style="margin-left:auto;color:#10b981;font-size:0.8rem;"><i class="fas fa-brain"></i> AI Suggested</div>
                    </div>`;
            });
            timelineHTML += `</div></div>`;
        });

        const modal = document.createElement('div');
        modal.id = 'studyPlanModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(15, 15, 25, 0.85);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,sans-serif;animation:modalFadeIn 0.3s ease-out;';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:20px;max-width:650px;width:100%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.4);">
                
                <div style="padding:25px 30px;background:linear-gradient(135deg, #6C63FF, #00d2ff);color:#fff;display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <div style="display:inline-block;background:rgba(255,255,255,0.2);backdrop-filter:blur(5px);padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;margin-bottom:10px;letter-spacing:0.5px;">✨ KAIROS INTELLIGENCE</div>
                        <h2 style="margin:0 0 5px;font-size:1.4rem;font-weight:700;">Your Optimized Study Plan</h2>
                        <p style="margin:0;font-size:0.9rem;opacity:0.9;">Generated based on cognitive spacing for your ${this.lectures.length} scheduled lectures.</p>
                    </div>
                    <button onclick="document.getElementById('studyPlanModal').remove()" style="background:none;border:none;font-size:1.5rem;color:#fff;opacity:0.7;cursor:pointer;transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">✕</button>
                </div>
                
                <div style="overflow-y:auto;flex:1;padding:25px 30px;background:#fafafa;">
                    ${timelineHTML}
                </div>
                
                <div style="padding:20px 30px;background:#fff;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:0.8rem;color:#64748b;max-width:60%;">
                        <i class="fas fa-info-circle text-primary"></i> These sessions will be added to your Planner grid. You can freely drag to reschedule them.
                    </div>
                    <div style="display:flex;gap:12px;flex-shrink:0;">
                        <button onclick="document.getElementById('studyPlanModal').remove()" style="padding:10px 20px;background:#fff;border:1px solid #cbd5e1;color:#64748b;border-radius:10px;font-weight:600;font-size:0.9rem;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#f8fafc'">Dismiss</button>
                        <button onclick="timetableManager.applyStudyPlan()" style="padding:10px 24px;background:linear-gradient(135deg, #6C63FF, #5a52d5);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:0.9rem;box-shadow:0 4px 6px -1px rgba(108,99,255,0.3);transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">
                            <i class="fas fa-magic"></i> Apply to Planner
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
            new Notification('Lecture Alert - Kairos', {
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
                    <div class="lecture-time">${l.startTime || '?'} - ${l.endTime || '?'}</div>
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
