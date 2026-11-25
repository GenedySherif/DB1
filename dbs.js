/* Übungsdatenbanken für die SQL-Konsole (SQLite-Dialekt im Browser).
   Uni-DB nach Kemper/Eickler (VL #3 Folie 3), SPJ-DB nach Praktikumsblatt #4, Familienbaum nach Praktikumsblatt #5.
   Tabellennamen ohne Umlaute wie im DBPRAKT-Schema: hoeren, pruefen, Vorgaenger. */
var DBS = {
  uni: {
    label: 'Uni-DB (Kemper)',
    tables: ['Studenten', 'Professoren', 'Assistenten', 'Vorlesungen', 'hoeren', 'voraussetzen', 'pruefen'],
    sql: `
CREATE TABLE Studenten (MatrNr INTEGER PRIMARY KEY, Name VARCHAR(30) NOT NULL, Semester INTEGER);
CREATE TABLE Professoren (PersNr INTEGER PRIMARY KEY, Name VARCHAR(30) NOT NULL, Rang CHAR(2) CHECK (Rang IN ('C2','C3','C4')), Raum INTEGER UNIQUE);
CREATE TABLE Assistenten (PersNr INTEGER PRIMARY KEY, Name VARCHAR(30) NOT NULL, Fachgebiet VARCHAR(30), Boss INTEGER REFERENCES Professoren(PersNr));
CREATE TABLE Vorlesungen (VorlNr INTEGER PRIMARY KEY, Titel VARCHAR(30), SWS INTEGER, gelesenVon INTEGER REFERENCES Professoren(PersNr));
CREATE TABLE hoeren (MatrNr INTEGER REFERENCES Studenten(MatrNr), VorlNr INTEGER REFERENCES Vorlesungen(VorlNr), PRIMARY KEY (MatrNr, VorlNr));
CREATE TABLE voraussetzen (Vorgaenger INTEGER REFERENCES Vorlesungen(VorlNr), Nachfolger INTEGER REFERENCES Vorlesungen(VorlNr), PRIMARY KEY (Vorgaenger, Nachfolger));
CREATE TABLE pruefen (MatrNr INTEGER REFERENCES Studenten(MatrNr), VorlNr INTEGER REFERENCES Vorlesungen(VorlNr), PersNr INTEGER REFERENCES Professoren(PersNr), Note NUMERIC(2,1) CHECK (Note BETWEEN 0.7 AND 5.0), PRIMARY KEY (MatrNr, VorlNr));
INSERT INTO Studenten VALUES (24002,'Xenokrates',18),(25403,'Jonas',12),(26120,'Fichte',10),(26830,'Aristoxenos',8),(27550,'Schopenhauer',6),(28106,'Carnap',3),(29120,'Theophrastos',2),(29555,'Feuerbach',2);
INSERT INTO Professoren VALUES (2125,'Sokrates','C4',226),(2126,'Russel','C4',232),(2127,'Kopernikus','C3',310),(2133,'Popper','C3',52),(2134,'Augustinus','C3',309),(2136,'Curie','C4',36),(2137,'Kant','C4',7);
INSERT INTO Assistenten VALUES (3002,'Platon','Ideenlehre',2125),(3003,'Aristoteles','Syllogistik',2125),(3004,'Wittgenstein','Sprachtheorie',2126),(3005,'Rhetikus','Planetenbewegung',2127),(3006,'Newton','Keplersche Gesetze',2127),(3007,'Spinoza','Gott und Natur',2126);
INSERT INTO Vorlesungen VALUES (5001,'Grundzüge',4,2137),(5041,'Ethik',4,2125),(5043,'Erkenntnistheorie',3,2126),(5049,'Mäeutik',2,2125),(4052,'Logik',4,2125),(5052,'Wissenschaftstheorie',3,2126),(5216,'Bioethik',2,2126),(5259,'Der Wiener Kreis',2,2133),(5022,'Glaube und Wissen',2,2134),(4630,'Die 3 Kritiken',4,2137);
INSERT INTO hoeren VALUES (26120,5001),(27550,5001),(27550,4052),(28106,5041),(28106,5052),(28106,5216),(28106,5259),(29120,5001),(29120,5041),(29120,5049),(29555,5022),(25403,5022),(29555,5001);
INSERT INTO voraussetzen VALUES (5001,5041),(5001,5043),(5001,5049),(5041,5216),(5043,5052),(5041,5052),(5052,5259);
INSERT INTO pruefen VALUES (28106,5001,2126,1.0),(25403,5041,2125,2.0),(27550,4630,2137,2.0);
`
  },
  spj: {
    label: 'SPJ-DB (Lieferungen)',
    tables: ['S', 'P', 'J', 'SPJ'],
    sql: `
CREATE TABLE S (SNO CHAR(3) PRIMARY KEY, SNAME VARCHAR(20), STATUS INTEGER, CITY VARCHAR(20));
CREATE TABLE P (PNO CHAR(3) PRIMARY KEY, PNAME VARCHAR(20), COLOR VARCHAR(10), WEIGHT INTEGER, CITY VARCHAR(20));
CREATE TABLE J (JNO CHAR(3) PRIMARY KEY, JNAME VARCHAR(20), CITY VARCHAR(20));
CREATE TABLE SPJ (SNO CHAR(3) REFERENCES S(SNO), PNO CHAR(3) REFERENCES P(PNO), JNO CHAR(3) REFERENCES J(JNO), QTY INTEGER, PRIMARY KEY (SNO, PNO, JNO));
INSERT INTO S VALUES ('S1','Smith',20,'London'),('S2','Jones',10,'Paris'),('S3','Blake',30,'Paris'),('S4','Clark',20,'London'),('S5','Adams',30,'Athens');
INSERT INTO P VALUES ('P1','Nut','Red',12,'London'),('P2','Bolt','Green',17,'Paris'),('P3','Screw','Blue',17,'Rome'),('P4','Screw','Red',14,'London'),('P5','Cam','Blue',12,'Paris'),('P6','Cog','Red',19,'London');
INSERT INTO J VALUES ('J1','Sorter','Paris'),('J2','Punch','Rome'),('J3','Reader','Athens'),('J4','Console','Athens'),('J5','Collator','London'),('J6','Terminal','Oslo'),('J7','Tape','London');
INSERT INTO SPJ VALUES ('S1','P1','J1',200),('S1','P1','J4',700),('S2','P3','J1',400),('S2','P3','J2',200),('S2','P3','J3',200),('S2','P3','J4',500),('S2','P3','J5',600),('S2','P3','J6',400),('S2','P3','J7',800),('S2','P5','J2',100),('S3','P3','J1',200),('S3','P4','J2',500),('S4','P6','J3',300),('S4','P6','J7',300),('S5','P2','J2',200),('S5','P2','J4',100),('S5','P5','J5',500),('S5','P5','J7',100),('S5','P6','J2',200),('S5','P1','J4',100),('S5','P3','J4',200),('S5','P4','J4',800),('S5','P5','J4',400),('S5','P6','J4',500);
`
  },
  fam: {
    label: 'Familienbaum',
    tables: ['Person', 'Elternteil'],
    sql: `
CREATE TABLE Person (Name VARCHAR(20) PRIMARY KEY, Geschlecht CHAR(1) CHECK (Geschlecht IN ('M','F')), Geburtsjahr INTEGER NOT NULL, Sterbejahr INTEGER);
CREATE TABLE Elternteil (Kind VARCHAR(20) REFERENCES Person(Name), Elternteil VARCHAR(20) REFERENCES Person(Name), PRIMARY KEY (Kind, Elternteil));
INSERT INTO Person VALUES ('Albert','M',1917,1966),('Anna','F',1923,2003),('Hans','M',1940,1982),('Maria','F',1946,NULL),('Rudolf','M',1950,NULL),('Wilhelm','M',1942,2015),('Dagmar','F',1945,NULL),('Markus','M',1965,NULL),('Ute','F',1970,NULL),('Silke','F',1968,NULL),('Thomas','M',1966,NULL),('Anke','F',1974,NULL),('Till','M',1971,NULL),('Sven','M',1995,NULL),('Olaf','M',1997,NULL),('Sonja','F',1988,NULL),('Andrea','M',1994,NULL),('Tom','M',2000,NULL),('Tim','M',2004,NULL),('Tina','F',2010,NULL);
INSERT INTO Elternteil VALUES ('Hans','Albert'),('Hans','Anna'),('Rudolf','Albert'),('Rudolf','Anna'),('Dagmar','Albert'),('Dagmar','Anna'),('Markus','Hans'),('Markus','Maria'),('Silke','Hans'),('Silke','Maria'),('Anke','Wilhelm'),('Anke','Dagmar'),('Sven','Markus'),('Sven','Ute'),('Olaf','Markus'),('Olaf','Ute'),('Sonja','Silke'),('Sonja','Thomas'),('Andrea','Silke'),('Andrea','Thomas'),('Tom','Anke'),('Tom','Till'),('Tim','Anke'),('Tim','Till'),('Tina','Anke'),('Tina','Till');
`
  }
};
if (typeof module !== 'undefined') module.exports = DBS;
