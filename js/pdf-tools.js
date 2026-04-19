/* ===========================
   PDF TOOLS  -  CLIENT-SIDE
   Uses pdf-lib (no backend required for most operations)
   Word→PDF / PPT→PDF still require the Python backend.
   =========================== */

const BACKEND = (typeof KAIROS_API_BASE !== 'undefined') ? KAIROS_API_BASE : 'http://localhost:5000/api';

// ── utilities ─────────────────────────────────────────────────────────────────

/** Read a File object as an ArrayBuffer */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/** Trigger a browser download from a Uint8Array / Blob */
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

/** Show a progress toast while work is being done, replace with result toast */
function withProgress(label, asyncFn) {
    showToast(`⏳ ${label}…`, 'info');
    return asyncFn().then(
        ()  => { /* caller shows success */ },
        err => {
            console.error(err);
            showToast(`❌ ${err.message || err}`, 'error');
        }
    );
}

/** Open a file-picker dialog; resolves with File(s) or null on cancel */
function pickFile(accept, multiple = false) {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type     = 'file';
        input.accept   = accept;
        input.multiple = multiple;
        input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(input);

        // resolve on selection
        input.addEventListener('change', () => {
            document.body.removeChild(input);
            if (!input.files || !input.files.length) { resolve(null); return; }
            resolve(multiple ? Array.from(input.files) : input.files[0]);
        });

        // resolve on cancel (oncancel not supported everywhere  -  use focus trick)
        const onFocus = () => {
            window.removeEventListener('focus', onFocus);
            setTimeout(() => {
                if (input.parentNode) {
                    document.body.removeChild(input);
                    resolve(null);
                }
            }, 500);
        };
        window.addEventListener('focus', onFocus);

        input.click();
    });
}

/** Parse a page-range string like "1-3,5,7-9" → sorted 0-based indices */
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

/** Add a processed file to localStorage history */
let processedFiles = JSON.parse(localStorage.getItem('kairos_pdf_history') || '[]');
function addToHistory(filename, tool, detail = '') {
    processedFiles.unshift({ id: Date.now(), filename, tool, detail, timestamp: new Date().toLocaleString() });
    if (processedFiles.length > 20) processedFiles.pop();
    localStorage.setItem('kairos_pdf_history', JSON.stringify(processedFiles));
}

// ── PDF-LIB helpers ───────────────────────────────────────────────────────────

function getPDFLib() {
    if (typeof PDFLib === 'undefined') throw new Error('pdf-lib not loaded. Check your internet connection and reload.');
    return PDFLib;
}

// ── MERGE ─────────────────────────────────────────────────────────────────────

async function initMergePDF() {
    const files = await pickFile('.pdf', true);
    if (!files || files.length < 2) {
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
    });
}

// ── SPLIT ─────────────────────────────────────────────────────────────────────

async function initSplitPDF() {
    const file = await pickFile('.pdf');
    if (!file) return;
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
    });
}

// ── COMPRESS ──────────────────────────────────────────────────────────────────

async function initCompressPDF() {
    const file = await pickFile('.pdf');
    if (!file) return;
    await withProgress('Compressing PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        // pdf-lib's useObjectStreams packs cross-reference tables efficiently
        const out = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        const origKB = (file.size / 1024).toFixed(1);
        const newKB  = (out.byteLength / 1024).toFixed(1);
        triggerDownload(out, 'compressed.pdf');
        addToHistory(file.name, 'compress');
        showToast(`✅ Compressed: ${origKB} KB → ${newKB} KB`, 'success');
    });
}

// ── WATERMARK ─────────────────────────────────────────────────────────────────

async function initWatermark() {
    const text = prompt('Enter watermark text:', 'CONFIDENTIAL');
    if (!text) return;
    const file = await pickFile('.pdf');
    if (!file) return;
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
    });
}

// ── PDF → IMAGE  (PDF.js) ─────────────────────────────────────────────────────

async function initConvertToImage(format) {
    const file = await pickFile('.pdf');
    if (!file) return;
    await withProgress(`Converting to ${format.toUpperCase()}`, async () => {
        const lib = window.pdfjsLib;
        if (!lib) throw new Error('PDF.js not loaded  -  check your internet connection and reload.');
        lib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

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
    });
}

// ── ROTATE ────────────────────────────────────────────────────────────────────

async function initRotatePDF() {
    const angle = prompt('Rotation angle (90, 180, or 270):', '90');
    if (!angle || !['90', '180', '270'].includes(angle.trim())) {
        showToast('Please enter 90, 180, or 270', 'warning');
        return;
    }
    const file = await pickFile('.pdf');
    if (!file) return;
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
    });
}

// ── UNLOCK ────────────────────────────────────────────────────────────────────

async function initUnlockPDF() {
    const file = await pickFile('.pdf');
    if (!file) return;
    const password = prompt('Enter the PDF password (leave blank if none):', '');
    if (password === null) return;
    await withProgress('Unlocking PDF', async () => {
        const { PDFDocument } = getPDFLib();
        const bytes  = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(bytes, { password, ignoreEncryption: false });
        // Re-save without encryption
        const out = await pdfDoc.save();
        triggerDownload(out, 'unlocked.pdf');
        addToHistory(file.name, 'unlock');
        showToast('✅ PDF unlocked successfully!', 'success');
    });
}

// ── EXTRACT PAGES ─────────────────────────────────────────────────────────────

async function initExtractPages() {
    const pageRange = prompt('Enter page range (e.g. 1-3 or 1,3,5):', '1-2');
    if (!pageRange) return;
    const file = await pickFile('.pdf');
    if (!file) return;
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
    });
}

// ── WORD → PDF  (mammoth.js + jsPDF) ─────────────────────────────────────────

async function initWordToPDF() {
    const file = await pickFile('.docx,.doc');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
        showToast('⚠️ Only .docx is supported for in-browser conversion. Re-save your file as .docx and try again.', 'warning');
        return;
    }
    await withProgress('Converting Word to PDF', async () => {
        if (!window.mammoth)      throw new Error('mammoth.js not loaded  -  check your internet connection.');
        if (!window.jspdf)        throw new Error('jsPDF not loaded  -  check your internet connection.');

        // 1. DOCX → HTML
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

        // 2. HTML → PDF using a text-based renderer (no html2canvas needed)
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        _htmlToJsPDF(pdf, html);

        triggerDownload(pdf.output('blob'), file.name.replace(/\.docx?$/i, '.pdf'), 'application/pdf');
        addToHistory(file.name, 'word-to-pdf');
        showToast('✅ Word document converted to PDF!', 'success');
    });
}

/** Render basic HTML (mammoth output) into an existing jsPDF instance. */
function _htmlToJsPDF(pdf, htmlContent) {
    const PAGE_W = 210, PAGE_H = 297, MARGIN = 15;
    const CW = PAGE_W - 2 * MARGIN; // content width
    let y = MARGIN;

    const newPage = () => { pdf.addPage(); y = MARGIN; };
    const checkBreak = h => { if (y + h > PAGE_H - MARGIN) newPage(); };

    const para = (text, { size = 11, weight = 'normal', indent = 0, gap = 2 } = {}) => {
        if (!text.trim()) return;
        pdf.setFontSize(size);
        pdf.setFont('helvetica', weight);
        pdf.setTextColor(0, 0, 0);
        const lh = size * 0.3528 * 1.45;
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
        else if (t === 'h1') { y += 3; para(el.textContent, { size: 20, weight: 'bold', gap: 4 }); }
        else if (t === 'h2') { y += 2; para(el.textContent, { size: 16, weight: 'bold', gap: 3 }); }
        else if (t === 'h3') { y += 2; para(el.textContent, { size: 13, weight: 'bold', gap: 2 }); }
        else if (t === 'ul') {
            for (const li of el.querySelectorAll(':scope > li'))
                para('• ' + li.textContent.trim(), { indent: 5 });
            y += 1;
        } else if (t === 'ol') {
            let n = 1;
            for (const li of el.querySelectorAll(':scope > li'))
                para(`${n++}. ` + li.textContent.trim(), { indent: 5 });
            y += 1;
        } else if (t === 'table') {
            const rows = el.querySelectorAll('tr');
            const cols = Math.max(...[...rows].map(r => r.querySelectorAll('td,th').length));
            const cw   = CW / (cols || 1);
            const rh   = 7;
            for (const row of rows) {
                checkBreak(rh + 2);
                const cells  = row.querySelectorAll('td,th');
                const isHead = !!row.querySelector('th');
                pdf.setFont('helvetica', isHead ? 'bold' : 'normal');
                pdf.setFontSize(9);
                for (let c = 0; c < cols; c++) {
                    const cx = MARGIN + c * cw;
                    pdf.setDrawColor(180, 180, 180);
                    pdf.rect(cx, y - rh + 2, cw, rh);
                    const txt = (cells[c]?.textContent || '').trim().substring(0, 60);
                    if (txt) pdf.text(txt, cx + 1.5, y - 0.5, { maxWidth: cw - 3 });
                }
                y += rh;
            }
            y += 3;
        } else {
            for (const child of el.children) walk(child);
        }
    };
    for (const child of dom.body.children) walk(child);
}

// ── PPT → PDF  (JSZip + XML parsing + jsPDF) ──────────────────────────────────

async function initPPTToPDF() {
    const file = await pickFile('.pptx,.ppt');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pptx')) {
        showToast('⚠️ Only .pptx is supported for in-browser conversion. Re-save as .pptx and try again.', 'warning');
        return;
    }
    await withProgress('Converting PowerPoint to PDF', async () => {
        if (!window.jspdf) throw new Error('jsPDF not loaded  -  check your internet connection.');

        const bytes = await readFileAsArrayBuffer(file);
        const zip   = await JSZip.loadAsync(bytes);

        // XML helpers (namespace-safe)
        const qa = (node, ln) => [...node.getElementsByTagName('*')].filter(e => e.localName === ln);
        const q1 = (node, ln) => qa(node, ln)[0] ?? null;

        // Resolve ordered slide paths from presentation.xml + its .rels
        let slidePaths = [];
        const presFile = zip.file('ppt/presentation.xml');
        const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
        if (presFile && relsFile) {
            const presDoc = new DOMParser().parseFromString(await presFile.async('string'), 'text/xml');
            const relsDoc = new DOMParser().parseFromString(await relsFile.async('string'), 'text/xml');
            const REL_NS  = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
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
        // Fallback: enumerate numerically
        if (!slidePaths.length) {
            slidePaths = Object.keys(zip.files)
                .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
                .sort((a, b) => +a.match(/(\d+)/)[1] - +b.match(/(\d+)/)[1]);
        }
        if (!slidePaths.length) throw new Error('No slides found in this file.');

        // Get slide dimensions from presentation.xml (fall back to widescreen 16:9)
        let slideWemu = 9144000, slideHemu = 5143500;
        if (presFile) {
            const presDoc = new DOMParser().parseFromString(await presFile.async('string'), 'text/xml');
            const sz = q1(presDoc, 'sldSz');
            if (sz) { slideWemu = +sz.getAttribute('cx') || slideWemu; slideHemu = +sz.getAttribute('cy') || slideHemu; }
        }
        const aspect = slideWemu / slideHemu;
        const PW = 297, PH = +(PW / aspect).toFixed(2); // landscape mm

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [PW, PH] });

        for (let si = 0; si < slidePaths.length; si++) {
            if (si > 0) pdf.addPage([PW, PH], 'landscape');
            const sf = zip.file(slidePaths[si]);
            if (!sf) continue;
            const sDoc = new DOMParser().parseFromString(await sf.async('string'), 'text/xml');
            await _pptxSlideToPDF(pdf, sDoc, PW, PH, slideWemu, slideHemu, q1, qa, zip, slidePaths[si]);
        }

        triggerDownload(pdf.output('blob'), file.name.replace(/\.pptx?$/i, '.pdf'), 'application/pdf');
        addToHistory(file.name, 'ppt-to-pdf');
        showToast(`✅ Converted ${slidePaths.length} slide(s) to PDF!`, 'success');
    });
}

/** Render one PPTX slide XML document onto the current jsPDF page. */
async function _pptxSlideToPDF(pdf, sDoc, PW, PH, SW, SH, q1, qa, zip, slidePath) {
    const emu2x = v => (+v / SW) * PW;
    const emu2y = v => (+v / SH) * PH;
    const h2rgb = h => h && h.length >= 6
        ? [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
        : null;

    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PW, PH, 'F');
    const bgClr = q1(q1(sDoc, 'bgPr') ?? sDoc, 'srgbClr');
    if (bgClr) {
        const rgb = h2rgb(bgClr.getAttribute('val') || '');
        if (rgb) { pdf.setFillColor(...rgb); pdf.rect(0, 0, PW, PH, 'F'); }
    }

    // Build image rId -> zip path map from slide rels
    const imgMap = {};
    if (slidePath && zip) {
        const slideDir = slidePath.replace(/\/[^/]+$/, '');
        const slideFile = slidePath.replace(/.*\//, '');
        const relsPath = `${slideDir}/_rels/${slideFile}.rels`;
        const relsFile = zip.file(relsPath);
        if (relsFile) {
            const rDoc = new DOMParser().parseFromString(await relsFile.async('string'), 'text/xml');
            for (const rel of [...rDoc.getElementsByTagName('Relationship')]) {
                const type = rel.getAttribute('Type') || '';
                if (type.includes('/image')) {
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

    // Helper: render one <sp> node
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

        // Shape fill
        const spPr  = q1(sp, 'spPr');
        const sfill = q1(spPr ?? sp, 'solidFill');
        if (sfill) {
            const clrEl = q1(sfill, 'srgbClr');
            if (clrEl) {
                const rgb = h2rgb(clrEl.getAttribute('val') || '');
                if (rgb) { pdf.setFillColor(...rgb); pdf.rect(x, y, w, h, 'F'); }
            }
        }

        // Text
        const txBody = q1(sp, 'txBody');
        if (!txBody) return;
        let curY = y + 3;
        for (const para of qa(txBody, 'p')) {
            const runs = qa(para, 'r');
            if (!runs.length) { curY += 3; continue; }
            if (curY >= y + h + 2) break;
            let text = '', fsz = 12, bold = false, italic = false, clr = [0, 0, 0];
            const pPr  = q1(para, 'pPr');
            const algn = pPr ? (pPr.getAttribute('algn') || 'l') : 'l';
            // Paragraph-level font size from lstStyle / defRPr
            const lstStyle = q1(txBody, 'lstStyle');
            const defRpr = lstStyle ? q1(lstStyle, 'defRPr') : null;
            if (defRpr) { const ds = defRpr.getAttribute('sz'); if (ds) fsz = Math.min(Math.max(parseInt(ds)/100,6),72); }
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
            try { pdf.setFont('helvetica', style); } catch(e) { pdf.setFont('helvetica','normal'); }
            pdf.setTextColor(...clr);
            const lh    = fsz * 0.3528 * 1.45;
            const align = algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : 'left';
            const tx    = algn === 'ctr' ? x + w/2 : algn === 'r' ? x + w - 2 : x + 2;
            for (const line of pdf.splitTextToSize(text.trim(), w - 4)) {
                if (curY >= y + h + 2) break;
                pdf.text(line, tx, curY, { align });
                curY += lh;
            }
        }
    }

    // Process all <sp> elements (including those inside <grpSp> groups)
    for (const sp of [...spTree.getElementsByTagName('*')].filter(e => e.localName === 'sp')) {
        renderSp(sp);
    }

    // Process images (<pic> elements)
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

        // Get rId from blipFill > blip r:embed
        const blip = q1(pic, 'blip');
        const rId  = blip ? (blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed') || blip.getAttribute('r:embed')) : null;
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
                } catch(e) {
                    // Image failed - draw placeholder rect
                    pdf.setDrawColor(180,180,180); pdf.setFillColor(240,240,240);
                    pdf.rect(x, y, w, h, 'FD');
                }
            })());
        } else {
            // No image data - draw light grey placeholder
            pdf.setDrawColor(180,180,180); pdf.setFillColor(240,240,240);
            pdf.rect(x, y, w, h, 'FD');
        }
    }
    await Promise.all(picPromises);
}

// ── init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
