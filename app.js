{
/* ================= Zustand ================= */
const KEY = 'db-lernapp-v2';
const DAY = 864e5;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const isoDay = t => new Date(t).toISOString().slice(0, 10);
let S = { cards: {}, quizBest: {}, solved: {}, puz: {}, checks: {}, days: [], hist: [], lv: 0, newDay: { d: 0, n: 0 }, lessons: {}, exams: [], wrong: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
S.lessons = S.lessons || {}; S.exams = S.exams || []; S.wrong = S.wrong || {};
try { const old = JSON.parse(localStorage.getItem('db-lernplan-v1') || 'null'); if (old && old.solved && !Object.keys(S.solved).length) S.solved = old.solved; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MOD = Object.fromEntries(MODULES.map(m => [m.id, m]));
function markActive() { const d = isoDay(today()); if (!S.days.includes(d)) { S.days.push(d); S.days = S.days.slice(-120); } save(); }
function streak() { let n = 0, t = today(); if (!S.days.includes(isoDay(t))) t -= DAY; while (S.days.includes(isoDay(t))) { n++; t -= DAY; } return n; }
const shown = {};

/* ================= Daten zusammenführen ================= */
const pick = (map, lid, i) => Array.isArray(map[lid]) ? map[lid][i] : map[lid];
const ALLCARDS = [];
LECTURES.forEach(l => (l.recall || []).forEach((r, i) => ALLCARDS.push({ id: 'r-' + l.id + '-' + i, m: pick(RECALL_MAP, l.id, i), f: r.q, b: r.a })));
CARDS.forEach((c, i) => ALLCARDS.push({ id: 'c-' + i, m: c[0], f: c[1], b: c[2] }));
const QZ = QUIZ.map((q, i) => ({ id: 'q' + i, m: q[0], q: q[1], o: q[2], e: q[3] }));

const TASKS = {};
const EXS = []; // Übungen pro Modul
LECTURES.forEach(l => (l.uebungen || []).forEach((u, i) => {
  const tid = u.sql ? 'L-' + l.id + '-' + i : null;
  if (tid) TASKS[tid] = { titel: u.titel, text: u.aufgabe, db: u.db, sql: u.sql, pre: u.pre, ordered: u.ordered, alt: u.alt, loesung: u.loesung };
  EXS.push({ m: pick(UEB_MAP, l.id, i), key: 'ue:' + l.id + i, titel: u.titel, aufgabe: u.aufgabe, loesung: u.loesung, task: tid });
}));
PRAKTIKA.forEach(p => p.aufgaben.forEach((a, i) => { if (a.sql) TASKS['P-' + p.id + '-' + i] = { titel: 'Praktikum ' + p.nr + ' · ' + a.nr, text: a.aufgabe, db: a.db, sql: a.sql, pre: a.pre, ordered: a.ordered, alt: a.alt, tipp: a.tipp, loesung: a.loesung }; }));
const fmtSql = s => s.replace(/ (FROM|WHERE|GROUP BY|HAVING|ORDER BY|LEFT JOIN|LEFT OUTER JOIN|JOIN|UNION|INTERSECT|EXCEPT) /g, '\n$1 ');
DRILL.forEach(d => {
  const ttl = (d.lv === 4 ? 'Klausurniveau · ' + ({ dml: 'DML', ddl: 'DDL' }[d.kind] || 'SQL') + ' ' + d.id.toUpperCase() : 'SQL-Training ' + d.id + ' · Level ' + d.lv);
  TASKS['D-' + d.id] = { titel: ttl, text: d.t, db: d.db, sql: d.sql, alt: d.alt, ordered: d.ordered, tipp: d.h, verify: d.verify, kind: d.kind, loesung: fmtSql(d.sql).replace(/; /g, ';\n') + '\n\n' + d.e };
  EXS.push({ m: DRILL_MAP[d.id], key: 'dr:' + d.id, titel: ttl, aufgabe: d.t, tipp: d.h, loesung: TASKS['D-' + d.id].loesung, task: 'D-' + d.id, lv: d.lv });
});

ALG.forEach((a, i) => EXS.push({ m: a.m || 'algebra', key: 'alg:' + i, titel: a.t, aufgabe: a.a, loesung: a.l, paper: true, lv: /-K\d/.test(a.t) ? 4 : 2 }));
EXS.sort((x, y) => (y.lv || 1) - (x.lv || 1));

/* ================= Fortschritt ================= */
const mastered = c => (S.cards[c.id] && S.cards[c.id].b >= 3);
function modProgress(mid) {
  const cs = ALLCARDS.filter(c => c.m === mid), ts = EXS.filter(e => e.m === mid), ps = PUZZLES.filter(p => p.m === mid);
  const parts = [[S.lessons[mid] ? 1 : 0, 0.15], [cs.filter(mastered).length / (cs.length || 1), 0.3], [(S.quizBest[mid] || 0) / 100, 0.2], [ts.filter(e => S.checks[e.key] || (e.task && S.solved[e.task])).length / (ts.length || 1), 0.2], [ps.filter(p => S.puz[p.id]).length / (ps.length || 1), 0.15]];
  return Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) * 100);
}
const ring = (pct, col, size = 56, sw = 6) => { const r = (size - sw) / 2, c = 2 * Math.PI * r; return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${sw}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${size / 4.2}" font-weight="600" fill="currentColor">${pct}%</text></svg>`; };
const ICON = {
  flame: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2c1 3.5-1.5 5-1.5 7.5 0 1.4 1 2.5 2.3 2.5 1.6 0 2.4-1.3 2.2-3 2.2 1.6 3.5 4 3.5 6.5A6.5 6.5 0 0 1 12 22a6.5 6.5 0 0 1-6.5-6.5C5.5 10 11 7.5 12 2z" fill="currentColor"/></svg>',
  cards: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="6" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 3h11a3 3 0 0 1 3 3v11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  quiz: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.2" fill="currentColor"/></svg>',
  lab: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 15h9" stroke="currentColor" stroke-width="2"/></svg>',
  puzzle: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  term: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 9l3 3-3 3M12 15h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 19V5M8 7h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  exam: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l3 2M10 2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  home: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* ================= Karteikarten (Leitner) ================= */
const IV = [0, 1, 3, 7, 14, 30];
const NEW_PER_DAY = 15;
function dueCards(mid) { const t = today(); return ALLCARDS.filter(c => (!mid || c.m === mid) && S.cards[c.id] && S.cards[c.id].due <= t); }
function newCards(mid) { return ALLCARDS.filter(c => (!mid || c.m === mid) && !S.cards[c.id]); }
function newLeft() { if (S.newDay.d !== today()) S.newDay = { d: today(), n: 0 }; return Math.max(0, NEW_PER_DAY - S.newDay.n); }
let FC = null; // {queue, i, flipped, done, again, title}
function startCards(mid, mode) {
  let q;
  if (mode === 'all') q = shuffle(ALLCARDS.filter(c => !mid || c.m === mid));
  else { const due = shuffle(dueCards(mid)); const nw = newCards(mid).slice(0, mid ? 20 : newLeft()); q = due.concat(nw).slice(0, 30); }
  if (!q.length) q = shuffle(ALLCARDS.filter(c => !mid || c.m === mid)).slice(0, 15);
  FC = { queue: q, i: 0, flipped: false, stats: { good: 0, hard: 0, again: 0 }, title: mid ? MOD[mid].t : 'Heute fällig', mid };
  go('karten');
}
function rateCard(r) {
  const c = FC.queue[FC.i], st = S.cards[c.id] || { b: 0, due: 0 };
  if (!S.cards[c.id]) { if (S.newDay.d !== today()) S.newDay = { d: today(), n: 0 }; S.newDay.n++; }
  if (r === 'again') { st.b = 0; st.due = today(); FC.queue.push(c); FC.stats.again++; }
  else if (r === 'hard') { st.b = Math.max(1, st.b); st.due = today() + DAY; FC.stats.hard++; }
  else { st.b = Math.min(5, st.b + 1); st.due = today() + IV[st.b] * DAY; FC.stats.good++; }
  S.cards[c.id] = st; markActive();
  FC.i++; FC.flipped = false; render();
}

/* ================= Quiz ================= */
let QS = null; // {qs, i, picked, score, wrong, title, mid}
function startQuiz(mid, onlyIds) {
  let pool = onlyIds ? QZ.filter(q => onlyIds.includes(q.id)) : QZ.filter(q => !mid || q.m === mid);
  const qs = shuffle(pool).slice(0, mid || onlyIds ? 12 : 15).map(q => ({ ...q, opts: shuffle(q.o.map((t, k) => ({ t, ok: k === 0 }))) }));
  QS = { qs, i: 0, picked: null, score: 0, wrong: [], title: mid ? MOD[mid].t : onlyIds ? 'Fehler wiederholen' : 'Klausur-Mix', mid };
  go('quiz');
}
function answer(k) {
  if (QS.picked !== null) return;
  const q = QS.qs[QS.i]; QS.picked = k;
  if (q.opts[k].ok) { QS.score++; if (S.wrong[q.id]) { S.wrong[q.id]--; if (S.wrong[q.id] <= 0) delete S.wrong[q.id]; } } else { QS.wrong.push(q.id); S.wrong[q.id] = 2; }
  markActive(); render();
}
function nextQ() {
  QS.i++; QS.picked = null;
  if (QS.i >= QS.qs.length && QS.mid) { const pct = Math.round(QS.score / QS.qs.length * 100); S.quizBest[QS.mid] = Math.max(S.quizBest[QS.mid] || 0, pct); save(); }
  render();
}

/* ================= SQL-Engine & Konsole ================= */
let SQLlib = null, sqlLoading = null;
const loadSQL = () => SQLlib ? Promise.resolve(SQLlib) : (sqlLoading = sqlLoading || initSqlJs({ locateFile: f => f }).then(L => (SQLlib = L)));
function makeDb(k) {
  const db = new SQLlib.Database(); db.run(DBS[k].sql);
  if (k === 'fam') db.create_function('BerechneAlter', n => { const st = db.prepare('SELECT Geburtsjahr, Sterbejahr FROM Person WHERE Name = ?'); st.bind([n]); let r = null; if (st.step()) { const [g, t] = st.get(); r = (t ?? new Date().getFullYear()) - g; } st.free(); return r; });
  return db;
}
const con = { db: 'uni', task: null, inst: null, text: '', out: null, msg: null };
const lastResult = (db, sql) => { const r = db.exec(sql); return r.length ? r[r.length - 1] : { columns: [], values: [] }; };
const norm = v => v === null || v === undefined ? '∅' : typeof v === 'number' ? String(Math.round(v * 1e4) / 1e4) : String(v).trim();
function compare(exp, got, ordered) {
  if (exp.columns.length !== got.columns.length) return `Deine Anfrage liefert ${got.columns.length} Attribut(e), erwartet sind ${exp.columns.length}.`;
  if (exp.values.length !== got.values.length) return `Deine Anfrage liefert ${got.values.length} Tupel, erwartet sind ${exp.values.length}.`;
  const key = r => r.map(norm).sort().join('\u0001'), a = exp.values.map(key), b = got.values.map(key);
  if (ordered) { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return `Anzahl stimmt, aber Tupel ${i + 1} weicht ab – Inhalt oder Sortierung prüfen.`; return null; }
  a.sort(); b.sort(); for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return 'Anzahl der Tupel stimmt, aber die Werte weichen ab.';
  return null;
}
const cell = v => v === null ? '<td class="null">NULL</td>' : `<td class="${typeof v === 'number' ? 'n' : ''}">${esc(typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v)}</td>`;
const tableHTML = r => r.columns.length ? `<div class="scroll"><table class="rt"><thead><tr>${r.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${r.values.slice(0, 500).map(row => `<tr>${row.map(cell).join('')}</tr>`).join('')}</tbody></table></div>` : '';
function renderOut() {
  const box = $('con-out'); if (!box) return;
  box.innerHTML = (con.msg ? `<div class="msg ${con.msg.t}">${esc(con.msg.s)}</div>` : '') + (con.out && con.out.columns.length ? `<div class="res"><div class="res-head"><span><b>${con.out.values.length}</b> Tupel · ${con.out.columns.length} Attribut(e)</span></div>${tableHTML(con.out)}</div>` : '');
}
function renderSide() {
  const box = $('con-schema'); if (!box) return;
  box.innerHTML = con.inst ? DBS[con.db].tables.map(t => { let cols = []; try { const r = con.inst.exec(`PRAGMA table_info(${t})`); cols = r.length ? r[0].values.map(v => v[5] ? `<u>${esc(v[1])}</u>` : esc(v[1])) : []; } catch (e) {} return `<div class="rel"><button data-act="ins" data-k="${esc(t)}">${esc(t)}</button><div>${cols.join(', ')}</div></div>`; }).join('') : '<div class="rel"><span class="sp"></span> lädt …</div>';
  const h = $('con-hist'); if (h) h.innerHTML = S.hist.length ? S.hist.map((q, i) => `<button data-act="hist" data-k="${i}" title="${esc(q)}">${esc(q)}</button>`).join('') : '<span class="faint">Noch keine Anfragen.</span>';
}
async function resetDb() { await loadSQL(); con.inst = makeDb(con.db); renderSide(); }
function pushHist(q) { q = q.trim().replace(/\s+/g, ' '); if (!q) return; S.hist = [q].concat(S.hist.filter(x => x !== q)).slice(0, 15); save(); }
async function runSql() {
  const q = $('ed').value; con.text = q; if (!q.trim()) return;
  await loadSQL(); if (!con.inst) con.inst = makeDb(con.db);
  try { const r = con.inst.exec(q); con.out = r.length ? r[r.length - 1] : null; con.msg = r.length ? null : { t: 'info', s: 'Anweisung ausgeführt · ' + con.inst.getRowsModified() + ' Tupel geändert.' }; pushHist(q); }
  catch (e) { con.out = null; con.msg = { t: 'err', s: 'Fehler: ' + e.message }; }
  renderOut(); renderSide();
}
async function checkSql() {
  const t = TASKS[con.task]; if (!t) return;
  const q = $('ed').value; con.text = q;
  if (!q.trim()) { con.msg = { t: 'err', s: 'Schreib zuerst eine Anfrage.' }; renderOut(); return; }
  await loadSQL(); let exp, got;
  try { const d = makeDb(t.db); if (t.pre) d.exec(t.pre); if (t.verify) { d.exec(t.sql); exp = lastResult(d, t.verify); } else exp = lastResult(d, t.alt || t.sql); d.close(); } catch (e) { con.msg = { t: 'err', s: 'Interner Fehler: ' + e.message }; renderOut(); return; }
  try { const d = makeDb(t.db); if (t.pre) d.exec(t.pre); if (t.verify) { d.exec(q); got = lastResult(d, t.verify); } else got = lastResult(d, q); d.close(); } catch (e) { con.out = null; con.msg = { t: 'err', s: 'Fehler in deiner Anweisung: ' + e.message }; renderOut(); return; }
  pushHist(q); con.out = got;
  const diff = compare(exp, got, t.ordered);
  const what = t.kind === 'ddl' ? 'Die Struktur (Attribute, Pflichtfelder, Schlüssel, Fremdschlüssel)' : t.kind === 'dml' ? 'Der Datenbankzustand nach deinen Anweisungen' : 'Dein Ergebnis';
  if (!diff) { S.solved[con.task] = true; markActive(); con.msg = { t: 'ok', s: 'Richtig! ' + what + ' stimmt mit der Musterlösung überein' + (t.ordered ? ' – inklusive Sortierung.' : '.') + (t.verify ? '\nUnten siehst du den geprüften Zustand.' : '') }; }
  else con.msg = { t: 'err', s: 'Noch nicht: ' + (t.verify ? what + ' weicht ab. ' : '') + diff };
  renderOut(); renderSide();
}

/* ================= Bausteine ================= */
const tog = (k, a, b) => `<button class="btn sm ${shown[k] ? 'on' : ''}" data-act="show" data-k="${esc(k)}" aria-pressed="${!!shown[k]}">${esc(shown[k] ? b : a)}</button>`;
function exCard(o) {
  const done = !!S.checks[o.key] || !!(o.task && S.solved[o.task]);
  let h = `<div class="ex ${done ? 'done' : ''}"><div class="ex-top"><div class="ex-title">${done ? `<span class="okdot">${ICON.check}</span>` : ''}${esc(o.titel)}${o.paper ? ' <span class="tag">auf Papier</span>' : ''}</div><div class="row">`;
  if (o.task) h += `<button class="btn sm pri" data-act="toConsole" data-k="${esc(o.task)}">In Konsole üben</button>`;
  if (o.tipp) h += tog('h:' + o.key, 'Denkanstoß', 'Denkanstoß zu');
  h += tog('s:' + o.key, 'Lösung', 'Lösung zu');
  h += `<label class="cb"><input type="checkbox" data-act="tick" data-k="${esc(o.key)}" ${done ? 'checked' : ''}> gelöst</label></div></div><div class="pre-line">${esc(o.aufgabe)}</div>`;
  if (o.tipp && shown['h:' + o.key]) h += `<div class="tip"><b>Denkanstoß</b> ${esc(o.tipp)}</div>`;
  if (shown['s:' + o.key]) h += `<div class="sol">${esc(o.loesung)}</div>`;
  return h + '</div>';
}
const gallery = ids => `<div class="imgs">${ids.map(id => `<button data-act="lb" data-k="${id}" data-l="${esc(slideLabel(id))}"><img src="slides/${id}.png" alt="${esc(slideLabel(id))}" loading="lazy"><span>${esc(slideLabel(id))}</span></button>`).join('')}</div>`;
function slideLabel(id) { for (const l of LECTURES) for (const im of (l.images || [])) if (im.id === id) return im.l; return id; }
const back = (to, label) => `<a class="back" href="#${to}">‹ ${esc(label)}</a>`;

/* ================= Labor: Join ================= */
const JDS = {
  lr: { name: 'L und R (Folie)', L: { n: 'L', c: ['A', 'B', 'C'], r: [['a1', 'b1', 'c1'], ['a2', 'b2', 'c2']] }, R: { n: 'R', c: ['C', 'D', 'E'], r: [['c1', 'd1', 'e1'], ['c3', 'd2', 'e2']] }, on: [2, 0], onTxt: 'L.C = R.C' },
  pa: { name: 'Professoren & Assistenten', note: 'Ausschnitt der Uni-DB', L: { n: 'Professoren', c: ['PersNr', 'Name', 'Rang'], r: [[2125, 'Sokrates', 'C4'], [2126, 'Russel', 'C4'], [2136, 'Curie', 'C4']] }, R: { n: 'Assistenten', c: ['PersNr', 'Name', 'Boss'], r: [[3002, 'Platon', 2125], [3003, 'Aristoteles', 2125], [3004, 'Wittgenstein', 2126], [3005, 'Rhetikus', 2127]] }, on: [0, 2], onTxt: 'Professoren.PersNr = Assistenten.Boss' },
  sp: { name: 'Studenten & pruefen', note: 'Ausschnitt der Uni-DB', L: { n: 'Studenten', c: ['MatrNr', 'Name', 'Semester'], r: [[25403, 'Jonas', 12], [28106, 'Carnap', 3], [29120, 'Theophrastos', 2], [29555, 'Feuerbach', 2]] }, R: { n: 'pruefen', c: ['MatrNr', 'VorlNr', 'Note'], r: [[28106, 5001, 1], [25403, 5041, 2], [27550, 4630, 2]] }, on: [0, 0], onTxt: 'Studenten.MatrNr = pruefen.MatrNr' },
};
const JT = [
  ['cross', '×', 'Kreuzprodukt', 'CROSS JOIN', 'Jedes Tupel links mit jedem Tupel rechts: |L| · |R| Tupel.'],
  ['nat', '⋈', 'Natürlicher Join', 'NATURAL JOIN', 'Verbindet über ALLE gleichnamigen Attribute; jedes erscheint nur einmal.'],
  ['inner', '⋈θ', 'Theta-Join', 'JOIN … ON', 'σθ(L × R): nur Paare, die die Bedingung erfüllen.'],
  ['left', '⟕', 'Linker äußerer', 'LEFT OUTER JOIN … ON', 'Alle Tupel links; ohne Partner wird rechts mit NULL aufgefüllt.'],
  ['right', '⟖', 'Rechter äußerer', 'RIGHT OUTER JOIN … ON', 'Alle Tupel rechts; ohne Partner wird links mit NULL aufgefüllt.'],
  ['full', '⟗', 'Voller äußerer', 'FULL OUTER JOIN … ON', 'Alle Tupel beider Seiten; fehlende Partner jeweils NULL.'],
  ['lsemi', '⋉', 'Linker Semi-Join', 'WHERE EXISTS (…)', 'Tupel links, die einen Partner haben – nur linke Attribute.'],
  ['rsemi', '⋊', 'Rechter Semi-Join', 'WHERE EXISTS (…)', 'Tupel rechts, die einen Partner haben – nur rechte Attribute.'],
];
let JL = { ds: 'pa', jt: 'left', guess: true, guessed: null, sel: null };
function joinCompute(ds, jt) {
  const { L, R, on } = ds; let cols = [], rows = [];
  const common = L.c.filter(c => R.c.includes(c));
  const match = jt === 'nat' ? (l, r) => common.length > 0 && common.every(c => l[L.c.indexOf(c)] === r[R.c.indexOf(c)]) : jt === 'cross' ? () => true : (l, r) => l[on[0]] === r[on[1]];
  const pairs = []; L.r.forEach((l, li) => R.r.forEach((r, ri) => { if (match(l, r)) pairs.push([li, ri]); }));
  const pre = (t, c) => (L.c.includes(c) && R.c.includes(c) ? t.n + '.' : '') + c;
  if (jt === 'lsemi') { cols = L.c; rows = L.r.map((l, li) => pairs.some(p => p[0] === li) ? { v: l, li, ri: null } : null).filter(Boolean); return { cols, rows, common }; }
  if (jt === 'rsemi') { cols = R.c; rows = R.r.map((r, ri) => pairs.some(p => p[1] === ri) ? { v: r, li: null, ri } : null).filter(Boolean); return { cols, rows, common }; }
  if (jt === 'nat') { const rc = R.c.filter(c => !common.includes(c)); cols = L.c.concat(rc); rows = pairs.map(([li, ri]) => ({ v: L.r[li].concat(rc.map(c => R.r[ri][R.c.indexOf(c)])), li, ri })); return { cols, rows, common }; }
  cols = L.c.map(c => pre(L, c)).concat(R.c.map(c => pre(R, c)));
  rows = pairs.map(([li, ri]) => ({ v: L.r[li].concat(R.r[ri]), li, ri }));
  if (jt === 'left' || jt === 'full') L.r.forEach((l, li) => { if (!pairs.some(p => p[0] === li)) rows.push({ v: l.concat(R.c.map(() => null)), li, ri: null }); });
  if (jt === 'right' || jt === 'full') R.r.forEach((r, ri) => { if (!pairs.some(p => p[1] === ri)) rows.push({ v: L.c.map(() => null).concat(r), li: null, ri }); });
  return { cols, rows, common };
}
const PAL = ['#3d5afe', '#ff7a1a', '#0e9f6e', '#e0115f', '#7c4dff'];
function relTable(t, side, hi) {
  return `<div class="vt"><div class="vt-name">${esc(t.n)}</div><div class="scroll"><table class="rt sm"><thead><tr><th></th>${t.c.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.r.map((r, i) => `<tr class="${hi(i) ? 'hi' : ''} ${JL.sel && JL.sel[0] === side && JL.sel[1] === i ? 'sel' : ''}" data-act="jsel" data-k="${side}:${i}"><td><span class="dot" style="background:${side === 'L' ? PAL[i % 5] : 'var(--faint)'}">${side === 'L' ? i + 1 : String.fromCharCode(97 + i)}</span></td>${r.map(cell).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function joinLab() {
  const ds = JDS[JL.ds], jt = JT.find(j => j[0] === JL.jt), res = joinCompute(ds, JL.jt);
  const n = res.rows.length, reveal = !JL.guess || JL.guessed !== null;
  const opts = shuffle([...new Set([n, n + 1, Math.max(0, n - 1), n + 2, ds.L.r.length * ds.R.r.length, ds.L.r.length])].slice(0, 4)).sort((a, b) => a - b);
  if (!opts.includes(n)) opts[0] = n;
  const sel = JL.sel;
  const hiL = i => sel && (sel[0] === 'L' ? sel[1] === i : sel[0] === 'O' ? res.rows[sel[1]] && res.rows[sel[1]].li === i : false);
  const hiR = i => sel && (sel[0] === 'R' ? sel[1] === i : sel[0] === 'O' ? res.rows[sel[1]] && res.rows[sel[1]].ri === i : false);
  const hiO = i => sel && (sel[0] === 'O' ? sel[1] === i : sel[0] === 'L' ? res.rows[i].li === sel[1] : res.rows[i].ri === sel[1]);
  let h = `<div class="lab"><div class="lab-ctl"><div class="seg" role="group" aria-label="Datensatz">${Object.entries(JDS).map(([k, d]) => `<button data-act="jds" data-k="${k}" aria-pressed="${JL.ds === k}">${esc(d.name)}</button>`).join('')}</div>
  <div class="chips-row">${JT.map(j => `<button class="opchip" data-act="jt" data-k="${j[0]}" aria-pressed="${JL.jt === j[0]}" title="${esc(j[2])}"><b>${esc(j[1])}</b><span>${esc(j[2])}</span></button>`).join('')}</div>
  <label class="cb"><input type="checkbox" data-act="jguess" ${JL.guess ? 'checked' : ''}> Erst raten, dann Ergebnis zeigen</label></div>
  <div class="formula"><span class="sym">${esc(ds.L.n)} ${esc(jt[1])} ${esc(ds.R.n)}</span>${JL.jt === 'cross' || JL.jt === 'nat' ? '' : `<span class="on">mit ${esc(ds.onTxt)}</span>`}<span class="sqlh">SQL: ${esc(jt[3])}</span></div>
  <p class="hint">${esc(jt[4])}${JL.jt === 'nat' ? ` Gemeinsame Attribute hier: ${res.common.length ? res.common.map(esc).join(', ') : 'keine'}.` : ''}${ds.note ? ' · ' + esc(ds.note) : ''}</p>
  <div class="vgrid">${relTable(ds.L, 'L', hiL)}${relTable(ds.R, 'R', hiR)}</div>`;
  if (!reveal) {
    h += `<div class="guess"><div class="q-big">Wie viele Tupel hat das Ergebnis?</div><div class="row">${opts.map(o => `<button class="btn big" data-act="jg" data-k="${o}">${o}</button>`).join('')}</div></div>`;
  } else {
    const right = JL.guessed === null || JL.guessed === n;
    if (JL.guess && JL.guessed !== null) h += `<div class="msg ${right ? 'ok' : 'err'}">${right ? 'Richtig geraten!' : `Nicht ganz – es sind ${n} Tupel.`}</div>`;
    h += `<div class="vt res-t"><div class="vt-name">Ergebnis · ${n} Tupel <span class="faint">– Tupel antippen zeigt die Herkunft</span></div><div class="scroll"><table class="rt sm"><thead><tr><th></th>${res.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${res.rows.length ? res.rows.map((r, i) => `<tr class="${hiO(i) ? 'hi' : ''}" data-act="jsel" data-k="O:${i}"><td>${r.li !== null ? `<span class="dot" style="background:${PAL[r.li % 5]}">${r.li + 1}</span>` : ''}${r.ri !== null ? `<span class="dot" style="background:var(--faint)">${String.fromCharCode(97 + r.ri)}</span>` : ''}</td>${r.v.map(cell).join('')}</tr>`).join('') : `<tr><td colspan="${res.cols.length + 1}" class="faint">leere Menge</td></tr>`}</tbody></table></div></div>`;
    if (JL.jt === 'nat' && JL.ds === 'pa') h += `<div class="tip"><b>Falle!</b> Professoren und Assistenten haben PersNr UND Name gemeinsam. Der natürliche Join verlangt, dass beide gleich sind – das trifft nie zu. Für „Professor mit Assistenten“ braucht man JOIN … ON PersNr = Boss.</div>`;
  }
  return h + '</div>';
}

/* ================= Labor: Algebra ================= */
const STU = [[24002, 'Xenokrates', 18], [25403, 'Jonas', 12], [26120, 'Fichte', 10], [26830, 'Aristoxenos', 8], [27550, 'Schopenhauer', 6], [28106, 'Carnap', 3], [29120, 'Theophrastos', 2], [29555, 'Feuerbach', 2]];
const PROF = [[2125, 'Sokrates', 'C4', 226], [2126, 'Russel', 'C4', 232], [2127, 'Kopernikus', 'C3', 310], [2133, 'Popper', 'C3', 52], [2134, 'Augustinus', 'C3', 309], [2136, 'Curie', 'C4', 36], [2137, 'Kant', 'C4', 7]];
const VORL = [[5001, 'Grundzüge', 4, 2137], [5041, 'Ethik', 4, 2125], [5043, 'Erkenntnistheorie', 3, 2126], [5049, 'Mäeutik', 2, 2125], [4052, 'Logik', 4, 2125], [5052, 'Wissenschaftstheorie', 3, 2126], [5216, 'Bioethik', 2, 2126], [5259, 'Der Wiener Kreis', 2, 2133], [5022, 'Glaube und Wissen', 2, 2134], [4630, 'Die 3 Kritiken', 4, 2137]];
const HOER = [[26120, 5001], [27550, 5001], [27550, 4052], [28106, 5041], [28106, 5052], [28106, 5216], [28106, 5259], [29120, 5001], [29120, 5041], [29120, 5049], [29555, 5022], [25403, 5022], [29555, 5001]];
let AL = { op: 'sel' };
const setA = [26830, 27550, 28106, 29120, 29555], setB = [25403, 26120, 27550, 28106, 29120, 29555];
const chipsSet = (arr, mark) => `<div class="setchips">${arr.map(v => `<span class="sc ${mark && mark(v) ? 'm' : ''}">${v}</span>`).join('') || '<span class="faint">∅ leere Menge</span>'}</div>`;
function simpleT(name, cols, rows, rowCls, colHi) { return `<div class="vt"><div class="vt-name">${esc(name)}</div><div class="scroll"><table class="rt sm"><thead><tr>${cols.map((c, i) => `<th class="${colHi && colHi(i) ? 'colhi' : ''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr class="${rowCls ? rowCls(r, i) : ''}">${r.map((v, j) => cell(v).replace('<td', `<td data-c="${colHi && colHi(j) ? 1 : 0}"`)).join('')}</tr>`).join('')}</tbody></table></div></div>`; }
const ALOPS = [
  ['sel', 'σ', 'Selektion'], ['proj', 'π', 'Projektion'], ['ren', 'ρ', 'Umbenennung'], ['uni', '∪', 'Vereinigung'], ['int', '∩', 'Durchschnitt'], ['dif', '−', 'Differenz'], ['div', '÷', 'Division'],
];
function algebraLab() {
  let h = `<div class="lab"><div class="chips-row">${ALOPS.map(o => `<button class="opchip" data-act="aop" data-k="${o[0]}" aria-pressed="${AL.op === o[0]}"><b>${o[1]}</b><span>${o[2]}</span></button>`).join('')}</div>`;
  const A = 'A = π MatrNr(σ Semester<10 (Studenten))', B = 'B = π MatrNr(hören)';
  if (AL.op === 'sel') h += `<div class="formula"><span class="sym">σ Semester &lt; 5 (Studenten)</span><span class="sqlh">SQL: SELECT * FROM Studenten WHERE Semester &lt; 5</span></div><p class="hint">Die Selektion prüft jedes Tupel einzeln. Markiert = Bedingung TRUE, bleibt im Ergebnis. Die Attribute ändern sich nicht.</p>${simpleT('Studenten → 3 von 8 Tupeln bleiben', ['MatrNr', 'Name', 'Semester'], STU, r => r[2] < 5 ? 'hi' : 'out')}`;
  if (AL.op === 'proj') { const ranks = [...new Set(PROF.map(r => r[2]))]; h += `<div class="formula"><span class="sym">π Rang (Professoren)</span><span class="sqlh">SQL: SELECT DISTINCT Rang FROM Professoren</span></div><p class="hint">Die Projektion schneidet Attribute heraus. Weil eine Relation eine MENGE ist, fallen doppelte Tupel weg: aus 7 werden 2.</p><div class="vgrid">${simpleT('Professoren', ['PersNr', 'Name', 'Rang', 'Raum'], PROF, null, i => i === 2)}${simpleT('Ergebnis · ' + ranks.length + ' Tupel', ['Rang'], ranks.map(r => [r]), () => 'hi')}</div>`; }
  if (AL.op === 'ren') h += `<div class="formula"><span class="sym">ρ PersNr←gelesenVon (Vorlesungen)</span><span class="sqlh">SQL: SELECT VorlNr, Titel, SWS, gelesenVon AS PersNr FROM Vorlesungen</span></div><p class="hint">Die Umbenennung ändert nur den Namen, nicht die Tupel. Typischer Einsatz: Schemagleichheit für ∪, ∩, − herstellen oder eine Relation zweimal verwenden (ρ V1, ρ V2).</p>${simpleT('Ergebnis', ['VorlNr', 'Titel', 'SWS', 'PersNr ← gelesenVon'], VORL.slice(0, 5), null, i => i === 3)}<p class="faint">… 5 weitere Tupel</p>`;
  if (['uni', 'int', 'dif'].includes(AL.op)) {
    const res = AL.op === 'uni' ? [...new Set(setA.concat(setB))].sort() : AL.op === 'int' ? setA.filter(v => setB.includes(v)) : setA.filter(v => !setB.includes(v));
    const sym = { uni: 'A ∪ B', int: 'A ∩ B', dif: 'A − B' }[AL.op], sq = { uni: 'UNION', int: 'INTERSECT', dif: 'EXCEPT (Oracle 19c: MINUS)' }[AL.op];
    h += `<div class="formula"><span class="sym">${sym}</span><span class="sqlh">SQL: … ${sq} …</span></div><p class="hint">Beide Seiten haben dasselbe Schema (nur MatrNr) – Voraussetzung für Mengenoperationen. ${AL.op === 'dif' ? 'Achtung: A − B ≠ B − A (hier B − A = {25403, 26120}).' : AL.op === 'int' ? 'R ∩ S = R − (R − S).' : 'Doppelte Werte erscheinen nur einmal.'}</p><div class="sets"><div><div class="vt-name">${esc(A)} · Studenten unter 10 Semestern</div>${chipsSet(setA, v => res.includes(v))}</div><div><div class="vt-name">${esc(B)} · Studenten, die hören</div>${chipsSet(setB, v => res.includes(v))}</div><div class="setres"><div class="vt-name">${sym} · ${res.length} Tupel</div>${chipsSet(res, () => true)}</div></div>`;
  }
  if (AL.op === 'div') {
    const div = [5001, 5022], studs = [...new Set(HOER.map(r => r[0]))];
    h += `<div class="formula"><span class="sym">hören ÷ π VorlNr (σ Titel='Grundzüge' ∨ Titel='Glaube und Wissen' (Vorlesungen))</span><span class="sqlh">SQL: doppeltes NOT EXISTS</span></div><p class="hint">Divisor = {5001, 5022}. Ein Student kommt ins Ergebnis, wenn er MIT JEDEM Tupel des Divisors in hören vorkommt.</p><div class="scroll"><table class="rt sm divt"><thead><tr><th>MatrNr</th>${div.map(d => `<th>hört ${d}?</th>`).join('')}<th>alle?</th></tr></thead><tbody>${studs.map(s => { const ok = div.map(d => HOER.some(r => r[0] === s && r[1] === d)); const all = ok.every(Boolean); return `<tr class="${all ? 'hi' : ''}"><td class="n">${s}</td>${ok.map(o => `<td class="${o ? 'yes' : 'no'}">${o ? 'ja' : 'nein'}</td>`).join('')}<td class="${all ? 'yes' : 'no'}"><b>${all ? 'ja → Ergebnis' : 'nein'}</b></td></tr>`; }).join('')}</tbody></table></div><div class="msg ok">Ergebnis: {29555} – Feuerbach. Bei Divisor = alle 4-SWS-Vorlesungen wäre es leer (niemand hört 4630).</div>`;
  }
  return h + '</div>';
}

/* ================= Labor: GROUP BY Schritt für Schritt ================= */
let GB = 0;
function groupLab() {
  const cross = []; VORL.forEach(v => PROF.forEach(p => cross.push(v.concat(p))));
  const cols = ['VorlNr', 'Titel', 'SWS', 'gelesenVon', 'PersNr', 'Name', 'Rang', 'Raum'];
  const where = cross.filter(r => r[3] === r[4] && r[6] === 'C4').sort((a, b) => a[3] - b[3] || a[0] - b[0]);
  const groups = {}; where.forEach(r => (groups[r[3]] = groups[r[3]] || []).push(r));
  const gk = Object.keys(groups), gcol = k => PAL[gk.indexOf(k) % 5];
  const avg = k => groups[k].reduce((a, r) => a + r[2], 0) / groups[k].length, sum = k => groups[k].reduce((a, r) => a + r[2], 0);
  const steps = [
    ['FROM', 'Kreuzprodukt Vorlesungen × Professoren', `10 · 7 = ${cross.length} Tupel. Jede Vorlesung mit jedem Professor – das meiste davon ist Unsinn, die WHERE-Bedingung sortiert es aus.`, () => simpleT(`Vorlesungen × Professoren · ${cross.length} Tupel (erste 9)`, cols, cross.slice(0, 9), r => r[3] === r[4] && r[6] === 'C4' ? 'hi' : '') + '<p class="faint">… 61 weitere Tupel. Markiert: Tupel, die WHERE überstehen.</p>'],
    ['WHERE', "gelesenVon = PersNr AND Rang = 'C4'", `Nur zusammengehörige Paare von C4-Professoren bleiben: ${where.length} Tupel.`, () => simpleT(`nach WHERE · ${where.length} Tupel`, cols, where)],
    ['GROUP BY', 'gelesenVon, Name', `Tupel mit gleichem gelesenVon und Name bilden eine Gruppe: ${gk.length} Gruppen.`, () => simpleT('Gruppen', cols, where, r => 'g' + gk.indexOf(String(r[3])))],
    ['HAVING', 'avg(SWS) >= 3', 'Pro Gruppe wird der Durchschnitt berechnet. Gruppen, die die Bedingung nicht erfüllen, fallen komplett weg.', () => `<div class="groups">${gk.map(k => { const a = avg(k), ok = a >= 3; return `<div class="grp ${ok ? '' : 'out'}" style="--g:${gcol(k)}"><div class="grp-h"><b>${esc(groups[k][0][5])}</b> (${k})</div><div class="faint">SWS: ${groups[k].map(r => r[2]).join(' + ')}</div><div>avg = ${a.toFixed(2).replace('.', ',')} → ${ok ? '<b class="good">bleibt</b>' : '<b class="bad">fällt weg</b>'}</div></div>`; }).join('')}</div>`],
    ['SELECT', 'gelesenVon, Name, sum(SWS)', 'Pro übrig gebliebener Gruppe genau ein Ergebnistupel mit der Summe.', () => simpleT('Ergebnis · 2 Tupel', ['gelesenVon', 'Name', 'sum(SWS)'], gk.filter(k => avg(k) >= 3).map(k => [+k, groups[k][0][5], sum(k)]), () => 'hi')],
  ];
  const st = steps[GB];
  return `<div class="lab"><div class="codebox">SELECT gelesenVon, Name, sum(SWS)\nFROM Vorlesungen, Professoren\nWHERE gelesenVon = PersNr AND Rang = 'C4'\nGROUP BY gelesenVon, Name\nHAVING avg(SWS) >= 3;</div>
  <div class="stepper">${steps.map((s, i) => `<button data-act="gb" data-k="${i}" aria-pressed="${GB === i}" class="${i < GB ? 'past' : ''}"><b>${i + 1}</b> ${esc(s[0])}</button>`).join('')}</div>
  <div class="step-card"><div class="step-h"><span class="kw">${esc(st[0])}</span> <code>${esc(st[1])}</code></div><p>${esc(st[2])}</p>${st[3]()}</div>
  <div class="row between"><button class="btn" data-act="gb" data-k="${Math.max(0, GB - 1)}" ${GB === 0 ? 'disabled' : ''}>‹ Zurück</button><button class="btn pri" data-act="gb" data-k="${Math.min(4, GB + 1)}" ${GB === 4 ? 'disabled' : ''}>Nächster Schritt ›</button></div></div>`;
}

/* ================= Labor: NULL-Logik ================= */
const TV = ['TRUE', 'NULL', 'FALSE'];
const AND = (a, b) => a === 'FALSE' || b === 'FALSE' ? 'FALSE' : a === 'NULL' || b === 'NULL' ? 'NULL' : 'TRUE';
const OR = (a, b) => a === 'TRUE' || b === 'TRUE' ? 'TRUE' : a === 'NULL' || b === 'NULL' ? 'NULL' : 'FALSE';
const NOT = a => a === 'TRUE' ? 'FALSE' : a === 'FALSE' ? 'TRUE' : 'NULL';
let NL = { in: {}, checked: false, ex: 0, exAns: null, ord: { AND: [TV, TV], OR: [TV, TV], NOT: [TV, [null]] } };
const shuffleTT = n => { NL.ord[n] = [shuffle(TV), n === 'NOT' ? [null] : shuffle(TV)]; Object.keys(NL.in).forEach(k => { if (k.startsWith(n)) delete NL.in[k]; }); NL.checked = false; };
const NEXPR = [
  ['Semester = NULL (Semester ist NULL)', 'NULL', 'Vergleich mit NULL ergibt immer NULL – auch wenn beide NULL sind.'],
  ['Semester < 13 OR Semester >= 13 (Semester ist NULL)', 'NULL', 'NULL OR NULL = NULL → das Tupel fällt im WHERE heraus.'],
  ["Semester > 20 AND Name = 'Platon' (Semester NULL, Name 'Kant')", 'FALSE', 'NULL AND FALSE = FALSE.'],
  ['Semester IS NULL OR Semester > 20 (Semester NULL)', 'TRUE', 'IS NULL liefert TRUE → TRUE OR … = TRUE.'],
  ['NOT (Semester = 5) (Semester NULL)', 'NULL', 'NOT NULL = NULL.'],
  ["CITY <> 'London' (CITY NULL)", 'NULL', 'Deshalb zählt S6 bei „sicher nicht in London“ nicht mit.'],
  ["'Rome' NOT IN ('London', 'Paris', NULL)", 'NULL', "= 'Rome'<>'London' AND 'Rome'<>'Paris' AND 'Rome'<>NULL = TRUE AND TRUE AND NULL = NULL."],
  ["'Paris' NOT IN ('London', 'Paris', NULL)", 'FALSE', "'Paris' <> 'Paris' ist FALSE → AND ergibt FALSE."],
  ["'Rome' IN ('London', 'Paris', NULL)", 'NULL', 'IN = OR-Kette: FALSE OR FALSE OR NULL = NULL.'],
  ['SWS BETWEEN 1 AND 8 (SWS NULL) – als CHECK', 'NULL', 'Ein CHECK mit Ergebnis NULL gilt als erfüllt → Einfügen erlaubt.'],
  ['(NULL + 3) > 2', 'NULL', 'NULL + 3 = NULL, Vergleich mit NULL = NULL.'],
  ["COALESCE(Semester, 0) = 0 (Semester NULL)", 'TRUE', 'COALESCE ersetzt NULL durch 0.'],
];
function nullLab() {
  const tbl = (name, f) => `<div class="tt"><div class="row between"><span class="vt-name">${name}</span><button class="btn sm" data-act="ttmix" data-k="${name}">Mischen</button></div><table class="rt sm ttab"><thead><tr><th>${name === 'NOT' ? 'a' : 'a \\ b'}</th>${name === 'NOT' ? '<th>NOT a</th>' : NL.ord[name][1].map(v => `<th>${v}</th>`).join('')}</tr></thead><tbody>${NL.ord[name][0].map(a => `<tr><th>${a}</th>${NL.ord[name][1].map(b => { const k = name + a + (b || ''), val = NL.in[k], corr = name === 'NOT' ? NOT(a) : f(a, b); const cls = NL.checked ? (val === corr ? 'yes' : 'no') : ''; return `<td><button class="tv ${cls}" data-act="tv" data-k="${k}">${val || '?'}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  const ex = NEXPR[NL.ex];
  return `<div class="lab"><p class="hint">Tippe auf ein Feld, um TRUE → NULL → FALSE durchzuschalten. Dann „Prüfen“.</p><div class="ttgrid">${tbl('AND', AND)}${tbl('OR', OR)}${tbl('NOT')}</div><div class="row"><button class="btn pri" data-act="tvcheck">Prüfen</button><button class="btn" data-act="ttmix" data-k="all">Alle mischen</button><button class="btn" data-act="tvreset">Zurücksetzen</button>${NL.checked ? `<span class="msg-inline">${Object.keys(NL.in).length < 21 ? 'Fülle alle 21 Felder aus.' : ''}</span>` : ''}</div>
  <h3>Ausdruck-Trainer</h3><div class="qcard"><div class="q-meta">Ausdruck ${NL.ex + 1} / ${NEXPR.length}</div><div class="q-big mono">${esc(ex[0])}</div><div class="opts three">${TV.map(v => { const st = NL.exAns === null ? '' : v === ex[1] ? 'right' : v === NL.exAns ? 'wrong' : 'dim'; return `<button class="opt ${st}" data-act="nx" data-k="${v}" ${NL.exAns !== null ? 'disabled' : ''}>${v}</button>`; }).join('')}</div>${NL.exAns !== null ? `<div class="feedback ${NL.exAns === ex[1] ? 'good' : 'bad'}"><b>${NL.exAns === ex[1] ? 'Richtig!' : 'Leider falsch – richtig: ' + ex[1]}</b><span>${esc(ex[2])}</span><button class="btn pri" data-act="nxnext">Weiter ›</button></div>` : ''}</div></div>`;
}

/* ================= Puzzles ================= */
let PZ = null; // {id, pool, ans, checked, gaps, line}
function openPuzzle(id) {
  const p = PUZZLES.find(x => x.id === id);
  PZ = { id, checked: false, line: null, gaps: {}, ans: [], pool: p.k === 'order' ? shuffle(p.items.map((t, i) => i)) : [] };
  if (p.k === 'gap') PZ.opts = p.gaps.map(g => shuffle(g));
  if (p.k === 'order') { let tries = 0; while (PZ.pool.every((v, i) => v === i) && tries++ < 5) PZ.pool = shuffle(PZ.pool); }
  go('puzzles');
}
function puzzleView() {
  const p = PUZZLES.find(x => x.id === PZ.id), idx = PUZZLES.indexOf(p);
  let h = `<div class="focus"><a class="back" href="#puzzles" data-act="pzclose">‹ Alle Puzzles</a><div class="qcard"><div class="q-meta">${esc({ order: 'Reihenfolge', gap: 'Lückentext', bug: 'Fehler finden' }[p.k])} · ${esc(MOD[p.m].t)}</div><div class="q-big">${esc(p.t)}</div><p>${esc(p.q)}</p>`;
  let solved = false;
  if (p.k === 'order') {
    const correct = PZ.ans.length === p.items.length && PZ.ans.every((v, i) => v === i);
    solved = PZ.checked && correct;
    h += `<div class="olist">${PZ.ans.map((v, i) => `<button class="oitem ${PZ.checked ? (v === i ? 'right' : 'wrong') : ''}" data-act="pzback" data-k="${i}"><span class="onum">${i + 1}</span><code>${esc(p.items[v])}</code></button>`).join('')}${PZ.ans.length < p.items.length ? `<div class="oslot">Tippe unten das ${PZ.ans.length + 1}. Element an</div>` : ''}</div><div class="opool">${PZ.pool.map(v => `<button class="pchip" data-act="pzadd" data-k="${v}"><code>${esc(p.items[v])}</code></button>`).join('')}</div>`;
    h += `<div class="row"><button class="btn pri" data-act="pzcheck" ${PZ.ans.length < p.items.length ? 'disabled' : ''}>Prüfen</button><button class="btn" data-act="pzreset">Neu mischen</button></div>`;
  }
  if (p.k === 'gap') {
    let code = esc(p.code);
    p.gaps.forEach((g, gi) => { const v = PZ.gaps[gi], cls = PZ.checked ? (v === g[0] ? 'right' : 'wrong') : ''; code = code.replace(`___${gi + 1}___`, `<select class="gap ${cls}" data-act="gap" data-k="${gi}" aria-label="Lücke ${gi + 1}"><option value="">Lücke ${gi + 1}</option>${PZ.opts[gi].map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`); });
    solved = PZ.checked && p.gaps.every((g, gi) => PZ.gaps[gi] === g[0]);
    h += `<pre class="codebox gapcode">${code}</pre><div class="row"><button class="btn pri" data-act="pzcheck">Prüfen</button></div>`;
  }
  if (p.k === 'bug') {
    solved = PZ.checked && p.ok.includes(PZ.line);
    h += `<div class="buglines">${p.lines.map((l, i) => `<button class="bl ${PZ.checked ? (p.ok.includes(i) ? 'right' : i === PZ.line ? 'wrong' : '') : ''}" data-act="bug" data-k="${i}" ${PZ.checked ? 'disabled' : ''}><span class="onum">${i + 1}</span><code>${esc(l)}</code></button>`).join('')}</div>`;
  }
  if (PZ.checked) h += `<div class="feedback ${solved ? 'good' : 'bad'}"><b>${solved ? 'Richtig gelöst!' : 'Noch nicht ganz.'}</b><span>${esc(p.e)}</span><div class="row">${!solved && p.k !== 'bug' ? '<button class="btn" data-act="pzretry">Nochmal versuchen</button>' : ''}${idx < PUZZLES.length - 1 ? `<button class="btn pri" data-act="pzopen" data-k="${PUZZLES[idx + 1].id}">Nächstes Puzzle ›</button>` : ''}</div></div>`;
  return h + '</div></div>';
}

/* ================= Lektionen ================= */
const LS = {};
function lessonHTML(mid) {
  const L = LESSONS[mid]; if (!L) return '';
  const i = Math.min(LS[mid] || 0, L.length - 1), st = L[i], m = MOD[mid], done = !!S.lessons[mid];
  return `<section class="lesson panel" id="lektion" style="--mc:${m.c}"><div class="row between"><h2>${ICON.book} Lektion</h2><span class="faint">${done ? '<span class="tag good">abgeschlossen</span> ' : ''}Schritt ${i + 1} von ${L.length}</span></div>
  <div class="ldots">${L.map((x, j) => `<button data-act="lstep" data-k="${mid}:${j}" aria-label="Schritt ${j + 1}: ${esc(x.t)}" aria-pressed="${j === i}" class="${j < i ? 'past' : ''}">${j + 1}</button>`).join('')}</div>
  <h3 class="ltitle">${esc(st.t)}</h3><div class="dia">${st.d()}</div><p class="lx">${esc(st.x)}</p>
  <div class="row between"><button class="btn" data-act="lstep" data-k="${mid}:${i - 1}" ${i === 0 ? 'disabled' : ''}>‹ Zurück</button>${i < L.length - 1 ? `<button class="btn pri" data-act="lstep" data-k="${mid}:${i + 1}">Weiter ›</button>` : `<button class="btn good" data-act="ldone" data-k="${mid}">${done ? 'Wiederholt ✓' : 'Lektion abschließen ✓'}</button>`}</div></section>`;
}

/* ================= Probeklausur ================= */
const EXAM_MIN = 45;
let KL = null;
let klTimer = null;
function startExam() {
  const qs = shuffle(QZ).slice(0, 6).map(q => ({ k: 'q', ...q, opts: shuffle(q.o.map((t, j) => ({ t, ok: j === 0 }))) }));
  const pickAlg = m => shuffle(ALG.filter(a => a.m === m && /-K\d/.test(a.t)))[0] || shuffle(ALG.filter(a => (a.m || 'algebra') === m))[0];
  const ra = pickAlg('algebra'), tk = pickAlg('kalkuel');
  const dbn = { uni: 'Uni-DB', spj: 'SPJ-DB', fam: 'Familienbaum' };
  const sq = shuffle(DRILL.filter(d => d.lv === 4 && !d.kind)).slice(0, 2);
  const dm = shuffle(DRILL.filter(d => d.lv === 4 && d.kind).map(d => ({ titel: (d.kind === 'ddl' ? 'DDL' : 'DML') + ' · ' + dbn[d.db], text: d.t, loesung: TASKS['D-' + d.id].loesung, task: 'D-' + d.id })).concat(ALG.filter(a => a.m === 'dml').map(a => ({ titel: a.t.replace(/^[A-Z]+-K\d+ · /, 'DML/DDL · '), text: a.a, loesung: a.l }))))[0];
  const tasks = [{ k: 't', titel: 'Relationale Algebra', text: ra.a, loesung: ra.l }, { k: 't', titel: 'Tupelkalkül', text: tk.a, loesung: tk.l }].concat(sq.map(d => ({ k: 't', titel: 'SQL · ' + dbn[d.db], text: d.t, loesung: TASKS['D-' + d.id].loesung, task: 'D-' + d.id })), [{ k: 't', ...dm }]);
  KL = { end: Date.now() + EXAM_MIN * 6e4, items: qs.concat(tasks), ans: {}, notes: {}, grade: {}, done: false };
  go('klausur'); tickExam();
}
function tickExam() {
  clearInterval(klTimer);
  klTimer = setInterval(() => {
    if (!KL || KL.done) { clearInterval(klTimer); return; }
    const ms = KL.end - Date.now(), el = $('kl-timer');
    if (ms <= 0) { submitExam(); return; }
    if (el) { el.textContent = Math.floor(ms / 6e4) + ':' + String(Math.floor(ms % 6e4 / 1e3)).padStart(2, '0'); el.classList.toggle('bad', ms < 5 * 6e4); }
  }, 1000);
}
function submitExam() { if (!KL || KL.done) return; KL.done = true; clearInterval(klTimer); markActive(); if (route() === 'klausur') keep(); }
function examScore() {
  let q = 0, t = 0; KL.items.forEach((it, i) => { if (it.k === 'q' && KL.ans[i] !== undefined && it.opts[KL.ans[i]].ok) q++; if (it.k === 't') t += KL.grade[i] || 0; });
  const max = KL.items.filter(i => i.k === 'q').length + KL.items.filter(i => i.k === 't').length * 4; return { q, t, max, pct: Math.round((q + t) / max * 100) };
}
function examView() {
  if (!KL) return `<section><h1>Probeklausur</h1><p class="faint">${EXAM_MIN} Minuten · 26 Punkte. Gewichtet nach der Info vom Prof (relationales Modell, Algebra, Tupelkalkül, SQL > 80 %): je 1 Aufgabe Algebra, Tupelkalkül und DML/DDL plus 2 SQL-Anfragen auf Klausurniveau (je 4 Punkte, selbst bewertet) und 6 Theoriefragen (je 1 Punkt). Feedback erst nach der Abgabe. Aufgabenformat ist eine Annahme, solange das echte Format offen ist.</p></section><button class="hero-btn" data-act="exam">${ICON.exam}<span><b>Probeklausur starten</b><span>Timer läuft sofort los</span></span></button>${S.exams.length ? `<section class="panel"><h2>Bisherige Versuche</h2>${S.exams.slice(-8).reverse().map(x => `<div class="row between exrow"><span>${esc(new Date(x.d).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span><b>${x.pct} %</b></div>`).join('')}</section>` : ''}`;
  const sc = KL.done ? examScore() : null;
  let h = `<div class="focus wide"><div class="examhead"><b>Probeklausur</b>${KL.done ? `<span class="tag good">abgegeben · ${sc.q + sc.t} / ${sc.max} Punkte (${sc.pct} %)</span>` : `<span class="timer" id="kl-timer">${EXAM_MIN}:00</span><button class="btn sm pri" data-act="examsubmit">Abgeben</button>`}</div>`;
  KL.items.forEach((it, i) => {
    if (it.k === 'q') {
      h += `<div class="qcard"><div class="q-meta">Aufgabe ${i + 1} · Theorie · 1 Punkt · ${esc(MOD[it.m].t)}</div><div class="q-big sm">${esc(it.q)}</div><div class="opts">${it.opts.map((o, k) => { const sel = KL.ans[i] === k; const st = !KL.done ? (sel ? 'chosen' : '') : o.ok ? 'right' : sel ? 'wrong' : 'dim'; return `<button class="opt ${st}" data-act="exans" data-k="${i}:${k}" ${KL.done ? 'disabled' : ''}><span class="ok-l">${'ABCD'[k]}</span><span>${esc(o.t)}</span></button>`; }).join('')}</div>${KL.done ? `<div class="faint">${esc(it.e)}</div>` : ''}</div>`;
    } else {
      h += `<div class="qcard"><div class="q-meta">Aufgabe ${i + 1} · 4 Punkte · ${esc(it.titel)}</div><div class="q-big sm pre-line">${esc(it.text)}</div><textarea class="editor small-ed" data-act="exnote" data-k="${i}" placeholder="Hier oder auf Papier lösen …" ${KL.done ? 'readonly' : ''}>${esc(KL.notes[i] || '')}</textarea>`;
      if (KL.done) h += `<div class="sol">${esc(it.loesung)}</div><div class="row"><span class="faint">Selbst bewerten:</span>${[[0, '0 P.'], [2, '2 P.'], [4, '4 P.']].map(([v, l]) => `<button class="btn sm ${KL.grade[i] === v ? 'on' : ''}" data-act="exgrade" data-k="${i}:${v}">${l}</button>`).join('')}${it.task ? `<button class="btn sm" data-act="toConsole" data-k="${it.task}">In Konsole prüfen</button>` : ''}</div>`;
      h += '</div>';
    }
  });
  h += KL.done ? `<div class="row center"><button class="btn pri big" data-act="examsave">Ergebnis speichern</button><button class="btn big" data-act="exam">Neue Probeklausur</button></div>` : `<div class="row center"><button class="btn pri big" data-act="examsubmit">Abgeben</button></div>`;
  return h + '</div>';
}

/* ================= Lernpfad ================= */
function learnPath() {
  const steps = [];
  const wn = Object.keys(S.wrong).length;
  if (wn) steps.push([ICON.quiz, 'Fehlerliste wiederholen', `${wn} Quizfrage${wn === 1 ? '' : 'n'} zuletzt falsch`, 'quizmine', '']);
  const n = dueCards().length + Math.min(newLeft(), newCards().length);
  if (n) steps.push([ICON.cards, 'Karteikarten', `${n} Karten für heute`, 'cards', '']);
  const ml = MODULES.find(m => !S.lessons[m.id]);
  if (ml) steps.push([ICON.book, 'Lektion: ' + ml.t, `${LESSONS[ml.id].length} Schritte mit Grafiken`, 'lesson', ml.id]);
  const mq = MODULES.filter(m => S.lessons[m.id]).sort((a, b) => (S.quizBest[a.id] || 0) - (S.quizBest[b.id] || 0))[0];
  if (mq && (S.quizBest[mq.id] || 0) < 80) steps.push([ICON.quiz, 'Quiz: ' + mq.t, `Bestwert ${S.quizBest[mq.id] || 0} % – Ziel 80 %`, 'quiz', mq.id]);
  const d = DRILL.slice().sort((a, b) => b.lv - a.lv).find(x => !S.solved['D-' + x.id]);
  if (d) steps.push([ICON.term, d.lv === 4 ? 'Klausuraufgabe ' + d.id.toUpperCase() : 'SQL-Aufgabe · Level ' + d.lv, d.t.length > 70 ? d.t.slice(0, 68) + '…' : d.t, 'toConsole', 'D-' + d.id]);
  if (!S.exams.length && Object.keys(S.lessons).length >= 5) steps.push([ICON.exam, 'Probeklausur', `${EXAM_MIN} Minuten, gemischt`, 'exam', '']);
  return steps.slice(0, 4);
}

/* ================= Suche & RemNote-Export ================= */
let SQ = '';
const IDX = [];
MODULES.forEach(m => { m.kern.forEach(([t, d]) => IDX.push({ typ: 'Kernwissen', m: m.id, t, d, go: 'modul-' + m.id })); (LESSONS[m.id] || []).forEach((l, i) => IDX.push({ typ: 'Lektion', m: m.id, t: l.t, d: l.x, lesson: [m.id, i] })); });
ALLCARDS.forEach(c => IDX.push({ typ: 'Karte', m: c.m, t: c.f, d: c.b, go: 'modul-' + c.m }));
EXS.forEach(e => IDX.push({ typ: 'Aufgabe', m: e.m, t: e.titel, d: e.aufgabe, go: 'modul-' + e.m, task: e.task }));
QZ.forEach(q => IDX.push({ typ: 'Quiz', m: q.m, t: q.q, d: q.o[0] + ' – ' + q.e, go: 'modul-' + q.m }));
const norm2 = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function searchResults(q) {
  q = norm2(q.trim()); if (q.length < 2) return '<p class="faint">Mindestens 2 Zeichen eingeben – z. B. „MERGE“, „Division“, „NULL“, „Sicherheit“.</p>';
  const words = q.split(/\s+/), hits = IDX.filter(x => { const h = norm2(x.t + ' ' + x.d); return words.every(w => h.includes(w)); }).slice(0, 40);
  if (!hits.length) return '<p class="faint">Nichts gefunden.</p>';
  return `<p class="faint">${hits.length}${hits.length === 40 ? '+' : ''} Treffer</p>` + hits.map(x => `<div class="hit"><div class="row between"><span class="tag" style="color:${MOD[x.m].c}">${esc(x.typ)} · ${esc(MOD[x.m].t)}</span>${x.lesson ? `<button class="btn sm" data-act="lessonAt" data-k="${x.lesson[0]}:${x.lesson[1]}">Lektion öffnen</button>` : x.task ? `<button class="btn sm pri" data-act="toConsole" data-k="${esc(x.task)}">In Konsole</button>` : `<a class="btn sm" href="#${x.go}">Zum Modul</a>`}</div><b>${esc(x.t)}</b><p class="faint pre-line">${esc(x.d.length > 260 ? x.d.slice(0, 258) + '…' : x.d)}</p></div>`).join('');
}
function remnoteText(mid) {
  const one = s => String(s).replace(/\s*\n\s*/g, ' · ').replace(/==/g, '= =');
  const mods = mid ? [MOD[mid]] : MODULES;
  return mods.map(m => `${m.t}\n` + ALLCARDS.filter(c => c.m === m.id).map(c => `    ${one(c.f)} == ${one(c.b)}`).join('\n')).join('\n');
}

/* ================= Ansichten ================= */
const NAV = [['start', 'Start'], ['karten', 'Karteikarten'], ['quiz', 'Quiz'], ['labor', 'Labor'], ['puzzles', 'Puzzles'], ['konsole', 'Konsole'], ['praktika', 'Praktika'], ['klausur', 'Probeklausur'], ['mehr', 'Mehr']];
const BNAV = [['start', 'Start', 'home'], ['karten', 'Karten', 'cards'], ['quiz', 'Quiz', 'quiz'], ['labor', 'Labor', 'lab'], ['mehr', 'Mehr', 'more']];
function route() { const h = location.hash.slice(1); if (h.startsWith('modul-') && MOD[h.slice(6)]) return h; return NAV.some(n => n[0] === h) ? h : 'start'; }
function go(r) { if (location.hash.slice(1) === r) render(); else location.hash = r; window.scrollTo(0, 0); }
function renderNav() { const r = route(), base = r.startsWith('modul-') ? 'start' : r; $('nav').innerHTML = NAV.map(([id, l]) => `<a href="#${id}" ${base === id ? 'aria-current="page"' : ''}>${esc(l)}</a>`).join(''); const bb = ['puzzles', 'konsole', 'praktika', 'klausur'].includes(base) ? 'mehr' : base; $('bnav').innerHTML = BNAV.map(([id, l, ic]) => `<a href="#${id}" ${bb === id ? 'aria-current="page"' : ''}>${ICON[ic]}<span>${esc(l)}</span></a>`).join(''); }

function startView() {
  const due = dueCards().length, nl = Math.min(newLeft(), newCards().length), st = streak();
  const ms = new Date('2026-11-25T20:15:00+01:00') - new Date();
  const totalPct = Math.round(MODULES.reduce((a, m) => a + modProgress(m.id), 0) / MODULES.length);
  const wk = WEEKS.find((w, i) => { const a = new Date(w.start + 'T00:00:00'), b = WEEKS[i + 1] ? new Date(WEEKS[i + 1].start + 'T00:00:00') : new Date(a.getTime() + 7 * DAY); return new Date() >= a && new Date() < b; });
  let h = `<section class="hello"><div><div class="hi-small">${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>Hallo Sherif</h1><div class="pills"><span class="pill warm">${ICON.flame}<b>${st}</b> ${st === 1 ? 'Tag' : 'Tage'} Serie</span><span class="pill">${ring(totalPct, 'var(--pri)', 34, 4)} Gesamt</span>${ms > 0 ? `<span class="pill bad">Praktikum #6 · noch ${Math.floor(ms / 36e5)} h ${Math.floor(ms % 36e5 / 6e4)} min</span>` : ''}</div></div>
  <div class="today"><div class="today-n">${due + nl}</div><div><b>Karten für heute</b><div class="faint">${due} fällig · ${nl} neu</div></div><button class="btn pri big" data-act="cards" data-k="">Lernen starten ›</button></div></section>`;
  const path = learnPath();
  if (path.length) h += `<section class="panel"><div class="sh"><h2>Dein Lernpfad</h2><span class="faint">Vorschläge in sinnvoller Reihenfolge</span></div><div class="path">${path.map(([ic, t, s, a, k], i) => `<button class="pstep" data-act="${a}" data-k="${esc(k)}"><span class="pnum">${i + 1}</span><span class="qa-ic">${ic}</span><span><b>${esc(t)}</b><span>${esc(s)}</span></span><span class="parrow">›</span></button>`).join('')}</div></section>`;
  h += `<section class="quick">${[['quiz', 'Klausur-Mix', '15 Fragen aus allen Modulen', ICON.quiz, 'quizmix'], ['klausur', 'Probeklausur', `${EXAM_MIN} min · ${S.exams.length ? 'zuletzt ' + S.exams[S.exams.length - 1].pct + ' %' : 'noch nicht geschrieben'}`, ICON.exam, 'goto'], ['labor', 'Labor', 'Joins & GROUP BY sehen', ICON.lab, 'goto'], ['puzzles', 'SQL-Puzzles', `${Object.keys(S.puz).length}/${PUZZLES.length} gelöst`, ICON.puzzle, 'goto'], ['konsole', 'Konsole', `${Object.keys(S.solved).length}/${Object.keys(TASKS).length} Aufgaben richtig`, ICON.term, 'goto'], ['praktika', 'Praktika', 'Denkanstoß + Lösung', ICON.book, 'goto']].map(([r, t, s, ic, act]) => `<button class="qa" data-act="${act}" data-k="${r}"><span class="qa-ic">${ic}</span><span><b>${t}</b><span>${s}</span></span></button>`).join('')}</section>`;
  h += `<section><div class="sh"><h2>Module</h2><span class="faint">Prof: relationales Modell, Algebra, Tupelkalkül und SQL = über 80 % der Klausur</span></div><div class="tiles">${MODULES.map(m => `<a class="tile" href="#modul-${m.id}" style="--mc:${m.c}">${ring(modProgress(m.id), m.c)}${m.focus ? '<span class="tag focus">Klausur-Schwerpunkt</span>' : ''}<span class="tile-t">${esc(m.t)}</span><span class="tile-s">${esc(m.s)}</span></a>`).join('')}</div></section>`;
  h += `<section class="two"><div class="panel"><h2>Klausur-Top-10</h2><p class="faint">Das musst du sicher können (Annahme aus Folien und Praktika – Klausurformat noch offen).</p><ol class="top10">${TOP10.map(([t, m]) => `<li><a href="#modul-${m}">${esc(t)}</a></li>`).join('')}</ol></div>`;
  h += `<div class="panel"><h2>Diese Woche</h2>${wk ? `<div class="wk-h"><span class="mono">${esc(wk.kw)} · ${esc(wk.range)}</span><span class="tag">${esc(wk.phase)} · ${wk.h} h</span></div><div class="wk-f">${esc(wk.focus)}</div>${wk.items.map((t, i) => { const k = wk.id + ':' + i, c = !!S.checks[k]; return `<label class="cb line ${c ? 'done' : ''}"><input type="checkbox" data-act="tick" data-k="${k}" ${c ? 'checked' : ''}> <span>${esc(t)}</span></label>`; }).join('')}` : '<p class="faint">Kein Wocheneintrag.</p>'}<a class="link" href="#mehr">Ganzer Wochenplan ›</a></div></section>`;
  return h;
}

function moduleView(mid) {
  const m = MOD[mid], cs = ALLCARDS.filter(c => c.m === mid), qs = QZ.filter(q => q.m === mid), ps = PUZZLES.filter(p => p.m === mid), ex = EXS.filter(e => e.m === mid);
  const due = dueCards(mid).length, nw = newCards(mid).length;
  const labs = { kalkuel: [['algebra', 'Algebra-Labor (Division)']], dml: [], joins: [['join', 'Join-Labor']], algebra: [['algebra', 'Algebra-Labor'], ['join', 'Join-Labor']], agg: [['group', 'GROUP BY Schritt für Schritt']], null: [['null', 'NULL-Logik-Trainer']], sql: [['group', 'GROUP BY Schritt für Schritt']] }[mid] || [];
  let h = `${back('start', 'Start')}<section class="mhead" style="--mc:${m.c}">${ring(modProgress(mid), m.c, 84, 8)}<div><h1>${esc(m.t)}</h1><p class="faint">${esc(m.s)}</p></div></section>`;
  h += lessonHTML(mid);
  h += `<section class="actions">
    <button class="act" data-act="cards" data-k="${mid}" style="--mc:${m.c}">${ICON.cards}<b>Karteikarten</b><span>${cs.length} Karten · ${cs.filter(mastered).length} gemeistert${due + nw ? ` · ${due + nw} offen` : ''}</span></button>
    <button class="act" data-act="quiz" data-k="${mid}" style="--mc:${m.c}">${ICON.quiz}<b>Quiz</b><span>${qs.length} Fragen · Bestwert ${S.quizBest[mid] || 0} %</span></button>
    <button class="act" data-act="copyrem" data-k="${mid}" style="--mc:${m.c}">${ICON.book}<b>Nach RemNote kopieren</b><span>${cs.length} Karten als „Frage == Antwort“</span></button>
    ${labs.map(([k, t]) => `<button class="act" data-act="lab" data-k="${k}" style="--mc:${m.c}">${ICON.lab}<b>${esc(t)}</b><span>interaktiv ausprobieren</span></button>`).join('')}
  </section>`;
  h += `<section class="panel"><h2>Das Wichtigste</h2><div class="kern">${m.kern.map(([t, d], i) => `<div class="k"><span class="kn" style="background:${m.c}">${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('')}</div><div class="merke" style="--mc:${m.c}"><b>Merksatz</b> ${esc(m.merke)}</div></section>`;
  if (ps.length) h += `<section><div class="sh"><h2>Puzzles</h2></div><div class="plist">${ps.map(p => `<button class="pz ${S.puz[p.id] ? 'done' : ''}" data-act="pzopen" data-k="${p.id}"><span class="pz-k">${esc({ order: 'Reihenfolge', gap: 'Lücken', bug: 'Fehler finden' }[p.k])}</span><b>${esc(p.t)}</b>${S.puz[p.id] ? `<span class="okdot">${ICON.check}</span>` : ''}</button>`).join('')}</div></section>`;
  if (ex.length) h += `<section><div class="sh"><h2>Übungen${mid === 'algebra' ? ' & Algebra auf Papier' : ''}</h2><span class="faint">${ex.filter(e => S.checks[e.key] || (e.task && S.solved[e.task])).length}/${ex.length} gelöst</span></div><div class="stack">${ex.map(exCard).join('')}</div></section>`;
  h += `<section><div class="sh"><h2>Folien</h2><span class="faint">aus ${m.lec.map(l => 'VL #' + l.slice(1)).join(', ')}</span></div>${gallery(m.slides)}</section>`;
  return h;
}

function cardsView() {
  if (!FC) {
    return `<section><h1>Karteikarten</h1><p class="faint">Leitner-System: Was du weißt, kommt seltener (1, 3, 7, 14, 30 Tage), was du nicht weißt, sofort wieder. Bis zu ${NEW_PER_DAY} neue Karten pro Tag.</p><div class="today"><div class="today-n">${dueCards().length + Math.min(newLeft(), newCards().length)}</div><div><b>Heute dran</b><div class="faint">${dueCards().length} fällig · ${Math.min(newLeft(), newCards().length)} neu · ${ALLCARDS.filter(mastered).length}/${ALLCARDS.length} gemeistert</div></div><button class="btn pri big" data-act="cards" data-k="">Starten ›</button></div></section><section><div class="sh"><h2>Nach Modul</h2></div><div class="tiles">${MODULES.map(m => { const cs = ALLCARDS.filter(c => c.m === m.id); return `<button class="tile" data-act="cards" data-k="${m.id}" style="--mc:${m.c}">${ring(Math.round(cs.filter(mastered).length / cs.length * 100), m.c)}<span class="tile-t">${esc(m.t)}</span><span class="tile-s">${cs.length} Karten · ${dueCards(m.id).length + newCards(m.id).length} offen</span></button>`; }).join('')}</div></section>`;
  }
  if (FC.i >= FC.queue.length) {
    const t = FC.stats.good + FC.stats.hard + FC.stats.again;
    return `<div class="focus"><div class="qcard center"><div class="big-ic good">${ICON.check}</div><h1>Geschafft!</h1><p>${t} Bewertungen · ${FC.stats.good} gewusst · ${FC.stats.hard} schwer · ${FC.stats.again} nochmal</p><div class="row center"><button class="btn pri big" data-act="cardsEnd">Zur Übersicht</button>${FC.mid ? `<button class="btn big" data-act="cardsAll" data-k="${FC.mid}">Alle Karten des Moduls</button>` : ''}</div></div></div>`;
  }
  const c = FC.queue[FC.i], st = S.cards[c.id], m = MOD[c.m];
  return `<div class="focus"><div class="row between"><a class="back" href="#karten" data-act="cardsEnd">‹ Beenden</a><span class="faint">${FC.i + 1} / ${FC.queue.length}</span></div><div class="prog"><div style="width:${FC.i / FC.queue.length * 100}%"></div></div>
  <button class="flash ${FC.flipped ? 'flipped' : ''}" data-act="flip" aria-label="Karte umdrehen"><span class="flash-in"><span class="face front"><span class="q-meta" style="color:${m.c}">${esc(m.t)}${st ? ' · Stufe ' + st.b : ' · neu'}</span><span class="q-big">${esc(c.f)}</span><span class="faint">Antippen zum Umdrehen</span></span><span class="face backf"><span class="q-meta">Antwort</span><span class="ans">${esc(c.b)}</span></span></span></button>
  <p class="kbdhint">Tastatur: <span class="kbd">Leertaste</span> umdrehen · <span class="kbd">1</span> nochmal · <span class="kbd">2</span> schwer · <span class="kbd">3</span> gewusst</p>
  ${FC.flipped ? `<div class="rate"><button class="btn big bad" data-act="rate" data-k="again">Nochmal<small>gleich wieder</small></button><button class="btn big" data-act="rate" data-k="hard">Schwer<small>morgen</small></button><button class="btn big good" data-act="rate" data-k="good">Gewusst<small>${IV[Math.min(5, (st ? st.b : 0) + 1)]} Tag(e)</small></button></div>` : `<div class="rate"><button class="btn big pri wide" data-act="flip">Antwort zeigen</button></div>`}</div>`;
}

function quizView() {
  if (!QS) return `<section><h1>Quiz</h1><p class="faint">Multiple Choice mit Erklärung. Pro Modul wird dein Bestwert gespeichert.</p><button class="hero-btn" data-act="quizmix">${ICON.quiz}<span><b>Klausur-Mix starten</b><span>15 zufällige Fragen aus allen Modulen</span></span></button>${Object.keys(S.wrong).length ? `<button class="qa" data-act="quizmine"><span class="qa-ic">${ICON.quiz}</span><span><b>Meine Fehlerliste (${Object.keys(S.wrong).length})</b><span>Falsch beantwortete Fragen – verschwinden nach 2× richtig</span></span></button>` : ''}</section><section><div class="sh"><h2>Nach Modul</h2></div><div class="tiles">${MODULES.map(m => `<button class="tile" data-act="quiz" data-k="${m.id}" style="--mc:${m.c}">${ring(S.quizBest[m.id] || 0, m.c)}<span class="tile-t">${esc(m.t)}</span><span class="tile-s">${QZ.filter(q => q.m === m.id).length} Fragen · Bestwert ${S.quizBest[m.id] || 0} %</span></button>`).join('')}</div></section>`;
  if (QS.i >= QS.qs.length) {
    const pct = Math.round(QS.score / QS.qs.length * 100);
    return `<div class="focus"><div class="qcard center">${ring(pct, pct >= 80 ? 'var(--good)' : pct >= 50 ? 'var(--warm)' : 'var(--bad)', 120, 10)}<h1>${QS.score} von ${QS.qs.length} richtig</h1><p class="faint">${esc(QS.title)}${QS.mid ? ' · Bestwert ' + (S.quizBest[QS.mid] || 0) + ' %' : ''}</p>${QS.wrong.length ? `<div class="wronglist"><h3>Das solltest du wiederholen</h3>${QS.wrong.map(id => { const q = QZ.find(x => x.id === id); return `<div class="wl"><b>${esc(q.q)}</b><span class="good">✓ ${esc(q.o[0])}</span><span class="faint">${esc(q.e)}</span></div>`; }).join('')}</div>` : '<p>Perfekt – keine Fehler!</p>'}<div class="row center">${QS.wrong.length ? `<button class="btn pri big" data-act="quizwrong">Fehler wiederholen</button>` : ''}<button class="btn big" data-act="quizagain">Neue Runde</button><button class="btn big" data-act="quizEnd">Übersicht</button></div></div></div>`;
  }
  const q = QS.qs[QS.i], m = MOD[q.m];
  let h = `<div class="focus"><div class="row between"><a class="back" href="#quiz" data-act="quizEnd">‹ Beenden</a><span class="faint">Frage ${QS.i + 1} / ${QS.qs.length} · ${QS.score} richtig</span></div><div class="prog"><div style="width:${QS.i / QS.qs.length * 100}%"></div></div><div class="qcard"><div class="q-meta" style="color:${m.c}">${esc(m.t)}</div><div class="q-big">${esc(q.q)}</div><div class="opts">${q.opts.map((o, k) => { const st = QS.picked === null ? '' : o.ok ? 'right' : k === QS.picked ? 'wrong' : 'dim'; return `<button class="opt ${st}" data-act="ans" data-k="${k}" ${QS.picked !== null ? 'disabled' : ''}><span class="ok-l">${'ABCD'[k]}</span><span>${esc(o.t)}</span></button>`; }).join('')}</div>`;
  if (QS.picked !== null) { const ok = q.opts[QS.picked].ok; h += `<div class="feedback ${ok ? 'good' : 'bad'}"><b>${ok ? 'Richtig!' : 'Leider falsch.'}</b><span>${esc(q.e)}</span><div class="row"><button class="btn pri" data-act="nextq">${QS.i + 1 < QS.qs.length ? 'Weiter ›' : 'Auswertung ›'}</button>${ok ? '' : `<a class="btn" href="#modul-${q.m}">Lektion „${esc(m.t)}“</a>`}</div></div>`; }
  return h + '</div><p class="kbdhint">Tastatur: <span class="kbd">1</span>–<span class="kbd">4</span> oder <span class="kbd">A</span>–<span class="kbd">D</span> antworten · <span class="kbd">Enter</span> weiter</p></div>';
}

let LABV = 'join';
function laborView() {
  const L = [['join', 'Join-Labor', 'Alle Join-Arten an echten Daten'], ['algebra', 'Algebra-Labor', 'σ π ρ ∪ ∩ − ÷ sehen'], ['group', 'GROUP BY', 'Schritt für Schritt'], ['null', 'NULL-Logik', 'Wahrheitstafeln + Trainer']];
  return `<section><h1>Labor</h1><p class="faint">Probier die Operatoren aus und sieh, was mit jedem Tupel passiert.</p><div class="seg wide" role="tablist">${L.map(([k, t, s]) => `<button data-act="lab" data-k="${k}" aria-pressed="${LABV === k}"><b>${t}</b><span>${s}</span></button>`).join('')}</div></section>${LABV === 'join' ? joinLab() : LABV === 'algebra' ? algebraLab() : LABV === 'group' ? groupLab() : nullLab()}`;
}

function puzzlesView() {
  if (PZ) return puzzleView();
  const kinds = [['order', 'Reihenfolge', 'Antippen in der richtigen Reihenfolge'], ['gap', 'Lückentext', 'Passende Bausteine auswählen'], ['bug', 'Fehler finden', 'Die falsche Zeile antippen']];
  return `<section><h1>SQL-Puzzles</h1><p class="faint">${Object.keys(S.puz).length} von ${PUZZLES.length} gelöst.</p></section>${kinds.map(([k, t, s]) => `<section><div class="sh"><h2>${t}</h2><span class="faint">${s}</span></div><div class="plist">${PUZZLES.filter(p => p.k === k).map(p => `<button class="pz ${S.puz[p.id] ? 'done' : ''}" data-act="pzopen" data-k="${p.id}" style="--mc:${MOD[p.m].c}"><span class="pz-k">${esc(MOD[p.m].t)}</span><b>${esc(p.t)}</b>${S.puz[p.id] ? `<span class="okdot">${ICON.check}</span>` : ''}</button>`).join('')}</div></section>`).join('')}`;
}

function konsoleView() {
  const t = con.task ? TASKS[con.task] : null;
  let h = `<section class="sh"><div><h1>SQL-Konsole</h1><p class="faint">SQLite im Browser · <span class="kbd">Strg</span> + <span class="kbd">Enter</span> führt aus${t ? ' bzw. prüft' : ''}.</p></div><div class="row"><select id="dbsel" class="sel" aria-label="Datenbank">${Object.entries(DBS).map(([k, v]) => `<option value="${k}" ${k === con.db ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select><button class="btn" data-act="resetDb">Zurücksetzen</button></div></section><div class="con"><div class="con-main">`;
  if (t) h += `<div class="taskbar"><div class="row between"><b>${esc(t.titel)}</b><div class="row">${S.solved[con.task] ? '<span class="tag good">gelöst</span>' : ''}<button class="btn sm" data-act="closeTask">Schließen</button></div></div><div class="pre-line">${esc(t.text)}</div>${t.pre ? `<div class="pre-note">Wird vorher automatisch ausgeführt:\n${esc(t.pre)}</div>` : ''}<div class="row">${t.tipp ? tog('ch:' + con.task, 'Denkanstoß', 'Denkanstoß zu') : ''}${tog('cs:' + con.task, 'Lösung', 'Lösung zu')}</div>${t.tipp && shown['ch:' + con.task] ? `<div class="tip"><b>Denkanstoß</b> ${esc(t.tipp)}</div>` : ''}${shown['cs:' + con.task] ? `<div class="sol">${esc(t.loesung)}</div>` : ''}</div>`;
  else h += `<div class="taskbar soft"><b>Freies Üben</b><span class="faint">Oder hol dir eine Aufgabe mit automatischer Prüfung:</span><div class="row"><button class="btn sm pri" data-act="randTask" data-k="4">Klausurniveau</button><button class="btn sm" data-act="randTask" data-k="3">Level 3</button><button class="btn sm" data-act="randTask" data-k="2">Level 2</button><button class="btn sm" data-act="randTask" data-k="1">Level 1</button></div></div>`;
  h += `<textarea id="ed" class="editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="SQL-Eingabe" placeholder="SELECT * FROM Studenten WHERE Semester = 2;">${esc(con.text)}</textarea><div class="row"><button class="btn pri big" data-act="run">Ausführen</button>${t ? '<button class="btn good big" data-act="check">Prüfen</button>' : ''}<button class="btn" data-act="clear">Leeren</button></div><div id="con-out" class="stack"></div></div>
  <aside class="side"><div class="panel tight"><h3>Relationen</h3><div id="con-schema"></div></div><div class="panel tight"><h3>SQLite-Hinweise</h3><ul class="small"><li>EXCEPT statt MINUS, COALESCE statt NVL</li><li>WITH RECURSIVE statt CONNECT BY</li><li>kein ALL / ANY → max() / min()</li><li>Ganzzahl / Ganzzahl rechnet ganzzahlig</li><li>kein PL/SQL; im Familienbaum gibt es BerechneAlter(Name)</li></ul></div><div class="panel tight hist"><h3>Verlauf</h3><div id="con-hist"></div></div></aside></div>`;
  return h;
}

function praktikaView() {
  return `<section><h1>Praktika</h1><p class="faint">Erst den Denkanstoß, dann selbst lösen, dann die Lösung. Abfragen kannst du in der Konsole automatisch prüfen lassen.</p></section>` + PRAKTIKA.map(p => {
    const open = !!shown['po:' + p.id] || (shown['po:' + p.id] === undefined && p.id === 'p6');
    const n = p.aufgaben.length, d = p.aufgaben.filter((a, i) => S.checks['pa:' + p.id + i] || S.solved['P-' + p.id + '-' + i]).length;
    let h = `<section class="acc ${open ? 'open' : ''}"><button class="acc-h" data-act="pop" data-k="${p.id}" aria-expanded="${open}"><span class="acc-nr">${esc(p.nr)}</span><span><b>${esc(p.titel)}</b><span class="faint">Abgabe ${esc(p.abgabe)}</span></span><span class="acc-r">${ring(Math.round(d / n * 100), 'var(--pri)', 40, 4)}</span></button>`;
    if (open) { h += `<div class="acc-b"><p>${esc(p.intro)}</p>${p.id === 'p4' ? gallery(['p4_s01']) : p.id === 'p5' ? gallery(['p5_s01']) : ''}<div class="stack">${p.aufgaben.map((a, i) => exCard({ key: 'pa:' + p.id + i, titel: 'Aufgabe ' + a.nr, aufgabe: a.aufgabe, tipp: a.tipp, loesung: a.loesung, task: a.sql ? 'P-' + p.id + '-' + i : null })).join('')}</div></div>`; }
    return h + '</section>';
  }).join('');
}

let confirmReset = false;
function mehrView() {
  let h = `<section><h1>Mehr</h1><div class="quick">${[['puzzles', 'SQL-Puzzles', ICON.puzzle], ['konsole', 'Konsole', ICON.term], ['praktika', 'Praktika', ICON.book], ['klausur', 'Probeklausur', ICON.exam]].map(([r, t, ic]) => `<a class="qa" href="#${r}"><span class="qa-ic">${ic}</span><span><b>${t}</b></span></a>`).join('')}</div></section><section class="panel" id="suche"><h2>Suche</h2><input id="search" class="sbox" type="search" placeholder="Begriff suchen …" value="${esc(SQ)}" aria-label="Lerninhalte durchsuchen" autocomplete="off"><div id="sres" class="stack">${searchResults(SQ)}</div></section>
  <section class="panel"><h2>Karteikarten nach RemNote</h2><p class="faint">Alle ${ALLCARDS.length} Karten im Format „Frage == Antwort“, nach Modul gegliedert. In RemNote einfügen – die Einrückung macht jedes Modul zum Ordner.</p><div class="row"><button class="btn pri" data-act="copyrem" data-k="">Alle kopieren</button>${MODULES.map(m => `<button class="btn sm" data-act="copyrem" data-k="${m.id}">${esc(m.t)}</button>`).join('')}</div><textarea id="remtxt" class="editor small-ed" hidden aria-label="RemNote-Text"></textarea></section>
  <section class="panel"><h2>Wochenplan</h2><p class="faint">6 h/Woche bis Weihnachten, 12 h/Woche ab Januar. Klausurtermin noch offen.</p><div class="weeks">${WEEKS.map(w => `<div class="wk"><div class="wk-h"><span class="mono">${esc(w.kw)} · ${esc(w.range)}</span><span class="tag">${esc(w.phase)} · ${w.h} h</span></div><div class="wk-f">${esc(w.focus)}</div>${w.items.map((t, i) => { const k = w.id + ':' + i, c = !!S.checks[k]; return `<label class="cb line ${c ? 'done' : ''}"><input type="checkbox" data-act="tick" data-k="${k}" ${c ? 'checked' : ''}> <span>${esc(t)}</span></label>`; }).join('')}</div>`).join('')}</div></section>`;
  h += `<section class="panel"><h2>Spickzettel</h2><div class="fgrid">${FORMULAS.map(g => `<div class="fcard"><h3>${esc(g.g)}</h3>${g.items.map(([a, b]) => `<div class="frow"><span>${esc(a)}</span><code>${esc(b)}</code></div>`).join('')}</div>`).join('')}</div></section>`;
  h += `<section class="panel"><h2>Vorlesungen & Folien</h2><div class="stack">${LECTURES.filter(l => l.available).map(l => `<details class="lec"><summary><b>#${esc(l.nr)}</b> ${esc(l.title)}</summary><div class="lec-b"><div class="small faint">${l.folien.map(f => `${esc(f.s)}: ${esc(f.w)}`).join(' · ')}</div><h4>Typische Fallen</h4><ul class="small">${l.fallen.map(f => `<li>${esc(f)}</li>`).join('')}</ul>${gallery(l.images.map(i => i.id))}</div></details>`).join('')}</div></section>`;
  h += `<section class="panel"><h2>Strategie</h2><ol class="strat">${STRATEGIE.map(s => `<li>${esc(s)}</li>`).join('')}</ol><p class="small">Werkzeuge: <a href="https://dbis-uibk.github.io/relax/landing">RelaX</a> · <a href="https://hyper-db.de/interface.html">HyPer</a> · DBPRAKT über eduVPN → 10.28.1.3:1521, SID DBPRAKT</p><div class="row">${confirmReset ? '<span>Wirklich alles löschen?</span><button class="btn bad" data-act="resetYes">Ja, zurücksetzen</button><button class="btn" data-act="resetNo">Abbrechen</button>' : '<button class="btn" data-act="reset">Fortschritt zurücksetzen</button>'}</div></section>`;
  return h;
}

function render() {
  renderNav();
  const r = route(), v = $('view');
  if (r === 'start') v.innerHTML = startView();
  else if (r.startsWith('modul-')) v.innerHTML = moduleView(r.slice(6));
  else if (r === 'karten') v.innerHTML = cardsView();
  else if (r === 'quiz') v.innerHTML = quizView();
  else if (r === 'labor') v.innerHTML = laborView();
  else if (r === 'puzzles') v.innerHTML = puzzlesView();
  else if (r === 'praktika') v.innerHTML = praktikaView();
  else if (r === 'mehr') v.innerHTML = mehrView();
  else if (r === 'klausur') { v.innerHTML = examView(); if (KL && !KL.done) tickExam(); }
  else if (r === 'konsole') {
    v.innerHTML = konsoleView(); renderOut(); renderSide(); if (!con.inst) resetDb();
    const ed = $('ed');
    ed.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); con.task ? checkSql() : runSql(); } if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ed.setRangeText('  ', ed.selectionStart, ed.selectionEnd, 'end'); } });
    ed.addEventListener('input', () => { con.text = ed.value; });
    $('dbsel').addEventListener('change', e => { con.db = e.target.value; con.inst = null; con.out = null; con.msg = null; renderOut(); resetDb(); });
  }
}
const keep = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };

/* ================= Events ================= */
document.addEventListener('click', e => {
  const na = e.target.closest('nav#nav a, nav#bnav a');
  if (na && na.getAttribute('href').slice(1) === route()) { e.preventDefault(); if (route() === 'puzzles') PZ = null; if (route() === 'karten' && FC && FC.i >= FC.queue.length) FC = null; if (route() === 'quiz' && QS && QS.i >= QS.qs.length) QS = null; render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, k = el.dataset.k;
  if (a === 'tick' || a === 'gap' || a === 'jguess') return;
  if (el.tagName === 'A' && ['cardsEnd', 'quizEnd', 'pzclose'].includes(a)) { e.preventDefault(); }
  switch (a) {
    case 'goto': go(k); break;
    case 'cards': startCards(k || null); break;
    case 'cardsAll': startCards(k, 'all'); break;
    case 'cardsEnd': FC = null; go('karten'); break;
    case 'flip': FC.flipped = !FC.flipped; render(); break;
    case 'rate': rateCard(k); break;
    case 'quiz': startQuiz(k); break;
    case 'quizmix': startQuiz(null); break;
    case 'quizwrong': startQuiz(null, QS.wrong.slice()); break;
    case 'quizmine': startQuiz(null, Object.keys(S.wrong)); break;
    case 'copyrem': { const txt = remnoteText(k); const done = () => { el.textContent = 'Kopiert ✓'; }; try { navigator.clipboard.writeText(txt).then(done, () => { const ta = $('remtxt'); if (ta) { ta.hidden = false; ta.value = txt; ta.select(); } }); } catch (err) { const ta = $('remtxt'); if (ta) { ta.hidden = false; ta.value = txt; ta.select(); } } break; }
    case 'quizagain': startQuiz(QS.mid); break;
    case 'quizEnd': QS = null; go('quiz'); break;
    case 'ans': answer(+k); break;
    case 'nextq': nextQ(); break;
    case 'lab': LABV = k; go('labor'); break;
    case 'jds': JL.ds = k; JL.guessed = null; JL.sel = null; keep(); break;
    case 'jt': JL.jt = k; JL.guessed = null; JL.sel = null; keep(); break;
    case 'jg': JL.guessed = +k; markActive(); keep(); break;
    case 'jsel': { const [s, i] = k.split(':'); JL.sel = JL.sel && JL.sel[0] === s && JL.sel[1] === +i ? null : [s, +i]; keep(); break; }
    case 'aop': AL.op = k; keep(); break;
    case 'gb': GB = +k; keep(); break;
    case 'tv': { const cur = NL.in[k], nx = cur === undefined ? 'TRUE' : cur === 'TRUE' ? 'NULL' : cur === 'NULL' ? 'FALSE' : 'TRUE'; NL.in[k] = nx; NL.checked = false; keep(); break; }
    case 'tvcheck': NL.checked = true; markActive(); keep(); break;
    case 'ttmix': (k === 'all' ? ['AND', 'OR', 'NOT'] : [k]).forEach(shuffleTT); keep(); break;
    case 'tvreset': NL.in = {}; NL.checked = false; keep(); break;
    case 'nx': NL.exAns = k; markActive(); keep(); break;
    case 'nxnext': NL.ex = (NL.ex + 1) % NEXPR.length; NL.exAns = null; keep(); break;
    case 'pzopen': openPuzzle(k); break;
    case 'lstep': { const [mm, j] = k.split(':'); LS[mm] = Math.max(0, +j); keep(); const el2 = $('lektion'); if (el2 && el2.getBoundingClientRect().top < 60) el2.scrollIntoView({ block: 'start' }); break; }
    case 'ldone': S.lessons[k] = true; markActive(); save(); keep(); break;
    case 'lessonAt': { const [mm, j] = k.split(':'); LS[mm] = +j; go('modul-' + mm); setTimeout(() => { const el2 = $('lektion'); if (el2) el2.scrollIntoView({ block: 'start' }); }, 30); break; }
    case 'lesson': LS[k] = 0; go('modul-' + k); setTimeout(() => { const el2 = $('lektion'); if (el2) el2.scrollIntoView({ block: 'start' }); }, 30); break;
    case 'exam': startExam(); break;
    case 'examsubmit': submitExam(); break;
    case 'exans': { const [i, j] = k.split(':').map(Number); if (!KL.done) { KL.ans[i] = j; keep(); } break; }
    case 'exgrade': { const [i, v] = k.split(':').map(Number); KL.grade[i] = v; keep(); break; }
    case 'examsave': { const sc = examScore(); S.exams.push({ d: Date.now(), pct: sc.pct }); save(); KL = null; go('klausur'); break; }
    case 'pzclose': PZ = null; go('puzzles'); break;
    case 'pzadd': PZ.pool = PZ.pool.filter(v => v !== +k); PZ.ans.push(+k); PZ.checked = false; keep(); break;
    case 'pzback': { const v = PZ.ans[+k]; PZ.ans.splice(+k, 1); PZ.pool.push(v); PZ.checked = false; keep(); break; }
    case 'pzreset': openPuzzle(PZ.id); break;
    case 'pzretry': { const p = PUZZLES.find(x => x.id === PZ.id); PZ.checked = false; if (p.k === 'order') { let n = PZ.ans.findIndex((v, i) => v !== i); if (n < 0) n = PZ.ans.length; PZ.ans = PZ.ans.slice(0, n); PZ.pool = shuffle(p.items.map((t, i) => i).filter(i => !PZ.ans.includes(i))); } else if (p.k === 'gap') p.gaps.forEach((g, gi) => { if (PZ.gaps[gi] !== g[0]) delete PZ.gaps[gi]; }); keep(); break; }
    case 'pzcheck': { const p = PUZZLES.find(x => x.id === PZ.id); PZ.checked = true; const ok = p.k === 'order' ? PZ.ans.every((v, i) => v === i) : p.gaps.every((g, gi) => PZ.gaps[gi] === g[0]); if (ok) S.puz[p.id] = true; markActive(); keep(); break; }
    case 'bug': { const p = PUZZLES.find(x => x.id === PZ.id); PZ.line = +k; PZ.checked = true; if (p.ok.includes(+k)) S.puz[p.id] = true; markActive(); keep(); break; }
    case 'show': shown[k] = !shown[k]; if (route() === 'konsole') { con.text = $('ed').value; render(); } else keep(); break;
    case 'pop': shown['po:' + k] = !(shown['po:' + k] ?? k === 'p6'); keep(); break;
    case 'toConsole': { const t = TASKS[k]; con.task = k; con.db = t.db; con.inst = null; con.out = null; con.msg = null; con.text = ''; go('konsole'); break; }
    case 'randTask': { const ids = DRILL.filter(d => d.lv === +k).map(d => 'D-' + d.id); const open = ids.filter(i => !S.solved[i]); const id = (open.length ? open : ids)[Math.floor(Math.random() * (open.length || ids.length))]; con.task = id; con.db = TASKS[id].db; con.inst = null; con.out = null; con.msg = null; con.text = ''; render(); break; }
    case 'closeTask': con.task = null; con.msg = null; con.text = $('ed').value; render(); break;
    case 'run': runSql(); break;
    case 'check': checkSql(); break;
    case 'clear': $('ed').value = ''; con.text = ''; con.out = null; con.msg = null; renderOut(); break;
    case 'resetDb': con.out = null; con.msg = { t: 'info', s: 'Datenbank auf Ausgangszustand zurückgesetzt.' }; renderOut(); resetDb(); break;
    case 'ins': { const ed = $('ed'); ed.value = (ed.value.trim() ? ed.value.replace(/\s*$/, '\n') : '') + 'SELECT * FROM ' + k + ';'; con.text = ed.value; ed.focus(); break; }
    case 'hist': { const ed = $('ed'); ed.value = S.hist[+k]; con.text = ed.value; ed.focus(); break; }
    case 'lb': { const lb = $('lb'); lb.innerHTML = `<div><img src="slides/${esc(k)}.png" alt="${esc(el.dataset.l)}"><span>${esc(el.dataset.l)} · Tippen oder Esc schließt</span></div>`; lb.hidden = false; break; }
    case 'reset': confirmReset = true; keep(); break;
    case 'resetNo': confirmReset = false; keep(); break;
    case 'resetYes': S = { cards: {}, quizBest: {}, solved: {}, puz: {}, checks: {}, days: [], hist: [], lv: 0, newDay: { d: 0, n: 0 }, lessons: {}, exams: [], wrong: {} }; confirmReset = false; save(); keep(); break;
  }
});
document.addEventListener('change', e => {
  const el = e.target, a = el.dataset.act;
  if (a === 'tick') { S.checks[el.dataset.k] = el.checked; if (el.checked) markActive(); save(); if (route() !== 'konsole') keep(); }
  else if (a === 'gap') { PZ.gaps[+el.dataset.k] = el.value; PZ.checked = false; }
  else if (a === 'exnote') { KL.notes[+el.dataset.k] = el.value; }
  else if (a === 'jguess') { JL.guess = el.checked; JL.guessed = null; keep(); }
});
document.addEventListener('input', e => {
  const el = e.target; if (el.dataset && el.dataset.act === 'exnote' && KL) KL.notes[+el.dataset.k] = el.value;
  if (el.id === 'search') { SQ = el.value; const box = $('sres'); if (box) box.innerHTML = searchResults(SQ); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $('lb').hidden = true;
  const r = route(); if (e.target.matches('textarea,select,input')) return;
  if (r === 'karten' && FC && FC.i < FC.queue.length) { if (e.key === ' ') { e.preventDefault(); FC.flipped = !FC.flipped; render(); } else if (FC.flipped && ['1', '2', '3'].includes(e.key)) rateCard(['again', 'hard', 'good'][+e.key - 1]); }
  if (r === 'quiz' && QS && QS.i < QS.qs.length) { const i = ['1', '2', '3', '4', 'a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase()); if (QS.picked === null && i >= 0) answer(i % 4); else if (QS.picked !== null && e.key === 'Enter') nextQ(); }
});
$('lb').addEventListener('click', () => { $('lb').hidden = true; });
window.addEventListener('hashchange', () => { confirmReset = false; if (route() !== 'puzzles') PZ = null; render(); });

render();
loadSQL().catch(() => {});
}
