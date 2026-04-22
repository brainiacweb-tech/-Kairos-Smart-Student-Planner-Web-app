
function showToast(msg,type){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:500;color:#fff;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:opacity .4s;';
  t.style.background=type==='success'?'#2B579A':type==='error'?'#c0392b':'#555';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),400);},2200);
}
const editor = document.getElementById('editor');
let docName = 'Document1';
let zoomLevel = 100;
let currentView = 'print';
let _savedSel = null;

// Save selection when editor loses focus (mobile: tapping ribbon loses selection)
document.addEventListener('DOMContentLoaded', () => {
  editor.addEventListener('blur', () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) _savedSel = sel.getRangeAt(0).cloneRange();
  });
  // On desktop only: prevent ribbon buttons from stealing focus (keeps selection alive)
  // Skip on touch devices so onclick events fire correctly
  if (!('ontouchstart' in window)) {
    document.querySelector('.ribbon').addEventListener('mousedown', (e) => {
      if (!e.target.closest('.ribbon-tab') &&
          e.target.tagName !== 'SELECT' &&
          e.target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    });
  }
  // Mobile: save selection on touchstart of ribbon buttons
  document.querySelector('.ribbon').addEventListener('touchstart', (e) => {
    if (!e.target.closest('.ribbon-tab')) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        _savedSel = sel.getRangeAt(0).cloneRange();
      }
    }
  }, { passive: true });
});

function _restoreSel() {
  if (!_savedSel) return;
  const range = _savedSel;
  _savedSel = null;
  editor.focus();
  const sel = window.getSelection();
  if (sel && range) { sel.removeAllRanges(); sel.addRange(range); }
}

// ============ RIBBON ============
function switchTab(name, el){
  try {
    // Close file menu when switching tabs
    const fileMenu = document.getElementById('fileMenu');
    if(fileMenu) fileMenu.style.display='none';
    
    // Remove active class from all tabs and contents
    document.querySelectorAll('.ribbon-tab').forEach(t => {
      t.classList.remove('active');
    });
    document.querySelectorAll('.ribbon-content').forEach(c => {
      c.classList.remove('active');
    });
    
    // Add active class to corresponding content
    const content = document.querySelector('.ribbon-content[data-tab="' + name + '"]');
    if(content) {
      content.classList.add('active');
      console.log('✓ Activated content:', name);
    } else {
      console.error('✗ Content not found:', name);
    }
    
    // Add active class to clicked tab
    if(el) {
      el.classList.add('active');
      console.log('✓ Activated button');
    }
    
    console.log('✓ Switched to tab:', name);
  } catch(e) {
    console.error('Error in switchTab:', e);
  }
}

// ============ EDITOR COMMANDS ============
function cmd(command, value){
  _restoreSel();
  editor.focus();
  document.execCommand(command, false, value||null);
  updateToolbarState();
}

function applyFont(){
  const font = document.getElementById('ribbonFontName').value;
  cmd('fontName', font);
}

function applyFontSize(){
  const size = parseInt(document.getElementById('ribbonFontSize').value);
  // execCommand fontSize only accepts 1-7; use span instead
  const sel = window.getSelection();
  if(!sel.rangeCount) return;
  document.execCommand('fontSize', false, '7');
  document.querySelectorAll('#editor font[size="7"]').forEach(el=>{
    el.removeAttribute('size');
    el.style.fontSize = size+'px';
  });
}

function adjustFontSize(delta){
  const sel = document.getElementById('ribbonFontSize');
  const cur = parseInt(sel.value)||12;
  const next = Math.max(8, Math.min(72, cur+delta));
  sel.value = next;
  applyFontSize();
}

function applyFontColor(){
  const color = document.getElementById('fontColorPicker').value;
  document.getElementById('fontColorSwatch').style.background = color;
  cmd('foreColor', color);
}

function updateToolbarState(){
  ['bold','italic','underline'].forEach(c=>{
    const btn = document.getElementById('btn-'+c);
    if(btn) btn.classList.toggle('pressed', document.queryCommandState(c));
  });
}

editor.addEventListener('keyup', updateToolbarState);
editor.addEventListener('mouseup', updateToolbarState);
editor.addEventListener('input', ()=>{
  if (isCorruptedWordDoc(editor.innerHTML || '')) {
    editor.innerHTML = '';
    localStorage.removeItem('kairos_word_doc');
    localStorage.removeItem('kairos_word_doc_draft');
    if(typeof showToast==='function') showToast('Corrupted content removed automatically.','error');
    return;
  }
  autoSave();
});

// ============ ZOOM ============
function setZoom(val){
  zoomLevel = parseInt(val);
  document.getElementById('docPage').style.transform = 'scale('+zoomLevel/100+')';
  document.getElementById('docPage').style.transformOrigin = 'top center';
}
function zoomIn(){ setZoom(Math.min(200, zoomLevel+10)); }
function zoomOut(){ setZoom(Math.max(50, zoomLevel-10)); }
function zoomReset(){ setZoom(100); }

// ============ VIEWS ============
function setView(v){
  currentView = v;
  const page = document.getElementById('docPage');
  const ws = document.getElementById('docWorkspace');
  ['btn-printlayout','btn-weblayout','btn-focusview'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.classList.remove('pressed');
  });
  if(v==='print'){
    page.style.width='816px';page.style.minHeight='1056px';page.style.boxShadow='0 2px 8px rgba(0,0,0,.15)';
    ws.style.background='#f3f2f1';
    document.getElementById('btn-printlayout').classList.add('pressed');
  } else if(v==='web'){
    page.style.width='100%';page.style.minHeight='auto';page.style.boxShadow='none';
    ws.style.background='white';
    document.getElementById('btn-weblayout').classList.add('pressed');
  } else if(v==='focus'){
    page.style.width='700px';page.style.minHeight='100%';page.style.boxShadow='none';
    ws.style.background='#f9f9f9';
    document.getElementById('btn-focusview').classList.add('pressed');
  }
}

// ============ MARGINS ============
function setMargins(m){
  const p = document.getElementById('docPage');
  const map = {normal:'96px 96px', narrow:'48px 48px', wide:'96px 144px'};
  p.style.padding = map[m]||'96px 96px';
}

// ============ ORIENTATION ============
function setOrientation(o){
  const p = document.getElementById('docPage');
  if(o==='landscape'){p.style.width='1056px';p.style.minHeight='816px';}
  else {p.style.width='816px';p.style.minHeight='1056px';}
}

// ============ COLUMNS ============
function setColumns(n){
  editor.style.columnCount = n>1 ? n : '';
  editor.style.columnGap = n>1 ? '40px' : '';
}

// ============ INSERT ============
function insertPageBreak(){
  cmd('insertHTML','<div style="page-break-after:always;border-top:1px dashed #bbb;margin:16px 0;"></div>');
}
function insertHR(){
  cmd('insertHTML','<hr style="border:none;border-top:1px solid #bbb;margin:12px 0;">');
}
function insertLink(){
  const url = prompt('Enter URL:','https://');
  if(url) cmd('createLink', url);
}

// ============ FIND & REPLACE ============
function openFindReplace(){ document.getElementById('findReplaceModal').classList.add('open'); document.getElementById('findInput').focus(); }
function closeFindReplace(){ document.getElementById('findReplaceModal').classList.remove('open'); }
function findNext(){
  const q = document.getElementById('findInput').value;
  if(!q) return;
  window.find(q, false, false, true, false, false, false);
}
function replaceNext(){
  const find = document.getElementById('findInput').value;
  const replace = document.getElementById('replaceInput').value;
  if(!find) return;
  if(window.find(find)){
    document.execCommand('insertText', false, replace);
  }
}
function replaceAll(){
  const find = document.getElementById('findInput').value;
  const replace = document.getElementById('replaceInput').value;
  if(!find) return;
  let count = 0;
  while(window.find(find)){ document.execCommand('insertText',false,replace); count++; if(count>500) break; }
  alert('Replaced '+count+' occurrence(s).');
}

// ============ TABLE MODAL ============
function openTableModal(){
  document.getElementById('tableModal').classList.add('open');
  buildTableGrid();
}
function closeTableModal(){ document.getElementById('tableModal').classList.remove('open'); }
function buildTableGrid(){
  const grid = document.getElementById('tableGrid');
  grid.innerHTML='';
  for(let r=1;r<=8;r++){
    for(let c=1;c<=10;c++){
      const btn = document.createElement('div');
      btn.className='table-cell-btn';
      btn.dataset.row=r; btn.dataset.col=c;
      btn.onmouseenter=()=>{
        document.querySelectorAll('.table-cell-btn').forEach(b=>{
          b.classList.toggle('hovered', parseInt(b.dataset.row)<=r && parseInt(b.dataset.col)<=c);
        });
        document.getElementById('tableGridLabel').textContent = r+'×'+c+' Table';
      };
      btn.onclick=()=>{ insertTable(r,c); closeTableModal(); };
      grid.appendChild(btn);
    }
  }
}
function insertTable(rows, cols){
  let html='<table><tbody>';
  for(let r=0;r<rows;r++){
    html+='<tr>';
    for(let c=0;c<cols;c++) html+='<td>&nbsp;</td>';
    html+='</tr>';
  }
  html+='</tbody></table><p></p>';
  cmd('insertHTML', html);
}

// ============ FILE OPERATIONS ============
function toggleFileMenu(){
  const m = document.getElementById('fileMenu');
  m.style.display = m.style.display==='none'?'block':'none';
}
document.addEventListener('click', e=>{
  const fm = document.getElementById('fileMenu');
  const fr = document.getElementById('findReplaceModal');
  const tm = document.getElementById('tableModal');
  if(!fm.contains(e.target) && !e.target.classList.contains('file-tab')) fm.style.display='none';
});

function newDoc(){
  if(editor.innerHTML && !confirm('Discard current document?')) return;
  editor.innerHTML=''; docName='Document1'; updateDocName();
  toggleFileMenu();
}
function saveDoc(){
  localStorage.setItem('kairos_word_doc', editor.innerHTML);
  localStorage.setItem('kairos_word_name', docName);
  if(typeof showToast==='function') showToast('Document saved','success');
  document.getElementById('fileMenu').style.display='none';
}
function autoSave(){ localStorage.setItem('kairos_word_doc_draft', editor.innerHTML); }
function renameDoc(){
  const n = prompt('Document name:', docName);
  if(n){ docName=n; updateDocName(); }
  document.getElementById('fileMenu').style.display='none';
}
function updateDocName(){
  document.getElementById('docNameDisplay').textContent = docName;
  document.getElementById('fileDocName').textContent = docName;
  document.title = docName+'  -  Word';
}
function downloadDoc(fmt){
  let content, mime, ext;
  if(fmt==='txt'){ content=editor.innerText; mime='text/plain'; ext='txt'; }
  else { content=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docName}</title></head><body>${editor.innerHTML}</body></html>`; mime='text/html'; ext='html'; }
  const blob=new Blob([content],{type:mime});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=docName+'.'+ext; a.click();
  document.getElementById('fileMenu').style.display='none';
}
function printDoc(){ window.print(); document.getElementById('fileMenu').style.display='none'; }
function goBack(){ window.location.href='dashboard.html'; }

// ============ PYTHON BACKEND  -  DOCX IMPORT / EXPORT ============
const _WORD_API = (typeof KAIROS_API_BASE !== 'undefined') ? KAIROS_API_BASE : 'http://localhost:5000/api';

async function exportDocx(){
  document.getElementById('fileMenu').style.display='none';
  if(typeof showToast==='function') showToast('⏳ Exporting as Word…','info');
  try {
    const res = await fetch(`${_WORD_API}/word/export`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({html: editor.innerHTML, name: docName})
    });
    if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (docName.endsWith('.docx')?docName:docName+'.docx');
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    if(typeof showToast==='function') showToast('✅ Word document exported!','success');
  } catch(e){
    // Fallback: export a Word-compatible HTML document locally.
    const fallback = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docName}</title></head><body>${editor.innerHTML}</body></html>`;
    const blob = new Blob([fallback], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (docName.endsWith('.doc') ? docName : docName + '.doc');
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    if(typeof showToast==='function') showToast('⚠️ Backend unavailable. Exported as .doc fallback.','info');
  }
}

async function openDocx(){
  document.getElementById('fileMenu').style.display='none';
  if(editor.innerHTML.trim() && !confirm('Replace current document with the imported file?')) return;
  const input = document.createElement('input');
  input.type='file'; input.accept='.docx,.doc'; input.style.display='none';
  document.body.appendChild(input);
  input.onchange = async ()=>{
    document.body.removeChild(input);
    const file = input.files[0];
    if(!file) return;
    if(typeof showToast==='function') showToast('⏳ Opening Word document…','info');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${_WORD_API}/word/import`,{method:'POST',body:fd});
      if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
      const data = await res.json();
      editor.innerHTML = data.html || '';
      docName = data.name || file.name.replace(/\.(docx?)$/i,'');
      updateDocName();
      autoSave();
      if(typeof showToast==='function') showToast('✅ Document opened!','success');
    } catch(e){
      const msg = e.name==='TypeError'
        ? '❌ Backend not running. Start backend/start_server.bat'
        : `❌ ${e.message}`;
      if(typeof showToast==='function') showToast(msg,'error');
    }
  };
  input.click();
}

// ============ RULER ============
function drawRuler(){
  const svg = document.getElementById('rulerSvg');
  const w = svg.parentElement.offsetWidth;
  svg.setAttribute('width', w);
  svg.innerHTML='';
  for(let i=0;i<=w;i+=10){
    const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
    tick.setAttribute('x1',i); tick.setAttribute('x2',i);
    tick.setAttribute('y2', i%100===0?14 : i%50===0?10 : 6);
    tick.setAttribute('y1','22');
    tick.setAttribute('stroke','#999'); tick.setAttribute('stroke-width','1');
    svg.appendChild(tick);
    if(i>0 && i%100===0){
      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x',i); txt.setAttribute('y',12);
      txt.setAttribute('text-anchor','middle'); txt.setAttribute('font-size','8');
      txt.setAttribute('fill','#888'); txt.textContent = Math.round(i/37.8)+'cm';
      svg.appendChild(txt);
    }
  }
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveDoc();}
  if((e.ctrlKey||e.metaKey)&&e.key==='h'){e.preventDefault();openFindReplace();}
  if((e.ctrlKey||e.metaKey)&&e.key==='f'){e.preventDefault();openFindReplace();}
});

// ============ INIT ============
function isCorruptedWordDoc(content){
  if(!content) return false;
  const suspiciousSnippets = [
    'const _WORD_API',
    'async function exportDocx',
    'function drawRuler',
    'window.addEventListener(\'load\'',
    'document.addEventListener(\'keydown\'',
    'function showToast(',
    'goBack(){ window.location.href=\'dashboard.html\''
  ];
  const looksLikeScriptDump =
    (content.includes('function ') && content.includes('const ') && content.includes('=>')) ||
    content.includes('// ============') ||
    content.includes('</scr' + 'ipt>');
  return suspiciousSnippets.some((snippet)=>content.includes(snippet)) || looksLikeScriptDump;
}

function sanitizeLoadedWordDoc(content){
  if(!content) return '';
  return isCorruptedWordDoc(content) ? '' : content;
}

window.addEventListener('load', ()=>{
  const fixVersionKey = 'kairos_word_fix_v4c_done';
  if(!localStorage.getItem(fixVersionKey)){
    localStorage.removeItem('kairos_word_doc');
    localStorage.removeItem('kairos_word_doc_draft');
    localStorage.setItem(fixVersionKey, '1');
  }

  const saved = localStorage.getItem('kairos_word_doc');
  const savedName = localStorage.getItem('kairos_word_name');
  if(saved) {
    if (isCorruptedWordDoc(saved)) {
      localStorage.removeItem('kairos_word_doc');
      localStorage.removeItem('kairos_word_doc_draft');
      editor.innerHTML = '';
      if(typeof showToast==='function') showToast('Corrupted draft removed. Starting clean document.','info');
    } else {
      editor.innerHTML = sanitizeLoadedWordDoc(saved);
    }
  }
  if(savedName){ docName=savedName; updateDocName(); }
  drawRuler();
  window.addEventListener('resize', drawRuler);
});
