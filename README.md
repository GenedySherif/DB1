# DB Lern-App – Datenbanksysteme (HM, WiSe 2026/27)

Interaktive Lern-App zu den Vorlesungen #1–#7 und Praktika #1–#6 (B. Milijaš).

## Inhalt
Schwerpunkt laut Prof: relationales Modell, relationale Algebra, Tupelkalkül und SQL (> 80 % der Klausur).

- **Start**: Lernpfad, Tagesziel, Lernserie, 12 Module mit Fortschritt, Klausur-Top-10, Wochenplan
- **Lektionen**: pro Modul Schritt-für-Schritt-Erklärungen mit Diagrammen (37 Schritte)
- **Karteikarten**: 137 Karten mit Leitner-Wiederholung, Export nach RemNote („Frage == Antwort“)
- **Quiz**: 174 Fragen mit Erklärung, Bestwert pro Modul, persönliche Fehlerliste
- **Labor**: Join-Visualisierer, Algebra-Operatoren (σ π ρ ∪ ∩ − ÷), GROUP BY Schritt für Schritt, NULL-Logik
- **Puzzles**: 45 SQL-Puzzles (Reihenfolge, Lückentext, Fehler finden)
- **Konsole**: SQLite im Browser (sql.js) mit Uni-DB, SPJ-DB und Familienbaum; automatische Prüfung von Anfragen, DML (INSERT/UPDATE/DELETE/UPSERT) und DDL (CREATE/ALTER/DROP)
- **Klausurniveau**: 20 Klausuraufgaben (SQL, DML, DDL) + 22 Papieraufgaben (Algebra, Tupelkalkül, MERGE, DDL)
- **Probeklausur**: 45 min, 26 Punkte, gewichtet nach Klausurschwerpunkt
- **Praktika**: alle Aufgaben mit Denkanstoß und Lösung
- **Suche** über Kernwissen, Lektionen, Karten, Quiz und Aufgaben

## Starten
Die App braucht einen lokalen Webserver (wegen `sql-wasm.wasm`):

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Fortschritt wird im `localStorage` des Browsers gespeichert.

## Dateien
| Datei | Inhalt |
|---|---|
| `index.html` | Layout und Design |
| `app.js` | App-Logik (Karten, Quiz, Labor, Puzzles, Konsole) |
| `learn.js` | Module, Kernwissen, Karteikarten, Quiz, Puzzles |
| `lessons.js` | Lektionen mit SVG-Diagrammen |
| `klausur.js` | Klausur-Paket: Tupelkalkül, DML/DDL inkl. MERGE/UPSERT, Klausuraufgaben |
| `content.js` | Vorlesungen, Praktika, SQL-Training, Wochenplan |
| `dbs.js` | Übungsdatenbanken (SQL) |
| `sql-wasm.js`, `sql-wasm.wasm` | sql.js 1.12.0 (SQLite im Browser, MIT-Lizenz) |
| `slides/` | Ausgewählte Folien aus den Vorlesungen (nur zum privaten Lernen) |
| `tools/verify.js` | Prüft alle Musterlösungen gegen die Datenbanken (`npm i sql.js && node tools/verify.js`) |

## Hinweis
Die Konsole nutzt SQLite. Standard-SQL läuft wie in Oracle; Oracle-Spezifika (NVL, MINUS, CONNECT BY, MERGE, PL/SQL, Trigger) in DBPRAKT (Oracle 19c) testen. UPSERT läuft in der Konsole als `INSERT … ON CONFLICT` (SQLite/PostgreSQL); in Oracle über `MERGE`.
