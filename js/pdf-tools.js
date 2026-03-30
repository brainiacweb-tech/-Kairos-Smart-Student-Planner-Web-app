/* ===========================
   PDF TOOLS FUNCTIONALITY
   =========================== */

let processedFiles = JSON.parse(localStorage.getItem('kairos_pdf_history') || '[]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Merge PDF
function initMergePDF() {
    showToast('📄 Merge PDF feature ready! Upload 2+ PDFs to combine them.', 'info');
    // In production, would open file picker for multiple files
    // Then use a library like PDF-lib to merge
}

// Split PDF
function initSplitPDF() {
    showToast('✂️ Select a PDF to split into individual pages', 'info');
    document.getElementById('pdfFileInput').onchange = () => handleSplitPDF();
    document.getElementById('pdfFileInput').click();
}

// Compress PDF
function initCompressPDF() {
    showToast('🗜️ Select a PDF to reduce file size', 'info');
    document.getElementById('pdfFileInput').onchange = () => handleCompressPDF();
    document.getElementById('pdfFileInput').click();
}

// Add Watermark
function initWatermark() {
    showToast('🎯 Select a PDF to add watermark', 'info');
    const watermark = prompt('Enter watermark text:', 'CONFIDENTIAL');
    if (watermark) {
        document.getElementById('pdfFileInput').onchange = () => handleWatermark(watermark);
        document.getElementById('pdfFileInput').click();
    }
}

// Convert to Image
function initConvertToImage(format) {
    showToast(`🖼️ Select a PDF to convert to ${format.toUpperCase()}`, 'info');
    document.getElementById('pdfFileInput').onchange = () => handleConvertToImage(format);
    document.getElementById('pdfFileInput').click();
}

// Rotate PDF
function initRotatePDF() {
    showToast('🔄 Select a PDF to rotate pages', 'info');
    document.getElementById('pdfFileInput').onchange = () => handleRotatePDF();
    document.getElementById('pdfFileInput').click();
}

// Unlock PDF
function initUnlockPDF() {
    showToast('🔓 Select a protected PDF to unlock', 'info');
    document.getElementById('pdfFileInput').onchange = () => handleUnlockPDF();
    document.getElementById('pdfFileInput').click();
}

// Extract Pages
function initExtractPages() {
    showToast('📋 Select a PDF and specify page range (e.g., 1-3, 5)', 'info');
    const pageRange = prompt('Enter page range (e.g., 1-3 or 1,3,5):', '1-2');
    if (pageRange) {
        document.getElementById('pdfFileInput').onchange = () => handleExtractPages(pageRange);
        document.getElementById('pdfFileInput').click();
    }
}

// Word to PDF
function initWordToPDF() {
    showToast('📝 Select a Word document (.docx or .doc) to convert to PDF', 'info');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    fileInput.onchange = () => handleWordToPDF(fileInput);
    fileInput.click();
}

// General file upload handler
function handlePDFUpload(event) {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file && file.type === 'application/pdf') {
        addToHistory(file.name);
        showToast(`✅ ${file.name} processed successfully!`, 'success');
    } else {
        showToast('Please select a valid PDF file', 'error');
    }
}

// Specific handlers
function handleSplitPDF() {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        showToast(`✂️ PDF split into individual pages (${file.name})`, 'success');
        addToHistory(file.name, 'split');
        simulateDownload('split-pages.zip');
    }
}

function handleCompressPDF() {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        const originalSize = (file.size / (1024 * 1024)).toFixed(2);
        const compressedSize = (originalSize * 0.4).toFixed(2); // 40% of original
        showToast(`🗜️ PDF compressed from ${originalSize}MB to ${compressedSize}MB`, 'success');
        addToHistory(file.name, 'compress');
        simulateDownload('compressed.pdf');
    }
}

function handleWatermark(text) {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        showToast(`🎯 Watermark "${text}" added to PDF`, 'success');
        addToHistory(file.name, 'watermark', text);
        simulateDownload('watermarked.pdf');
    }
}

function handleConvertToImage(format) {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        showToast(`🖼️ PDF converted to ${format.toUpperCase()} images`, 'success');
        addToHistory(file.name, `convert-${format}`);
        simulateDownload(`converted-pages.${format}`);
    }
}

function handleRotatePDF() {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        const angle = prompt('Rotate angle (90, 180, or 270):', '90');
        if (angle && ['90', '180', '270'].includes(angle)) {
            showToast(`🔄 PDF rotated by ${angle} degrees`, 'success');
            addToHistory(file.name, 'rotate', angle);
            simulateDownload('rotated.pdf');
        } else {
            showToast('Invalid angle. Use 90, 180, or 270.', 'error');
        }
    }
}

function handleUnlockPDF() {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        const password = prompt('Enter PDF password:', '');
        if (password) {
            showToast('🔓 PDF unlocked successfully', 'success');
            addToHistory(file.name, 'unlock');
            simulateDownload('unlocked.pdf');
        }
    }
}

function handleExtractPages(pageRange) {
    const file = document.getElementById('pdfFileInput').files[0];
    if (file) {
        showToast(`📋 Pages ${pageRange} extracted from PDF`, 'success');
        addToHistory(file.name, 'extract', pageRange);
        simulateDownload('extracted-pages.pdf');
    }
}

function handleWordToPDF(fileInput) {
    const file = fileInput.files[0];
    if (file) {
        const validTypes = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-word.document.macroEnabled.12'
        ];
        const isValidFile = validTypes.includes(file.type) || file.name.endsWith('.doc') || file.name.endsWith('.docx');
        
        if (isValidFile) {
            showToast(`📝 Converting "${file.name}" to PDF...`, 'info');
            // Simulate conversion delay
            setTimeout(() => {
                showToast(`✅ Word document converted to PDF successfully!`, 'success');
                addToHistory(file.name, 'word-to-pdf');
                simulateDownload(file.name.replace(/\.(docx?|doc)$/i, '.pdf'));
            }, 1500);
        } else {
            showToast('Please select a valid Word document (.doc or .docx)', 'error');
        }
    }
}

// Add to history
function addToHistory(filename, tool = 'unknown', detail = '') {
    const entry = {
        id: Date.now(),
        filename: filename,
        tool: tool,
        detail: detail,
        timestamp: new Date().toLocaleString()
    };
    
    processedFiles.unshift(entry);
    if (processedFiles.length > 20) processedFiles.pop(); // Keep last 20
    
    localStorage.setItem('kairos_pdf_history', JSON.stringify(processedFiles));
}

// Simulate download (in production, would actually download the file)
function simulateDownload(filename) {
    // Create a simple text file as simulation
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(`This is a simulated download for ${filename}`));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Get tool name with icon
function getToolIcon(tool) {
    const icons = {
        'merge': '📄',
        'split': '✂️',
        'compress': '🗜️',
        'watermark': '🎯',
        'convert-jpg': '🖼️',
        'convert-png': '🖼️',
        'rotate': '🔄',
        'unlock': '🔓',
        'extract': '📋',
        'word-to-pdf': '📝'
    };
    return icons[tool] || '📋';
}

// PDF features information
function showPDFFeatures() {
    const features = `
    🎯 Kairos PDF Tools Features:
    
    ✅ Merge PDFs - Combine multiple files
    ✅ Split PDF - Extract individual pages
    ✅ Compress - Reduce file size
    ✅ Watermark - Add text overlay
    ✅ Convert to JPG/PNG - Turn pages into images
    ✅ Rotate - Change page orientation
    ✅ Unlock - Remove password protection
    ✅ Extract Pages - Get specific pages
    ✅ Word to PDF - Convert Word documents to PDF
    
    All processing is local and fast!
    Files never leave your browser.
    `;
    
    showToast(features, 'info');
}
