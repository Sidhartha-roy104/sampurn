/**
 * tasks.js — Today's habits, persisted to Firebase Firestore
 */
const Tasks = (() => {

  let _userId  = null;
  let _today   = Utils.todayStr();
  let _habits  = [];    // in-memory cache for today
  let _addOpen = false;

  /* ── Init ── */
  async function init(userId) {
    _userId = userId;
    _today  = Utils.todayStr();
    _bindEvents();
    await _load();
  }

  /* Midnight rollover — reset to new day */
 
async function newDay(dateStr) {
    // Only reset if it's actually a new date (midnight rollover)
    // If same date (called from Calendar toggle), just reload quietly
    const isNewDay = dateStr !== _today;
    _today = dateStr;
    if(isNewDay) {
      _habits = [];
      _render();
    }
    await _load();
  }
  /* ── Load from Firestore ── */
  async function _load() {
    _showLoading(true);
    try {
      _habits = await DB.getHabitsForDate(_userId, _today);
    } catch(e) {
      console.error('[Tasks] load error', e);
      _habits = [];
    }
    _showLoading(false);
    _render();
    _updateHero();
    _updateStreak();
  }

  /* ── Render ── */
  function _render() {
    const list = document.getElementById('task-list');
    list.style.display = 'block';

    // if (!_habits.length) {
    //   list.innerHTML = '<p class="empty-msg">No tasks yet — tap <strong>+ Add</strong> to begin!</p>';
    //   return;
    // }
    if (!_habits.length) {
  list.innerHTML = `
    <div class="empty-flow">
    <p class="empty-cta">Tap <strong>+ Add</strong> to begin your day ↑</p>
    <br>
      <p class="empty-title">How Sampūrṇ works</p>
      <ol class="app-flow-hint">
        <li>Type a task → Enter to save</li>
        <li>Mark done → jar fills, next highlights</li>
        <li>Track → Calendar &amp; History</li>
        <li>All done → jar hits 100% + streak up</li>
        <li>Midnight → resets, moves to History</li>
      </ol>
      
    </div>`;
  return;
}
    list.innerHTML = _habits.map((h, i) => `
      <div class="task-item" onclick="Tasks._toggle(${i})">
        <div class="t-check ${h.done ? 'on' : ''}"><div class="tick"></div></div>
        <span class="t-emoji">${Utils.escHtml(h.emoji)}</span>
        <span class="t-name ${h.done ? 'done' : ''}">${Utils.escHtml(h.name)}</span>
        <button class="del-btn" onclick="Tasks._del(event,${i})" title="Delete">×</button>
      </div>`).join('');
  }

  function _updateHero() {
    const done  = _habits.filter(h => h.done).length;
    const total = _habits.length;
    const pct   = Utils.calcPct(_habits);
    document.getElementById('hero-pct').textContent  = pct + '%';
    document.getElementById('h-done').textContent    = done;
    document.getElementById('h-total').textContent   = total;
    Jar.set(pct);
  }

  async function _updateStreak() {
    try {
      const dates    = await DB.getAllDates(_userId);
      const byDate   = await DB.getHabitsForDates(_userId, dates.slice(0, 90));
      // Inject today's in-memory habits into byDate (not yet saved to streak query)
      byDate[_today] = _habits;
      const streak   = DB.calcStreak(byDate);
      document.getElementById('streak-num').textContent = streak;
    } catch(e) {
      console.error('[Tasks] streak error', e);
    }
  }

  /* ── Toggle done ── */
  async function _toggle(i) {
    const h      = _habits[i];
    const newDone = !h.done;
    // Optimistic update
    _habits[i] = { ...h, done: newDone, doneAt: newDone ? { toDate: () => new Date() } : null };
    _render();
    _updateHero();
    // Persist
    try {
      await DB.toggleHabit(h.id, newDone);
    } catch(e) {
      // Rollback on error
      _habits[i] = h;
      _render();
      _updateHero();
      console.error('[Tasks] toggle error', e);
    }
  }

  /* ── Delete ── */
  async function _del(e, i) {
    e.stopPropagation();
    const h = _habits[i];
    _habits.splice(i, 1);
    _render();
    _updateHero();
    try {
      await DB.deleteHabit(h.id);
    } catch(err) {
      console.error('[Tasks] delete error', err);
    }
  }

  /* ── Add ── */
  async function _add(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const emoji = Utils.matchEmoji(trimmed);

    // Optimistic: add temp row
    const temp = {
      id: 'tmp_' + Date.now(),
      name: trimmed, emoji,
      done: false,
      addedAt: { toDate: () => new Date() },
      doneAt: null,
    };
    _habits.push(temp);
    _render();
    _updateHero();

    try {
      const saved = await DB.addHabit(_userId, _today, trimmed, emoji);
      // Replace temp with real doc
      const idx = _habits.findIndex(h => h.id === temp.id);
      if (idx !== -1 && saved) _habits[idx] = saved;
      _updateStreak();
    } catch(e) {
      // Remove temp on failure
      _habits = _habits.filter(h => h.id !== temp.id);
      _render();
      _updateHero();
      console.error('[Tasks] add error', e);
    }
  }

  /* ── Add form ── */
  function _bindEvents() {
    document.getElementById('add-toggle').onclick = () => {
  _addOpen = !_addOpen;
  const form = document.getElementById('add-form');
  form.classList.remove('hidden');
  form.classList.toggle('open', _addOpen);
  if (_addOpen) document.getElementById('add-input').focus();
  else { document.getElementById('add-input').value=''; document.getElementById('add-emoji').textContent='⭐'; }
};

    document.getElementById('add-ok').onclick = _submit;

    document.getElementById('add-input').addEventListener('input', e => {
      const v   = e.target.value;
      const em  = v.trim() ? Utils.matchEmoji(v) : '⭐';
      const el  = document.getElementById('add-emoji');
      if (el.textContent !== em) {
        el.textContent = em;
        el.classList.remove('bounce');
        void el.offsetWidth;
        el.classList.add('bounce');
      }
    });

    document.getElementById('add-input').addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); _submit(); }
      if (e.key === 'Escape') { _closeAdd(); }
    });
  }

  function _submit() {
    const val = document.getElementById('add-input').value.trim();
    if (!val) { document.getElementById('add-input').focus(); return; }
    _add(val);
    _closeAdd();
  }

  function _closeAdd() {
    _addOpen = false;
    document.getElementById('add-form').classList.remove('open');
    document.getElementById('add-form').classList.add('hidden');
    document.getElementById('add-input').value = '';
    document.getElementById('add-emoji').textContent = '⭐';
  }

  function _showLoading(on) {
    document.getElementById('tasks-loading').classList.toggle('hidden', !on);
    document.getElementById('task-list').style.display = on ? 'none' : 'block';
  }

  // Called by Calendar when it toggles/adds/deletes a habit for today
  // Updates the hero jar instantly without re-fetching from Firestore
  function refreshHero(habits) {
    _habits = habits;
    _updateHero();
    _updateStreak();
  }

  return { init, newDay, refreshHero, _toggle, _del };
})();
