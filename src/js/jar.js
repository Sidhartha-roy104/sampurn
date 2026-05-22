/**
 * jar.js — animated SVG jar fill
 */
const Jar = (() => {
  const TOP=20, H=84, STEPS=30, MS=16;
  let _t=null;
  function set(pct){
    if(_t) clearInterval(_t);
    const fill=document.getElementById('jar-fill');
    const txt=document.getElementById('jar-txt');
    if(!fill||!txt) return;
    const tH=Math.round((pct/100)*H);
    const tY=pct===0?TOP+H:TOP+H-tH;
    const col=Utils.jarColor(pct);
    let cH=parseFloat(fill.getAttribute('height'))||0;
    let cY=parseFloat(fill.getAttribute('y'))||(TOP+H);
    let s=0;
    _t=setInterval(()=>{
      s++;
      const e=Utils.easeInOut(s/STEPS);
      const h=cH+(tH-cH)*e, y=cY+(tY-cY)*e;
      fill.setAttribute('height',h);
      fill.setAttribute('y',y);
      fill.setAttribute('fill',col);
      txt.textContent=Math.round((h/H)*100)+'%';
      if(s>=STEPS){
        clearInterval(_t);
        fill.setAttribute('height',tH);
        fill.setAttribute('y',tY);
        fill.setAttribute('fill',col);
        txt.textContent=pct+'%';
      }
    },MS);
  }
  return{set};
})();
