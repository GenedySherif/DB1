# DB Lern-App – Datenbanksysteme (HM, WiSe 2026/27)

Interaktive Lern-App zu den Vorlesungen #1–#7 und Praktika #1–#6 (B. Milijaš).

## Inhalt
- **Start**: Tagesziel, Lernserie, Modul-Kacheln mit Fortschritt, Klausur-Top-10, Wochenplan
- **Karteikarten**: 109 Karten mit Leitner-Wiederholung (1, 3, 7, 14, 30 Tage)
- **Quiz**: 107 Multiple-Choice-Fragen mit Erklärung, Bestwert pro Modul, Fehler wiederholen
- **Labor**: Join-Visualisierer, Algebra-Operatoren (σ π ρ ∪ ∩ − ÷), GROUP BY Schritt für Schritt, NULL-Wahrheitstafeln
- **Puzzles**: 26 SQL-Puzzles (Reihenfolge, Lückentext, Fehler finden)
- **Konsole**: SQLite im Browser (sql.js) mit Uni-DB, SPJ-DB und Familienbaum; automatische Prüfung gegen Musterlösungen
- **Praktika**: alle Aufgaben mit Denkanstoß und Lösung

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
| `content.js` | Vorlesungen, Praktika, SQL-Training, Wochenplan |
| `dbs.js` | Übungsdatenbanken (SQL) |
| `sql-wasm.js`, `sql-wasm.wasm` | sql.js 1.12.0 (SQLite im Browser, MIT-Lizenz) |
| `slides/` | Ausgewählte Folien aus den Vorlesungen (nur zum privaten Lernen) |
| `tools/verify.js` | Prüft alle Musterlösungen gegen die Datenbanken (`npm i sql.js && node tools/verify.js`) |

## Hinweis
Die Konsole nutzt SQLite. Standard-SQL läuft wie in Oracle; Oracle-Spezifika (NVL, MINUS, CONNECT BY, PL/SQL, Trigger) in DBPRAKT (Oracle 19c) testen.
