const initSqlJs = require('sql.js');
const DBS = require('../dbs.js');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../content.js','utf8') + fs.readFileSync(__dirname + '/../learn.js','utf8') + fs.readFileSync(__dirname + '/../lessons.js','utf8') + fs.readFileSync(__dirname + '/../klausur.js','utf8') + '\nmodule.exports={LECTURES,PRAKTIKA,DRILL};';
const m = {exports:{}}; new Function('module', src)(m); const {LECTURES,PRAKTIKA,DRILL} = m.exports;
initSqlJs().then(SQL => {
  const mk = (k) => { const db = new SQL.Database(); db.run(DBS[k].sql);
    if (k==='fam') db.create_function('BerechneAlter', n => { const r = db.exec("SELECT Geburtsjahr, Sterbejahr FROM Person WHERE Name = '"+String(n).replace(/'/g,"''")+"'"); if(!r.length) return null; const [g,t]=r[0].values[0]; return (t ?? new Date().getFullYear()) - g; });
    return db; };
  const items = [];
  LECTURES.forEach(l => (l.uebungen||[]).forEach(u => u.sql && items.push([u.titel, u])));
  PRAKTIKA.forEach(p => p.aufgaben.forEach(a => a.sql && items.push([p.nr+' '+a.nr, a])));
  DRILL.forEach(d => items.push([d.id+' '+d.t.slice(0,40), d]));
  let err=0;
  for (const [name, it] of items) {
    try { const db = mk(it.db); if (it.pre) db.exec(it.pre); const r = db.exec(it.alt || it.sql);
      const rows = r.length ? r[r.length-1].values : []; const cols = r.length ? r[r.length-1].columns : [];
      console.log('## '+name+' ['+rows.length+'] '+cols.join('|')); console.log(rows.map(x=>x.join('|')).join(' ; ').slice(0,600));
    } catch(e) { err++; console.log('!! '+name+': '+e.message); }
  }
  console.log('items', items.length, 'errors', err);
});
