/* Lektionen: pro Modul Schritte mit Diagramm (zuerst) und Erklärung (danach).
   Diagramme sind Inline-SVG mit CSS-Klassen (d-*), damit sie hell und dunkel funktionieren. */
const DG = (() => {
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" class="dg" role="img" aria-label="${e(label)}" style="min-width:${Math.min(w, 480)}px">${body}</svg>`;
  const r = (x, y, w, h, c = 'b', rx = 8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="d-${c}"/>`;
  const t = (x, y, s, c = 't', a = 'middle', fs = 14, fw = 400) => `<text x="${x}" y="${y}" class="d-${c}" text-anchor="${a}" font-size="${fs}" font-weight="${fw}">${e(s)}</text>`;
  const tm = (x, y, s, c = 't', a = 'middle', fs = 13) => `<text x="${x}" y="${y}" class="d-${c} d-mono" text-anchor="${a}" font-size="${fs}">${e(s)}</text>`;
  const l = (x1, y1, x2, y2, c = 'l', m = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="d-${c}"${m ? ` marker-end="url(#dg${m})"` : ''}/>`;
  const p = (d, c = 'l', m = '') => `<path d="${d}" class="d-${c}"${m ? ` marker-end="url(#dg${m})"` : ''}/>`;
  const c = (cx, cy, rr, cl = 'b') => `<circle cx="${cx}" cy="${cy}" r="${rr}" class="d-${cl}"/>`;
  /* Mini-Relation: cols = Namen, rows = Werte; o: {cw: Breite je Attribut, hiR, outR, hiC, key, title} */
  function tbl(x, y, cols, rows, o = {}) {
    const cw = o.cw || 80, rh = 26, w = cols.length * cw;
    let s = '';
    if (o.title) s += t(x, y - 8, o.title, 't', 'start', 13.5, 600);
    s += r(x, y, w, rh * (rows.length + 1), 'b', 6) + r(x, y, w, rh, 's', 6);
    cols.forEach((cn, i) => {
      if (o.hiC && o.hiC.includes(i)) s += `<rect x="${x + i * cw}" y="${y}" width="${cw}" height="${rh * (rows.length + 1)}" class="d-pc"/>`;
      s += t(x + i * cw + cw / 2, y + 17, cn, (o.hiC && o.hiC.includes(i)) ? 'tp' : 'm', 'middle', 12.5, 600);
      if (o.key && o.key.includes(i)) s += l(x + i * cw + 10, y + 21, x + (i + 1) * cw - 10, y + 21, 'lk');
    });
    rows.forEach((row, j) => {
      const yy = y + rh * (j + 1);
      if (o.hiR && o.hiR.includes(j)) s += `<rect x="${x}" y="${yy}" width="${w}" height="${rh}" class="d-pr"/>`;
      if (o.gR && o.gR[j] !== undefined) s += `<rect x="${x}" y="${yy}" width="${w}" height="${rh}" class="d-g${o.gR[j]}"/>`;
      s += l(x, yy, x + w, yy, 'lt');
      row.forEach((v, i) => { const isNull = v === null; s += tm(x + i * cw + cw / 2, yy + 17, isNull ? 'NULL' : v, isNull ? 'm' : (o.outR && o.outR.includes(j)) ? 'f' : 't', 'middle', 12.5); });
      if (o.outR && o.outR.includes(j)) s += l(x + 4, yy + 13, x + w - 4, yy + 13, 'lx');
    });
    return s;
  }
  return { svg, r, t, tm, l, p, c, tbl, e };
})();

const LESSONS = {
  grundlagen: [
    { t: 'Warum überhaupt ein DBMS?', d: () => { const { svg, r, t, l } = DG; let s = t(130, 22, 'Ohne Datenbank', 't', 'middle', 15, 600) + t(410, 22, 'Mit Datenbank', 't', 'middle', 15, 600);
      ['Vertrieb', 'Buchhaltung', 'Lager'].forEach((n, i) => { const y = 44 + i * 62; s += r(20, y, 100, 40, 'p') + t(70, y + 25, n, 't', 'middle', 13) + l(120, y + 20, 150, y + 20, 'l', 'a') + r(152, y + 4, 90, 32, i === 1 ? 'r' : 'b', 4) + t(197, y + 25, i === 1 ? 'Adresse alt' : 'Adresse neu', i === 1 ? 'tr' : 't', 'middle', 12); });
      ['Vertrieb', 'Buchhaltung', 'Lager'].forEach((n, i) => { const x = 300 + i * 82; s += r(x, 44, 74, 36, 'p') + t(x + 37, 67, n, 't', 'middle', 11.5) + l(x + 37, 80, 410, 118, 'l', 'a'); });
      s += r(345, 120, 130, 44, 'g') + t(410, 147, 'DBMS', 'tg', 'middle', 15, 700) + l(410, 164, 410, 186, 'l', 'a') + r(350, 188, 120, 40, 'b') + t(410, 213, 'eine Datenbasis', 't', 'middle', 12.5);
      return svg(540, 240, s, 'Drei Abteilungen mit eigenen Dateien gegenüber gemeinsamer Datenbank'); },
      x: 'Links pflegt jede Abteilung ihre eigene Datei. Ändert nur der Vertrieb die Adresse, entsteht eine Inkonsistenz – Ursache ist die unkontrollierte Redundanz. Rechts greifen alle über das DBMS auf EINE Datenbasis zu. Das DBMS sorgt automatisch für Konsistenz, Integrität, Zugriff, Mehrbenutzer-Synchronisation, Sicherheit und Recovery.' },
    { t: 'ANSI-SPARC: drei Ebenen', d: () => { const { svg, r, t, l, p } = DG; let s = '';
      ['Sicht 1', 'Sicht 2', 'Sicht 3'].forEach((n, i) => { s += r(60 + i * 120, 16, 100, 38, 'p') + t(110 + i * 120, 40, n, 't', 'middle', 13); s += l(110 + i * 120, 54, 230, 92, 'l', 'a'); });
      s += r(120, 94, 220, 44, 'g') + t(230, 121, 'Konzeptionelles Schema', 't', 'middle', 14, 600);
      s += l(230, 138, 230, 168, 'l', 'a') + r(120, 170, 220, 44, 'w') + t(230, 197, 'Internes Schema', 't', 'middle', 14, 600);
      s += p('M230 214 v14', 'l') + `<ellipse cx="230" cy="236" rx="60" ry="10" class="d-s"/>` + t(230, 262, 'Speicher', 'm', 'middle', 12);
      s += p('M440 20 h10 v116 h-10', 'lb') + t(460, 72, 'logische', 'tp', 'start', 12.5, 600) + t(460, 88, 'Daten-', 'tp', 'start', 12.5) + t(460, 104, 'unabhängigkeit', 'tp', 'start', 12.5);
      s += p('M440 100 h18 v114 h-18', 'lb2') + t(468, 160, 'physische', 'tw', 'start', 12.5, 600) + t(468, 176, 'Daten-', 'tw', 'start', 12.5) + t(468, 192, 'unabhängigkeit', 'tw', 'start', 12.5);
      s += t(20, 40, 'extern', 'm', 'start', 12) + t(20, 120, 'konzept.', 'm', 'start', 12) + t(20, 196, 'intern', 'm', 'start', 12);
      return svg(580, 272, s, 'ANSI-SPARC-Architektur mit drei Ebenen'); },
      x: 'Oben die externen Schemata (Sichten der Anwendungen), in der Mitte das konzeptionelle Schema (alle Relationen), unten das interne Schema (Speicherung, Indexe). Logische Datenunabhängigkeit: Das konzeptionelle Schema ändern, ohne die Sichten/Anwendungen zu ändern – nur bedingt möglich. Physische Datenunabhängigkeit: Speicherung ändern (z. B. neuer Index), ohne das Schema zu berühren.' },
    { t: 'Anatomie einer Relation', d: () => { const { svg, t, l, tbl } = DG; let s = tbl(40, 40, ['PersNr', 'Name', 'Rang'], [[2125, 'Sokrates', 'C4'], [2126, 'Russel', 'C4'], [2127, 'Kopernikus', 'C3']], { cw: 100, key: [0], hiR: [1], title: 'Professoren' });
      s += l(340, 66, 380, 66, 'lp', 'p') + t(388, 70, 'Attribute (Schema)', 'tp', 'start', 13);
      s += l(340, 105, 380, 105, 'lp', 'p') + t(388, 109, 'Tupel', 'tp', 'start', 13, 600);
      s += l(90, 160, 90, 182, 'lw', 'w') + t(40, 200, 'Primärschlüssel (unterstrichen)', 'tw', 'start', 12.5);
      s += t(440, 200, 'dom(Rang) = {C2, C3, C4}', 'm', 'middle', 12.5);
      s += t(40, 22, 'Relation', 'm', 'start', 12);
      return svg(540, 212, s, 'Relation Professoren mit Attributen, Tupel und Primärschlüssel'); },
      x: 'Eine Relation ist eine Menge von Tupeln (R ⊆ D1 × … × Dn). Das Schema sch(R) legt die Attribute mit ihren Domänen fest, die Ausprägung sind die aktuellen Tupel. Der Primärschlüssel (unterstrichen) identifiziert jedes Tupel eindeutig. Fachbegriffe: Relation, Tupel, Attribut.' },
    { t: 'Fremdschlüssel verbinden Relationen', d: () => { const { svg, tbl, p, t } = DG; let s = tbl(20, 34, ['VorlNr', 'Titel', 'gelesenVon'], [[5041, 'Ethik', 2125], [5043, 'Erkenntnisth.', 2126], [5001, 'Grundzüge', 2137]], { cw: 92, key: [0], hiC: [2], title: 'Vorlesungen' });
      s += tbl(340, 34, ['PersNr', 'Name'], [[2125, 'Sokrates'], [2126, 'Russel'], [2137, 'Kant']], { cw: 90, key: [0], hiC: [0], title: 'Professoren' });
      s += p('M296 73 C 318 73, 318 73, 338 73', 'lp', 'p') + p('M296 99 C 318 99, 318 99, 338 99', 'lp', 'p') + p('M296 125 C 318 125, 318 125, 338 125', 'lp', 'p');
      s += t(270, 168, 'Fremdschlüssel gelesenVon → Primärschlüssel PersNr', 'tp', 'middle', 13, 600);
      return svg(540, 180, s, 'Fremdschlüssel gelesenVon verweist auf PersNr'); },
      x: 'Vorlesungen.gelesenVon ist ein Fremdschlüssel: Jeder Wert muss als PersNr in Professoren existieren (oder NULL sein). So entstehen die Beziehungen zwischen Relationen – und genau über diese Attribute werden später die Joins gebildet.' },
  ],
  algebra: [
    { t: 'σ schneidet Tupel, π schneidet Attribute', d: () => { const { svg, tbl, t } = DG; const rows = [[24002, 'Xenokrates', 18], [28106, 'Carnap', 3], [29120, 'Theophrastos', 2], [27550, 'Schopenhauer', 6]];
      let s = tbl(10, 34, ['MatrNr', 'Name', 'Sem.'], rows, { cw: 86, hiR: [1, 2], outR: [0, 3], title: 'σ Semester < 5 (Studenten)' });
      s += tbl(290, 34, ['MatrNr', 'Name', 'Sem.'], rows, { cw: 86, hiC: [1], title: 'π Name (Studenten)' });
      s += t(139, 186, 'horizontal: Tupel auswählen', 'tp', 'middle', 12.5) + t(419, 186, 'vertikal: Attribute auswählen', 'tp', 'middle', 12.5);
      return svg(560, 198, s, 'Selektion und Projektion im Vergleich'); },
      x: 'Die Selektion σ prüft jedes Tupel gegen eine Bedingung und behält nur die passenden – die Attribute bleiben gleich. Die Projektion π behält nur die genannten Attribute; weil eine Relation eine Menge ist, verschwinden dabei doppelte Tupel (π Rang(Professoren) hat nur 2 Tupel).' },
    { t: 'Join = Kreuzprodukt + Selektion', d: () => { const { svg, r, t, l, tm } = DG; let s = t(110, 20, 'L × R: jedes mit jedem', 't', 'middle', 13.5, 600) + t(420, 20, 'σ L.C = R.C → L ⋈ R', 't', 'middle', 13.5, 600);
      const L = ['a1 · c1', 'a2 · c2'], R = ['c1 · d1', 'c3 · d2'];
      L.forEach((v, i) => R.forEach((w, j) => { const y = 34 + (i * 2 + j) * 36, ok = i === 0 && j === 0; s += r(20, y, 180, 28, ok ? 'g' : 'b', 6) + tm(110, y + 19, v + '  |  ' + w, ok ? 'tg' : 't'); s += l(204, y + 14, 300, 92, ok ? 'lg' : 'ld', ok ? 'g' : ''); }));
      s += r(305, 76, 230, 32, 'g', 6) + tm(420, 97, 'a1 · c1 · d1', 'tg') + t(420, 140, '3 von 4 Kombinationen fallen weg', 'm', 'middle', 12.5);
      return svg(560, 184, s, 'Kreuzprodukt mit anschließender Selektion ergibt den Join'); },
      x: 'Das Kreuzprodukt kombiniert jedes Tupel aus L mit jedem aus R (|L| · |R| Tupel). Behält man nur die Kombinationen, die zusammenpassen, entsteht der Join: R ⋈θ S = σθ(R × S). Der natürliche Join verbindet automatisch über alle gleichnamigen Attribute und nimmt sie nur einmal ins Ergebnis.' },
    { t: 'Mengenoperationen: ∪ ∩ −', d: () => { const { svg, t, c } = DG; let s = '';
      [['A ∪ B', ['o', 'o', 'o']], ['A ∩ B', ['n', 'o', 'n']], ['A − B', ['o', 'n', 'n']]].forEach(([n, f], i) => { const x = 95 + i * 180;
        s += `<g><circle cx="${x - 22}" cy="80" r="46" class="d-${f[0] === 'o' ? 'vf' : 'vb'}"/><circle cx="${x + 22}" cy="80" r="46" class="d-${f[2] === 'o' ? 'vf' : 'vb'}"/>`;
        if (f[1] === 'o') s += `<path d="M${x} 39.6 A46 46 0 0 1 ${x} 120.4 A46 46 0 0 1 ${x} 39.6" class="d-vf2"/>`; else if (f[0] === 'o') s += `<path d="M${x} 39.6 A46 46 0 0 1 ${x} 120.4 A46 46 0 0 1 ${x} 39.6" class="d-vcut"/>`;
        s += `<circle cx="${x - 22}" cy="80" r="46" class="d-vo"/><circle cx="${x + 22}" cy="80" r="46" class="d-vo"/></g>` + t(x - 40, 84, 'A', 't', 'middle', 14, 600) + t(x + 40, 84, 'B', 't', 'middle', 14, 600) + t(x, 152, n, 'tp', 'middle', 16, 700); });
      return svg(540, 166, s, 'Vereinigung, Durchschnitt und Differenz als Mengendiagramme'); },
      x: 'Vereinigung, Durchschnitt und Differenz funktionieren nur bei Schemagleichheit: beide Seiten haben dieselben Attribute. Typisch: erst mit π auf gleiche Attribute bringen, mit ρ gleich benennen (ρ PersNr←gelesenVon). Merke: A − B ≠ B − A, und R ∩ S = R − (R − S).' },
    { t: 'Division: „alle“-Fragen', d: () => { const { svg, t, r, tm } = DG; const studs = [[29555, [1, 1]], [27550, [1, 0]], [29120, [1, 0]], [25403, [0, 1]]];
      let s = t(20, 22, 'hören ÷ {5001, 5022}', 't', 'start', 15, 700) + t(240, 50, '5001', 'm', 'middle', 13, 600) + t(320, 50, '5022', 'm', 'middle', 13, 600) + t(420, 50, 'alle?', 'm', 'middle', 13, 600);
      studs.forEach(([m, h], i) => { const y = 60 + i * 34, all = h.every(Boolean); s += r(20, y, 470, 28, all ? 'g' : 'b', 6) + tm(80, y + 19, m) + tm(240, y + 19, h[0] ? 'ja' : '–', h[0] ? 'tg' : 'f') + tm(320, y + 19, h[1] ? 'ja' : '–', h[1] ? 'tg' : 'f') + t(420, y + 19, all ? 'ja → Ergebnis' : 'nein', all ? 'tg' : 'tr', 'middle', 13, 600); });
      return svg(510, 200, s, 'Division prüft für jeden Studenten alle Werte des Divisors'); },
      x: 'R ÷ S liefert die Werte, die mit JEDEM Tupel aus S in R vorkommen. Hier: Wer hört sowohl 5001 als auch 5022? Nur 29555 (Feuerbach). In SQL wird daraus ein doppeltes NOT EXISTS: „Es gibt keine Vorlesung aus dem Divisor, die der Student nicht hört.“' },
  ],
  sql: [
    { t: 'In welcher Reihenfolge wertet SQL aus?', d: () => { const { svg, r, t, l } = DG; const st = [['FROM', '70 Tupel', 'b'], ['WHERE', '8 Tupel', 'b'], ['GROUP BY', '3 Gruppen', 'p'], ['HAVING', '2 Gruppen', 'p'], ['SELECT', '2 Tupel', 'g'], ['ORDER BY', 'sortiert', 'g']];
      let s = ''; st.forEach(([k, v, c], i) => { const x = 10 + i * 92; s += r(x, 30, 82, 60, c) + t(x + 41, 56, k, 't', 'middle', 12.5, 700) + t(x + 41, 76, v, 'm', 'middle', 11.5); if (i < 5) s += l(x + 82, 60, x + 92, 60, 'l', 'a'); });
      s += t(10, 18, 'Beispiel aus VL #4: C4-Professoren, sum(SWS), HAVING avg(SWS) >= 3', 'm', 'start', 12);
      s += t(280, 118, 'Schreiben: SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY', 'tp', 'middle', 12.5, 600);
      return svg(560, 132, s, 'Logische Auswertungsreihenfolge einer SQL-Anfrage'); },
      x: 'Geschrieben wird SELECT zuerst, ausgewertet aber zuletzt (vor ORDER BY). Deshalb kennt WHERE keine Aliase aus dem SELECT, und Aggregatfunktionen können erst in HAVING geprüft werden – die Gruppen existieren vorher noch nicht. Das Labor zeigt das Beispiel Schritt für Schritt.' },
    { t: 'Kanonische Übersetzung SQL → Algebra', d: () => { const { svg, r, t, l, tm } = DG; let s = r(20, 20, 250, 90, 's') + tm(30, 46, 'SELECT A1, …, An', 'tp', 'start') + tm(30, 70, 'FROM R1, …, Rk', 't', 'start') + tm(30, 94, 'WHERE P', 'tw', 'start');
      s += l(272, 64, 312, 64, 'l', 'a');
      s += r(390, 14, 90, 32, 'p') + t(435, 35, 'π A1..An', 'tp', 'middle', 13, 700) + l(435, 46, 435, 66, 'l');
      s += r(390, 66, 90, 32, 'w') + t(435, 87, 'σ P', 'tw', 'middle', 13, 700) + l(435, 98, 435, 118, 'l');
      s += r(390, 118, 90, 32, 'b') + t(435, 139, '×', 't', 'middle', 16, 700) + l(420, 150, 370, 176, 'l') + l(450, 150, 500, 176, 'l');
      s += r(340, 176, 60, 28, 's') + t(370, 195, 'R1', 't', 'middle', 13) + r(470, 176, 60, 28, 's') + t(500, 195, 'Rk', 't', 'middle', 13) + t(435, 195, '…', 'm', 'middle', 14);
      return svg(550, 214, s, 'Operatorbaum der kanonischen Übersetzung'); },
      x: 'Jede einfache SELECT-Anfrage lässt sich mechanisch übersetzen: erst das Kreuzprodukt aller Relationen im FROM, darauf die Selektion mit der WHERE-Bedingung, zuletzt die Projektion auf die SELECT-Attribute: π A1..An(σ P(R1 × … × Rk)). Das DBMS optimiert diesen Baum später (Explain Plan, F10).' },
    { t: 'DDL, DML, DCL – wer macht was?', d: () => { const { svg, r, t, tm } = DG; const g = [['DDL', 'Struktur', ['CREATE', 'ALTER', 'DROP', 'TRUNCATE'], 'kein ROLLBACK', 'w'], ['DML', 'Tupel', ['INSERT', 'UPDATE', 'DELETE', '(SELECT)'], 'ROLLBACK möglich', 'g'], ['DCL', 'Rechte', ['GRANT', 'REVOKE'], 'z. B. an DBMI60', 'p']];
      let s = ''; g.forEach(([n, w, cmds, note, c], i) => { const x = 14 + i * 178; s += r(x, 14, 166, 178, c) + t(x + 83, 40, n, 't', 'middle', 17, 700) + t(x + 83, 58, w, 'm', 'middle', 12.5); cmds.forEach((cm, j) => { s += tm(x + 83, 86 + j * 22, cm); }); s += t(x + 83, 180, note, 'm', 'middle', 11.5); });
      return svg(560, 204, s, 'Die drei SQL-Sprachteile DDL, DML und DCL'); },
      x: 'DDL ändert die Struktur und ist endgültig (DROP TABLE löscht Relation UND Struktur, kein ROLLBACK). DML ändert Tupel und lässt sich zurückrollen (DELETE ≠ DROP). DCL vergibt Rechte – im Praktikum GRANT SELECT ON … TO DBMI60. SELECT wird oft separat als DQL bezeichnet.' },
  ],
  joins: [
    { t: 'Welche Tupel bleiben bei welchem Join?', d: () => { const { svg, r, t, tm } = DG; const J = [['JOIN', [1, 1, 0, 0]], ['LEFT', [1, 1, 1, 0]], ['RIGHT', [1, 1, 0, 1]], ['FULL', [1, 1, 1, 1]]];
      let s = ''; J.forEach(([n, k], i) => { const x = 10 + i * 138; s += t(x + 62, 20, n, 'tp', 'middle', 14, 700);
        const rows = [['Sokrates', 'Platon'], ['Russel', 'Wittgenst.'], ['Curie', null], [null, 'Rhetikus']];
        rows.forEach((rw, j) => { const y = 32 + j * 34, on = k[j]; s += r(x, y, 124, 28, on ? (j < 2 ? 'p' : 'w') : 'n', 6); s += tm(x + 32, y + 19, rw[0] === null ? 'NULL' : rw[0], on ? (rw[0] === null ? 'm' : 't') : 'f', 'middle', 11) + tm(x + 92, y + 19, rw[1] === null ? 'NULL' : rw[1], on ? (rw[1] === null ? 'm' : 't') : 'f', 'middle', 11); }); });
      s += t(280, 188, 'blau = Paar mit Partner · orange = ohne Partner, mit NULL aufgefüllt · gestrichelt = fällt weg', 'm', 'middle', 11.5);
      return svg(560, 198, s, 'Inner, Left, Right und Full Outer Join im Vergleich'); },
      x: 'Ein innerer JOIN behält nur Paare mit Partner. LEFT OUTER behält zusätzlich die linken Tupel ohne Partner (Curie), RIGHT OUTER die rechten (Rhetikus, dessen Boss nicht im Ausschnitt ist), FULL OUTER beide. Fehlende Werte werden mit NULL aufgefüllt. Probier es im Join-Labor aus.' },
    { t: 'Join vervielfacht, Semi-Join filtert', d: () => { const { svg, r, t, tm, l } = DG; let s = t(130, 20, 'Professoren ⋈ Assistenten', 't', 'middle', 13.5, 600) + t(420, 20, 'Professoren ⋉ Assistenten', 't', 'middle', 13.5, 600);
      [['Sokrates', 'Platon'], ['Sokrates', 'Aristoteles'], ['Russel', 'Wittgenstein']].forEach((v, i) => { const y = 34 + i * 34; s += r(20, y, 220, 28, 'p', 6) + tm(80, y + 19, v[0]) + tm(180, y + 19, v[1]); });
      ['Sokrates', 'Russel'].forEach((v, i) => { const y = 34 + i * 34; s += r(330, y, 180, 28, 'g', 6) + tm(420, y + 19, v); });
      s += t(130, 150, 'Sokrates erscheint 2× (2 Assistenten)', 'm', 'middle', 12) + t(420, 120, 'jeder Professor höchstens 1×,', 'm', 'middle', 12) + t(420, 136, 'nur Professoren-Attribute', 'm', 'middle', 12);
      s += t(420, 160, 'SQL: WHERE EXISTS (…)', 'tp', 'middle', 12.5, 600);
      return svg(540, 172, s, 'Join gegenüber Semi-Join'); },
      x: 'Ein Join erzeugt pro passendem Paar ein Tupel – hat Sokrates zwei Assistenten, erscheint er zweimal. Der Semi-Join L ⋉ R fragt nur „Gibt es einen Partner?“ und liefert jedes L-Tupel höchstens einmal, nur mit den Attributen von L. In SQL schreibt man das mit EXISTS oder IN.' },
    { t: 'Self Join: eine Relation, zwei Rollen', d: () => { const { svg, tbl, p, t } = DG; const rows = [['Carnap', 3], ['Theophrastos', 2], ['Feuerbach', 2]];
      let s = tbl(20, 34, ['Name', 'Sem.'], rows, { cw: 100, title: 'Studenten s1' }) + tbl(330, 34, ['Name', 'Sem.'], rows, { cw: 100, title: 'Studenten s2' });
      s += p('M220 99 C 275 99, 275 125, 330 125', 'lp', 'p') + p('M220 125 C 275 125, 275 99, 330 99', 'lp', 'p');
      s += t(275, 160, 's1.Semester = s2.Semester AND s1.MatrNr < s2.MatrNr', 'tp', 'middle', 12.5, 600);
      return svg(550, 172, s, 'Self Join der Relation Studenten'); },
      x: 'Beim Self Join wird dieselbe Relation mit zwei Aliasen (s1, s2) verwendet – als wären es zwei Relationen. So findet man z. B. Studenten im gleichen Semester. Mit s1.MatrNr < s2.MatrNr erscheint jedes Paar nur einmal und niemand wird mit sich selbst kombiniert.' },
  ],
  agg: [
    { t: 'Gruppieren: viele Tupel → ein Tupel pro Gruppe', d: () => { const { svg, r, t, tm, l } = DG; const rows = [['Sokrates', 4, 0], ['Sokrates', 2, 0], ['Sokrates', 4, 0], ['Russel', 3, 1], ['Russel', 3, 1], ['Russel', 2, 1], ['Kant', 4, 2], ['Kant', 4, 2]];
      let s = t(80, 18, 'nach WHERE', 'm', 'middle', 12.5, 600) + t(460, 18, 'GROUP BY Name', 'm', 'middle', 12.5, 600);
      rows.forEach(([n, v, g], i) => { const y = 26 + i * 24; s += `<rect x="20" y="${y}" width="140" height="20" rx="4" class="d-g${g}"/>` + tm(70, y + 15, n, 't', 'middle', 11.5) + tm(140, y + 15, v, 't', 'middle', 11.5); });
      [['Sokrates', 'sum 10', 0, 26], ['Russel', 'sum 8', 1, 98], ['Kant', 'sum 8', 2, 170]].forEach(([n, v, g, y]) => { s += l(164, y + 30, 390, y + 30 + (g - 1) * 4, 'l', 'a') + `<rect x="392" y="${y + 18}" width="140" height="28" rx="6" class="d-g${g}"/>` + tm(442, y + 37, n, 't', 'middle', 12) + tm(500, y + 37, v, 't', 'middle', 12); });
      return svg(550, 226, s, 'Acht Tupel werden zu drei Gruppen zusammengefasst'); },
      x: 'GROUP BY fasst alle Tupel mit gleichem Wert der Gruppierungsattribute zusammen. Pro Gruppe entsteht GENAU EIN Ergebnistupel. Deshalb darf im SELECT nur stehen, was pro Gruppe eindeutig ist: die Gruppierungsattribute oder Aggregate wie sum(SWS).' },
    { t: 'WHERE vor, HAVING nach dem Gruppieren', d: () => { const { svg, r, t, l } = DG; let s = r(10, 40, 120, 54, 'b') + t(70, 72, 'Tupel', 't', 'middle', 14, 600) + l(130, 67, 160, 67, 'l', 'a');
      s += r(162, 40, 110, 54, 'w') + t(217, 64, 'WHERE', 'tw', 'middle', 14, 700) + t(217, 82, 'filtert Tupel', 'm', 'middle', 11.5) + l(272, 67, 300, 67, 'l', 'a');
      s += r(302, 40, 110, 54, 'p') + t(357, 64, 'GROUP BY', 'tp', 'middle', 13.5, 700) + t(357, 82, 'bildet Gruppen', 'm', 'middle', 11.5) + l(412, 67, 438, 67, 'l', 'a');
      s += r(440, 40, 110, 54, 'g') + t(495, 64, 'HAVING', 'tg', 'middle', 14, 700) + t(495, 82, 'filtert Gruppen', 'm', 'middle', 11.5);
      s += t(217, 120, "Rang = 'C4'", 'm', 'middle', 12) + t(495, 120, 'avg(SWS) >= 3', 'm', 'middle', 12) + t(280, 150, 'Aggregatfunktion in der Bedingung? → HAVING', 'tp', 'middle', 13, 600);
      return svg(560, 164, s, 'WHERE filtert vor, HAVING nach der Gruppierung'); },
      x: 'WHERE arbeitet auf einzelnen Tupeln, bevor gruppiert wird – dort gibt es noch keine Summen oder Durchschnitte. HAVING arbeitet auf fertigen Gruppen und darf deshalb Aggregatfunktionen enthalten. WHERE sum(SWS) > 6 ist ein Fehler.' },
    { t: 'count(*), count(A), count(DISTINCT A)', d: () => { const { svg, r, t, tm } = DG; const v = ['C4', 'C4', null, 'C3', null];
      let s = t(60, 18, 'Attribut A', 'm', 'middle', 12.5, 600); v.forEach((x, i) => { s += r(20, 26 + i * 28, 80, 24, x === null ? 'n' : 'b', 5) + tm(60, 43 + i * 28, x === null ? 'NULL' : x, x === null ? 'm' : 't'); });
      [['count(*)', '5', 'zählt alle Tupel'], ['count(A)', '3', 'ignoriert NULL'], ['count(DISTINCT A)', '2', 'verschiedene Werte']].forEach(([f, n, d], i) => { const y = 30 + i * 46; s += r(150, y, 380, 38, i === 0 ? 'p' : i === 1 ? 'w' : 'g') + tm(160, y + 24, f, 't', 'start', 13) + t(340, y + 25, '= ' + n, 't', 'start', 16, 700) + t(390, y + 24, d, 'm', 'start', 12); });
      return svg(550, 176, s, 'Unterschied der count-Varianten'); },
      x: 'count(*) zählt Tupel, egal was drinsteht. count(A) und alle anderen Aggregatfunktionen ignorieren NULL. count(DISTINCT A) zählt verschiedene Werte. Wichtig nach einem LEFT JOIN: count(*) zählt auch das mit NULL aufgefüllte Tupel – für „0 Vorlesungen“ muss count(v.VorlNr) stehen.' },
  ],
  null: [
    { t: 'Drei Wahrheitswerte', d: () => { const { svg, r, t } = DG; const V = ['TRUE', 'NULL', 'FALSE'], col = { TRUE: 'g', NULL: 'w', FALSE: 'r' }, tc = { TRUE: 'tg', NULL: 'tw', FALSE: 'tr' };
      const AND = (a, b) => a === 'FALSE' || b === 'FALSE' ? 'FALSE' : a === 'NULL' || b === 'NULL' ? 'NULL' : 'TRUE', OR = (a, b) => a === 'TRUE' || b === 'TRUE' ? 'TRUE' : a === 'NULL' || b === 'NULL' ? 'NULL' : 'FALSE';
      let s = ''; [['AND', AND, 10], ['OR', OR, 290]].forEach(([n, f, x0]) => { s += t(x0 + 30, 30, n, 'tp', 'middle', 15, 700); V.forEach((b, j) => { s += t(x0 + 100 + j * 62, 30, b, 'm', 'middle', 11.5, 600); }); V.forEach((a, i) => { s += t(x0 + 30, 62 + i * 36, a, 'm', 'middle', 11.5, 600); V.forEach((b, j) => { const v = f(a, b); s += r(x0 + 72 + j * 62, 42 + i * 36, 56, 30, col[v], 6) + t(x0 + 100 + j * 62, 62 + i * 36, v, tc[v], 'middle', 11.5, 600); }); }); });
      s += t(280, 170, 'NOT TRUE = FALSE · NOT NULL = NULL · NOT FALSE = TRUE', 'm', 'middle', 12.5);
      return svg(560, 182, s, 'Wahrheitstafeln der dreiwertigen Logik'); },
      x: 'NULL steht für „unbekannt“. Ein Vergleich mit NULL ergibt NULL. Bei AND gewinnt FALSE (FALSE AND NULL = FALSE), bei OR gewinnt TRUE (TRUE OR NULL = TRUE). In allen anderen Fällen mit NULL bleibt das Ergebnis NULL. Im Labor kannst du die Tafeln selbst ausfüllen.' },
    { t: 'WHERE lässt nur TRUE durch', d: () => { const { svg, r, t, l } = DG; let s = r(220, 30, 110, 110, 'p') + t(275, 80, 'WHERE', 'tp', 'middle', 15, 700) + t(275, 100, 'Bedingung', 'm', 'middle', 12);
      [['TRUE', 'g', 'tg', 50], ['NULL', 'w', 'tw', 85], ['FALSE', 'r', 'tr', 120]].forEach(([v, c, tc, y]) => { s += r(30, y - 16, 90, 26, c, 6) + t(75, y + 1, v, tc, 'middle', 12.5, 600) + l(120, y - 3, 218, y - 3, 'l', 'a'); });
      s += l(330, 47, 420, 47, 'lg', 'g') + r(422, 32, 110, 30, 'g', 6) + t(477, 52, 'Ergebnis', 'tg', 'middle', 13, 600);
      s += t(400, 110, 'NULL und FALSE', 'tr', 'middle', 12.5, 600) + t(400, 126, 'fallen heraus', 'tr', 'middle', 12.5);
      return svg(550, 160, s, 'Nur Tupel mit TRUE passieren die WHERE-Bedingung'); },
      x: 'Ein Tupel kommt nur ins Ergebnis, wenn die Bedingung TRUE ergibt. Deshalb fällt ein Student mit Semester = NULL sogar bei „Semester < 13 OR Semester >= 13“ heraus: NULL OR NULL = NULL. Auf NULL prüft man nur mit IS NULL.' },
    { t: 'Die NOT-IN-Falle', d: () => { const { svg, r, t, tm } = DG; let s = tm(20, 30, "'Rome' NOT IN ('London', 'Paris', NULL)", 't', 'start', 14);
      s += t(20, 62, '=', 'm', 'start', 14);
      [["'Rome' <> 'London'", 'TRUE', 'g', 'tg'], ["'Rome' <> 'Paris'", 'TRUE', 'g', 'tg'], ["'Rome' <> NULL", 'NULL', 'w', 'tw']].forEach(([e, v, c, tc], i) => { const x = 28 + i * 178; s += r(x, 46, 150, 50, c) + tm(x + 75, 66, e, 't', 'middle', 11) + t(x + 75, 87, v, tc, 'middle', 13, 700); if (i < 2) s += t(x + 164, 76, 'AND', 'm', 'middle', 10, 700); });
      s += t(280, 124, 'TRUE AND TRUE AND NULL = NULL → kein Tupel', 'tr', 'middle', 14, 700) + t(280, 148, 'NULL-sicher: NOT EXISTS (… S.CITY = J.CITY)', 'tg', 'middle', 13, 600);
      return svg(560, 160, s, 'NOT IN mit NULL in der Liste ergibt nie TRUE'); },
      x: 'x NOT IN (Liste) ist eine AND-Kette von Ungleichungen. Steckt ein NULL in der Liste, ist ein Glied NULL und die ganze Kette nie TRUE – das Ergebnis ist leer (SPJ-Aufgabe 32d). NOT EXISTS vergleicht nur mit vorhandenen Partnern und ist deshalb sicher.' },
  ],
  sub: [
    { t: 'Unkorreliert vs. korreliert', d: () => { const { svg, r, t, tm, p } = DG; let s = t(135, 20, 'unkorreliert', 'tp', 'middle', 14, 700) + t(410, 20, 'korreliert', 'tw', 'middle', 14, 700);
      s += r(20, 32, 230, 110, 'b') + tm(30, 54, 'SELECT * FROM pruefen', 't', 'start', 11.5) + tm(30, 72, 'WHERE Note <', 't', 'start', 11.5) + r(40, 82, 200, 44, 'p') + tm(50, 100, '(SELECT avg(Note)', 'tp', 'start', 11) + tm(50, 116, ' FROM pruefen)', 'tp', 'start', 11);
      s += t(135, 162, 'einmal ausgewertet → 1,67', 'm', 'middle', 12);
      s += r(290, 32, 250, 110, 'b') + tm(300, 54, 'SELECT Name FROM Professoren p', 't', 'start', 11) + tm(300, 72, 'WHERE EXISTS', 't', 'start', 11.5) + r(310, 82, 220, 44, 'w') + tm(320, 100, '(… WHERE gelesenVon', 'tw', 'start', 11) + tm(320, 116, '       = p.PersNr)', 'tw', 'start', 11);
      s += p('M520 104 C 560 90, 560 60, 500 56', 'lw', 'w') + t(415, 162, 'pro Tupel von p neu ausgewertet', 'm', 'middle', 12);
      return svg(560, 174, s, 'Unkorrelierte und korrelierte Unterabfrage'); },
      x: 'Eine unkorrelierte Unterabfrage hängt nicht von der äußeren Anfrage ab und wird einmal ausgewertet. Eine korrelierte Unterabfrage verweist auf ein Attribut der äußeren Anfrage (p.PersNr) und wird gedanklich für jedes äußere Tupel neu ausgewertet.' },
    { t: 'Allquantor = doppeltes NOT EXISTS', d: () => { const { svg, r, t } = DG; let s = r(10, 14, 530, 150, 'b') + t(24, 38, 'Student s, für den gilt:', 't', 'start', 14, 600);
      s += r(30, 50, 490, 100, 'r') + t(44, 74, 'es gibt KEINE 4-SWS-Vorlesung v, …', 'tr', 'start', 13.5, 600);
      s += r(50, 86, 450, 50, 'r') + t(64, 116, '… die s NICHT hört (kein hören-Tupel mit s und v)', 'tr', 'start', 13);
      s += t(275, 188, '∀v (v.SWS = 4 ⇒ s hört v)  ≡  ¬∃v (v.SWS = 4 ∧ ¬ s hört v)', 'tp', 'middle', 13, 600);
      return svg(550, 200, s, 'Verschachtelte NOT EXISTS für den Allquantor'); },
      x: 'SQL hat keinen Allquantor. „Hört ALLE 4-SWS-Vorlesungen“ wird umgeformt zu „Es gibt keine 4-SWS-Vorlesung, die er nicht hört“ – zwei verschachtelte NOT EXISTS. Alternative: GROUP BY MatrNr HAVING count(DISTINCT VorlNr) = (SELECT count(*) FROM Vorlesungen WHERE SWS = 4).' },
    { t: 'Drei Wege zur gleichen Antwort', d: () => { const { svg, r, t, tm } = DG; const w = [['IN', 'WHERE MatrNr IN (SELECT MatrNr FROM hoeren)', 'p'], ['EXISTS', 'WHERE EXISTS (SELECT * FROM hoeren h WHERE h.MatrNr = s.MatrNr)', 'w'], ['JOIN', 'SELECT DISTINCT s.* FROM Studenten s JOIN hoeren h ON …', 'g']];
      let s = t(20, 22, 'Studenten, die mindestens eine Vorlesung hören (6 Tupel)', 't', 'start', 13.5, 600);
      w.forEach(([n, q, c], i) => { const y = 36 + i * 44; s += r(20, y, 520, 36, c) + t(36, y + 23, n, 't', 'start', 13, 700) + tm(110, y + 23, q, 't', 'start', 11); });
      return svg(560, 172, s, 'IN, EXISTS und JOIN liefern dasselbe Ergebnis'); },
      x: 'Viele Anfragen lassen sich auf mehrere Arten schreiben. Beim JOIN braucht man DISTINCT, weil Studenten mit mehreren Vorlesungen sonst mehrfach erscheinen. Für die Verneinung („hört nichts“) ist NOT EXISTS die sichere Wahl, NOT IN scheitert an NULL.' },
  ],
  rek: [
    { t: 'Der Voraussetzungsgraph', d: () => { const { svg, r, t, l } = DG; const N = { 5001: [270, 22, 'Grundzüge', 3], 5041: [130, 96, 'Ethik', 2], 5043: [270, 96, 'Erkenntnisth.', 2], 5049: [410, 96, 'Mäeutik', 0], 5216: [60, 166, 'Bioethik', 0], 5052: [230, 166, 'Wissensch.th.', 1], 5259: [230, 236, 'Der Wiener Kreis', 9] };
      const E = [[5001, 5041], [5001, 5043], [5001, 5049], [5041, 5216], [5043, 5052], [5041, 5052], [5052, 5259]];
      let s = ''; E.forEach(([a, b]) => { s += l(N[a][0], N[a][1] + 14, N[b][0], N[b][1] - 16, [5001, 5041, 5043, 5052].includes(a) && [5041, 5043, 5052, 5259].includes(b) ? 'lp' : 'l', [5001, 5041, 5043, 5052].includes(a) && [5041, 5043, 5052, 5259].includes(b) ? 'p' : 'a'); });
      Object.entries(N).forEach(([k, [x, y, n, lv]]) => { const cl = lv === 9 ? 'w' : lv ? 'p' : 'b'; s += r(x - 70, y - 15, 140, 30, cl, 8) + t(x, y + 5, n + (lv && lv < 9 ? ' · St. ' + lv : ''), 't', 'middle', 11.5); });
      return svg(540, 260, s, 'Voraussetzungsgraph mit den Vorgängern von Der Wiener Kreis'); },
      x: 'Die Relation voraussetzen ist ein Graph. Die Vorgänger von „Der Wiener Kreis“: Stufe 1 Wissenschaftstheorie, Stufe 2 Erkenntnistheorie und Ethik, Stufe 3 Grundzüge. Ein einfacher Join findet nur Stufe 1; alle Stufen zusammen heißen transitive Hülle.' },
    { t: 'Pro Stufe ein Self Join – oder Rekursion', d: () => { const { svg, r, t, tm, p, l } = DG; let s = t(130, 20, 'SQL-92: feste Stufen', 't', 'middle', 13.5, 600) + t(410, 20, 'WITH RECURSIVE', 'tp', 'middle', 13.5, 700);
      ['1 Stufe: 1 Join', '2 Stufen: 2 Joins', '3 Stufen: 3 Joins', 'n Stufen: ???'].forEach((v, i) => { s += r(30, 32 + i * 34, 200, 28, i === 3 ? 'r' : 'b', 6) + t(130, 51 + i * 34, v, i === 3 ? 'tr' : 't', 'middle', 12.5); });
      s += r(300, 34, 220, 40, 'p') + t(410, 59, 'Startanfrage (Stufe 1)', 't', 'middle', 12.5) + l(410, 74, 410, 92, 'l', 'a');
      s += r(300, 94, 220, 40, 'p') + t(410, 119, 'Rekursionsschritt (+1 Stufe)', 't', 'middle', 12.5) + p('M520 114 C 560 114, 560 150, 470 150 L 470 136', 'lp', 'p') + t(460, 168, 'bis nichts Neues kommt', 'm', 'middle', 11.5);
      return svg(560, 178, s, 'Feste Self Joins gegenüber rekursiver Anfrage'); },
      x: 'SQL-92 ist nicht Turing-vollständig: Für jede Stufe braucht man einen weiteren Self Join, für beliebig viele Stufen geht es gar nicht. SQL:1999 bietet WITH RECURSIVE (Startanfrage UNION Rekursionsschritt), Oracle zusätzlich CONNECT BY … PRIOR … START WITH.' },
  ],
  views: [
    { t: 'Sicht vs. materialisierte Sicht', d: () => { const { svg, r, t, l } = DG; let s = r(20, 70, 120, 40, 'b') + t(80, 95, 'Basisrelationen', 't', 'middle', 12.5);
      s += l(140, 82, 260, 46, 'l', 'a') + l(140, 98, 260, 136, 'l', 'a');
      s += r(262, 20, 270, 52, 'p') + t(397, 42, 'VIEW', 'tp', 'middle', 14, 700) + t(397, 60, 'nur die Anfrage – immer aktuell', 'm', 'middle', 12);
      s += r(262, 110, 270, 52, 'w') + t(397, 132, 'MATERIALIZED VIEW', 'tw', 'middle', 14, 700) + t(397, 150, 'Ergebnis gespeichert, braucht Refresh', 'm', 'middle', 11.5);
      return svg(550, 176, s, 'Sicht und materialisierte Sicht'); },
      x: 'Eine VIEW speichert nur die Anfrage und wird bei jedem Zugriff neu ausgewertet. Vorteile laut VL: Benutzerfreundlichkeit, Datenschutz, logische Datenunabhängigkeit. Eine MATERIALIZED VIEW speichert das Ergebnis – schneller, braucht aber Platz und muss aktualisiert werden. Sichten mit GROUP BY, DISTINCT oder mehreren Relationen sind i. A. nicht update-fähig.' },
    { t: 'Professor löschen – was passiert mit seinen Vorlesungen?', d: () => { const { svg, r, t, tm } = DG; let s = r(20, 20, 160, 36, 'r') + tm(100, 43, 'DELETE Sokrates', 'tr', 'middle', 12.5);
      [['Default', 'Löschen wird zurückgewiesen', 'b', 't'], ['ON DELETE CASCADE', 'Ethik, Mäeutik, Logik werden mitgelöscht', 'r', 'tr'], ['ON DELETE SET NULL', 'gelesenVon = NULL bei 3 Vorlesungen', 'w', 'tw']].forEach(([n, d, c, tc], i) => { const y = 74 + i * 46; s += r(20, y, 520, 38, c) + t(34, y + 24, n, tc, 'start', 13, 700) + t(220, y + 24, d, 't', 'start', 12.5); });
      return svg(560, 216, s, 'Drei Reaktionen der referentiellen Integrität'); },
      x: 'Referentielle Integrität: Ein Fremdschlüssel verweist auf ein existierendes Tupel oder ist NULL. Wird das referenzierte Tupel gelöscht, gibt es drei Reaktionen: zurückweisen (Standard), CASCADE (mitlöschen – Vorsicht, kann weitere Tupel wie hoeren betreffen) oder SET NULL.' },
    { t: 'Constraint prüft Zustände, Trigger Übergänge', d: () => { const { svg, r, t, l, tm } = DG; let s = r(20, 30, 200, 90, 'g') + t(120, 56, 'CONSTRAINT (statisch)', 'tg', 'middle', 13, 700) + tm(120, 82, 'CHECK (SWS BETWEEN 1 AND 8)', 't', 'middle', 10.5) + t(120, 104, 'gilt für jeden Zustand', 'm', 'middle', 12);
      s += r(270, 30, 100, 40, 'b') + t(320, 55, 'alt: C4', 't', 'middle', 12.5) + l(370, 50, 410, 50, 'lw', 'w') + r(412, 30, 120, 40, 'b') + t(472, 55, 'neu: C3 ?', 't', 'middle', 12.5);
      s += r(270, 84, 262, 36, 'w') + t(401, 107, 'TRIGGER (dynamisch) prüft alt → neu', 'tw', 'middle', 12.5, 600);
      return svg(550, 136, s, 'Statische Constraints und dynamische Trigger'); },
      x: 'Statische Integritätsbedingungen beschreiben erlaubte Zustände: NOT NULL, UNIQUE, CHECK, PRIMARY KEY, FOREIGN KEY. Dynamische beschreiben erlaubte Übergänge („ein C4 darf nicht zu C3 werden“) – dafür braucht man Trigger, weil nur sie den alten UND den neuen Wert kennen.' },
  ],
  plsql: [
    { t: 'Ablauf eines Zeilentriggers', d: () => { const { svg, r, t, l, tm } = DG; const st = [['UPDATE', 'Anweisung', 'b', 't'], ['BEFORE', ':new noch änderbar', 'p', 'tp'], ['Speichern', 'Tupel wird geschrieben', 'b', 't'], ['AFTER', 'z. B. protokollieren', 'g', 'tg']];
      let s = ''; st.forEach(([n, d, c, tc], i) => { const x = 10 + i * 138; s += r(x, 26, 126, 64, c) + t(x + 63, 52, n, tc, 'middle', 14, 700) + t(x + 63, 74, d, 'm', 'middle', 10.5); if (i < 3) s += l(x + 126, 58, x + 138, 58, 'l', 'a'); });
      s += tm(280, 120, 'WHEN (old.Note <= 4.0)  →  RAISE_APPLICATION_ERROR', 'tr', 'middle', 12) + t(280, 142, 'FOR EACH ROW: läuft einmal pro geändertem Tupel', 'm', 'middle', 12);
      return svg(560, 154, s, 'Ablauf eines BEFORE- und AFTER-Zeilentriggers'); },
      x: 'Ein BEFORE-Trigger läuft vor dem Schreiben: Er sieht :old und :new und kann :new ändern (keineDegradierung) oder mit RAISE_APPLICATION_ERROR abbrechen (Praktikum #6.4). Ein AFTER-Trigger läuft danach. In der WHEN-Klausel ohne Doppelpunkt (old.Note), im Rumpf mit (:old.Note).' },
    { t: 'Cursor: mengenorientiert → satzweise', d: () => { const { svg, r, t, tm, l } = DG; let s = r(20, 26, 200, 128, 'b') + t(120, 18, 'Ergebnis im Cursor', 'm', 'middle', 12, 600);
      ['Sokrates', 'Russel', 'Curie', 'Kant'].forEach((n, i) => { s += r(30, 36 + i * 28, 180, 24, i === 1 ? 'p' : 's', 5) + tm(120, 53 + i * 28, n, i === 1 ? 'tp' : 't'); });
      s += l(240, 76, 214, 76, 'lp', 'p') + t(248, 80, 'FETCH holt das nächste Tupel', 'tp', 'start', 12.5);
      [['OPEN c', 'Anfrage ausführen'], ['LOOP FETCH c INTO v', 'satzweise holen'], ['EXIT WHEN c%NOTFOUND', 'Ende erkennen'], ['CLOSE c', 'freigeben']].forEach(([a, b], i) => { s += tm(248, 108 + i * 18, a, 't', 'start', 11) + t(430, 108 + i * 18, b, 'm', 'start', 11); });
      return svg(560, 176, s, 'Expliziter Cursor mit OPEN, FETCH und CLOSE'); },
      x: 'Das DBMS liefert Mengen, Programme verarbeiten Tupel einzeln. Der Cursor überbrückt das: OPEN führt die Anfrage aus, FETCH holt Tupel für Tupel, %NOTFOUND erkennt das Ende, CLOSE gibt frei. Implizite Cursor (SELECT INTO, CURSOR FOR LOOP) erledigen OPEN/FETCH/CLOSE automatisch.' },
    { t: 'Function, Procedure, Package', d: () => { const { svg, r, t, tm } = DG; let s = r(10, 20, 170, 120, 'p') + t(95, 44, 'FUNCTION', 'tp', 'middle', 14, 700) + t(95, 66, 'MUSS Wert liefern', 't', 'middle', 12) + tm(95, 90, 'RETURN v;', 't', 'middle', 11.5) + tm(95, 114, 'SELECT f(10) FROM dual', 'm', 'middle', 10);
      s += r(195, 20, 170, 120, 'w') + t(280, 44, 'PROCEDURE', 'tw', 'middle', 14, 700) + t(280, 66, 'muss nichts liefern', 't', 'middle', 12) + tm(280, 90, 'p (IN x, OUT y)', 't', 'middle', 11.5) + tm(280, 114, 'Aufruf im Block', 'm', 'middle', 10);
      s += r(380, 20, 170, 120, 'g') + t(465, 44, 'PACKAGE', 'tg', 'middle', 14, 700) + t(465, 70, 'Specification', 't', 'middle', 12) + t(465, 88, '+ Body', 't', 'middle', 12) + t(465, 114, 'bündelt beides', 'm', 'middle', 11);
      return svg(560, 154, s, 'Function, Procedure und Package im Vergleich'); },
      x: 'Eine Function MUSS einen Wert zurückgeben und lässt sich in SQL aufrufen (BerechneAlter). Eine Procedure muss nichts zurückgeben, kann aber OUT-Parameter haben. Ein Package bündelt Functions, Procedures, Typen, Variablen, Cursor und Exceptions in Specification + Body.' },
  ],
};
