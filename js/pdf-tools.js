/* ===========================
   PDF TOOLS  -  CLIENT-SIDE
   Uses pdf-lib, PDF.js, and Tesseract.js
   =========================== */

const BACKEND = (typeof KAIROS_API_BASE !== 'undefined') ? KAIROS_API_BASE : 'http://localhost:5000/api';

// ── utilities ─────────────────────────────────────────────────────────────────

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

function triggerDownload(data, filename, mime = 'application/pdf') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function withProgress(label, asyncFn) {
    showToast(`⏳ ${label}…`, 'info');
    return asyncFn().then(
        ()  => { /* success handled by caller */ },
        err => {
            console.error(err);
            showToast(`❌ ${err.message || err}`, 'error');
        }
    );
}

function parsePageRange(str, totalPages) {
    const indices = new Set();
    for (const part of str.split(',')) {
        const p = part.trim();
        if (p.includes('-')) {
            const [a, b] = p.split('-').map(Number);
            for (let i = a; i <= b; i++) if (i >= 1 && i <= totalPages) indices.add(i - 1);
        } else {
            const n = Number(p);
            if (n >= 1 && n <= totalPages) indices.add(n - 1);
        }
    }
    return [...indices].sort((a, b) => a - b);
}

let processedFiles = JSON.parse(localStorage.getItem('kairos_pdf_history') || '[]');
function addToHistory(filename, tool, detail = '') {
    processedFiles.unshift({ id: Date.now(), filename, tool, detail, timestamp: new Date().toLocaleString() });
    if (processedFiles.length > 20) processedFiles.pop();
    localStorage.setItem('kairos_pdf_history', JSON.stringify(processedFiles));
}

function getPDFLib() {
    if (typeof PDFLib === 'undefined') throw new Error('pdf-lib not loaded. Check internet connection.');
    return PDFLib;
}

// ── CUSTOM MODALS & WORKSPACE ─────────────────────────────────────────────────

let currentToolId = null;
let currentAccept = null;
let currentMultiple = false;

function openWorkspace(id, title, desc, iconClass, accept, multiple = false) {
    currentToolId = id;
    currentAccept = accept;
    currentMultiple = multiple;
    
    document.getElementById('pdfToolsGrid').style.display = 'none';
    const ws = document.getElementById('pdfWorkspace');
    ws.style.display = 'block';
    
    document.getElementById('workspaceIcon').className = iconClass;
    document.getElementById('workspaceTitle').innerText = title;
    document.getElementById('workspaceDesc').innerText = desc;
    
    document.getElementById('workspaceActionArea').innerHTML = `
        <div id="dropZone" style="border: 2px dashed var(--primary); border-radius: 12px; padding: 40px; background: rgba(108, 99, 255, 0.02); cursor: pointer; transition: all 0.3s ease;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3 style="margin-bottom: 10px; font-family: var(--font-primary);">Drag & Drop file${multiple ? 's' : ''} here</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">or click to browse (${accept})</p>
            <button class="btn btn-primary" onclick="document.getElementById('wsFileInput').click()">Browse Files</button>
            <input type="file" id="wsFileInput" accept="${accept}" ${multiple ? 'multiple' : ''} style="display: none;">
        </div>
    `;

    // Setup Drag and Drop
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('wsFileInput');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.style.background = 'rgba(108, 99, 255, 0.1)', false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.style.background = 'rgba(108, 99, 255, 0.02)', false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleWorkspaceFiles(files);
    }, false);

    fileInput.addEventListener('change', (e) => {
        handleWorkspaceFiles(e.target.files);
    });
}

function closeWorkspace() {
    document.getElementById('pdfWorkspace').style.display = 'none';
    document.getElementById('pdfToolsGrid').style.display = 'grid';
    currentToolId = null;
}

function handleWorkspaceFiles(files) {
    if (!files || files.length === 0) return;
    
    if (!currentMultiple && files.length > 1) {
        showToast('Please select only one file for this tool.', 'warning');
        return;
    }

    const fileList = currentMultiple ? Array.from(files) : files[0];

    // Route to correct tool
    switch(currentToolId) {
        case 'merge': initMergePDF(fileList); break;
        case 'split': initSplitPDF(fileList); break;
        case 'compress': initCompressPDF(fileList); break;
        case 'watermark': initWatermark(fileList); break;
        case 'pdf-to-jpg': initConvertToImage(fileList, 'jpg'); break;
        case 'pdf-to-png': initConvertToImage(fileList, 'png'); break;
        case 'rotate': initRotatePDF(fileList); break;
        case 'unlock': initUnlockPDF(fileList); break;
        case 'extract-pages': initExtractPages(fileList); break;
        case 'word-to-pdf': initWordToPDF(fileList); break;
        case 'ppt-to-pdf': initPPTToPDF(fileList); break;
        case 'extract-timetable': initExtractTimetable(fileList); break;
    }
}

function showCustomPrompt(title, desc, placeholder) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customPromptModal');
        const input = document.getElementById('promptInput');
        document.getElementById('promptTitle').innerText = title;
        document.getElementById('promptDesc').innerText = desc;
        input.placeholder = placeholder;
        input.value = '';
        modal.style.display = 'flex';
        input.focus();

        const cleanup = () => {
            modal.style.display = 'none';
            document.getElementById('promptCancel').onclick = null;
            document.getElementById('promptConfirm').onclick = null;
        };

        document.getElementById('promptCancel').onclick = () => {
            cleanup();
            resolve(null);
        };

        document.getElementById('promptConfirm').onclick = () => {
            cleanup();
            resolve(input.value);
        };
    });
}

// ── TIMETABLE EXTRACTOR ───────────────────────────────────────────────────────

function _tt2dFormatTime(t) {
    if (!t) return '08:00';
    t = t.toUpperCase().replace('.', ':');
    const hasAmPm = /[AP]M/.test(t);
    const isPM = t.includes('PM');
    let tp = t.replace(/\s*(AM|PM)/, '').trim();
    if (!tp.includes(':')) tp += ':00';
    const parts = tp.split(':');
    let h = parseInt(parts[0]);
    const m = (parts[1] || '00').slice(0, 2);
    if (hasAmPm) { if (isPM && h !== 12) h += 12; if (!isPM && h === 12) h = 0; }
    return `${String(h).padStart(2,'0')}:${m}`;
}

function _tt2dAddHours(t, hrs) {
    const [h, m] = t.split(':').map(Number);
    const total = h * 60 + m + hrs * 60;
    return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

function _tt2dMergeGroup(group) {
    const x = Math.min(...group.map(g => g.x));
    const y = Math.min(...group.map(g => g.y));
    const maxRight  = Math.max(...group.map(g => g.x + g.w));
    const maxBottom = Math.max(...group.map(g => g.y + g.h));
    return { text: group.map(g => g.text).join(' '), x, y, w: maxRight - x, h: maxBottom - y };
}

function parseTimetable2D(items) {
    if (!items || items.length === 0) return [];

    const courseRegex      = /^([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)$/i;
    const courseInTextRegex = /\b([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)\b/i;
    const timeRegex24 = /^(?:[01]?\d|2[0-3])[:.][0-5]\d$/;
    const timeRegex12 = /^(?:1[0-2]|0?[1-9])[:.]?(?:[0-5]\d)?\s*(?:AM|PM)$/i;
    const dayRegex    = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su)$/i;
    const DAY_NORMALIZE = {
        'mo':'Mon','tu':'Tue','we':'Wed','th':'Thu','fr':'Fri','sa':'Sat','su':'Sun',
        'mon':'Mon','tue':'Tue','wed':'Wed','thu':'Thu','fri':'Fri','sat':'Sat','sun':'Sun',
        'monday':'Mon','tuesday':'Tue','wednesday':'Wed','thursday':'Thu',
        'friday':'Fri','saturday':'Sat','sunday':'Sun',
    };
    const MWF_MAP = {
        'mwf':['Mon','Wed','Fri'],'mw':['Mon','Wed'],'wf':['Wed','Fri'],
        'tth':['Tue','Thu'],'tuth':['Tue','Thu'],'tueth':['Tue','Thu'],
        'mf':['Mon','Fri'],'tw':['Tue','Wed'],'wth':['Wed','Thu'],
        'thf':['Thu','Fri'],'mtwthf':['Mon','Tue','Wed','Thu','Fri'],
        'mtuth':['Mon','Tue','Thu'],'mtw':['Mon','Tue','Wed'],
        'mtwf':['Mon','Tue','Wed','Fri'],'twf':['Tue','Wed','Fri'],
    };

    // Merge nearby words into row-level phrases
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
            const gap = item.x - (last.x + last.w);
            if (Math.abs(item.y - last.y) < 8 && gap >= -5 && gap < 42) {
                currentGroup.push(item);
            } else {
                mergedItems.push(_tt2dMergeGroup(currentGroup));
                currentGroup = [item];
            }
        }
    }
    if (currentGroup.length > 0) mergedItems.push(_tt2dMergeGroup(currentGroup));

    const dayRowZones = [], timeColZones = [], courseItems = [], uncategorized = [];

    for (const item of mergedItems) {
        let dMatch = item.text.match(dayRegex);
        if (!dMatch) {
            const words = item.text.split(/\s+/);
            dMatch = words[0].match(dayRegex);
        }
        if (dMatch) {
            const normalized = DAY_NORMALIZE[dMatch[1].toLowerCase()] ||
                (dMatch[1].slice(0,3).charAt(0).toUpperCase() + dMatch[1].slice(0,3).slice(1).toLowerCase());
            dayRowZones.push({ day: normalized, y: item.y, h: item.h });
            continue;
        }

        const lowerClean = item.text.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (MWF_MAP[lowerClean]) {
            MWF_MAP[lowerClean].forEach(d => dayRowZones.push({ day: d, y: item.y, h: item.h }));
            continue;
        }

        const times = [];
        const timeTokens = item.text.split(/\s*[-–to]+\s*/);
        for (const tk of timeTokens) {
            const t = tk.trim();
            if (t.match(timeRegex24) || t.match(timeRegex12)) times.push(t.replace('.', ':'));
        }
        if (times.length > 0) {
            const st = _tt2dFormatTime(times[0]);
            const et = times.length > 1 ? _tt2dFormatTime(times[1]) : _tt2dAddHours(st, 2);
            timeColZones.push({ startTime: st, endTime: et, x: item.x, w: item.w });
            continue;
        }

        let cMatch = item.text.match(courseRegex);
        let detectedRoom = null;

        if (!cMatch) {
            const words = item.text.split(/\s+/);
            for (let w = 0; w < words.length - 1; w++) {
                const comb = words[w] + words[w+1];
                const cbMatch = comb.match(/^([A-Z]{2,5})(\d{3,4}[A-Z]?)$/i);
                if (cbMatch) { cMatch = [comb, cbMatch[1], cbMatch[2]]; break; }
            }
        }
        if (!cMatch) {
            const embedded = item.text.match(courseInTextRegex);
            if (embedded) {
                cMatch = embedded;
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

    if (dayRowZones.length === 0 || timeColZones.length === 0 || courseItems.length === 0) return [];

    const courses = [];
    const roomRx = /\b(?:(?:Room|Rm|Hall|Lab|Classroom|Bldg?|Block|BLK|Lecture|Auditorium)\.?\s*#?\s*[A-Z0-9][\w\s]{0,8}|[A-Z]{2,4}\s+[A-Z0-9]{1,2}[0-9]{0,2}(?:\s+[0-9]{1,2})?|[A-Z]{1,3}[0-9]{2,4}[A-Z]?|Virtual|Online)\b/i;

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
            let room = cItem.room || 'TBA';
            if (!cItem.room) {
                let bestRoom = null, bestDist = Infinity;
                for (const ui of uncategorized) {
                    const dx = Math.abs(cItem.x - (ui.x + ui.w / 2));
                    const dy = Math.abs(cItem.y - (ui.y + ui.h / 2));
                    if (dx < 200 && dy < 120) {
                        const rm = ui.text.match(roomRx);
                        if (rm) {
                            const dist = dx + dy * 2;
                            if (dist < bestDist) { bestDist = dist; bestRoom = rm[0].trim(); }
                        }
                    }
                }
                if (bestRoom) room = bestRoom;
            }
            courses.push({ course: cItem.code, room, startTime: closestTime.startTime, endTime: closestTime.endTime, days: [closestDay] });
        }
    }

    return courses.filter((v,i,a) => a.findIndex(v2 =>
        v2.course === v.course && v2.startTime === v.startTime && v2.days.join() === v.days.join()
    ) === i);
}

async function initExtractTimetable(file) {
    await withProgress('Analyzing Document...', async () => {
        let classes = [];

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const lib = window.pdfjsLib;
            if (!lib) throw new Error('PDF.js not loaded.');
            lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            const bytes = await readFileAsArrayBuffer(file);
            const pdfDoc = await lib.getDocument({ data: bytes }).promise;

            let allItems = [];
            let fullText = '';
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page    = await pdfDoc.getPage(i);
                const vp      = page.getViewport({ scale: 1 });
                const content = await page.getTextContent();
                content.items.forEach(item => {
                    if (!item.str.trim()) return;
                    const x = item.transform[4];
                    const y = vp.height - item.transform[5]; // flip to top-left origin
                    allItems.push({ text: item.str.trim(), x, y, w: item.width || 0, h: item.height || 10 });
                });
                fullText += content.items.map(it => it.str).join(' ') + '\n';
            }

            // Try 2D grid parse first (works for tabular timetables)
            classes = parseTimetable2D(allItems);

            // Fall back to line-by-line text parser
            if (classes.length === 0) {
                classes = parseTimetableText(fullText);
            }
        } else {
            if (!window.Tesseract) throw new Error('Tesseract.js not loaded. Check internet connection.');
            showToast('⏳ Running OCR on image (this may take a minute)…', 'info');
            const result = await Tesseract.recognize(file, 'eng');
            classes = parseTimetableText(result.data.text);
        }

        if (classes.length === 0) {
            showToast('⚠️ Could not detect any classes. Ensure the schedule text is readable.', 'warning');
            return;
        }
        showTimetablePreview(classes);
    });
}

function parseTimetableText(text) {
    const results = [];

    const DAY_NORM = {
        'mo':'Mon','tu':'Tue','we':'Wed','th':'Thu','fr':'Fri','sa':'Sat','su':'Sun',
        'mon':'Mon','tue':'Tue','wed':'Wed','thu':'Thu','fri':'Fri','sat':'Sat','sun':'Sun',
        'monday':'Mon','tuesday':'Tue','wednesday':'Wed','thursday':'Thu',
        'friday':'Fri','saturday':'Sat','sunday':'Sun',
    };
    const MWF_EXPAND = {
        'mwf':['Mon','Wed','Fri'],'mw':['Mon','Wed'],'wf':['Wed','Fri'],
        'tth':['Tue','Thu'],'tuth':['Tue','Thu'],'tueth':['Tue','Thu'],
        'mf':['Mon','Fri'],'tw':['Tue','Wed'],'wth':['Wed','Thu'],
        'thf':['Thu','Fri'],'mtwthf':['Mon','Tue','Wed','Thu','Fri'],
    };

    const courseRx = /\b([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)\b/gi;
    const timeRx   = /(\d{1,2}[:.]\d{2})\s*(?:AM|PM)?(?:\s*[-–to]+\s*(\d{1,2}[:.]\d{2})\s*(?:AM|PM)?)?/gi;
    const dayRx    = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su|MWF|MW|WF|TTh|TuTh|TueTh|MF|TW)\b/gi;
    const roomRx   = /\b(?:(?:Room|Rm|Hall|Lab|Classroom|Bldg?|Block|BLK|Lecture|Auditorium)\.?\s*#?\s*[A-Z0-9][\w\s]{0,8}|[A-Z]{2,4}\s+[A-Z]{0,2}[0-9]{1,4}(?:\s+[0-9]{1,2})?|[A-Z]{1,3}[0-9]{2,4}[A-Z]?)\b/i;

    function fmt(t) {
        if (!t) return null;
        t = t.replace('.', ':');
        if (!t.includes(':')) t += ':00';
        return t.padStart(5, '0').slice(0, 5);
    }

    // Gather global day mentions across whole text first
    const globalDays = [];
    let dm;
    dayRx.lastIndex = 0;
    while ((dm = dayRx.exec(text)) !== null) {
        const k = dm[1].toLowerCase().replace(/[^a-z]/g,'');
        const expanded = MWF_EXPAND[k];
        if (expanded) { expanded.forEach(d => globalDays.push(d)); }
        else { const n = DAY_NORM[k]; if (n) globalDays.push(n); }
    }
    const uniqueDays = [...new Set(globalDays)];
    const fallbackDays = uniqueDays.length > 0 ? uniqueDays : ['Mon'];

    const lines = text.split('\n');
    let currentDays = fallbackDays;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Update day context from this line
        const lineDays = [];
        dayRx.lastIndex = 0;
        let lm;
        while ((lm = dayRx.exec(trimmed)) !== null) {
            const k = lm[1].toLowerCase().replace(/[^a-z]/g,'');
            const expanded = MWF_EXPAND[k];
            if (expanded) expanded.forEach(d => lineDays.push(d));
            else { const n = DAY_NORM[k]; if (n) lineDays.push(n); }
        }
        if (lineDays.length > 0) currentDays = [...new Set(lineDays)];

        // Extract time from line
        timeRx.lastIndex = 0;
        const tm = timeRx.exec(trimmed);
        const startTime = tm ? (fmt(tm[1]) || '09:00') : '09:00';
        const endTime   = tm && tm[2] ? (fmt(tm[2]) || '10:30') : '10:30';

        // Extract room from line
        const roomMatch = trimmed.match(roomRx);
        const room = roomMatch ? roomMatch[0].trim() : 'TBA';

        // Extract all course codes from line
        courseRx.lastIndex = 0;
        let cm;
        while ((cm = courseRx.exec(trimmed)) !== null) {
            const code = `${cm[1].toUpperCase()}${cm[2].toUpperCase()}`;
            results.push({
                id: 'pt_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
                course: code,
                room,
                startTime,
                endTime,
                days: [...currentDays],
                dateAdded: new Date().toLocaleDateString(),
                uploadedFile: 'PDF Extract'
            });
        }
    }

    // Dedup: same course+startTime+days
    const seen = new Set();
    return results.filter(r => {
        const key = r.course + '|' + r.startTime + '|' + r.days.sort().join(',');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function showTimetablePreview(classes) {
    window._tempExtractedClasses = classes;
    const container = document.getElementById('extractedClassesContainer');
    container.innerHTML = '';
    classes.forEach((c, idx) => {
        const daysStr = Array.isArray(c.days) ? c.days.join(', ') : (c.day || 'Mon');
        const courseName = c.course || c.title || 'Unknown';
        const roomStr = c.room || c.location || 'TBA';
        container.innerHTML += `
            <div data-idx="${idx}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border, #eee); background: rgba(0,0,0,0.02); margin-bottom: 5px; border-radius: 8px;">
                <div>
                    <strong style="color: var(--primary);">${courseName}</strong>
                    <span style="color:var(--text-secondary);font-size:0.8rem;margin-left:8px;"><i class="fas fa-map-marker-alt"></i> ${roomStr}</span><br>
                    <small style="color: var(--text-secondary);"><i class="fas fa-calendar-day"></i> ${daysStr} &nbsp; <i class="fas fa-clock"></i> ${c.startTime} - ${c.endTime}</small>
                </div>
                <button onclick="this.closest('[data-idx]').remove()" style="background:none; border:none; color: var(--danger); cursor: pointer; padding: 5px;"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
    document.getElementById('timetablePreviewModal').style.display = 'flex';
}

if (document.getElementById('btnImportTimetable')) {
    document.getElementById('btnImportTimetable').addEventListener('click', () => {
        const existing = JSON.parse(localStorage.getItem('kairos_lectures') || '[]');
        const container = document.getElementById('extractedClassesContainer');
        // Keep only rows still in the DOM (user may have deleted some)
        const remainingIdxs = new Set(
            Array.from(container.querySelectorAll('[data-idx]')).map(el => parseInt(el.dataset.idx))
        );
        const all = window._tempExtractedClasses || [];
        const toSave = all
            .filter((_, i) => remainingIdxs.has(i))
            .map(c => ({
                id:          'lec_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
                course:      c.course || c.title || 'Unknown',
                room:        c.room || c.location || 'TBA',
                startTime:   c.startTime || '09:00',
                endTime:     c.endTime   || '10:30',
                days:        Array.isArray(c.days) ? c.days : (c.day ? [c.day] : ['Mon']),
                dateAdded:   new Date().toLocaleDateString(),
                uploadedFile: c.uploadedFile || 'PDF Extract'
            }));

        localStorage.setItem('kairos_lectures', JSON.stringify(existing.concat(toSave)));
        document.getElementById('timetablePreviewModal').style.display = 'none';
        closeWorkspace();
        showToast(`✅ ${toSave.length} class(es) imported successfully!`, 'success');
        setTimeout(() => { window.location.href = 'timetable.html'; }, 1000);
    });
}


// ── PDF TOOLS IMPLEMENTATIONS ────────────────────────────────────────────────

async function initMergePDF(files) {
    if (files.length < 2) {
        showToast('Select at least 2 PDF files to merge', 'warning');
        return;
    }
    await withProgress('Merging PDFs', async () => {
        const { PDFDocument } = getPDFLib();
        const merged = await PDFDocument.create();
        for (const file of files) {
            const bytes  = await readFileAsArrayBuffer(file);
            const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
            const copied = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
            copied.forEach(p => merged.addPage(p));
        }
        const out = await merged.save();
        triggerDownload(out, 'merged.pdf');
        addToHistory(files.map(f => f.name).join(', '), 'merge');
        showToast(`✅ Merged ${files.length} PDFs successfully!`, 'success');
        closeWorkspace();
    });
}

async function initSplitPDF(file) {
    await withProgress('Splitting PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const total  = srcDoc.getPageCount();

        const zip = new JSZip();
        for (let i = 0; i < total; i++) {
            const pageDoc = await PDFDocument.create();
            const [page]  = await pageDoc.copyPages(srcDoc, [i]);
            pageDoc.addPage(page);
            const pageBytes = await pageDoc.save();
            zip.file(`page_${i + 1}.pdf`, pageBytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, 'split_pages.zip', 'application/zip');
        addToHistory(file.name, 'split');
        showToast(`✅ Split into ${total} pages!`, 'success');
        closeWorkspace();
    });
}

async function initCompressPDF(file) {
    await withProgress('Compressing PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const out = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        const origKB = (file.size / 1024).toFixed(1);
        const newKB  = (out.byteLength / 1024).toFixed(1);
        triggerDownload(out, 'compressed.pdf');
        addToHistory(file.name, 'compress');
        showToast(`✅ Compressed: ${origKB} KB → ${newKB} KB`, 'success');
        closeWorkspace();
    });
}

async function initWatermark(file) {
    const text = await showCustomPrompt('Watermark Text', 'Enter the text you want to stamp across the PDF pages.', 'e.g. CONFIDENTIAL');
    if (!text) return;
    
    await withProgress('Adding watermark', async () => {
        const { PDFDocument, rgb, degrees, StandardFonts } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (const page of pdfDoc.getPages()) {
            const { width, height } = page.getSize();
            const fontSize = Math.min(width, height) * 0.12;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            page.drawText(text, {
                x       : width  / 2 - textWidth / 2,
                y       : height / 2 - fontSize   / 2,
                size    : fontSize,
                font,
                color   : rgb(0.5, 0.5, 0.5),
                opacity : 0.35,
                rotate  : degrees(45),
            });
        }
        const out = await pdfDoc.save();
        triggerDownload(out, 'watermarked.pdf');
        addToHistory(file.name, 'watermark', text);
        showToast(`✅ Watermark "${text}" added!`, 'success');
        closeWorkspace();
    });
}

async function initConvertToImage(file, format) {
    await withProgress(`Converting to ${format.toUpperCase()}`, async () => {
        const lib = window.pdfjsLib;
        if (!lib) throw new Error('PDF.js not loaded.');
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const bytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await lib.getDocument({ data: bytes }).promise;
        const total  = pdfDoc.numPages;
        const mime   = format === 'jpg' ? 'image/jpeg' : 'image/png';

        const renderPage = async (num) => {
            const page     = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas   = document.createElement('canvas');
            canvas.width   = viewport.width;
            canvas.height  = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            return new Promise(res => canvas.toBlob(res, mime, 0.92));
        };

        if (total === 1) {
            const blob = await renderPage(1);
            triggerDownload(blob, `page_1.${format}`, mime);
        } else {
            const zip = new JSZip();
            for (let i = 1; i <= total; i++) {
                const blob = await renderPage(i);
                zip.file(`page_${i}.${format}`, await blob.arrayBuffer());
            }
            triggerDownload(await zip.generateAsync({ type: 'blob' }), 'pages.zip', 'application/zip');
        }

        addToHistory(file.name, `convert-${format}`);
        showToast(`✅ Converted ${total} page(s) to ${format.toUpperCase()}!`, 'success');
        closeWorkspace();
    });
}

async function initRotatePDF(file) {
    const angle = await showCustomPrompt('Rotation Angle', 'Enter rotation angle in degrees (90, 180, or 270)', '90');
    if (!angle || !['90', '180', '270'].includes(angle.trim())) {
        showToast('Please enter 90, 180, or 270', 'warning');
        return;
    }
    
    await withProgress('Rotating PDF', async () => {
        const { PDFDocument, degrees } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        for (const page of pdfDoc.getPages()) {
            const current = page.getRotation().angle;
            page.setRotation(degrees((current + Number(angle)) % 360));
        }
        const out = await pdfDoc.save();
        triggerDownload(out, 'rotated.pdf');
        addToHistory(file.name, 'rotate', `${angle}°`);
        showToast(`✅ Rotated by ${angle}°!`, 'success');
        closeWorkspace();
    });
}

async function initUnlockPDF(file) {
    const password = await showCustomPrompt('PDF Password', 'Enter the password to unlock this PDF. Leave blank if none.', '');
    if (password === null) return;
    
    await withProgress('Unlocking PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { password, ignoreEncryption: false });
        const out = await pdfDoc.save();
        triggerDownload(out, 'unlocked.pdf');
        addToHistory(file.name, 'unlock');
        showToast('✅ PDF unlocked successfully!', 'success');
        closeWorkspace();
    });
}

async function initExtractPages(file) {
    const pageRange = await showCustomPrompt('Page Range', 'Enter pages to extract (e.g. 1-3 or 1,3,5)', '1-2');
    if (!pageRange) return;
    
    await withProgress('Extracting pages', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes    = await readFileAsArrayBuffer(file);
        const srcDoc   = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const indices  = parsePageRange(pageRange, srcDoc.getPageCount());
        if (!indices.length) throw new Error('No valid pages in that range');

        const newDoc = await PDFDocument.create();
        const pages  = await newDoc.copyPages(srcDoc, indices);
        pages.forEach(p => newDoc.addPage(p));
        const out = await newDoc.save();
        triggerDownload(out, 'extracted.pdf');
        addToHistory(file.name, 'extract', pageRange);
        showToast(`✅ Extracted ${indices.length} page(s)!`, 'success');
        closeWorkspace();
    });
}

async function initWordToPDF(file) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
        showToast('⚠️ Only .docx is supported for in-browser conversion.', 'warning');
        return;
    }
    await withProgress('Converting Word to PDF', async () => {
        if (!window.mammoth) throw new Error('mammoth.js not loaded.');
        if (!window.jspdf) throw new Error('jsPDF not loaded.');
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const margin = 15, pageW = 210 - margin * 2, pageH = 297;
        let y = 20;

        const addPage = () => { pdf.addPage(); y = 20; };
        const checkPage = (need) => { if (y + need > pageH - 15) addPage(); };

        // Parse mammoth HTML into structural elements
        const div = document.createElement('div');
        div.innerHTML = html;

        for (const el of div.children) {
            const tag = el.tagName.toLowerCase();
            const text = el.textContent.trim();
            if (!text) { y += 3; continue; }

            if (['h1','h2','h3','h4'].includes(tag)) {
                const sz = tag === 'h1' ? 18 : tag === 'h2' ? 15 : tag === 'h3' ? 13 : 12;
                pdf.setFontSize(sz); pdf.setFont('helvetica', 'bold');
                const lines = pdf.splitTextToSize(text, pageW);
                checkPage(lines.length * sz * 0.42 + 5);
                pdf.text(lines, margin, y);
                y += lines.length * sz * 0.42 + 5;

            } else if (tag === 'p') {
                pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
                const lines = pdf.splitTextToSize(text, pageW);
                checkPage(lines.length * 5.5 + 4);
                pdf.text(lines, margin, y);
                y += lines.length * 5.5 + 4;

            } else if (tag === 'ul' || tag === 'ol') {
                pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
                let idx = 1;
                for (const li of el.querySelectorAll('li')) {
                    const liText = (tag === 'ul' ? '• ' : `${idx++}. `) + li.textContent.trim();
                    const lines = pdf.splitTextToSize(liText, pageW - 6);
                    checkPage(lines.length * 5.5 + 2);
                    pdf.text(lines, margin + 4, y);
                    y += lines.length * 5.5 + 2;
                }
                y += 3;

            } else if (tag === 'table') {
                pdf.setFontSize(9);
                const rows = Array.from(el.querySelectorAll('tr'));
                const cols = Math.max(...rows.map(r => r.querySelectorAll('td,th').length), 1);
                const colW = pageW / cols;
                for (const row of rows) {
                    const cells = row.querySelectorAll('td,th');
                    const isHeader = row.querySelector('th') !== null;
                    pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
                    checkPage(8);
                    let x = margin;
                    for (const cell of cells) {
                        const ct = pdf.splitTextToSize(cell.textContent.trim(), colW - 2);
                        pdf.text(ct[0] || '', x + 1, y);
                        pdf.rect(x, y - 5, colW, 7);
                        x += colW;
                    }
                    y += 7;
                }
                y += 4;
            }
        }

        triggerDownload(pdf.output('blob'), file.name.replace(/\.docx?$/i, '.pdf'), 'application/pdf');
        addToHistory(file.name, 'word-to-pdf');
        showToast('✅ Word document converted to PDF!', 'success');
        closeWorkspace();
    });
}

async function initPPTToPDF(file) {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
        showToast('⚠️ Only .pptx is supported for in-browser conversion.', 'warning');
        return;
    }
    await withProgress('Converting PowerPoint to PDF', async () => {
        if (!window.JSZip) throw new Error('JSZip not loaded.');
        if (!window.jspdf) throw new Error('jsPDF not loaded.');

        const arrayBuffer = await readFileAsArrayBuffer(file);
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Collect slide XML files in order
        const slideFiles = Object.keys(zip.files)
            .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
            .sort((a, b) => {
                const na = parseInt(a.match(/slide(\d+)/)[1]);
                const nb = parseInt(b.match(/slide(\d+)/)[1]);
                return na - nb;
            });

        if (slideFiles.length === 0) throw new Error('No slides found in PPTX file.');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [297, 210] });

        const unescape = s => s
            .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
            .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'");

        for (let si = 0; si < slideFiles.length; si++) {
            if (si > 0) pdf.addPage([297, 210], 'landscape');

            const xmlStr = await zip.files[slideFiles[si]].async('string');

            // Extract text runs grouped by paragraph
            const paragraphs = [];
            for (const paraMatch of xmlStr.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g)) {
                const paraXml = paraMatch[1];
                const runs = [...paraXml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
                    .map(m => unescape(m[1])).join('').trim();
                if (runs) paragraphs.push(runs);
            }

            // Slide background
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 297, 210, 'F');

            // Slide border
            pdf.setDrawColor(220, 220, 220);
            pdf.rect(1, 1, 295, 208);

            // Slide number badge
            pdf.setFontSize(8); pdf.setTextColor(160, 160, 160);
            pdf.text(`${si + 1} / ${slideFiles.length}`, 287, 205, { align: 'right' });

            pdf.setTextColor(30, 30, 30);

            if (paragraphs.length === 0) {
                pdf.setFontSize(12); pdf.setTextColor(180, 180, 180);
                pdf.text('(Empty slide)', 148, 105, { align: 'center' });
                continue;
            }

            // Title (first non-empty paragraph)
            pdf.setFontSize(24); pdf.setFont('helvetica', 'bold');
            const titleLines = pdf.splitTextToSize(paragraphs[0], 265);
            pdf.text(titleLines, 16, 30);

            // Body content
            if (paragraphs.length > 1) {
                pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(60, 60, 60);
                let y = 30 + titleLines.length * 11 + 10;
                for (let i = 1; i < paragraphs.length && y < 195; i++) {
                    const lines = pdf.splitTextToSize(`• ${paragraphs[i]}`, 265);
                    pdf.text(lines, 16, y);
                    y += lines.length * 6.5;
                }
            }
        }

        triggerDownload(pdf.output('blob'), file.name.replace(/\.pptx?$/i, '.pdf'), 'application/pdf');
        addToHistory(file.name, 'ppt-to-pdf');
        showToast(`✅ Converted ${slideFiles.length} slide(s) to PDF!`, 'success');
        closeWorkspace();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // We do not strict checkAuth here to allow tools to work offline
});
