
function showToast(msg,type){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:500;color:#fff;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:opacity .4s;';
  t.style.background=type==='success'?'#C44529':type==='error'?'#c0392b':'#555';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),400);},2200);
}
// ============ STATE ============
let slides = [];
let currentSlideIdx = 0;
let selectedElement = null;
let presName = 'Presentation1';
let zoomLvl = 100;
let currentTransition = 'none';
let undoStack = [], redoStack = [];

const THEMES = [
  {name:'Default', bg:'#ffffff', title:'#1a1a1a', body:'#333333', accent:'#C44529'},
  {name:'Ocean', bg:'linear-gradient(135deg,#0f3460,#16213e)', title:'#ffffff', body:'#a8d8ea', accent:'#00b4d8'},
  {name:'Forest', bg:'linear-gradient(135deg,#1a472a,#2d6a4f)', title:'#ffffff', body:'#d8f3dc', accent:'#74c69d'},
  {name:'Sunset', bg:'linear-gradient(135deg,#ff6b6b,#feca57)', title:'#ffffff', body:'#fff', accent:'#ff9ff3'},
  {name:'Slate', bg:'linear-gradient(135deg,#2c3e50,#4a5568)', title:'#ffffff', body:'#cbd5e0', accent:'#63b3ed'},
  {name:'Purple', bg:'linear-gradient(135deg,#4c1d95,#7c3aed)', title:'#ffffff', body:'#ede9fe', accent:'#c4b5fd'},
  {name:'Rose', bg:'linear-gradient(135deg,#881337,#9f1239)', title:'#ffffff', body:'#fecdd3', accent:'#fb7185'},
  {name:'Mint', bg:'#f0fdf4', title:'#14532d', body:'#166534', accent:'#22c55e'},
  {name:'Charcoal', bg:'#1a1a2e', title:'#ffffff', body:'#a0a0b0', accent:'#6c63ff'},
  {name:'Paper', bg:'#fdf8f0', title:'#2d1b00', body:'#5c4a2a', accent:'#d97706'},
];

const LAYOUTS = [
  {name:'Title Slide', icon:'<div style="text-align:center"><div style="height:6px;background:#c44529;margin:4px 0;border-radius:1px"></div><div style="height:3px;background:#888;margin:2px 0;border-radius:1px;width:70%;margin-left:15%"></div></div>'},
  {name:'Title & Content', icon:'<div><div style="height:5px;background:#c44529;margin:2px 0;border-radius:1px"></div><div style="height:20px;background:#f0f0f0;margin:2px 0;border-radius:1px;border:1px solid #ddd"></div></div>'},
  {name:'Two Content', icon:'<div style="display:flex;gap:2px"><div style="flex:1;height:20px;background:#f0f0f0;border:1px solid #ddd;border-radius:1px"></div><div style="flex:1;height:20px;background:#f0f0f0;border:1px solid #ddd;border-radius:1px"></div></div>'},
  {name:'Blank', icon:'<div style="height:26px;background:#fafafa;border:1px solid #ddd;border-radius:1px"></div>'},
  {name:'Title Only', icon:'<div><div style="height:5px;background:#c44529;margin:2px 0;border-radius:1px"></div><div style="height:16px;background:#fafafa;border:1px dashed #ccc;border-radius:1px;margin-top:4px"></div></div>'},
  {name:'Section Header', icon:'<div style="background:#c44529;height:26px;border-radius:1px;display:flex;align-items:center;justify-content:center"><div style="height:3px;background:rgba(255,255,255,.7);width:60%;border-radius:1px"></div></div>'},
];

// ============ DATA ============
function newSlide(layout){
  layout = layout || 'Title & Content';
  const elements = [];
  if(layout === 'Blank'){
    // nothing
  } else if(layout === 'Title Slide'){
    elements.push({id:uid(),type:'title',x:80,y:140,w:640,h:80,text:'Click to add title',fontSize:40,fontWeight:'700',textAlign:'center',color:'#1a1a1a'});
    elements.push({id:uid(),type:'subtitle',x:150,y:240,w:500,h:50,text:'Click to add subtitle',fontSize:20,fontWeight:'400',textAlign:'center',color:'#555'});
  } else if(layout === 'Section Header'){
    elements.push({id:uid(),type:'title',x:80,y:160,w:640,h:70,text:'Section Title',fontSize:36,fontWeight:'700',textAlign:'center',color:'#ffffff'});
  } else if(layout === 'Two Content'){
    elements.push({id:uid(),type:'title',x:60,y:30,w:680,h:55,text:'Click to add title',fontSize:28,fontWeight:'700',textAlign:'left',color:'#1a1a1a'});
    elements.push({id:uid(),type:'body',x:20,y:100,w:365,h:310,text:'• Content here\n• Second point\n• Third point',fontSize:14,fontWeight:'400',textAlign:'left',color:'#333'});
    elements.push({id:uid(),type:'body',x:415,y:100,w:365,h:310,text:'• Content here\n• Second point\n• Third point',fontSize:14,fontWeight:'400',textAlign:'left',color:'#333'});
  } else {
    elements.push({id:uid(),type:'title',x:60,y:30,w:680,h:60,text:'Click to add title',fontSize:30,fontWeight:'700',textAlign:'left',color:'#1a1a1a'});
    elements.push({id:uid(),type:'body',x:60,y:110,w:680,h:300,text:'• Click to add text\n• Second point\n• Third point',fontSize:14,fontWeight:'400',textAlign:'left',color:'#333'});
  }
  return {id:uid(), elements, notes:'', bg:'#ffffff', theme:'Default', transition:'none', layout};
}
function uid(){ return '_'+Math.random().toString(36).slice(2,9); }

function normalizeSlides(input){
  if(!Array.isArray(input) || input.length===0) return [newSlide()];
  const normalized = input.map((slide)=>({
    id: slide?.id || uid(),
    elements: Array.isArray(slide?.elements) ? slide.elements : [],
    notes: typeof slide?.notes === 'string' ? slide.notes : '',
    bg: slide?.bg || '#ffffff',
    theme: slide?.theme || 'Default',
    transition: slide?.transition || 'none',
    layout: slide?.layout || 'Title & Content'
  }));
  return normalized.length ? normalized : [newSlide()];
}

// ============ RENDER ============
function renderThumbs(){
  slides = normalizeSlides(slides);
  if(currentSlideIdx<0 || currentSlideIdx>=slides.length) currentSlideIdx=0;
  const list = document.getElementById('slideList');
  list.innerHTML='';
  slides.forEach((s,i)=>{
    const wrap=document.createElement('div');
    wrap.className='slide-thumb-wrap';
    const num=document.createElement('div');
    num.className='slide-thumb-num'; num.textContent=i+1;
    wrap.appendChild(num);
    const thumb=document.createElement('div');
    thumb.className='slide-thumb'+(i===currentSlideIdx?' active':'');
    thumb.style.background=s.bg||'#fff';
    // Mini preview of title
    const titleEl=s.elements.find(e=>e.type==='title');
    const bodyEl=s.elements.find(e=>e.type==='body'||e.type==='subtitle');
    const t=document.createElement('div'); t.className='thumb-title';
    t.style.color=titleEl?titleEl.color:'#222';
    t.textContent=titleEl?titleEl.text.substring(0,40):'(blank)';
    thumb.appendChild(t);
    if(bodyEl){const b=document.createElement('div');b.className='thumb-body';b.style.color=bodyEl.color||'#444';b.textContent=bodyEl.text.substring(0,80);thumb.appendChild(b);}
    thumb.onclick=()=>{saveCurrentSlide();loadSlide(i);};
    wrap.appendChild(thumb);
    const actions=document.createElement('div'); actions.className='slide-thumb-actions';
    const dupBtn=document.createElement('button'); dupBtn.className='thumb-action-btn'; dupBtn.innerHTML='<i class="fas fa-copy"></i>'; dupBtn.title='Duplicate'; dupBtn.onclick=e=>{e.stopPropagation();duplicateSlideAt(i);};
    const delBtn=document.createElement('button'); delBtn.className='thumb-action-btn'; delBtn.innerHTML='<i class="fas fa-trash"></i>'; delBtn.title='Delete'; delBtn.onclick=e=>{e.stopPropagation();deleteSlideAt(i);};
    actions.appendChild(dupBtn); actions.appendChild(delBtn);
    wrap.appendChild(actions);
    list.appendChild(wrap);
  });
  document.getElementById('slideCountLabel').textContent=slides.length;
  document.getElementById('currentSlideNum').textContent=currentSlideIdx+1;
  document.getElementById('totalSlidesNum').textContent=slides.length;
  document.getElementById('pptStatus').textContent='Slide '+(currentSlideIdx+1)+' of '+slides.length;
}

function renderCanvas(){
  slides = normalizeSlides(slides);
  if(currentSlideIdx<0 || currentSlideIdx>=slides.length) currentSlideIdx=0;
  const canvas=document.getElementById('slideCanvas');
  const s=slides[currentSlideIdx];
  canvas.innerHTML='';
  canvas.style.background=s.bg||'#ffffff';
  s.elements.forEach(el=>canvas.appendChild(createDOMElement(el)));
  document.getElementById('notesInput').value=s.notes||'';
  document.getElementById('slideBgColor').value=rgbToHex(s.bg)||'#ffffff';
}

function createDOMElement(el){
  const wrap=document.createElement('div');
  wrap.className='slide-element';
  wrap.id='el-'+el.id;
  wrap.style.cssText=`left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;`;

  let content;
  if(el.type==='shape'){
    content=document.createElement('div');
    content.className='el-content el-shape';
    content.style.background=el.fill||'#c44529';
    content.style.color=el.color||'#fff';
    if(el.shape==='ellipse') content.style.borderRadius='50%';
    if(el.shape==='triangle'){content.style.clipPath='polygon(50% 0%,100% 100%,0% 100%)';content.style.borderRadius='0';}
    if(el.shape==='star'){content.style.clipPath='polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';}
    content.contentEditable='true';
    content.textContent=el.text||'';
  } else {
    content=document.createElement('textarea');
    content.className='el-content el-'+(el.type==='title'?'title':el.type==='subtitle'?'subtitle':'body');
    content.value=el.text||'';
    content.rows=1;
    content.oninput=()=>{ el.text=content.value; saveCurrentSlide(); renderThumbs(); };
  }
  content.style.fontSize=(el.fontSize||14)+'px';
  content.style.fontWeight=el.fontWeight||'400';
  content.style.fontStyle=el.fontStyle||'normal';
  content.style.textDecoration=el.textDecoration||'none';
  content.style.textAlign=el.textAlign||'left';
  content.style.color=el.color||'#333';
  if(el.fontFamily) content.style.fontFamily=el.fontFamily;

  wrap.appendChild(content);

  const rh=document.createElement('div'); rh.className='resize-handle';
  wrap.appendChild(rh);

  makeDraggable(wrap, el);
  makeResizable(rh, wrap, el);

  wrap.addEventListener('mousedown',e=>{if(e.target!==rh){e.stopPropagation();selectElement(wrap,el);}});
  return wrap;
}

function selectElement(wrap, el){
  deselectAll();
  wrap.classList.add('selected');
  selectedElement={wrap,el};
}
function deselectAll(){
  document.querySelectorAll('.slide-element.selected').forEach(e=>e.classList.remove('selected'));
  selectedElement=null;
}

// ============ DRAG ============
function makeDraggable(wrap, el){
  let dragging=false,sx=0,sy=0,ox=0,oy=0;
  wrap.addEventListener('mousedown',e=>{
    if(e.target.classList.contains('resize-handle')) return;
    if(e.target.tagName==='TEXTAREA'||e.target.contentEditable==='true') return;
    dragging=true; sx=e.clientX; sy=e.clientY; ox=el.x; oy=el.y;
    e.preventDefault();
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging) return;
    el.x=Math.max(0,ox+(e.clientX-sx)); el.y=Math.max(0,oy+(e.clientY-sy));
    wrap.style.left=el.x+'px'; wrap.style.top=el.y+'px';
  });
  document.addEventListener('mouseup',()=>{if(dragging){dragging=false;saveCurrentSlide();}});
}
function makeResizable(handle, wrap, el){
  let resizing=false,sx=0,sy=0,ow=0,oh=0;
  handle.addEventListener('mousedown',e=>{
    resizing=true; sx=e.clientX; sy=e.clientY; ow=el.w; oh=el.h;
    e.stopPropagation(); e.preventDefault();
  });
  document.addEventListener('mousemove',e=>{
    if(!resizing) return;
    el.w=Math.max(80,ow+(e.clientX-sx)); el.h=Math.max(30,oh+(e.clientY-sy));
    wrap.style.width=el.w+'px'; wrap.style.height=el.h+'px';
  });
  document.addEventListener('mouseup',()=>{if(resizing){resizing=false;saveCurrentSlide();}});
}

// ============ TEXT STYLES ============
function applyTextStyle(prop, val){
  if(!selectedElement) return;
  const el=selectedElement.el;
  const content=selectedElement.wrap.querySelector('.el-content');
  if(prop==='bold'){el.fontWeight=el.fontWeight==='700'?'400':'700';content.style.fontWeight=el.fontWeight;}
  else if(prop==='italic'){el.fontStyle=el.fontStyle==='italic'?'normal':'italic';content.style.fontStyle=el.fontStyle;}
  else if(prop==='underline'){el.textDecoration=el.textDecoration==='underline'?'none':'underline';content.style.textDecoration=el.textDecoration;}
  else if(prop==='shadow'){content.style.textShadow=content.style.textShadow?'':'2px 2px 4px rgba(0,0,0,.4)';}
  else if(prop==='font'){el.fontFamily=val;content.style.fontFamily=val;}
  else if(prop==='size'){el.fontSize=parseInt(val);content.style.fontSize=val+'px';}
  else if(prop==='alignLeft'){el.textAlign='left';content.style.textAlign='left';}
  else if(prop==='alignCenter'){el.textAlign='center';content.style.textAlign='center';}
  else if(prop==='alignRight'){el.textAlign='right';content.style.textAlign='right';}
  else if(prop==='bullet'){if(content.tagName==='TEXTAREA'){const lines=content.value.split('\n').map(l=>l.startsWith('• ')?l:('• '+l));content.value=lines.join('\n');el.text=content.value;}}
  saveCurrentSlide();
}
function applyTextColor(){
  const color=document.getElementById('pptFontColorPicker').value;
  document.getElementById('pptFontColorBar').style.background=color;
  if(selectedElement){
    selectedElement.el.color=color;
    selectedElement.wrap.querySelector('.el-content').style.color=color;
    saveCurrentSlide();
  }
}
function pickTextColor(){ document.getElementById('pptFontColorPicker').click(); }

// ============ SLIDE OPS ============
function saveCurrentSlide(){
  if(!slides[currentSlideIdx]) return;
  slides[currentSlideIdx].notes=document.getElementById('notesInput').value;
  autoSavePres();
}
function loadSlide(i){
  currentSlideIdx=Math.max(0,Math.min(slides.length-1,i));
  renderCanvas();
  renderThumbs();
}
function addSlide(layout){
  pushUndo();
  slides.splice(currentSlideIdx+1,0,newSlide(layout));
  loadSlide(currentSlideIdx+1);
}
function deleteSlide(){ deleteSlideAt(currentSlideIdx); }
function deleteSlideAt(i){
  if(slides.length<=1){alert('Presentation must have at least 1 slide.');return;}
  pushUndo();
  slides.splice(i,1);
  loadSlide(Math.max(0,i-1));
}
function duplicateSlide(){ duplicateSlideAt(currentSlideIdx); }
function duplicateSlideAt(i){
  pushUndo();
  const copy=JSON.parse(JSON.stringify(slides[i]));
  copy.id=uid();
  copy.elements.forEach(e=>{e.id=uid();});
  slides.splice(i+1,0,copy);
  loadSlide(i+1);
}
function addTextBox(){
  pushUndo();
  const el={id:uid(),type:'body',x:100,y:150,w:300,h:80,text:'Text Box',fontSize:14,fontWeight:'400',textAlign:'left',color:'#333'};
  slides[currentSlideIdx].elements.push(el);
  renderCanvas();
  renderThumbs();
}
function insertShape(shape){
  pushUndo();
  const fills={rect:'#c44529',ellipse:'#2196F3',triangle:'#4CAF50',arrow:'#FF9800',star:'#9C27B0'};
  const el={id:uid(),type:'shape',shape,x:200,y:150,w:200,h:120,text:'',fill:fills[shape]||'#c44529',color:'#fff',fontSize:16};
  slides[currentSlideIdx].elements.push(el);
  renderCanvas();
  renderThumbs();
}
function insertImagePrompt(){
  const url=prompt('Image URL (paste a direct image link):');
  if(url){
    pushUndo();
    const el={id:uid(),type:'image',x:100,y:80,w:300,h:200,src:url};
    slides[currentSlideIdx].elements.push(el);
    // Render image element directly
    const canvas=document.getElementById('slideCanvas');
    const wrap=document.createElement('div');
    wrap.className='slide-element'; wrap.style.cssText=`left:100px;top:80px;width:300px;height:200px;`;
    const img=document.createElement('img'); img.src=url; img.style.cssText='width:100%;height:100%;object-fit:contain;pointer-events:none;';
    wrap.appendChild(img);
    makeDraggable(wrap,el);
    canvas.appendChild(wrap);
    renderThumbs();
  }
}
function insertTable(){
  pushUndo();
  let html='<table style="border-collapse:collapse;width:100%">';
  for(let r=0;r<3;r++){html+='<tr>';for(let c=0;c<3;c++)html+='<td style="border:1px solid #bbb;padding:4px 8px;font-size:12px">'+(r===0?'<b>Header '+(c+1)+'</b>':'Cell')+'</td>';html+='</tr>';}
  html+='</table>';
  const el={id:uid(),type:'shape',shape:'rect',x:100,y:100,w:400,h:150,text:'',fill:'transparent',color:'#333'};
  const wrap=document.createElement('div');
  wrap.className='slide-element'; wrap.style.cssText=`left:100px;top:100px;width:400px;height:150px;`;
  const content=document.createElement('div'); content.className='el-content'; content.innerHTML=html;
  content.contentEditable='true'; wrap.appendChild(content);
  const rh=document.createElement('div'); rh.className='resize-handle'; wrap.appendChild(rh);
  makeDraggable(wrap,el);
  makeResizable(rh,wrap,el);
  wrap.addEventListener('mousedown',e=>{e.stopPropagation();selectElement(wrap,el);});
  document.getElementById('slideCanvas').appendChild(wrap);
  slides[currentSlideIdx].elements.push(el);
  renderThumbs();
}
function insertDivider(){
  const el={id:uid(),type:'shape',shape:'rect',x:60,y:220,w:680,h:4,text:'',fill:'#c44529',color:'transparent'};
  slides[currentSlideIdx].elements.push(el);
  renderCanvas();
}

// ============ THEMES ============
function buildThemeGallery(){
  const gallery=document.getElementById('themeGallery');
  gallery.innerHTML='';
  THEMES.forEach((t,i)=>{
    const sw=document.createElement('div');
    sw.className='theme-swatch'+(slides[currentSlideIdx]?.theme===t.name?' active':'');
    sw.style.background=t.bg;
    sw.style.color=t.title;
    sw.title=t.name;
    const label=document.createElement('span'); label.textContent=t.name; label.style.cssText='font-size:8px;text-shadow:0 1px 2px rgba(0,0,0,.5);color:'+t.title;
    sw.appendChild(label);
    sw.onclick=()=>applyTheme(t);
    gallery.appendChild(sw);
  });
}
function applyTheme(theme){
  pushUndo();
  const s=slides[currentSlideIdx];
  s.bg=theme.bg; s.theme=theme.name;
  s.elements.forEach(el=>{
    if(el.type==='title') el.color=theme.title;
    else if(el.type==='body'||el.type==='subtitle') el.color=theme.body;
  });
  renderCanvas(); renderThumbs();
  document.getElementById('pptThemeStatus').textContent='Theme: '+theme.name;
  buildThemeGallery();
}
function applySlideBackground(){
  const color=document.getElementById('slideBgColor').value;
  slides[currentSlideIdx].bg=color;
  document.getElementById('slideCanvas').style.background=color;
  renderThumbs();
}
function rgbToHex(color){
  if(!color||color.startsWith('linear')||color.startsWith('#')) return color||'#ffffff';
  return color;
}

// ============ TRANSITIONS ============
function setTransition(tr){
  document.querySelectorAll('[id^="tr-"]').forEach(b=>b.classList.remove('pressed'));
  document.getElementById('tr-'+tr)?.classList.add('pressed');
  currentTransition=tr;
  slides[currentSlideIdx].transition=tr;
  saveCurrentSlide();
}
function applyTransitionAll(){ slides.forEach(s=>s.transition=currentTransition); if(typeof showToast==='function') showToast('Transition applied to all slides','success'); }

// ============ SLIDE SHOW ============
function startSlideShow(){ launchShow(0); }
function startSlideShowCurrent(){ launchShow(currentSlideIdx); }
function launchShow(startIdx){
  let idx=startIdx;
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
  const slide=document.createElement('div');
  slide.style.cssText='width:min(90vw,1280px);height:min(90vh,720px);background:white;position:relative;overflow:hidden;';
  const nav=document.createElement('div');
  nav.style.cssText='position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:12px;z-index:10;';
  const counter=document.createElement('span');
  counter.style.cssText='color:white;font-size:14px;margin-top:8px;font-family:Inter,sans-serif;';
  const prev=document.createElement('button');
  prev.innerHTML='&#x25C0;'; prev.style.cssText='background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:white;padding:8px 18px;cursor:pointer;border-radius:3px;font-size:16px;';
  const next=document.createElement('button');
  next.innerHTML='&#x25B6;'; next.style.cssText=prev.style.cssText;
  const close=document.createElement('button');
  close.innerHTML='&#x2715; Exit'; close.style.cssText='background:rgba(196,69,41,.7);border:1px solid rgba(196,69,41,.9);color:white;padding:8px 16px;cursor:pointer;border-radius:3px;font-size:13px;position:absolute;top:12px;right:12px;z-index:20;';
  nav.appendChild(prev); nav.appendChild(next);
  overlay.appendChild(slide); overlay.appendChild(nav); overlay.appendChild(counter); overlay.appendChild(close);
  document.body.appendChild(overlay);

  function showSlide(i){
    const s=slides[i];
    slide.style.background=s.bg||'#fff';
    slide.innerHTML='';
    const scale=Math.min((window.innerWidth*0.9)/800,(window.innerHeight*0.9)/450);
    s.elements.forEach(el=>{
      if(el.type==='image'){
        const img=document.createElement('img');
        img.src=el.src; img.style.cssText=`position:absolute;left:${el.x*scale}px;top:${el.y*scale}px;width:${el.w*scale}px;height:${el.h*scale}px;object-fit:contain;`;
        slide.appendChild(img);
      } else {
        const d=document.createElement('div');
        let txt=el.type==='shape'?el.text:el.text;
        d.style.cssText=`position:absolute;left:${el.x*scale}px;top:${el.y*scale}px;width:${el.w*scale}px;min-height:${el.h*scale}px;font-size:${(el.fontSize||14)*scale}px;font-weight:${el.fontWeight||'400'};color:${el.color||'#333'};text-align:${el.textAlign||'left'};white-space:pre-wrap;padding:${6*scale}px ${10*scale}px;`;
        if(el.type==='shape'){d.style.background=el.fill||'#c44529';if(el.shape==='ellipse')d.style.borderRadius='50%';if(el.shape==='triangle')d.style.clipPath='polygon(50% 0%,100% 100%,0% 100%)';}
        d.textContent=txt;
        slide.appendChild(d);
      }
    });
    counter.textContent=(i+1)+' / '+slides.length;
  }
  prev.onclick=e=>{e.stopPropagation();if(idx>0){idx--;showSlide(idx);}};
  next.onclick=e=>{e.stopPropagation();if(idx<slides.length-1){idx++;showSlide(idx);}else overlay.remove();};
  close.onclick=()=>overlay.remove();
  document.addEventListener('keydown',function handler(e){
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){if(idx<slides.length-1){idx++;showSlide(idx);}else overlay.remove();}
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){if(idx>0){idx--;showSlide(idx);}}
    if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',handler);}
  });
  showSlide(idx);
}

// ============ LAYOUT PICKER ============
function openLayoutPicker(){
  document.getElementById('layoutModal').classList.add('open');
  const grid=document.getElementById('layoutGrid');
  grid.innerHTML='';
  LAYOUTS.forEach(l=>{
    const card=document.createElement('div');
    card.className='layout-card';
    card.innerHTML=l.icon+'<span style="font-size:9px;color:#666;margin-top:3px">'+l.name+'</span>';
    card.onclick=()=>{addSlide(l.name);closeLayoutPicker();};
    grid.appendChild(card);
  });
}
function closeLayoutPicker(){ document.getElementById('layoutModal').classList.remove('open'); }

// ============ ZOOM ============
function zoomCanvas(delta, val){
  if(val!==undefined) zoomLvl=parseInt(val);
  else zoomLvl=Math.max(30,Math.min(200,zoomLvl+delta));
  const canvas=document.getElementById('slideCanvas');
  canvas.style.transform='scale('+zoomLvl/100+')';
  canvas.style.transformOrigin='center center';
  document.getElementById('pptZoomLabel').textContent=zoomLvl+'%';
  document.getElementById('pptZoomLabel2').textContent=zoomLvl+'%';
  ['pptZoom','pptZoom2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=zoomLvl;});
}

// ============ VIEWS ============
function setView(v){
  const body=document.getElementById('editorBody');
  const panel=document.getElementById('slidePanel');
  ['btn-normalview','btn-outlineview','btn-sorterview'].forEach(id=>document.getElementById(id)?.classList.remove('pressed'));
  if(v==='normal'){panel.style.display='flex';document.getElementById('btn-normalview').classList.add('pressed');}
  else if(v==='outline'){panel.style.display='none';document.getElementById('btn-outlineview').classList.add('pressed');}
  else if(v==='sorter'){panel.style.display='none';document.getElementById('btn-sorterview').classList.add('pressed');}
}

// ============ UNDO/REDO ============
function pushUndo(){ undoStack.push(JSON.stringify(slides)); redoStack=[]; }
function undoAction(){ if(!undoStack.length) return; redoStack.push(JSON.stringify(slides)); slides=JSON.parse(undoStack.pop()); loadSlide(Math.min(currentSlideIdx,slides.length-1)); }
function redoAction(){ if(!redoStack.length) return; undoStack.push(JSON.stringify(slides)); slides=JSON.parse(redoStack.pop()); loadSlide(Math.min(currentSlideIdx,slides.length-1)); }

// ============ ASPECT RATIO ============
function setAspectRatio(r){
  const canvas=document.getElementById('slideCanvas');
  if(r==='16:9'){canvas.style.width='800px';canvas.style.height='450px';}
  else{canvas.style.width='640px';canvas.style.height='480px';}
}

// ============ FILE OPS ============
function toggleFileMenu(){ const m=document.getElementById('pptFileMenu'); m.style.display=m.style.display==='none'?'block':'none'; }
function newPresentation(){ if(confirm('Create new presentation?')){ slides=[newSlide()]; currentSlideIdx=0; loadSlide(0); } document.getElementById('pptFileMenu').style.display='none'; }
function savePresentation(){ localStorage.setItem('kairos_ppt',JSON.stringify(slides)); localStorage.setItem('kairos_ppt_name',presName); if(typeof showToast==='function') showToast('Presentation saved','success'); document.getElementById('pptFileMenu').style.display='none'; }
function autoSavePres(){ localStorage.setItem('kairos_ppt_draft',JSON.stringify(slides)); }
function renamePresentation(){ const n=prompt('Presentation name:',presName); if(n){presName=n;document.getElementById('presNameDisplay').textContent=n;document.title=n+'  -  PowerPoint';} document.getElementById('pptFileMenu').style.display='none'; }
function downloadPresentation(fmt){
  let content='',mime='text/plain',ext=fmt;
  if(fmt==='txt') content=slides.map((s,i)=>'SLIDE '+(i+1)+'\n'+(s.elements.find(e=>e.type==='title')?.text||'')+'\n\n'+(s.elements.filter(e=>e.type==='body').map(e=>e.text).join('\n\n'))+'\n\nNotes:\n'+s.notes+'\n\n---\n\n').join('');
  else{
    mime='text/html';ext='html';
    const slideHtml=slides.map(s=>'<div class="slide" style="background:'+s.bg+'">'+s.elements.map(el=>'<div style="position:absolute;left:'+el.x+'px;top:'+el.y+'px;width:'+el.w+'px;font-size:'+el.fontSize+'px;font-weight:'+el.fontWeight+';color:'+el.color+';text-align:'+el.textAlign+';white-space:pre-wrap">'+el.text+'<\/div>').join('')+'<\/div>').join('');
    content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#6C63FF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Kairos">
<link rel="apple-touch-icon" href="1000669890-Photoroom.png">
<title>${presName}</title>
<style>
body{font-family:sans-serif;margin:0}
.slide{width:800px;height:450px;margin:20px auto;position:relative;page-break-after:always;overflow:hidden;}
</style>
</head>
<body>
${slideHtml}
</body>
</html>`;
  }
  const blob=new Blob([content],{type:mime}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=presName+'.'+ext; a.click();
  document.getElementById('pptFileMenu').style.display='none';
}
function goBack(){ window.location.href='dashboard.html'; }

// ============ PDF EXPORT ============
async function exportPdf(){
  document.getElementById('pptFileMenu').style.display='none';
  saveCurrentSlide();
  if(typeof showToast==='function') showToast('⏳ Generating PDF…','info');
  try {
    if(!window.html2canvas){
      await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
    }
    if(!window.jspdf){
      await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
    }
    const {jsPDF}=window.jspdf;
    const W=800,H=450;
    const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[W,H],hotfixes:['px_scaling']});
    const offscreen=document.createElement('div');
    offscreen.style.cssText=`position:fixed;left:-9999px;top:-9999px;width:${W}px;height:${H}px;overflow:hidden;z-index:-1;`;
    document.body.appendChild(offscreen);
    for(let i=0;i<slides.length;i++){
      const s=slides[i];
      offscreen.style.background=s.bg||'#ffffff';
      offscreen.innerHTML='';
      s.elements.forEach(el=>{
        const wrap=document.createElement('div');
        wrap.style.cssText=`position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h||60}px;`;
        const inner=document.createElement('div');
        inner.style.cssText=`font-size:${el.fontSize||14}px;font-weight:${el.fontWeight||'400'};font-style:${el.fontStyle||'normal'};text-decoration:${el.textDecoration||'none'};text-align:${el.textAlign||'left'};color:${el.color||'#333'};white-space:pre-wrap;width:100%;height:100%;overflow:hidden;box-sizing:border-box;`;
        if(el.fontFamily) inner.style.fontFamily=el.fontFamily;
        if(el.type==='shape'){inner.style.background=el.fill||'#c44529';if(el.shape==='ellipse')inner.style.borderRadius='50%';}
        inner.textContent=el.text||'';
        wrap.appendChild(inner);
        offscreen.appendChild(wrap);
      });
      const canvas=await html2canvas(offscreen,{scale:2,useCORS:true,allowTaint:true,backgroundColor:s.bg||'#ffffff',width:W,height:H,windowWidth:W,windowHeight:H});
      const img=canvas.toDataURL('image/jpeg',0.92);
      if(i>0) pdf.addPage([W,H],'landscape');
      pdf.addImage(img,'JPEG',0,0,W,H);
    }
    document.body.removeChild(offscreen);
    const fname=(presName.endsWith('.pdf')?presName:presName+'.pdf');
    pdf.save(fname);
    if(typeof showToast==='function') showToast('✅ PDF exported: '+fname,'success');
  } catch(e){
    console.error(e);
    if(typeof showToast==='function') showToast('❌ PDF export failed: '+e.message,'error');
  }
}

// ============ PYTHON BACKEND  -  PPTX IMPORT / EXPORT ============
const _PPT_API = (typeof KAIROS_API_BASE !== 'undefined') ? KAIROS_API_BASE : 'http://localhost:5000/api';

async function exportPptx(){
  document.getElementById('pptFileMenu').style.display='none';
  saveCurrentSlide();
  if(typeof showToast==='function') showToast('⏳ Exporting as PowerPoint…','info');
  try {
    const res = await fetch(`${_PPT_API}/ppt/export`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({slides, name: presName})
    });
    if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (presName.endsWith('.pptx')?presName:presName+'.pptx');
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    if(typeof showToast==='function') showToast('✅ PowerPoint exported!','success');
  } catch(e){
    // Fallback: export current deck as HTML package when backend is unavailable.
    downloadPresentation('html');
    if(typeof showToast==='function') showToast('⚠️ Backend unavailable. Exported as HTML fallback.','info');
  }
}

async function openPptx(){
  document.getElementById('pptFileMenu').style.display='none';
  if(slides.length && !confirm('Replace current presentation with the imported file?')) return;
  const input = document.createElement('input');
  input.type='file'; input.accept='.pptx'; input.style.display='none';
  document.body.appendChild(input);
  input.onchange = async ()=>{
    document.body.removeChild(input);
    const file = input.files[0];
    if(!file) return;
    if(typeof showToast==='function') showToast('⏳ Opening presentation…','info');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${_PPT_API}/ppt/import`,{method:'POST',body:fd});
      if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
      const data = await res.json();
      if(data.slides && data.slides.length){
        slides = data.slides;
        presName = data.name || file.name.replace(/\.pptx$/i,'');
        document.getElementById('presNameDisplay').textContent = presName;
        document.title = presName + '  -  PowerPoint';
        currentSlideIdx = 0;
        renderCanvas();
        renderThumbs();
        autoSavePres();
        if(typeof showToast==='function') showToast('✅ Presentation opened!','success');
      }
    } catch(e){
      const msg = e.name==='TypeError'
        ? '❌ Backend not running. Start backend/start_server.bat'
        : `❌ ${e.message}`;
      if(typeof showToast==='function') showToast(msg,'error');
    }
  };
  input.click();
}

// ============ RIBBON TABS ============
function switchTab(name, btn){
  try {
    // Close file menu when switching tabs
    const fileMenu = document.getElementById('pptFileMenu');
    if(fileMenu) fileMenu.style.display='none';
    
    // Remove active class from all tabs and contents
    document.querySelectorAll('.ribbon-tab').forEach(t => {
      t.classList.remove('active');
    });
    document.querySelectorAll('.ribbon-content').forEach(c => {
      c.classList.remove('active');
    });
    
    // Add active class to corresponding content
    const contentId = 'tab-' + name;
    const content = document.getElementById(contentId) || document.querySelector('.ribbon-content[data-tab="' + name + '"]');
    if(content) {
      content.classList.add('active');
      console.log('✓ Activated content:', contentId);
    } else {
      console.error('✗ Content not found:', contentId);
      return;
    }
    
    // Add active class to the clicked button
    if(btn) {
      btn.classList.add('active');
      console.log('✓ Activated button');
    }
    
    // Build theme gallery if switching to design tab
    if(name === 'design') {
      try {
        buildThemeGallery();
      } catch(e) {
        console.warn('Theme gallery build failed:', e);
      }
    }
    
    console.log('✓ Switched to tab:', name);
  } catch(e) {
    console.error('Error in switchTab:', e);
  }
}

// ============ KEYBOARD ============
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();savePresentation();}
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undoAction();}
  if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redoAction();}
  if(e.key==='Delete'&&selectedElement&&document.activeElement.tagName!=='TEXTAREA'&&document.activeElement.contentEditable!=='true'){
    pushUndo();
    const id=selectedElement.el.id;
    slides[currentSlideIdx].elements=slides[currentSlideIdx].elements.filter(e=>e.id!==id);
    selectedElement.wrap.remove(); selectedElement=null;
    renderThumbs();
  }
  if(e.key==='Escape') deselectAll();
  if((e.ctrlKey||e.metaKey)&&e.key==='d'&&selectedElement){e.preventDefault();duplicateSlide();}
});

document.addEventListener('click',e=>{
  const fm=document.getElementById('pptFileMenu'); const lm=document.getElementById('layoutModal');
  if(!fm.contains(e.target)&&!e.target.classList.contains('file-tab')) fm.style.display='none';
});

// ============ INIT ============
window.addEventListener('load',()=>{
  const saved=localStorage.getItem('kairos_ppt');
  const savedName=localStorage.getItem('kairos_ppt_name');
  if(saved){
    try{
      const parsed=JSON.parse(saved);
      slides = normalizeSlides(parsed);
    }catch{
      slides=[newSlide()];
    }
  } else {
    slides=[newSlide()];
  }
  if(savedName){presName=savedName;document.getElementById('presNameDisplay').textContent=presName;document.title=presName+'  -  PowerPoint';}
  currentSlideIdx=0;
  renderCanvas();
  renderThumbs();
});

