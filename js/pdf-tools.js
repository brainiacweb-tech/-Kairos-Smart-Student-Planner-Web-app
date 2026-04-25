/* ===========================
   PDF TOOLS  —  CLIENT-SIDE
   All operations run in the browser via pdf-lib / PDF.js / mammoth / jsPDF.
   Word→PDF and PPT→PDF try the backend first (LibreOffice quality), then
   fall back to client-side parsing.
   =========================== */

const BACKEND = (typeof KAIROS_API_BASE !== 'undefined') ? KAIROS_API_BASE : 'http://localhost:5000/api';

// ── Dropped-file store (drag-drop → tool mapping) ─────────────────────────────
const _dropped = {};

// ── History ───────────────────────────────────────────────────────────────────
let _history = (() => { try { return JSON.parse(localStorage.getItem('kairos_pdf_history') || '[]'); } catch { return []; } })();

function addToHistory(filename, tool, detail = '') {
    _history.unshift({ id: Date.now(), filename, tool, detail, ts: new Date().toLocaleString() });
    if (_history.length > 30) _history.pop();
    localStorage.setItem('kairos_pdf_history', JSON.stringify(_history));
    renderHistory();
}

const TOOL_LABELS = {
    merge: 'Merge', split: 'Split', compress: 'Compress', watermark: 'Watermark',
    'convert-jpg': 'PDF→JPG', 'convert-png': 'PDF→PNG', rotate: 'Rotate',
    unlock: 'Unlock', extract: 'Extract', 'word-to-pdf': 'Word→PDF', 'ppt-to-pdf': 'PPT→PDF'
};

function renderHistory() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    if (!_history.length) {
        body.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:var(--spacing-md) 0;margin:0;font-size:0.88rem;">No files processed yet</p>';
        return;
    }
    body.innerHTML = _history.slice(0, 10).map(h => `
        <div class="history-row">
            <span class="history-badge">${TOOL_LABELS[h.tool] || h.tool}</span>
            <span class="history-file" title="${h.filename}">${h.filename}</span>
            ${h.detail ? `<span style="color:var(--text-secondary);font-size:0.78rem;">${h.detail}</span>` : ''}
            <span class="history-time">${h.ts}</span>
        </div>`).join('');
}

function clearPDFHistory() {
    _history = [];
    localStorage.removeItem('kairos_pdf_history');
    renderHistory();
    showToast('History cleared', 'info');
}

// ── Progress overlay ──────────────────────────────────────────────────────────
let _progressTimer = null;

function showProgress(label, sub = 'Please wait — this may take a moment') {
    document.getElementById('pdfProgressLabel').textContent = label;
    document.getElementById('pdfProgressSub').textContent = sub;
    _setProgress(8);
    document.getElementById('pdfProgressOverlay').style.display = 'flex';
    // Creep progress slowly toward 85% so user sees movement
    _progressTimer = setInterval(() => {
        const bar = document.getElementById('pdfProgressBar');
        const cur = parseFloat(bar.style.width) || 8;
        if (cur < 82) _setProgress(cur + (82 - cur) * 0.07);
    }, 350);
}

function _setProgress(pct) {
    pct = Math.round(Math.min(100, pct));
    const bar = document.getElementById('pdfProgressBar');
    const pctEl = document.getElementById('pdfProgressPct');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
}

function hideProgress() {
    clearInterval(_progressTimer);
    _setProgress(100);
    setTimeout(() => {
        document.getElementById('pdfProgressOverlay').style.display = 'none';
        _setProgress(0);
    }, 380);
}

// ── Main withProgress wrapper ─────────────────────────────────────────────────
async function withProgress(label, asyncFn, sub) {
    showProgress(label, sub);
    try {
        await asyncFn();
    } catch (err) {
        console.error(err);
        showToast('❌ ' + (err.message || String(err)), 'error');
    } finally {
        hideProgress();
    }
}

// ── File meta display ─────────────────────────────────────────────────────────
function showFileMeta(key, files) {
    const meta = document.getElementById('meta-' + key);
    if (!meta) return;
    const arr = Array.isArray(files) ? files : [files];
    const totalKB = (arr.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0);
    const label = arr.length > 1
        ? `${arr.length} files · ${totalKB} KB`
        : `${arr[0].name} · ${totalKB} KB`;
    meta.textContent = '📎 ' + label;
    meta.className = 'pdf-card-meta ok';
}

function clearFileMeta(key) {
    const meta = document.getElementById('meta-' + key);
    if (meta) { meta.textContent = ''; meta.className = 'pdf-card-meta'; }
}

// ── Drag-and-drop ─────────────────────────────────────────────────────────────
function enableDropZones() {
    document.querySelectorAll('.pdf-drop-zone').forEach(zone => {
        const key = zone.id.replace('drop-', '');

        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('click', () => _triggerToolByKey(key));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const files = [...e.dataTransfer.files];
            if (!files.length) return;
            _dropped[key] = files.length === 1 ? files[0] : files;
            showFileMeta(key, files);
        });
    });
}

function _triggerToolByKey(key) {
    const fn = {
        merge: initMergePDF, split: initSplitPDF, compress: initCompressPDF,
        watermark: initWatermark, jpg: () => initConvertToImage('jpg'),
        png: () => initConvertToImage('png'), rotate: initRotatePDF,
        unlock: initUnlockPDF, extract: initExtractPages,
        word: initWordToPDF, ppt: initPPTToPDF
    }[key];
    if (fn) fn();
}

// ── Rotate angle selector ─────────────────────────────────────────────────────
function selectRotate(btn) {
    document.querySelectorAll('.rotate-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function _selectedAngle() {
    const sel = document.querySelector('.rotate-btn.selected');
    return sel ? parseInt(sel.dataset.angle) : 90;
}

// ── File picker (checks dropped store first) ──────────────────────────────────
function getFiles(accept, multiple, key) {
    if (key && _dropped[key] !== undefined) {
        const f = _dropped[key];
        delete _dropped[key];
        clearFileMeta(key);
        return Promise.resolve(multiple ? (Array.isArray(f) ? f : [f]) : (Array.isArray(f) ? f[0] : f));
    }
    return pickFile(accept, multiple);
}

function pickFile(accept, multiple = false) {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = accept; input.multiple = multiple;
        input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(input);
        input.addEventListener('change', () => {
            document.body.removeChild(input);
            if (!input.files || !input.files.length) { resolve(null); return; }
            resolve(multiple ? Array.from(input.files) : input.files[0]);
        });
        const onFocus = () => {
            window.removeEventListener('focus', onFocus);
            setTimeout(() => { if (input.parentNode) { document.body.removeChild(input); resolve(null); } }, 500);
        };
        window.addEventListener('focus', onFocus);
        input.click();
    });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve(e.target.result);
        r.onerror = () => reject(new Error('Failed to read file'));
        r.readAsArrayBuffer(file);
    });
}

function triggerDownload(data, filename, mime = 'application/pdf') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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

function getPDFLib() {
    if (typeof PDFLib === 'undefined') throw new Error('pdf-lib not loaded — check your internet connection and reload.');
    return PDFLib;
}

function _fmtSize(bytes) { return (bytes / 1024).toFixed(0) + ' KB'; }

// ── MERGE ─────────────────────────────────────────────────────────────────────
async function initMergePDF() {
    const files = await getFiles('.pdf', true, 'merge');
    if (!files || files.length < 2) {
        showToast('Select at least 2 PDF files to merge', 'warning');
        return;
    }
    await withProgress('Merging PDFs', async () => {
        const { PDFDocument } = getPDFLib();
        const merged = await PDFDocument.create();
        for (const file of files) {
            const bytes = await readFileAsArrayBuffer(file);
            const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
            const copied = await merged.copyPages(src, src.getPageIndices());
            copied.forEach(p => merged.addPage(p));
        }
        const out = await merged.save();
        triggerDownload(out, 'merged.pdf');
        addToHistory(files.map(f => f.name).join(', '), 'merge', `${files.length} files → ${_fmtSize(out.byteLength)}`);
        showToast(`✅ Merged ${files.length} PDFs successfully!`, 'success');
    }, `Merging ${files.length} files…`);
}

// ── SPLIT ─────────────────────────────────────────────────────────────────────
async function initSplitPDF() {
    const file = await getFiles('.pdf', false, 'split');
    if (!file) return;
    const mode = document.getElementById('splitMode')?.value || 'all';
    const rangeStr = document.getElementById('splitRange')?.value?.trim() || '';

    await withProgress('Splitting PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes = await readFileAsArrayBuffer(file);
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const total = src.getPageCount();

        let groups; // array of index arrays
        if (mode === 'range' && rangeStr) {
            // Parse ranges into groups like [[0,1,2],[4],[6,7,8]]
            groups = rangeStr.split(',').map(seg => {
                const s = seg.trim();
                if (s.includes('-')) {
                    const [a, b] = s.split('-').map(n => parseInt(n) - 1);
                    const idxs = [];
                    for (let i = a; i <= Math.min(b, total - 1); i++) if (i >= 0) idxs.push(i);
                    return idxs;
                }
                const n = parseInt(s) - 1;
                return n >= 0 && n < total ? [n] : [];
            }).filter(g => g.length);
            if (!groups.length) throw new Error('No valid pages in that range');
        } else {
            groups = Array.from({ length: total }, (_, i) => [i]);
        }

        const zip = new JSZip();
        for (let gi = 0; gi < groups.length; gi++) {
            const doc = await PDFDocument.create();
            const pages = await doc.copyPages(src, groups[gi]);
            pages.forEach(p => doc.addPage(p));
            const pb = await doc.save();
            const label = groups.length === total ? `page_${gi + 1}` : `part_${gi + 1}`;
            zip.file(`${label}.pdf`, pb);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `split_${file.name.replace(/\.pdf$/i, '')}.zip`, 'application/zip');
        addToHistory(file.name, 'split', `${groups.length} part(s)`);
        showToast(`✅ Split into ${groups.length} part(s)!`, 'success');
    });
}

// ── COMPRESS ──────────────────────────────────────────────────────────────────
async function initCompressPDF() {
    const file = await getFiles('.pdf', false, 'compress');
    if (!file) return;
    const quality = document.getElementById('compressQuality')?.value || 'balanced';

    await withProgress('Compressing PDF', async () => {
        // Try backend first (server-side pypdf gives real compression)
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('quality', quality);
            const resp = await fetch(`${BACKEND}/pdf/compress`, { method: 'POST', body: fd, signal: AbortSignal.timeout(30000) });
            if (resp.ok) {
                const blob = await resp.blob();
                const newSize = blob.size;
                triggerDownload(blob, 'compressed.pdf');
                const ratio = (((file.size - newSize) / file.size) * 100).toFixed(0);
                addToHistory(file.name, 'compress', `${_fmtSize(file.size)} → ${_fmtSize(newSize)} (−${ratio}%)`);
                showToast(`✅ Compressed: ${_fmtSize(file.size)} → ${_fmtSize(newSize)} (−${ratio}%)`, 'success');
                return;
            }
        } catch { /* fall through */ }

        // Client-side fallback
        const { PDFDocument } = getPDFLib();
        const bytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const out = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        triggerDownload(out, 'compressed.pdf');
        const ratio = (((file.size - out.byteLength) / file.size) * 100).toFixed(0);
        addToHistory(file.name, 'compress', `${_fmtSize(file.size)} → ${_fmtSize(out.byteLength)} (−${ratio}%)`);
        showToast(`✅ Compressed: ${_fmtSize(file.size)} → ${_fmtSize(out.byteLength)} (−${ratio}%)`, 'success');
    });
}

// ── WATERMARK ─────────────────────────────────────────────────────────────────
async function initWatermark() {
    const text = (document.getElementById('wmText')?.value || '').trim() || 'CONFIDENTIAL';
    const colorHex = document.getElementById('wmColor')?.value || '#808080';
    const opacity = (parseInt(document.getElementById('wmOpacity')?.value || '35')) / 100;
    const position = document.getElementById('wmPosition')?.value || 'center';

    const file = await getFiles('.pdf', false, 'watermark');
    if (!file) return;

    await withProgress('Adding watermark', async () => {
        const { PDFDocument, rgb, degrees, StandardFonts } = getPDFLib();
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;

        const bytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (const page of pdfDoc.getPages()) {
            const { width, height } = page.getSize();
            const fontSize = Math.min(width, height) * 0.1;
            const textW = font.widthOfTextAtSize(text, fontSize);

            if (position === 'tiled') {
                // Tile the watermark across the page
                const cols = Math.ceil(width / (textW * 1.6)) + 1;
                const rows = Math.ceil(height / (fontSize * 3.5)) + 1;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        page.drawText(text, {
                            x: col * textW * 1.5 - textW / 2,
                            y: row * fontSize * 3,
                            size: fontSize * 0.7, font,
                            color: rgb(r, g, b), opacity: opacity * 0.75,
                            rotate: degrees(30),
                        });
                    }
                }
            } else if (position === 'bottomright') {
                const smallSize = Math.min(width, height) * 0.06;
                const tw = font.widthOfTextAtSize(text, smallSize);
                page.drawText(text, {
                    x: width - tw - 20, y: 20,
                    size: smallSize, font,
                    color: rgb(r, g, b), opacity,
                });
            } else {
                // Diagonal centre (default)
                page.drawText(text, {
                    x: width / 2 - textW / 2,
                    y: height / 2 - fontSize / 2,
                    size: fontSize, font,
                    color: rgb(r, g, b), opacity,
                    rotate: degrees(45),
                });
            }
        }
        const out = await pdfDoc.save();
        triggerDownload(out, 'watermarked.pdf');
        addToHistory(file.name, 'watermark', `"${text}" · ${position}`);
        showToast(`✅ Watermark added to all pages!`, 'success');
    });
}

// ── PDF → IMAGE ───────────────────────────────────────────────────────────────
async function initConvertToImage(format) {
    const key = format === 'jpg' ? 'jpg' : 'png';
    const file = await getFiles('.pdf', false, key);
    if (!file) return;

    await withProgress(`Converting to ${format.toUpperCase()}`, async () => {
        const lib = window.pdfjsLib;
        if (!lib) throw new Error('PDF.js not loaded — check your internet connection and reload.');
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const bytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await lib.getDocument({ data: bytes }).promise;
        const total = pdfDoc.numPages;
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

        const renderPage = async (num) => {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            return new Promise(res => canvas.toBlob(res, mime, 0.92));
        };

        if (total === 1) {
            const blob = await renderPage(1);
            triggerDownload(blob, file.name.replace(/\.pdf$/i, `_page1.${format}`), mime);
        } else {
            const zip = new JSZip();
            for (let i = 1; i <= total; i++) {
                _setProgress(10 + (i / total) * 75);
                const blob = await renderPage(i);
                zip.file(`page_${i}.${format}`, await blob.arrayBuffer());
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            triggerDownload(zipBlob, file.name.replace(/\.pdf$/i, `_pages.zip`), 'application/zip');
        }
        addToHistory(file.name, `convert-${format}`, `${total} page(s)`);
        showToast(`✅ Converted ${total} page(s) to ${format.toUpperCase()}!`, 'success');
    });
}

// ── ROTATE ────────────────────────────────────────────────────────────────────
async function initRotatePDF() {
    const angle = _selectedAngle();
    const file = await getFiles('.pdf', false, 'rotate');
    if (!file) return;

    await withProgress(`Rotating PDF ${angle}°`, async () => {
        const { PDFDocument, degrees } = getPDFLib();
        const bytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        for (const page of pdfDoc.getPages()) {
            const current = page.getRotation().angle;
            page.setRotation(degrees((current + angle) % 360));
        }
        const out = await pdfDoc.save();
        triggerDownload(out, 'rotated.pdf');
        addToHistory(file.name, 'rotate', `${angle}°`);
        showToast(`✅ Rotated ${pdfDoc.getPageCount()} page(s) by ${angle}°!`, 'success');
    });
}

// ── UNLOCK ────────────────────────────────────────────────────────────────────
async function initUnlockPDF() {
    const file = await getFiles('.pdf', false, 'unlock');
    if (!file) return;
    const password = document.getElementById('unlockPassword')?.value || '';

    await withProgress('Unlocking PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes = await readFileAsArrayBuffer(file);
        let pdfDoc;
        try {
            pdfDoc = await PDFDocument.load(bytes, { password, ignoreEncryption: false });
        } catch (e) {
            if (e.message && e.message.includes('password')) throw new Error('Incorrect password. Try again.');
            // Try ignoring encryption as fallback
            pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        }
        const out = await pdfDoc.save();
        triggerDownload(out, 'unlocked.pdf');
        addToHistory(file.name, 'unlock');
        showToast('✅ PDF unlocked successfully!', 'success');
        // Clear password field
        const pwEl = document.getElementById('unlockPassword');
        if (pwEl) pwEl.value = '';
    });
}

// ── EXTRACT PAGES ─────────────────────────────────────────────────────────────
async function initExtractPages() {
    const rangeStr = (document.getElementById('extractRange')?.value || '').trim();
    if (!rangeStr) {
        showToast('Enter a page range first (e.g. 1-3, 5)', 'warning');
        document.getElementById('extractRange')?.focus();
        return;
    }
    const file = await getFiles('.pdf', false, 'extract');
    if (!file) return;

    await withProgress('Extracting pages', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes = await readFileAsArrayBuffer(file);
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const indices = parsePageRange(rangeStr, src.getPageCount());
        if (!indices.length) throw new Error('No valid pages found in that range.');

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(src, indices);
        pages.forEach(p => newDoc.addPage(p));
        const out = await newDoc.save();
        triggerDownload(out, 'extracted.pdf');
        addToHistory(file.name, 'extract', `pages ${rangeStr}`);
        showToast(`✅ Extracted ${indices.length} page(s)!`, 'success');
    });
}

// ── WORD → PDF ────────────────────────────────────────────────────────────────
async function initWordToPDF() {
    const file = await getFiles('.docx,.doc', false, 'word');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
        showToast('⚠️ Only .docx is supported. Re-save your file as .docx first.', 'warning');
        return;
    }

    await withProgress('Converting Word to PDF', async () => {
        // Try backend first (LibreOffice quality)
        try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch(`${BACKEND}/pdf/word-to-pdf`, { method: 'POST', body: fd, signal: AbortSignal.timeout(30000) });
            if (resp.ok) {
                const blob = await resp.blob();
                triggerDownload(blob, file.name.replace(/\.docx?$/i, '.pdf'));
                addToHistory(file.name, 'word-to-pdf', 'server conversion');
                showToast('✅ Word document converted to PDF!', 'success');
                return;
            }
        } catch { /* fall through to client-side */ }

        // Client-side fallback (mammoth + jsPDF)
        if (!window.mammoth) throw new Error('mammoth.js not loaded — check your internet connection.');
        if (!window.jspdf) throw new Error('jsPDF not loaded — check your internet connection.');
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        _htmlToJsPDF(pdf, html);
        triggerDownload(pdf.output('blob'), file.name.replace(/\.docx?$/i, '.pdf'));
        addToHistory(file.name, 'word-to-pdf', 'browser conversion');
        showToast('✅ Word document converted to PDF!', 'success');
    }, 'Converting document…');
}

/** Render basic HTML (mammoth output) into an existing jsPDF instance. */
function _htmlToJsPDF(pdf, htmlContent) {
    const PAGE_W = 210, PAGE_H = 297, MARGIN = 16;
    const CW = PAGE_W - 2 * MARGIN;
    let y = MARGIN;

    const newPage = () => { pdf.addPage(); y = MARGIN; };
    const checkBreak = h => { if (y + h > PAGE_H - MARGIN) newPage(); };

    const para = (text, { size = 11, weight = 'normal', indent = 0, gap = 2.5, color = [0,0,0] } = {}) => {
        if (!text.trim()) return;
        pdf.setFontSize(size);
        pdf.setFont('helvetica', weight);
        pdf.setTextColor(...color);
        const lh = size * 0.3528 * 1.5;
        for (const line of pdf.splitTextToSize(text.trim(), CW - indent)) {
            checkBreak(lh);
            pdf.text(line, MARGIN + indent, y);
            y += lh;
        }
        y += gap;
    };

    const dom = new DOMParser().parseFromString(htmlContent, 'text/html');
    const walk = (el) => {
        if (el.nodeType !== 1) return;
        const t = el.tagName.toLowerCase();
        if      (t === 'p')  { para(el.textContent); }
        else if (t === 'h1') { y += 4; para(el.textContent, { size: 22, weight: 'bold', gap: 5 }); }
        else if (t === 'h2') { y += 3; para(el.textContent, { size: 17, weight: 'bold', gap: 4 }); }
        else if (t === 'h3') { y += 2; para(el.textContent, { size: 13, weight: 'bold', gap: 3 }); }
        else if (t === 'ul') {
            for (const li of el.querySelectorAll(':scope > li')) para('• ' + li.textContent.trim(), { indent: 6 });
            y += 1;
        } else if (t === 'ol') {
            let n = 1;
            for (const li of el.querySelectorAll(':scope > li')) para(`${n++}. ` + li.textContent.trim(), { indent: 6 });
            y += 1;
        } else if (t === 'hr') {
            checkBreak(6);
            pdf.setDrawColor(180, 180, 180);
            pdf.line(MARGIN, y, MARGIN + CW, y);
            y += 6;
        } else if (t === 'table') {
            const rows = el.querySelectorAll('tr');
            const cols = Math.max(...[...rows].map(r => r.querySelectorAll('td,th').length));
            const cw = CW / (cols || 1);
            const rh = 7;
            for (const row of rows) {
                checkBreak(rh + 2);
                const cells = row.querySelectorAll('td,th');
                const isHead = !!row.querySelector('th');
                if (isHead) { pdf.setFillColor(240, 240, 248); pdf.rect(MARGIN, y - rh + 2, CW, rh, 'F'); }
                pdf.setFont('helvetica', isHead ? 'bold' : 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(0, 0, 0);
                for (let c = 0; c < cols; c++) {
                    const cx = MARGIN + c * cw;
                    pdf.setDrawColor(200, 200, 200);
                    pdf.rect(cx, y - rh + 2, cw, rh);
                    const txt = (cells[c]?.textContent || '').trim().substring(0, 60);
                    if (txt) pdf.text(txt, cx + 2, y - 0.5, { maxWidth: cw - 4 });
                }
                y += rh;
            }
            y += 4;
        } else {
            for (const child of el.children) walk(child);
        }
    };
    for (const child of dom.body.children) walk(child);
}

// ── PPT → PDF ─────────────────────────────────────────────────────────────────
async function initPPTToPDF() {
    const file = await getFiles('.pptx,.ppt', false, 'ppt');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pptx')) {
        showToast('⚠️ Only .pptx is supported. Re-save your file as .pptx first.', 'warning');
        return;
    }

    await withProgress('Converting PowerPoint to PDF', async () => {
        // Try backend first
        try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch(`${BACKEND}/pdf/ppt-to-pdf`, { method: 'POST', body: fd, signal: AbortSignal.timeout(45000) });
            if (resp.ok) {
                const blob = await resp.blob();
                triggerDownload(blob, file.name.replace(/\.pptx?$/i, '.pdf'));
                addToHistory(file.name, 'ppt-to-pdf', 'server conversion');
                showToast('✅ PowerPoint converted to PDF!', 'success');
                return;
            }
        } catch { /* fall through */ }

        // Client-side fallback
        if (!window.jspdf) throw new Error('jsPDF not loaded — check your internet connection.');
        const bytes = await readFileAsArrayBuffer(file);
        const zip = await JSZip.loadAsync(bytes);

        const qa = (node, ln) => [...node.getElementsByTagName('*')].filter(e => e.localName === ln);
        const q1 = (node, ln) => qa(node, ln)[0] ?? null;

        let slidePaths = [];
        const presFile = zip.file('ppt/presentation.xml');
        const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
        if (presFile && relsFile) {
            const presDoc = new DOMParser().parseFromString(await presFile.async('string'), 'text/xml');
            const relsDoc = new DOMParser().parseFromString(await relsFile.async('string'), 'text/xml');
            const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
            const allRels = [...relsDoc.getElementsByTagName('Relationship')];
            for (const sldId of qa(presDoc, 'sldId')) {
                const rId = sldId.getAttributeNS(REL_NS, 'id') || sldId.getAttribute('r:id');
                if (!rId) continue;
                const rel = allRels.find(r => r.getAttribute('Id') === rId);
                if (!rel) continue;
                let tgt = rel.getAttribute('Target') || '';
                if (!tgt.startsWith('ppt/')) tgt = 'ppt/' + tgt.replace(/^\//, '');
                slidePaths.push(tgt);
            }
        }
        if (!slidePaths.length) {
            slidePaths = Object.keys(zip.files)
                .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
                .sort((a, b) => +a.match(/(\d+)/)[1] - +b.match(/(\d+)/)[1]);
        }
        if (!slidePaths.length) throw new Error('No slides found in this file.');

        let slideWemu = 9144000, slideHemu = 5143500;
        if (presFile) {
            const presDoc = new DOMParser().parseFromString(await presFile.async('string'), 'text/xml');
            const sz = q1(presDoc, 'sldSz');
            if (sz) { slideWemu = +sz.getAttribute('cx') || slideWemu; slideHemu = +sz.getAttribute('cy') || slideHemu; }
        }
        const aspect = slideWemu / slideHemu;
        const PW = 297, PH = +(PW / aspect).toFixed(2);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [PW, PH] });

        for (let si = 0; si < slidePaths.length; si++) {
            _setProgress(10 + (si / slidePaths.length) * 80);
            if (si > 0) pdf.addPage([PW, PH], 'landscape');
            const sf = zip.file(slidePaths[si]);
            if (!sf) continue;
            const sDoc = new DOMParser().parseFromString(await sf.async('string'), 'text/xml');
            await _pptxSlideToPDF(pdf, sDoc, PW, PH, slideWemu, slideHemu, q1, qa, zip, slidePaths[si]);
        }

        triggerDownload(pdf.output('blob'), file.name.replace(/\.pptx?$/i, '.pdf'));
        addToHistory(file.name, 'ppt-to-pdf', `${slidePaths.length} slide(s)`);
        showToast(`✅ Converted ${slidePaths.length} slide(s) to PDF!`, 'success');
    }, 'Parsing slides…');
}

/** Render one PPTX slide XML onto the current jsPDF page. */
async function _pptxSlideToPDF(pdf, sDoc, PW, PH, SW, SH, q1, qa, zip, slidePath) {
    const emu2x = v => (+v / SW) * PW;
    const emu2y = v => (+v / SH) * PH;
    const h2rgb = h => h && h.length >= 6
        ? [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
        : null;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PW, PH, 'F');
    const bgClr = q1(q1(sDoc, 'bgPr') ?? sDoc, 'srgbClr');
    if (bgClr) {
        const rgb = h2rgb(bgClr.getAttribute('val') || '');
        if (rgb) { pdf.setFillColor(...rgb); pdf.rect(0, 0, PW, PH, 'F'); }
    }

    const imgMap = {};
    if (slidePath && zip) {
        const slideDir = slidePath.replace(/\/[^/]+$/, '');
        const slideFile = slidePath.replace(/.*\//, '');
        const relsPath = `${slideDir}/_rels/${slideFile}.rels`;
        const relsF = zip.file(relsPath);
        if (relsF) {
            const rDoc = new DOMParser().parseFromString(await relsF.async('string'), 'text/xml');
            for (const rel of [...rDoc.getElementsByTagName('Relationship')]) {
                if ((rel.getAttribute('Type') || '').includes('/image')) {
                    let tgt = rel.getAttribute('Target') || '';
                    if (!tgt.startsWith('/') && !tgt.includes('://'))
                        tgt = `${slideDir}/${tgt}`.replace(/\/\.\//g, '/');
                    imgMap[rel.getAttribute('Id')] = tgt.replace(/^\//, '');
                }
            }
        }
    }

    const spTree = q1(sDoc, 'spTree');
    if (!spTree) return;

    function renderSp(sp) {
        const xfrm = q1(sp, 'xfrm');
        if (!xfrm) return;
        const off = q1(xfrm, 'off'), ext = q1(xfrm, 'ext');
        if (!off || !ext) return;
        const x = emu2x(off.getAttribute('x') || 0);
        const y = emu2y(off.getAttribute('y') || 0);
        const w = emu2x(ext.getAttribute('cx') || 0);
        const h = emu2y(ext.getAttribute('cy') || 0);
        if (w <= 0 || h <= 0) return;

        const spPr = q1(sp, 'spPr');
        const sfill = q1(spPr ?? sp, 'solidFill');
        if (sfill) {
            const clrEl = q1(sfill, 'srgbClr');
            if (clrEl) { const rgb = h2rgb(clrEl.getAttribute('val') || ''); if (rgb) { pdf.setFillColor(...rgb); pdf.rect(x, y, w, h, 'F'); } }
        }

        const txBody = q1(sp, 'txBody');
        if (!txBody) return;
        let curY = y + 3;
        for (const para of qa(txBody, 'p')) {
            const runs = qa(para, 'r');
            if (!runs.length) { curY += 3; continue; }
            if (curY >= y + h + 2) break;
            let text = '', fsz = 12, bold = false, italic = false, clr = [0, 0, 0];
            const pPr = q1(para, 'pPr');
            const algn = pPr ? (pPr.getAttribute('algn') || 'l') : 'l';
            for (const r of runs) {
                text += q1(r, 't')?.textContent ?? '';
                const rPr = q1(r, 'rPr');
                if (rPr) {
                    const sz = rPr.getAttribute('sz');
                    if (sz) fsz = Math.min(Math.max(parseInt(sz)/100, 6), 72);
                    if (rPr.getAttribute('b') === '1') bold = true;
                    if (rPr.getAttribute('i') === '1') italic = true;
                    const rc = q1(rPr, 'srgbClr');
                    if (rc) { const rgb = h2rgb(rc.getAttribute('val') || ''); if (rgb) clr = rgb; }
                }
            }
            if (!text.trim()) { curY += fsz * 0.3528 * 1.3; continue; }
            pdf.setFontSize(fsz);
            const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
            try { pdf.setFont('helvetica', style); } catch { pdf.setFont('helvetica', 'normal'); }
            pdf.setTextColor(...clr);
            const lh = fsz * 0.3528 * 1.5;
            const align = algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : 'left';
            const tx = algn === 'ctr' ? x + w/2 : algn === 'r' ? x + w - 2 : x + 2;
            for (const line of pdf.splitTextToSize(text.trim(), w - 4)) {
                if (curY >= y + h + 2) break;
                pdf.text(line, tx, curY, { align });
                curY += lh;
            }
        }
    }

    for (const sp of [...spTree.getElementsByTagName('*')].filter(e => e.localName === 'sp')) renderSp(sp);

    const picPromises = [];
    for (const pic of [...spTree.getElementsByTagName('*')].filter(e => e.localName === 'pic')) {
        const xfrm = q1(pic, 'xfrm');
        if (!xfrm) continue;
        const off = q1(xfrm, 'off'), ext = q1(xfrm, 'ext');
        if (!off || !ext) continue;
        const x = emu2x(off.getAttribute('x') || 0);
        const y = emu2y(off.getAttribute('y') || 0);
        const w = emu2x(ext.getAttribute('cx') || 0);
        const h = emu2y(ext.getAttribute('cy') || 0);
        if (w <= 0 || h <= 0) continue;
        const blip = q1(pic, 'blip');
        const rId = blip ? (blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed') || blip.getAttribute('r:embed')) : null;
        const imgPath = rId ? imgMap[rId] : null;
        if (imgPath && zip) {
            picPromises.push((async () => {
                try {
                    const imgFile = zip.file(imgPath);
                    if (!imgFile) return;
                    const b64 = await imgFile.async('base64');
                    const ext2 = imgPath.split('.').pop().toUpperCase().replace('JPG','JPEG');
                    const fmt = ['JPEG','PNG','GIF','WEBP'].includes(ext2) ? ext2 : 'JPEG';
                    pdf.addImage(`data:image/${fmt.toLowerCase()};base64,${b64}`, fmt, x, y, w, h);
                } catch {
                    pdf.setDrawColor(180,180,180); pdf.setFillColor(240,240,240);
                    pdf.rect(x, y, w, h, 'FD');
                }
            })());
        } else {
            pdf.setDrawColor(180,180,180); pdf.setFillColor(240,240,240);
            pdf.rect(x, y, w, h, 'FD');
        }
    }
    await Promise.all(picPromises);
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    enableDropZones();
    renderHistory();
});
