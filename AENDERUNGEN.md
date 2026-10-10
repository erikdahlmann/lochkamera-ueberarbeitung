# Lochkamera – geplante Änderungen

Grundlage: https://viethtom.github.io/lochkamera/ (Thomas Vieth), alle 7 Seiten in 3D- und 2D-Fassung.
Geprüft: Quelltext Zeile für Zeile, alle Seiten im Browser (iPad-Breite und Handy), dazu ein unabhängiges Gutachten von ChatGPT.

Kennzeichen: **(C)** von Claude gefunden, **(G)** von ChatGPT, **(C+G)** von beiden. Punkte von ChatGPT habe ich im Code nachgeprüft.
S1 bis S6 = Station 1 bis 6, S0 = Übersicht.

Gesamturteil: Das Original ist technisch und fachlich stark. Die Liste unten ist Feinschliff, keine Rettung.

## Stand 10.10.2026: alles umgesetzt

Alle 61 Punkte sind umgesetzt, in der 3D- und in der 2D-Fassung. Beide Entscheidungen wie empfohlen: 2D bekommt dieselben Texte und Korrekturen; Begriffe wie bei LEIFI (Abbildungsmaßstab, Linsengleichung).

Zusätzlich (Wunsch „mehr Details, schicke Hintergründe“):
- Abgedunkelter Physikraum hinter allen Labor-Szenen: Tafel mit Kreide-Skizzen (Lochkamera, Linse, Formeln), Poster „Das Licht“ mit Spektrum, Uhr, Fenster mit geschlossenen Jalousien und Lichtschlitzen, Glasschrank, Deckenleuchten, leichter Nebel nach hinten.
- Experimentiertisch mit Kantenleiste, Gestell und Schubladenschrank.
- Landschaft der Übersicht: Teich mit Schilf, Rauch aus dem Schornstein, kreisende Vögel, ziehende Wolken.

Hinweise zur Umsetzung:
- Station 6: Die alte Antwort aus „Aufgabe 2/3“ (gemeinsamer Speicher „a2“) bleibt bei Aufgabe 2. Aufgabe 3 hat ein neues, leeres Feld.
- Der Abschluss-Text aus Station 5 wird beim ersten Öffnen von Station 6 automatisch übernommen.
- Die Helligkeit der Schirmbilder ist jetzt in Station 0, 1 und 2 gleich geeicht. Kleine Löcher ergeben deshalb wirklich dunkle Bilder.
- Neu sind das Verschieben der Linse in Station 6 und die Draufsicht ohne Perspektive (Station 1, 3, 4); Drehen ist in der Draufsicht gesperrt, „↺ Start“ hebt das auf.


---

## A. Echte Fehler

1. **S6: Zwei Antwortfelder überschreiben sich.** Aufgabe 2 und Aufgabe 3 speichern beide unter „a2“. Neuer Name für Aufgabe 3, alte Antworten bleiben erhalten. (C+G)
2. **„Ergebnisse kopieren“ vergisst Antworten:** S1 Aufgabe 1 und 2, S2 Profi-Aufgabe, S6 alle Rechenaufgaben. Künftig wird alles kopiert. (C+G)
3. **S6 Aufgabe 1 ist nicht lösbar:** Bei g = 120 mm braucht Linse B den Schirm bei 600 mm. Die Bank „nah“ reicht nur bis 445 mm. Bank schaltet automatisch um, oder der Bereich wird größer. (G)
4. **S6 Rechenaufgaben „prüft mit der Simulation“:** g = 4,2 m und 20 m lassen sich nicht einstellen. Bereich erweitern oder Text anpassen. Aufgabe 9 fragt nach der Linse, hat aber kein Feld dafür. (G)
5. **S6 „Bild ist scharf“ kommt zu früh:** Bei kleiner Öffnung (d = 5 mm) gilt b = 185 mm schon als scharf, richtig wäre 200 mm. Die Messwerte für die Linsengleichung weichen dann bis 4 % ab. Neue Prüfung: höchstens 1 % neben der richtigen Bildweite. (G)
6. **S6 Bild wird abgeschnitten:** Der Kerzenfuß sitzt auf der Achse. Das Bild liegt nur in der unteren Schirmhälfte. Schon bei g = b = 200 mm fehlt die Flammenspitze. Schirm passend setzen, Hinweis „Bild größer als der Schirm“. (G)
7. **S3/S4 Raster stimmt nicht:** Text sagt „1 Kästchen = 1 cm“, die Kästchen sind 10 mm × 6,25 mm. (G)
8. **S1 Motiv „Haus“:** Die Unschärfe wird mit 40 cm Abstand gerechnet, das Haus steht aber 42 m weit weg. Der Fleck ist dadurch zu groß. (G)
9. **S1 Aufgabe 2:** Die gelben Lämpchen verschmelzen im ganzen Reglerbereich nie (Bildabstand 33 mm, größter Fleck 16,5 mm). Lämpchen näher zusammen. (G, nachgerechnet)
10. **Animationen:** Schnelles Doppeltippen auf „Box einschalten“ (S2) startet zwei Animationen gleichzeitig. „Loch langsam vergrößern“ (S1) lässt sich nicht anhalten. (G)
11. **S6 Experiment-Tabelle:** Ausgerechnete Quotienten bleiben stehen, wenn man danach Messwerte ändert. (G)
12. **S4 Wellenmodell:** Bei Totalreflexion verschwindet die Welle einfach. Es fehlt die zurückgeworfene Welle. (G)
13. **Technik-Kleinkram:** Ein zweiter Finger stört das Ziehen von Lampe/Kerze. Die Knöpfe − und + gehen nicht mit der Tastatur. Bei langem Arbeiten sammelt sich Grafikspeicher an (iPad wird langsam). Gespeicherte Tabellenwerte werden ungeprüft als HTML eingesetzt. (G)

## B. Fachliche Korrekturen

14. **S4 Merke „alle Strahlen treffen sich im Brennpunkt“:** gilt nur für achsenparalleles Licht nahe der Achse. Die Simulation zeigt sogar sichtbar den Linsenfehler (Randstrahlen schneiden sich früher). Neu: zuerst ein schmales Bündel, Schalter „Randstrahlen zeigen“ mit einem Satz zum Linsenfehler. (C+G)
15. **Beugung fehlt:** Sehr kleine Löcher machen das echte Bild wieder unschärfer. Bei b = 15 cm ist das beste Loch etwa 0,45 mm groß. Neu: Profi-Schalter „Beugung berücksichtigen“ und ein Satz im Merke-Kasten. (C+G)
16. **S1 Merke „Fleck ungefähr so groß wie das Loch“:** stimmt nur bei weit entfernten Gegenständen. In der Simulation (40 cm) ist er 1,4-mal so groß. Neu: „Bei fernen Gegenständen etwa so groß wie das Loch, bei nahen größer.“ (C+G)
17. **S1 „Jeder Punkt sendet Licht in alle Richtungen“:** Neu: „Selbst leuchtende und beleuchtete Gegenstände: Beleuchtete streuen das Licht in viele Richtungen.“ (G)
18. **S6 Begriffe:** Dort heißt B : G = b : g „Abbildungsgleichung“. LEIFIphysik und viele Schulbücher nennen 1/f = 1/g + 1/b so. Vorschlag: „Abbildungsmaßstab“ für B : G = b : g und „Linsengleichung (Abbildungsgleichung)“ für 1/f = 1/g + 1/b. (C)
19. **S6 Zirkelschluss:** Die Simulation trägt B schon als G · b / g ein. Dann sollen die Schüler B : G = b : g „entdecken“. Neu: Maßstab am Schirmbild, die Schüler lesen B selbst ab. (G)
20. **Zerstreuungslinse und Sonderfälle (S2, S6):** „kein Bild“ → „kein Bild auf dem Schirm“ (es gibt ein virtuelles Bild). Bei g = f eigene Meldung statt „verschiebt den Schirm“. Bildgröße B nur zeigen, wenn das Bild scharf ist. Die drei besonderen Strahlen auch für Zerstreuungslinsen richtig zeigen und erklären. Konstruktionslinien gestrichelt. (C+G)
21. **S3 „Glaskugel“ ist ein Zylinder.** Neu: „Glaszylinder“. „Halbkreis“ wird „Halbzylinder“ wie in S5. (C+G)
22. **S4 Brechzahl n wird nie erklärt.** Neu: ein Satz und eine kleine Tabelle (Wasser 1,33 · Glas 1,5 · Diamant 2,42). (C)
23. **S3 zeigt das Wort „Totalreflexion“, bevor S4 es einführt.** Neu in S3: „Das Licht kommt nicht heraus, es wird zurückgeworfen (mehr in Station 4).“ (C)
24. **Durchmesser-Regler (S2, S6) baut die Linse neu, sie wird dicker.** Bei einer echten Kamera bleibt die Linse gleich und eine Blende davor ändert die Öffnung. Neu: Linse fest, sichtbare Blende, Regler „Öffnung d“. (G)
25. **S5 Versuch 3:** Eine Lampe mit mehreren Spalten liefert kein paralleles Licht. Neu: „Leuchte mit Parallel-Aufsatz“. S5 Profi: C + E zerstreut (f ≈ −200 mm), dafür eine Antwortmöglichkeit. (G)
26. **S1 Realversuch:** „Stecht nacheinander Löcher hinein“ erzeugt mehrere Löcher gleichzeitig und damit mehrere Bilder. Neu: jedes Loch in ein eigenes Stück Folie. (G)
27. **S5 Sicherheit:** „Laserpointer“ → „nur Schullaser der Klasse 1 oder 2“ (RiSU). (C)

## C. Konsistenz der Aufgaben und Texte

28. **S1: 3D-Modell und Schirmbild zeigen Verschiedenes.** Oben Leuchtpunkte, unten eine Kerze. Aufgabe 1 fragt nach dem Fleck „auf dem Schirm“, den man im Schirmbild gar nicht sieht. Neu: Motiv „Leuchtpunkte“ auch im Schirmbild, als Start eingestellt. (C)
29. **Drei Schirmgrößen** (12 × 9, 15 × 11, 8 × 5,6 cm). Neu: überall 15 × 11 cm. (C+G)
30. **Helligkeit:** Der gleiche Wert („100 ×“) sieht in S1 und S2 verschieden hell aus. Neu: eine Belichtung für alle Stationen. (G)
31. **S5 heißt „Abschluss“, danach kommt noch S6.** Der Abschluss wandert ans Ende von S6, S5 wird „Zwischenbilanz“. (C+G)
32. **S4 Aufgabe 1:** soll Wasser, Glas und Diamant vergleichen, die Tabelle hat nur Glas. Neu: Zeilen für Wasser und Diamant. (C)
33. **S2 Linsentest:** Die Spalte „Bildgröße“ wird nie geprüft, „sehr genau“ gibt es schon bei 5 % Abweichung. Rückmeldung ehrlich machen. (G)
34. **Linsen überall in der Reihenfolge A bis F** (S6-Experiment hat B, C, A, D). (C)
35. **„Lochkamera mit Linse“ ist eine Linsenkamera.** Das einmal ausdrücklich sagen (S2 Merke). (G)
36. **S6 Experiment:** G und B an denselben Stellen messen (Fuß bis Flammenspitze), Abstände ab Linsenmitte. (G)

## D. 3D-Darstellung

37. **Startansichten enger:** In S2 (Box) und S6 ist das Modell klein, viel leerer Tisch. (C)
38. **Beschriftungen größer und ohne Überlappung.** In S6 mit allen Hilfen liegen F, 2F und „g = …“ übereinander. Schilder mit kurzer Linie zum Objekt. (C)
39. **S4 Winkelscheibe:** Der Glaskörper ist auf der weißen Scheibe fast unsichtbar. Neu: Glas leicht blau, kräftige Kante, Hälften „Luft“ und „Glas“ farbig hinterlegt. (C)
40. **„Von oben“ als echte Draufsicht ohne Perspektive.** So lassen sich Winkel unverzerrt ablesen. Die freie 3D-Ansicht bleibt. (G)
41. **Ruhiger Modus:** Schalter „Lichtkegel / nur Strahlen / beides“, weniger Glühen, Leuchtpunkte zusätzlich nummeriert. (C+G)
42. **S4 Linse:** Brennpunkt markieren und Brennweite als Zahl zeigen, wenn sich Wölbung oder n ändert. Das hilft direkt bei Aufgabe 3 (Linse A gegen D). (C)
43. **Vollbild „⛶ Groß“:** Die wichtigsten Regler kommen mit ins Vollbild. (G)

## E. Animationen und neue Regler

44. **S1:** Regler „Abstand Gegenstand g“ (bisher fest 40 cm). Pause-Knopf für die Loch-Animation.
45. **S2:** Knopf „Schirm langsam verschieben“: Der Fleck wird kleiner, dann wieder größer. Dazu ein kleines Diagramm „Fleckgröße über b“ mit sichtbarem Minimum.
46. **S2:** Gegenstandsabstand als Regler. Haus, Lämpchen und Kerze bleiben als Schnellwahl.
47. **S3:** Ein Lichtpuls läuft den Strahl entlang und zeigt die Richtung. Lot an nur einer gewählten Stelle einblendbar.
48. **S4:** Knopf „α von 0° bis 89° durchfahren“ und ein α-β-Diagramm, das sich dabei füllt. Wellenmodell mit Pause.
49. **S4 (optional, Profi):** Prisma mit weißem Licht zeigt ein Farbspektrum.
50. **S6:** Knopf „Kerze fährt heran“ mit automatischem Scharfstellen. b und B wachsen sichtbar, die Fälle 2F und F werden dabei markiert.
51. **S6 (optional):** Linse auf der Bank verschiebbar, nicht nur Kerze und Schirm.

## F. Lesbarkeit, Navigation, Bedienung

52. **Navigationsleiste oben:** Übersicht · 1 bis 6 · zurück/weiter, dazu Wechsel 2D ↔ 3D bei gleicher Station. Die Übersicht bekommt Links statt Dateinamen.
53. **Scrollen:** Am Rechner zoomt das Mausrad die 3D-Szene, statt die Seite zu scrollen. Auf dem iPad dreht ein Finger auf der Szene, statt zu scrollen. Neu: Zoomen mit Mausrad erst nach Klick in die Szene, auf dem iPad ein freier Rand zum Scrollen.
54. **Fortschritt:** Stationen in der Leiste bekommen ein ✓, wenn ihre Aufgaben ausgefüllt sind.
55. **Begriffsliste auf der Übersicht:** Lot, Einfallswinkel, Brechungswinkel, Brechung, Brechzahl, Brennpunkt, Brennweite, Gegenstandsweite, Bildweite.
56. **Barrierefreiheit:** Reglerwerte für Screenreader, Knöpfe melden an/aus, α und β nicht nur über Farbe unterscheidbar.
57. **Speichern sichtbar machen** („gespeichert ✓“). Ergebnisse zusätzlich als PDF/Druckansicht.
58. **Fehleranzeige:** Wenn die 3D-Ansicht trotz allem scheitert, klarer Hinweis mit Link zur 2D-Fassung.

## G. Nachbau und Technik

59. **Neuer Aufbau:** gemeinsamer 3D-Code, gemeinsames CSS und je Station eine Quelldatei. `build.py` baut daraus wieder Einzeldateien, die offline laufen. three.js bleibt eingebettet, gleiche Version wie im Original. Ordner `~/Claude/Unterricht/Physik-8_Lochkamera`, das Original bleibt unverändert in `original/`.
60. **S3/S4 Linsen genau rechnen:** echte Kreisbögen statt Vielecke. Bisher läuft sogar der Mittelstrahl 0,2 mm schief. (G)
61. **Grenzen kennzeichnen:** sehr kleines b (Bildwinkel über 150°) und sehr große Flecken werden bisher still abgeschnitten. (G)

## H. Bewusst nicht übernommen

- Echte Tiefenschärfe für die ganze 3D-Szene (ChatGPT): zu aufwendig. Stattdessen Bildunterschrift „vereinfachtes Modell“.
- Speichernamen umbenennen (lk3 bei Station 4 usw.): nein. Sonst verlieren Schüler ihre Eingaben.
- Vorzeichen-Regel m = −b/g: zu viel für Klasse 8. Nur der Hinweis, dass mit Beträgen gerechnet wird.

## Offene Entscheidungen

1. **2D-Fassung:** (a) bekommt die gleichen Texte und Fehlerkorrekturen aus derselben Quelle, Grafik bleibt 2D – *Empfehlung*. (b) bleibt wie im Original.
2. **Begriffe in S6:** (a) wie LEIFI: Abbildungsmaßstab und Linsengleichung – *Empfehlung*. (b) wie im Original.
