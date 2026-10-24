# Webbyu – Ausrichtung an werkzeug.

Stand: 24. Oktober 2026. Grundlage: ausdrücklicher Nutzerauftrag in diesem Chat.

## Bestätigte Richtung

Das Konzept von „werkzeug.“ entspricht der gewünschten Positionierung am besten. Der aktuelle Webbyu-Auftritt soll dessen Gestaltung und inhaltliche Tiefe stärker aufnehmen. Die bereits übernommenen und aktualisierten Demos bleiben Grundlage: Meisterwerk, Nordlicht, Safran Atelier und Raumgut.

Webbyu entwickelt individuell gestaltete Websites und hilfreiche Funktionen. Ausgangspunkt sind das Unternehmen, seine Kunden und die Abläufe dahinter. Eine Website erklärt ein Angebot, hilft bei Entscheidungen und kann die anschließende Arbeit vorbereiten. Auswahlhilfen, Anfragewege, Shops und Anbindungen werden aus der tatsächlichen Aufgabe abgeleitet.

Die Sprache soll ohne IT-Vorkenntnisse verständlich sein. Konkrete Situationen und Tätigkeiten erklären den Nutzen. Fachbegriffe sind kein Ersatz für eine Erklärung. Keine erfundenen Kundenbelege, Ergebnisse oder garantierten Einsparungen ergänzen.

## Technik

Der Nutzer möchte ausdrücklich kein WordPress und keinen Webbuilder als Grundlage. Der vorhandene Vite-/TypeScript-Auftritt wird individuell weiterentwickelt. Je nach Bedarf können Shopify oder andere Dienste angebunden werden, gegebenenfalls über eine getrennte Oberfläche und Datenschnittstellen. Eine konkrete Shopify-Integration wurde damit noch nicht beauftragt.

Eine optionale spätere Inhaltspflege ist eine projektbezogene Entscheidung. Die sichtbare Website erklärt, was Kunden tun können; technische Architekturdetails gehören nur dorthin, wo sie eine konkrete Entscheidung unterstützen.

## Umsetzung in diesem Arbeitsschritt

- Neue Hauptaussage: „Ihr Angebot klarer. Ihr Alltag einfacher.“
- Neue Ansatzsektion mit drei konkreten Ausgangssituationen und aufklappbaren Erläuterungen.
- Leistungen erklären jeweils Aufgabe, mögliche Bestandteile und Ziel.
- Näher an werkzeug.: klare serifenlose Typografie, warmer Papiergrund, dunkles Blau und gezielte gelbgrüne Hervorhebungen.
- Die vier Demos, ihre Sitzungsverwaltung und die 3D-Galerie bleiben erhalten.
- Verständlichere Begriffe im Projektfinder und in den Beschreibungen der Demos und Ergänzungen.
- Preisentwürfe und deren Leistungsgrenzen werden durch diesen Gestaltungsauftrag nicht neu beschlossen.

## Sprachliche Beispiele

| Bisheriger Begriff | Verständliche Erklärung im Kontext |
|---|---|
| CMS | Inhalte selbst bearbeiten |
| Schnittstelle / Integration | Einen vorhandenen Dienst anbinden und nötige Angaben weitergeben |
| Projektbriefing | Wünsche und Angaben für ein Vorhaben zusammenfassen |
| Conversion / Nutzerführung | Besuchern helfen, die passende Leistung und den nächsten Schritt zu finden |
| Content | Texte, Fotos und Videos |

Die ursprünglichen werkzeug.-Dateien unter `site/` bleiben als Referenz erhalten. Das untersuchte WordPress-Paket unter `projektpruefung/` bleibt ein getrenntes historisches Prüfobjekt und wird nicht zur technischen Basis.

## Wortmarke: Web · By · Yu

Nutzerergänzung vom 24. Oktober 2026: Die sichtbare Wortmarke soll als „WebByYu“ gelesen werden. Header und Footer gliedern sie deshalb in drei Wortteile: „Web“ in dunklem Blau, „By“ in einem zurückhaltenden Blaugrau und „Yu“ auf dem gelbgrünen Akzent der Website. Die Großschreibung macht die Trennung auch unabhängig von der Farbe sichtbar. Die zugängliche Linkbezeichnung liest „Web By Yu“. Diese Gestaltung betrifft die Wortmarke; Repository, Domain und bestehende Projektbezeichnungen werden dadurch nicht umbenannt.

## Prüfung und Vorschau

- Lokale Vorschau: http://127.0.0.1:5173/; HTTP 200 geprüft.
- TypeScript ohne Fehler; alle 85 bestehenden Tests bestanden; Produktionsbuild erfolgreich.
- Browser: 360, 390, 768, 1024 und 1440 Pixel ohne horizontalen Seitenüberlauf. 390/1440 zusätzlich visuell geprüft.
- Aufklappbare Erklärungen, mobile Navigation samt Schließen nach Navigation und Raumgut-Großansicht bedient.
- Projektfinder mit synthetischen Angaben bis zur fertigen Zusammenfassung bedient. Kein Kopiervorgang und kein Versand ausgeführt; Testdaten durch Neuladen verworfen.
- Bildschirmaufnahmen unter `artifacts/werkzeug-positioning/`: Desktop, Ansatzsektion und Mobilansicht. Dieser Ordner bleibt wie bisher von Git ausgeschlossen.
- Bestehende Buildhinweise zu relativen Schriftpfaden und Größe des separat geladenen 3D-Bündels bleiben bestehen. Dies ist keine vollständige neue Accessibility-/Sicherheitsabnahme; AP5 bleibt separat offen.
- Umsetzung lokal; kein Push und keine Veröffentlichung dieses Arbeitsschritts.
