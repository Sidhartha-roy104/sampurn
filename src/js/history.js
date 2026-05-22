/**
 * history.js — past days, loaded from Firestore
 */
const History = (() => {

  let _userId = null;

  function init(userId) { _userId = userId; }

  async function render() {
    const listEl = document.getElementById('hist-list');
    const loadEl = document.getElementById('hist-loading');
    loadEl.classList.remove('hidden');
    listEl.innerHTML = '';

    const today = Utils.todayStr();
    let dates = [], grouped = {};

    try {
      dates   = await DB.getAllDates(_userId);
      grouped = await DB.getHabitsForDates(_userId, dates);
    } catch(e) {
      console.error('[History] load error', e);
    }

    loadEl.classList.add('hidden');

    if (!dates.length) {
      listEl.innerHTML = '<p class="no-hist">No history yet — complete some habits today!</p>';
      return;
    }

    listEl.innerHTML = dates.map(date => {
      const habits  = grouped[date] || [];
      const pct     = Utils.calcPct(habits);
      const col     = Utils.dotColor(pct) || 'var(--border2)';
      const isToday = date === today;
      const todayPill = isToday ? '<span class="today-pill">today</span>' : '';

      // Find latest save time
      const lastUpdated = habits.reduce((max, h) => {
        const t = h.updatedAt || h.addedAt;
        return (!max || (t && t.seconds > max.seconds)) ? t : max;
      }, null);

      const taskRows = habits.length
        ? habits.map(h => `
            <div class="hist-task">
              <div class="hist-check ${h.done ? 'on' : ''}"></div>
              <span style="font-size:14px;line-height:1;margin-right:5px">${Utils.escHtml(h.emoji)}</span>
              <span class="hist-tname ${h.done ? 'done' : ''}">${Utils.escHtml(h.name)}</span>
              <br>
              ${h.done && h.doneAt ? `<span class="hist-time">✓ ${Utils.fmtTime(h.doneAt)}</span>` : ''}
            </div>`).join('')
        : '<p style="font-size:13px;color:var(--t3)">No tasks recorded.</p>';

      return `
        <div class="hist-item ${isToday ? 'open' : ''}" id="hi-${date}">
          <div class="hist-hdr" onclick="History._toggle('${date}')">
            <div class="hist-date-wrap">
              <span class="hist-date">${todayPill}${Utils.friendlyDate(date)}</span>
              ${lastUpdated ? `<span class="hist-saved">${Utils.fmtSaved(lastUpdated)}</span>` : ''}
            </div>
            <div class="hist-right">
              <span class="hist-pct">${pct}%</span>
              <div class="hist-bar">
                <div class="hist-bar-fill" style="width:${pct}%;background:${col}"></div>
              </div>
              <span class="hist-arrow">›</span>
            </div>
          </div>
          <div class="hist-body">${taskRows}</div>
        </div>`;
    }).join('');
  }

  function _toggle(date) {
    const el = document.getElementById(`hi-${date}`);
    if (el) el.classList.toggle('open');
  }

  return { init, render, _toggle };
})();
