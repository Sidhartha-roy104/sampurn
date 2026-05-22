/**
 * db.js — Firestore data layer
 *
 * Auth is now handled entirely by Firebase Auth (Google Sign-In).
 * This file only handles habit data in Firestore.
 *
 * Structure:
 *   /habits/{habitId}
 *     userId    : string   (Firebase Auth UID)
 *     date      : string   ("YYYY-MM-DD")
 *     name      : string
 *     emoji     : string
 *     done      : boolean
 *     addedAt   : timestamp
 *     doneAt    : timestamp | null
 *     updatedAt : timestamp
 */
const DB = (() => {

  /* ── Habits: Read ── */

 async function getHabitsForDate(userId, dateStr) {
    const snap = await db.collection('habits')
      .where('userId', '==', userId)
      .where('date', '==', dateStr)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getHabitsForDates(userId, dates) {
    if (!dates.length) return {};
    const chunks = [];
    for (let i = 0; i < dates.length; i += 30) chunks.push(dates.slice(i, i + 30));

    const all = [];
    for (const chunk of chunks) {
   const snap = await db.collection('habits')
        .where('userId', '==', userId)
        .where('date', 'in', chunk)
        .get();
      snap.docs.forEach(d => all.push({ id: d.id, ...d.data() }));
    }

    const grouped = {};
    for (const h of all) {
      if (!grouped[h.date]) grouped[h.date] = [];
      grouped[h.date].push(h);
    }
    return grouped;
  }

  async function getAllDates(userId) {
const snap = await db.collection('habits')
      .where('userId', '==', userId)
      .get();
    const seen = new Set();
    snap.docs.forEach(d => seen.add(d.data().date));
    return [...seen].sort().reverse();
  }

  /* ── Habits: Write ── */

  async function addHabit(userId, dateStr, name, emoji) {
    const ref = await db.collection('habits').add({
      userId,
      date:      dateStr,
      name:      name.trim(),
      emoji,
      done:      false,
      addedAt:   firebase.firestore.FieldValue.serverTimestamp(),
      doneAt:    null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  }

  async function toggleHabit(habitId, done) {
    await db.collection('habits').doc(habitId).update({
      done,
      doneAt:    done ? firebase.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  async function deleteHabit(habitId) {
    await db.collection('habits').doc(habitId).delete();
  }

  /* ── Streak ── */

  function calcStreak(habitsByDate) {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key    = Utils.dateStr(d);
      const habits = habitsByDate[key] || [];
      if (habits.length > 0 && Utils.calcPct(habits) > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  return {
    getHabitsForDate, getHabitsForDates, getAllDates,
    addHabit, toggleHabit, deleteHabit,
    calcStreak,
  };
})();
