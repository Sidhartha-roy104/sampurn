/**
 * clock.js — live date/time display + midnight rollover
 */
const Clock = (() => {
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  let _timer=null, _lastDate=null, _cb=null;

  function _pad(n){return String(n).padStart(2,'0')}

  function _tick(){
    const now=new Date();
    const dEl=document.getElementById('live-date');
    const tEl=document.getElementById('live-time');
    if(dEl){
      const s=`${DAYS[now.getDay()]}, ${MONS[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
      if(dEl.textContent!==s) dEl.textContent=s;
    }
    if(tEl){
      const h12=now.getHours()%12||12;
      const ampm=now.getHours()>=12?'PM':'AM';
      tEl.textContent=`${_pad(h12)}:${_pad(now.getMinutes())}:${_pad(now.getSeconds())} ${ampm}`;
    }
    const today = Utils.dateStr(now);
    if (_lastDate && _lastDate !== today) {
      _lastDate = today;
      if (typeof _cb === 'function') _cb(today);
      // Re-render calendar if it's open so "today" ring moves to new date
      if (typeof Calendar !== 'undefined') {
        const calView = document.getElementById('v-calendar');
        if (calView && !calView.classList.contains('hidden')) {
          Calendar.render();
        }
      }
    }
    _lastDate = today;
  }

  function start(onNewDay){
    _cb=onNewDay||null;
    _lastDate=Utils.dateStr(new Date());
    _tick();
    _timer=setInterval(_tick,1000);
  }

  function stop(){
    if(_timer){clearInterval(_timer);_timer=null;}
  }

  return{start,stop};
})();
