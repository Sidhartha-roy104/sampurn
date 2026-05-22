/**
 * app.js — boots after auth, controls tabs
 */
const App = (() => {

  const TABS = ['today','calendar','history'];
  let _active = 'today';

  async function boot(user) {
    _active = 'today';
    _setGreeting(user.name);
    _setMotivator();

    // Reset tab to today
    _switchTab('today', false);

    // Init all modules
    await Tasks.init(user.id);
    await Calendar.init(user.id);
    History.init(user.id);
    Notes.init(user.id);

    // Start real-time clock; midnight callback
    Clock.start(async newDate => {
      _setGreeting(user.name);
      await Tasks.newDay(newDate);
      Notes.newDay(newDate);
    });
  }

  function tab(name) { _switchTab(name, true); }

  function _switchTab(name, lazy) {
    if (!TABS.includes(name)) return;
    _active = name;
    TABS.forEach(id => {
      const btn  = document.getElementById(`tab-${id}`);
      const view = document.getElementById(`v-${id}`);
      const on   = id === name;
      if (btn)  btn.classList.toggle('active', on);
      if (view) { view.classList.toggle('active',on); view.classList.toggle('hidden',!on); }
    });
    if (!lazy) return;
    if (name === 'calendar') Calendar.render();
    if (name === 'history')  History.render();
  }

  function _setGreeting(name) {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
    const el = document.getElementById('greeting');
    if (el) el.textContent = `${g}, ${name}`;
  }

  function _setMotivator() {
    const el = document.getElementById('motivator-text');
    if (!el) return;
    el.style.animation = 'none';
    el.textContent = Utils.pick(Utils.QUOTES);
    void el.offsetWidth;
    el.style.animation = '';
  }

  /* ── Page load: expose globals, hand off to Auth ── */
  function _onLoad() {
    window.App     = { boot, tab };
    window.Auth    = Auth;
    window.Tasks   = Tasks;
    window.Calendar= Calendar;
    window.History = History;
    window.Notes   = Notes;
    Auth.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _onLoad);
  } else {
    _onLoad();
  }

  return { boot, tab };
})();
