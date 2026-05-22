
/**
 * calendar.js - click any date to view, add, toggle and delete habits
 *               includes mini jar animation per selected day
 */
const Calendar = (() => {

  const NOW = new Date();
  let _userId=null, _viewY=NOW.getFullYear(), _viewM=NOW.getMonth(), _selKey=null;
  let _cache={};
  let _selHabits=[];
  let _jarTimer=null;

  async function init(userId) {
    _userId = userId;
    document.getElementById('cal-prev').onclick = _prev;
    document.getElementById('cal-next').onclick = _next;
  }

  async function render() {
    await _loadMonth();
    _renderGrid();
  }

  async function _loadMonth() {
    const y=_viewY, m=String(_viewM+1).padStart(2,'0');
    const dim=new Date(y, _viewM+1, 0).getDate();
    const dates=[];
    for(let d=1;d<=dim;d++) dates.push(`${y}-${m}-${String(d).padStart(2,'0')}`);
    try {
      const grouped = await DB.getHabitsForDates(_userId, dates);
      _cache={};
      for(const [date, habits] of Object.entries(grouped)){
        _cache[date]=Utils.calcPct(habits);
      }
    } catch(e){ console.error('[Cal] load error', e); }
  }

  function _renderGrid() {
    const y=_viewY, m=_viewM;
    document.getElementById('cal-m').textContent = Utils.MONTHS[m];
    document.getElementById('cal-y').textContent = y;
    const first=new Date(y,m,1).getDay();
    const dim=new Date(y,m+1,0).getDate();
    const today=Utils.todayStr();
    let html='';
    for(let i=0;i<first;i++) html+='<div class="day empty"></div>';
    for(let d=1;d<=dim;d++){
      const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const pct=_cache[key]||0;
      const dot=Utils.dotColor(pct);
      const cls=['day', key===today&&'today', key===_selKey&&'sel'].filter(Boolean).join(' ');
      html+=`<div class="${cls}" onclick="Calendar._select('${key}')">
        <span class="dnum">${d}</span>
        ${dot?`<div class="ddot" style="background:${dot}"></div>`:''}
      </div>`;
    }
    document.getElementById('days-grid').innerHTML=html;
    if(_selKey) _renderDetail(_selKey);
  }

  async function _select(key) {
    if(_selKey===key){
      _selKey=null;
      _selHabits=[];
      document.getElementById('day-detail').classList.add('hidden');
      _renderGrid();
      return;
    }
    _selKey=key;
    _renderGrid();
    await _renderDetail(key);
  }

  async function _renderDetail(key) {
    const panel=document.getElementById('day-detail');
    try { _selHabits=await DB.getHabitsForDate(_userId, key); } catch(e){ _selHabits=[]; }

    const d=Utils.parseDate(key);
    const pct=Utils.calcPct(_selHabits);
    const today=Utils.todayStr();
    const isFuture=key>today;

    // document.getElementById('dd-title').innerHTML=
    //   `<span>${Utils.DAYS_FULL[d.getDay()]}, ${Utils.MONTHS_SHORT[d.getMonth()]} ${d.getDate()}</span>
    
    //    <span class="dd-pct">${_selHabits.length ? pct+'% complete' : ''}</span>`;
  //   document.getElementById('dd-title').innerHTML =
  // `<span>${Utils.DAYS_FULL[d.getDay()]}, ${Utils.MONTHS_SHORT[d.getMonth()]} ${d.getDate()}</span>
  // <br>
  // <br>
  //  <span class="dd-pct">${_selHabits.length ? pct + '% complete' : ''}</span>`;
  const titleEl = document.getElementById('dd-title');
titleEl.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
titleEl.innerHTML =
  `<span>${Utils.DAYS_FULL[d.getDay()]}, ${Utils.MONTHS_SHORT[d.getMonth()]} ${d.getDate()}</span>
   <span class="dd-pct">${_selHabits.length ? pct + '% complete' : ''}</span>`;

    // Animate mini jar
    _animateJar(pct);

    const el=document.getElementById('dd-tasks');
    const taskRows = _selHabits.length
      ? _selHabits.map((h,i)=>`
          <div class="dd-task">
            <div class="dd-check ${h.done?'on':''}" onclick="Calendar._toggle(${i})" style="cursor:pointer"></div>
            <span style="font-size:14px;line-height:1;margin-right:5px">${Utils.escHtml(h.emoji)}</span>
            <span class="dd-name ${h.done?'done':''}">${Utils.escHtml(h.name)}</span>
            <button class="dd-del" onclick="Calendar._delete(${i})" title="Delete">&times;</button>
          </div>`).join('')
      : `<p class="dd-empty">No habits recorded.</p>`;

    el.innerHTML = taskRows + `
      <div class="dd-add-form" id="dd-add-form">
        <div class="dd-add-row">
          <span class="dd-add-emoji" id="dd-add-emoji">*</span>
          <input class="dd-add-input" id="dd-add-input" type="text"
            placeholder="${isFuture ? 'Plan a habit for this day...' : 'Add task here...'}"
            maxlength="60" autocomplete="off"
            oninput="Calendar._previewEmoji(this.value)"
            onkeydown="if(event.key==='Enter'){event.preventDefault();Calendar._addHabit()}"
          />
        </div>
        <button class="dd-add-btn" onclick="Calendar._addHabit()">+ Add</button>
      </div>`;

    panel.classList.remove('hidden');
  }

  /* ── Mini jar animation ── */
  function _animateJar(pct) {
    if(_jarTimer) clearInterval(_jarTimer);
    const fill = document.querySelector('.ddj-fill');
    const txt  = document.querySelector('.ddj-txt');
    if(!fill || !txt) return;

    const H=48, TOP=14;
    const targetH = Math.round((pct/100)*H);
    const targetY = pct===0 ? TOP+H : TOP+H-targetH;
    const col = Utils.jarColor(pct);
    let curH = parseFloat(fill.getAttribute('height'))||0;
    let curY = parseFloat(fill.getAttribute('y'))||(TOP+H);
    let s=0; const STEPS=25;

    _jarTimer = setInterval(()=>{
      s++;
      const e = Utils.easeInOut(s/STEPS);
      const h = curH+(targetH-curH)*e;
      const y = curY+(targetY-curY)*e;
      fill.setAttribute('height', h);
      fill.setAttribute('y', y);
      fill.setAttribute('fill', col);
      txt.textContent = Math.round((h/H)*100)+'%';
      if(s>=STEPS){
        clearInterval(_jarTimer);
        fill.setAttribute('height', targetH);
        fill.setAttribute('y', targetY);
        fill.setAttribute('fill', col);
        txt.textContent = pct+'%';
      }
    }, 16);
  }

  /* ── Toggle habit done/undone ── */
  async function _toggle(index) {
    if(!_selKey || !_selHabits[index]) return;
    const h = _selHabits[index];
    const newDone = !h.done;
    _selHabits[index] = {...h, done:newDone};
    _cache[_selKey] = Utils.calcPct(_selHabits);
    _renderGrid();
    await DB.toggleHabit(h.id, newDone);
    if(_selKey===Utils.todayStr() && typeof Tasks!=='undefined') Tasks.refreshHero(_selHabits);
  }

  /* ── Delete habit ── */
  async function _delete(index) {
    if(!_selKey || !_selHabits[index]) return;
    const h = _selHabits[index];
    _selHabits.splice(index, 1);
    _cache[_selKey] = Utils.calcPct(_selHabits);
    _renderGrid();
    await DB.deleteHabit(h.id);
    if(_selKey===Utils.todayStr() && typeof Tasks!=='undefined') Tasks.refreshHero(_selHabits);
  }

  /* ── Add habit for selected date ── */
  async function _addHabit() {
    const input = document.getElementById('dd-add-input');
    if(!input || !_selKey) return;
    const val = input.value.trim();
    if(!val) return;

    const emoji = Utils.matchEmoji(val);
    const temp = {id:'tmp_'+Date.now(), name:val, emoji, done:false};
    _selHabits.push(temp);
    _cache[_selKey] = Utils.calcPct(_selHabits);
    input.value='';
    document.getElementById('dd-add-emoji').textContent='⭐';
    _renderGrid();

    const saved = await DB.addHabit(_userId, _selKey, val, emoji);
    if(saved){
      const idx = _selHabits.findIndex(h=>h.id===temp.id);
      if(idx!==-1) _selHabits[idx]=saved;
    }
    if(_selKey===Utils.todayStr() && typeof Tasks!=='undefined') Tasks.refreshHero(_selHabits);
  }

  /* ── Live emoji preview ── */
  function _previewEmoji(val) {
    const el = document.getElementById('dd-add-emoji');
    if(!el) return;
    const emoji = val.trim() ? Utils.matchEmoji(val) : '⭐';
    if(el.textContent!==emoji){
      el.textContent=emoji;
      el.classList.remove('bounce');
      void el.offsetWidth;
      el.classList.add('bounce');
    }
  }

  function _prev(){
    if(_viewM===0){_viewM=11;_viewY--;}else _viewM--;
    _selKey=null; _selHabits=[];
    document.getElementById('day-detail').classList.add('hidden');
    render();
  }

  function _next(){
    if(_viewM===11){_viewM=0;_viewY++;}else _viewM++;
    _selKey=null; _selHabits=[];
    document.getElementById('day-detail').classList.add('hidden');
    render();
  }

  return{init, render, _select, _toggle, _delete, _addHabit, _previewEmoji};
})();
// /**
//  * calendar.js — click any date to view, add, toggle and delete habits
//  */
// const Calendar = (() => {

//   const NOW = new Date();
//   let _userId=null, _viewY=NOW.getFullYear(), _viewM=NOW.getMonth(), _selKey=null;
//   let _cache={};
//   let _selHabits=[];   // habits for currently selected date

//   async function init(userId) {
//     _userId = userId;
//     document.getElementById('cal-prev').onclick = _prev;
//     document.getElementById('cal-next').onclick = _next;
//   }

//   async function render() {
//     await _loadMonth();
//     _renderGrid();
//   }

//   async function _loadMonth() {
//     const y=_viewY, m=String(_viewM+1).padStart(2,'0');
//     const dim=new Date(y, _viewM+1, 0).getDate();
//     const dates=[];
//     for(let d=1;d<=dim;d++) dates.push(`${y}-${m}-${String(d).padStart(2,'0')}`);
//     try {
//       const grouped = await DB.getHabitsForDates(_userId, dates);
//       _cache={};
//       for(const [date, habits] of Object.entries(grouped)){
//         _cache[date]=Utils.calcPct(habits);
//       }
//     } catch(e){ console.error('[Cal] load error', e); }
//   }

//   function _renderGrid() {
//     const y=_viewY, m=_viewM;
//     document.getElementById('cal-m').textContent = Utils.MONTHS[m];
//     document.getElementById('cal-y').textContent = y;
//     const first=new Date(y,m,1).getDay();
//     const dim=new Date(y,m+1,0).getDate();
//     const today=Utils.todayStr();
//     let html='';
//     for(let i=0;i<first;i++) html+='<div class="day empty"></div>';
//     for(let d=1;d<=dim;d++){
//       const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
//       const pct=_cache[key]||0;
//       const dot=Utils.dotColor(pct);
//       const cls=['day', key===today&&'today', key===_selKey&&'sel'].filter(Boolean).join(' ');
//       html+=`<div class="${cls}" onclick="Calendar._select('${key}')">
//         <span class="dnum">${d}</span>
//         ${dot?`<div class="ddot" style="background:${dot}"></div>`:''}
//       </div>`;
//     }
//     document.getElementById('days-grid').innerHTML=html;
//     if(_selKey) _renderDetail(_selKey);
//   }

//   async function _select(key) {
//     if(_selKey===key){
//       _selKey=null;
//       _selHabits=[];
//       document.getElementById('day-detail').classList.add('hidden');
//       _renderGrid();
//       return;
//     }
//     _selKey=key;
//     _renderGrid();
//     await _renderDetail(key);
//   }

//   async function _renderDetail(key) {
//     const panel=document.getElementById('day-detail');
//     try { _selHabits=await DB.getHabitsForDate(_userId, key); } catch(e){ _selHabits=[]; }

//     const d=Utils.parseDate(key);
//     const pct=Utils.calcPct(_selHabits);
//     const today=Utils.todayStr();
//     const isFuture=key>today;


//       `<span>${Utils.DAYS_FULL[d.getDay()]}, ${Utils.MONTHS_SHORT[d.getMonth()]} ${d.getDate()}</span>
//        <span class="dd-pct">${_selHabits.length?    document.getElementById('dd-title').innerHTML=pct+'% complete':''}</span>`;

//     const el=document.getElementById('dd-tasks');

//     const taskRows = _selHabits.length
//       ? _selHabits.map((h,i)=>`
//           <div class="dd-task">
//             <div class="dd-check ${h.done?'on':''}" onclick="Calendar._toggle(${i})" style="cursor:pointer"></div>
//             <span style="font-size:14px;line-height:1;margin-right:5px">${Utils.escHtml(h.emoji)}</span>
//             <span class="dd-name ${h.done?'done':''}">${Utils.escHtml(h.name)}</span>
//             <button class="dd-del" onclick="Calendar._delete(${i})" title="Delete">×</button>
//           </div>`).join('')
//       : `<p class="dd-empty">No habits recorded.</p>`;

//     el.innerHTML = taskRows + `
//       <div class="dd-add-form" id="dd-add-form">
//         <div class="dd-add-row">
//           <span class="dd-add-emoji" id="dd-add-emoji">⭐</span>
//           <input class="dd-add-input" id="dd-add-input" type="text"
//             placeholder="${isFuture ? 'Plan a habit for this day…' : 'Add a habit for this day…'}"
//             maxlength="60" autocomplete="off"
//             oninput="Calendar._previewEmoji(this.value)"
//             onkeydown="if(event.key==='Enter'){event.preventDefault();Calendar._addHabit()}"
//           />
//         </div>
//         <button class="dd-add-btn" onclick="Calendar._addHabit()">+ Add</button>
//       </div>`;

//     panel.classList.remove('hidden');
//   }

//   /* ── Toggle habit done/undone from calendar ── */
//   async function _toggle(index) {
//     if(!_selKey || !_selHabits[index]) return;
//     const h = _selHabits[index];
//     const newDone = !h.done;
//     _selHabits[index] = {...h, done: newDone};
//     // Update cache dot
//     _cache[_selKey] = Utils.calcPct(_selHabits);
//     _renderGrid();
//     // Persist
//     await DB.toggleHabit(h.id, newDone);
//     // If it's today, refresh the Today tab hero too
//     if(_selKey === Utils.todayStr() && typeof Tasks !== 'undefined') {
//       Tasks.newDay(Utils.todayStr());
//     }
//   }

//   /* ── Delete habit from calendar ── */
//   async function _delete(index) {
//     if(!_selKey || !_selHabits[index]) return;
//     const h = _selHabits[index];
//     _selHabits.splice(index, 1);
//     _cache[_selKey] = Utils.calcPct(_selHabits);
//     _renderGrid();
//     await DB.deleteHabit(h.id);
//     if(_selKey === Utils.todayStr() && typeof Tasks !== 'undefined') {
//       Tasks.newDay(Utils.todayStr());
//     }
//   }

//   /* ── Add habit for the selected date ── */
//   async function _addHabit() {
//     const input = document.getElementById('dd-add-input');
//     if(!input) return;
//     const val = input.value.trim();
//     if(!val || !_selKey) return;

//     const emoji = Utils.matchEmoji(val);
//     // Optimistic
//     const temp = {id:'tmp_'+Date.now(), name:val, emoji, done:false};
//     _selHabits.push(temp);
//     _cache[_selKey] = Utils.calcPct(_selHabits);
//     input.value='';
//     document.getElementById('dd-add-emoji').textContent='⭐';
//     _renderGrid();

//     // Persist
//     const saved = await DB.addHabit(_userId, _selKey, val, emoji);
//     if(saved){
//       const idx = _selHabits.findIndex(h=>h.id===temp.id);
//       if(idx!==-1) _selHabits[idx]=saved;
//     }
//     // Refresh Today tab if adding to today
//     if(_selKey === Utils.todayStr() && typeof Tasks !== 'undefined') {
//       Tasks.newDay(Utils.todayStr());
//     }
//   }

//   /* ── Live emoji preview in add input ── */
//   function _previewEmoji(val) {
//     const el = document.getElementById('dd-add-emoji');
//     if(!el) return;
//     const emoji = val.trim() ? Utils.matchEmoji(val) : '⭐';
//     if(el.textContent !== emoji) {
//       el.textContent = emoji;
//       el.classList.remove('bounce');
//       void el.offsetWidth;
//       el.classList.add('bounce');
//     }
//   }

//   function _prev(){
//     if(_viewM===0){_viewM=11;_viewY--;}else _viewM--;
//     _selKey=null; _selHabits=[];
//     document.getElementById('day-detail').classList.add('hidden');
//     render();
//   }

//   function _next(){
//     if(_viewM===11){_viewM=0;_viewY++;}else _viewM++;
//     _selKey=null; _selHabits=[];
//     document.getElementById('day-detail').classList.add('hidden');
//     render();
//   }

//   return{init, render, _select, _toggle, _delete, _addHabit, _previewEmoji};
// })();



//--------------------------------------------------------------


///----------------------------------------------------------------------------------
// /**
//  * calendar.js — monthly calendar with Firebase-backed dots
//  */
// const Calendar = (() => {

//   const NOW = new Date();
//   let _userId=null, _viewY=NOW.getFullYear(), _viewM=NOW.getMonth(), _selKey=null;
//   let _cache={};   // { "YYYY-MM-DD": pct }

//   async function init(userId) {
//     _userId = userId;
//     document.getElementById('cal-prev').onclick = _prev;
//     document.getElementById('cal-next').onclick = _next;
//   }

//   async function render() {
//     await _loadMonth();
//     _renderGrid();
//   }

//   async function _loadMonth() {
//     const y=_viewY, m=String(_viewM+1).padStart(2,'0');
//     const dim=new Date(y, _viewM+1, 0).getDate();
//     const dates=[];
//     for(let d=1;d<=dim;d++) dates.push(`${y}-${m}-${String(d).padStart(2,'0')}`);
//    try {
//       const grouped = await DB.getHabitsForDates(_userId, dates);
//       _cache={};
//       for(const [date, habits] of Object.entries(grouped)){
//         _cache[date]=Utils.calcPct(habits);
//       }
//     } catch(e){
//       console.error('[Cal] load error', e);
//       alert('Calendar error: ' + e.message + '\n\nCheck console for details.');
//     }
//   }

//   function _renderGrid() {
//     const y=_viewY, m=_viewM;
//     document.getElementById('cal-m').textContent = Utils.MONTHS[m];
//     document.getElementById('cal-y').textContent = y;
//     const first=new Date(y,m,1).getDay();
//     const dim=new Date(y,m+1,0).getDate();
//     const today=Utils.todayStr();
//     let html='';
//     for(let i=0;i<first;i++) html+='<div class="day empty"></div>';
//     for(let d=1;d<=dim;d++){
//       const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
//       const pct=_cache[key]||0;
//       const dot=Utils.dotColor(pct);
//       const cls=['day', key===today&&'today', key===_selKey&&'sel'].filter(Boolean).join(' ');
//       html+=`<div class="${cls}" onclick="Calendar._select('${key}')">
//         <span class="dnum">${d}</span>
//         ${dot?`<div class="ddot" style="background:${dot}"></div>`:''}
//       </div>`;
//     }
//     document.getElementById('days-grid').innerHTML=html;
//     if(_selKey) _renderDetail(_selKey);
//   }

//   async function _select(key) {
//     if(_selKey===key){
//       _selKey=null;
//       document.getElementById('day-detail').classList.add('hidden');
//       _renderGrid();
//       return;
//     }
//     _selKey=key;
//     _renderGrid();
//     await _renderDetail(key);
//   }

//   async function _renderDetail(key) {
//     const panel=document.getElementById('day-detail');
//     let habits=[];
//     try { habits=await DB.getHabitsForDate(_userId, key); } catch(e){}
//     const d=Utils.parseDate(key);
//     const pct=Utils.calcPct(habits);
//     document.getElementById('dd-title').innerHTML=
//       `${Utils.DAYS_FULL[d.getDay()]}, ${Utils.MONTHS_SHORT[d.getMonth()]} ${d.getDate()}
//        <span class="dd-pct">${habits.length?pct+'% complete':''}</span>`;
//     const el=document.getElementById('dd-tasks');
//     if(!habits.length){
//       el.innerHTML='<p style="font-size:13px;color:var(--t3);padding:4px 0">No habits recorded.</p>';
//     } else {
//       el.innerHTML=habits.map(h=>`
//         <div class="dd-task">
//           <div class="dd-check ${h.done?'on':''}"></div>
//           <span style="font-size:14px;line-height:1;margin-right:5px">${Utils.escHtml(h.emoji)}</span>
//           <span class="dd-name ${h.done?'done':''}">${Utils.escHtml(h.name)}</span>
//         </div>`).join('');
//     }
//     panel.classList.remove('hidden');
//   }

//   function _prev(){
//     if(_viewM===0){_viewM=11;_viewY--;}else _viewM--;
//     _selKey=null;
//     document.getElementById('day-detail').classList.add('hidden');
//     render();
//   }

//   function _next(){
//     if(_viewM===11){_viewM=0;_viewY++;}else _viewM++;
//     _selKey=null;
//     document.getElementById('day-detail').classList.add('hidden');
//     render();
//   }

//   return{init,render,_select};
// })();
