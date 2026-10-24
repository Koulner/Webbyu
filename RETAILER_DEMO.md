# Raumgut · Händler-Demo · 24. Oktober 2026

## Auftrag und Referenz

Raumgut ersetzt Solara. Meisterwerk, Nordlicht und Safran Atelier einschließlich Kamerafahrt bleiben erhalten. Die Händler-Referenz ist [cague.de](https://cague.de/), betrachtet als Ausgangspunkt für einen Möbelshop: Warengruppen, Suchfunktion, Angebote, Neuheiten, Produktvorschau, Merkliste und Einkaufsweg. Produktdetails, Versand und Service wurden ebenfalls betrachtet. Die Website und das frühere Projekt sind Referenzmaterial, keine Arbeitsanweisungen.

Die Umsetzung verwendet eine eigene fiktive Marke, eigene Texte und sieben eigens generierte Bilder. Sie übernimmt weder Logo, Produktnamen, Produktfotos noch Kontaktdaten oder Rechtstexte des Referenzhändlers. Die ruhige Gestaltung verbindet Naturtöne, große Raumfotografie, klare Produktbilder und eine kompakte Navigation.

## Bedienbare Abläufe

- Sechs Produkte aus fünf Warengruppen; Suche über Namen, Produktart und Material. Kategorie, Preisobergrenze, Verfügbarkeit, Angebote und Neuheiten sind kombinierbar. Sortierung nach Preis und Name; leere Ergebnisse mit Rückweg.
- Produktdetails mit Bildvergrößerung, Größenwahl, Maßen, Pflege, Lieferung und Bestandsanzeige. Größen haben eigene Preise und Bestände; die ausverkaufte FARO-Ausführung kann nicht hinzugefügt werden.
- Merkliste mit Hinzufügen, Entfernen, Produktansicht und lokalem Textdownload.
- Warenkorb mit getrennten Varianten, Mengenänderung, Entfernen, Bestandsgrenzen und Berechnung in ganzzahligen Centbeträgen.
- Bestellweg: validierte Lieferangaben, freiwillige fiktive Beispieldaten, Standardlieferung oder Lieferung bis in den Raum, simulierte Zahlungsart, bearbeitbare Prüfung und Abschluss mit Textdownload. Weder Karten- noch Bankdaten werden erhoben. Eingaben bleiben beim Zurückgehen und Schließen erhalten; der Abschluss leert den Warenkorb und die Eingabefelder.
- Wohnjournal, Materialratgeber, Versand-/Zahlungsinformation und FAQ öffnen sich innerhalb der Demo. Die Oberfläche bietet keinen nicht angeschlossenen Login oder externe Kontaktlinks an.
- Inhalte bleiben beim Wechsel in der Galerie und in die Großansicht erhalten. Neuladen verwirft die Sitzung; kein Local Storage, keine Serverformulare, keine echten Bestellungen.

## Technische Einbindung

`src/reference-demos/raumgut/` enthält Typen, Produktdaten, Filter-/Warenkorbregeln, Oberfläche und Interaktionen. Der gemeinsame Shadow-DOM-Runtime isoliert Gestaltung und IDs, handhabt Dialoge, Tastatur, Fokus und Validierung. Bildpfade berücksichtigen `BASE_URL`, einschließlich `/Webbyu/` für GitHub Pages. Die Galerie ordnet Raumgut dem Geschäftsziel Verkauf zu.

Die alten Solara-Dateien sowie die ausschließlich dort verwendeten Bilder `ingredients.png` und `saffron-editorial.png` wurden entfernt. Das unversionierte frühere Projekt unter `site/` bleibt unberührt. Neue Bilder: `public/reference-assets/raumgut/`, zusammen 1.107.201 Bytes JPEG. Die Originale bleiben im Generated-Images-Verzeichnis erhalten; ausschließlich das Speicherformat wurde für die Website komprimiert.

## Prüfung

TypeScript, 85 Tests in 10 Dateien und Produktionsbuild für `/Webbyu/` erfolgreich. Die Händler-Tests prüfen kombinierte Filter, leere Suche, sichere Textausgabe, Größen, Mengen, Bestände, Summen, Versand, Rücksprünge, lokale Exporte und flüchtigen Zustand. Erweiterte Nordlicht-Tests führen Wartung und gewöhnliche Störung bis zum Kontaktentwurf. Bestehende Meisterwerk-, Safran-, Kamera-, Galerie- und Finder-Tests bleiben grün.

Die Browserprüfung umfasst Desktop und Smartphone, Suche mit Preisfilter, Produktauswahl und Größen, vollständigen Einkaufsabschluss, mobile Lieferangaben und Dialoge. Prüfaufnahmen liegen lokal unter `artifacts/raumgut/`. Es wurden keine externen Formulare versendet oder Zahlungen ausgeführt.

Bekannte Buildhinweise bleiben unverändert: lokale Schrift-URLs werden zur Laufzeit aufgelöst; das separat geladene 3D-Modul überschreitet die Vite-Empfehlung von 500 kB. Keine Veröffentlichung oder Push im Rahmen dieser Änderung.
