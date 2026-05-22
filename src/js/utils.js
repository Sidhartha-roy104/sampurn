/**
 * utils.js — helpers, date tools, smart emoji matcher
 */
const Utils = (() => {

  const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const QUOTES = [
    'Every small step keeps your rhythm.',
    'Consistency is the key to mastery.',
    'Show up — that\'s already a win.',
    'Progress, not perfection.',
    'You\'re building something great.',
    'One habit at a time.',
    'The secret is just to begin.',
    'Small deeds done beat great deeds planned.',
    'Each day is a fresh start.',
    'Your future self will thank you.',
    'Discipline is choosing between what you want now and what you want most.',
    'We are what we repeatedly do.',
  ];

  /* ─── Smart emoji keyword map ─── */
  const EMOJI_MAP = [
    { e:'🏃', k:['run','running','jog','jogging','sprint','cardio','5k','10k','marathon','track','pace'] },
    { e:'🚶', k:['walk','walking','steps','stroll','hike','hiking','10000 steps','step count'] },
    { e:'🧘', k:['meditat','yoga','mindful','breathing','breathwork','relax','calm','zen','wim hof'] },
    { e:'📚', k:['read','reading','book','study','learn','page','novel','studying','revision','literature'] },
    { e:'💪', k:['gym','workout','exercise','lift','strength','train','fitness','pushup','pull-up','squat','bench','deadlift','weights','crossfit','hiit','circuit','resistance','kettlebell'] },
    { e:'💧', k:['water','drink','hydrat','litre','liter','glass','fluid','h2o','2l','3l'] },
    { e:'🥗', k:['diet','salad','veggie','vegetable','fruit','healthy food','nutrition','calorie','macro','no junk','no sugar','no fast food','clean eating'] },
    { e:'🍳', k:['cook','cooking','bake','baking','recipe','kitchen','meal prep','prepare food'] },
    { e:'😴', k:['sleep','bed','rest','nap','bedtime','8 hours','no screen before bed','wind down'] },
    { e:'✍️', k:['write','writing','journal','diary','note','blog','essay','letter','gratitude journal'] },
    { e:'🎵', k:['music','guitar','piano','sing','singing','instrument','song','play music','practice music','drum','violin','ukulele'] },
    { e:'🌅', k:['morning','sunrise','wake','early','dawn','morning routine','5am','6am','7am'] },
    { e:'🧠', k:['focus','mental','mind','cognitive','memory','puzzle','chess','sudoku','brain training','deep work','no distraction'] },
    { e:'🚴', k:['bike','cycling','cycle','bicycle','ride','spin class','velodrome'] },
    { e:'🧹', k:['clean','tidy','organis','organiz','declutter','laundry','dishes','vacuum','sweep','mop','wash clothes'] },
    { e:'📵', k:['no phone','screen time','digital detox','social media','limit phone','no scroll','phone free','no instagram','no tiktok'] },
    { e:'💊', k:['vitamin','medicine','supplement','pill','tablet','medication','probiotic','omega','multivitamin'] },
    { e:'☕', k:['coffee','tea','green tea','matcha','herbal tea','no coffee','limit caffeine'] },
    { e:'🌿', k:['nature','outside','garden','plant','green','outdoor','fresh air','park','forest','walk outside'] },
    { e:'💼', k:['work','office','job','meeting','email','project','business','client','deadline','task list'] },
    { e:'🤝', k:['social','friend','family','connect','call','talk','chat','relationship','catch up','quality time'] },
    { e:'🎨', k:['draw','paint','art','sketch','creative','design','colour','color','illustration','craft'] },
    { e:'📷', k:['photo','picture','camera','photograph'] },
    { e:'🏊', k:['swim','swimming','pool','water sport','laps','aqua'] },
    { e:'⚽', k:['football','soccer','sport','game','ball','basketball','tennis','badminton','squash','volleyball'] },
    { e:'🥤', k:['smoothie','shake','juice','blend','protein shake','green juice'] },
    { e:'🌙', k:['evening routine','night routine','before bed','no screen at night','wind down','11pm','10pm'] },
    { e:'🙏', k:['gratitude','grateful','thankful','pray','prayer','affirmation','manifest','intention','positive'] },
    { e:'📖', k:['scripture','quran','bible','devotion','reading plan','spiritual','faith'] },
    { e:'🧴', k:['skincare','moisturis','moisturiz','sunscreen','face wash','serum','spf','toner'] },
    { e:'🦷', k:['teeth','floss','dental','brush teeth','mouthwash','oral'] },
    { e:'💰', k:['save','saving','budget','money','finance','invest','no spend','track spending','expense'] },
    { e:'📝', k:['plan day','schedule','agenda','to-do','todo','to do list','daily plan','priorit'] },
    { e:'🌊', k:['cold shower','cold plunge','ice bath','contrast shower','cold water'] },
    { e:'🏋️', k:['strength training','weight training','powerlifting','bodybuilding'] },
    { e:'🍎', k:['eat fruit','eat veggies','apple','banana','healthy snack','no snacking'] },
    { e:'🎯', k:['goal','target','aim','focus session','pomodoro','deep work session'] },
    { e:'😊', k:['smile','happiness','positive mindset','self care','self-care','me time','self love'] },
    { e:'🧺', k:['laundry','fold clothes','iron','tidy room','make bed'] },
    { e:'🛏️', k:['make bed','wake up early','morning alarm','consistent wake','same sleep time'] },
    { e:'🍵', k:['herbal','chamomile','peppermint','relaxing tea','evening tea'] },
    { e:'📞', k:['call mum','call dad','call family','check in','phone call','facetime'] },
  ];

  const FALLBACKS = ['⭐','🎯','✅','🌟','💫','🔥','🏆','🌈'];

  function matchEmoji(text) {
    if (!text || !text.trim()) return pick(FALLBACKS);
    const lower = text.toLowerCase();
    let best = null, bestScore = 0;
    for (const { e, k } of EMOJI_MAP) {
      let score = 0;
      for (const kw of k) {
        if (lower.includes(kw)) score += kw.length; // longer keyword = stronger signal
      }
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best || pick(FALLBACKS);
  }

  /* ─── Date helpers ─── */
  function todayStr() { return dateStr(new Date()); }

  function dateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function friendlyDate(str) {
    const d = parseDate(str);
    const isThisYear = d.getFullYear() === new Date().getFullYear();
    return `${DAYS_FULL[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}${isThisYear ? '' : ' ' + d.getFullYear()}`;
  }

  /* ─── Stats ─── */
  function calcPct(habits) {
    if (!habits || !habits.length) return 0;
    return Math.round(habits.filter(h => h.done).length / habits.length * 100);
  }

  function dotColor(pct) {
    if (pct >= 100) return '#7F77DD';
    if (pct >= 75)  return '#1D9E75';
    if (pct >= 50)  return '#5DCAA5';
    if (pct > 0)    return '#FAC775';
    return '';
  }

  function jarColor(pct) {
    if (pct >= 100) return '#7F77DD';
    if (pct >= 75)  return '#5DCAA5';
    if (pct >= 50)  return '#EF9F27';
    if (pct > 0)    return '#FAC775';
    return '#AFA9EC';
  }

  /* ─── Misc ─── */
  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function easeInOut(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }

  function fmtTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtSaved(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return `saved at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return {
    MONTHS, MONTHS_SHORT, DAYS_FULL, QUOTES,
    matchEmoji,
    todayStr, dateStr, parseDate, friendlyDate,
    calcPct, dotColor, jarColor,
    escHtml, pick, easeInOut, fmtTime, fmtSaved,
  };
})();
