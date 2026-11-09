"""Legt Briefing, Markenprofil und drei Thesen des Piloten als CDE-01-Artefakte an.

Aufruf: python erzeugen.py <pfad-zu-cde-project> <zielordner>
Bewusst KEINE Freigabe: Der Status endet bei "reviewed". Die gestalterische
Schlussfreigabe bleibt laut UNIKAT_STANDARD.md der verantwortlichen Person.
Alle Angaben sind fiktiv.
"""
import shutil
import sys
from pathlib import Path

project, target = Path(sys.argv[1]), Path(sys.argv[2])
sys.path.insert(0, str(project))
from cde import ArtifactStore  # noqa: E402

if target.exists():
    # Nur den eigenen Ausgabeordner ersetzen, nie einen fremden Pfad.
    if not (target / 'events.jsonl').exists():
        raise SystemExit(f'{target} sieht nicht wie ein CDE-Workspace aus')
    shutil.rmtree(target)
store = ArtifactStore(target, human_actor_ids=())
P = 'eiche-form-pilot'


def R(o):
    return {'id': o['artifactId'], 'revision': o['revision']}


def add(kind, id, payload, *deps):
    obj = store.create(kind, id, P, payload, dependencies=[R(d) for d in deps], actor_id='claude-pilot', actor_kind='agent')
    store.review(id, obj['revision'])
    return obj


FIKTIV = 'Fiktives Demo-Briefing, von Claude entworfen; keine Kundenangabe'

brief = add('ProjectBrief', 'brief-eiche-form', {
    'clientName': 'Eiche & Form (fiktiv)',
    'sector': 'Tischlerei für Einbaumöbel in Altbauten und Dachgeschossen',
    'businessSummary': 'Fiktive Tischlerei in Lübeck: baut rechtwinklige Einbaumöbel für Räume, die nicht rechtwinklig sind. '
                       'Besonderheit ist das Aufmaß vor Ort und das Einpassen über angerissene Passleisten.',
    'goals': [
        'Besucher klären selbst, ob ihr Raum in Frage kommt',
        'Anfragen enthalten bereits vier Maße statt nur „wir brauchen einen Schrank“',
    ],
    'targetAudiences': [
        'Eigentümer und Mieter in Altbauwohnungen mit schiefen Nischen',
        'Menschen, die ein Dachgeschoss ausgebaut haben und Stauraum unter der Schräge suchen',
    ],
    'offers': ['Aufmaß vor Ort', 'Entwurf mit Werkzeichnung', 'Bau und Einbau von Einbaumöbeln'],
    'budgetTier': 'signature',
    'constraints': [
        'Paket Business der Webbyu-Demos; Routen und lokaler Formularablauf bleiben erhalten',
        'Keine Fotos angeblicher Projekte; es gibt keine echten Projekte',
        'Im Piloten stand kein Bildgenerator zur Verfügung',
    ],
    'locales': ['de-DE'],
    'assets': [],
    'seoRequirements': ['Demo bleibt noindex wie alle Paketdemos'],
    'dataPolicy': 'local_only',
})

brand = add('BrandProfile', 'brand-eiche-form', {
    'name': 'Eiche & Form',
    'positioning': 'Gerade Möbel für schiefe Häuser.',
    'audiences': ['Altbau-Bewohner mit schwierigen Nischen', 'Dachgeschoss-Ausbauer'],
    'differentiators': [
        'Kommt vor dem Entwurf zum Aufmaß und zeigt die Abweichungen offen',
        'Korpus bleibt rechtwinklig, die Schiefe nimmt eine angerissene Passleiste auf',
    ],
    'values': ['Genauigkeit', 'Offenheit über das Unperfekte', 'Trockener Handwerkerton'],
    'dimensions': [],
    'facts': [
        {'key': 'status', 'value': 'Das Unternehmen ist erfunden', 'status': 'confirmed',
         'evidence': [{'sourceId': 'PACKAGE_DEMOS.md', 'kind': 'direct_observation', 'note': 'Als fiktive Paketdemo geführt'}]},
        {'key': 'standort', 'value': 'Lübeck', 'status': 'proposed',
         'evidence': [{'sourceId': 'brief-eiche-form', 'kind': 'creative_hypothesis', 'note': FIKTIV}]},
        {'key': 'fall-14', 'value': 'Flurnische für eine Garderobe, Baujahr 1908, 1.207 mm unten, 1.184 mm oben', 'status': 'proposed',
         'evidence': [{'sourceId': 'brief-eiche-form', 'kind': 'creative_hypothesis', 'note': 'Erfundener Raumfall, nicht gemessen'}]},
        {'key': 'tischler-technik', 'value': 'Korpus rechtwinklig, Einpassung über angerissene Passleiste', 'status': 'inferred',
         'evidence': [{'sourceId': 'allgemeines-fachwissen', 'kind': 'inference', 'note': 'Vor Veröffentlichung von einer Tischlerin oder einem Tischler gegenlesen lassen'}]},
    ],
    'negativeReferences': [
        'Warme Beige-Wohnwelt mit kursiver Serife',
        'Handwerksromantik: Hände, Späne, „mit Liebe gemacht“',
        'Nummerierte Augenbrauen über jedem Abschnitt',
    ],
    'unknowns': [
        'Keine echten Fotos vorhanden',
        'Preise bleiben „auf Anfrage“; Zeitbedarf eines Falls ist nicht belegt',
        'Fachliche Prüfung der Maße und Holzliste steht aus',
    ],
    'sourceBrief': R(brief),
}, brief)

WITHOUT_MOTION = 'Statische Zeichnungen in Folge'

add('CreativeThesis', 'thesis-a-werkakte', {
    'title': 'Die Werkakte',
    'thesisType': 'expected',
    'coreIdea': 'Die Website ist die Akte eines einzigen Falls, von der ersten Nachricht bis zum Einbau.',
    'visualMetaphor': 'Eine Projektmappe mit Reitern und Laufzetteln',
    'narrative': ['Nachricht der Kundin', 'Aufmaß', 'Zeichnung', 'Holzliste', 'Einbau'],
    'emotionalArc': ['Wiedererkennen', 'Einblick', 'Vertrauen'],
    'brandEvidence': [{'sourceId': 'brand-eiche-form', 'kind': 'creative_hypothesis', 'note': 'Stützt die Offenheit über den Arbeitsablauf'}],
    'signatureProposal': {'concept': 'Laufzettel, der sich beim Scrollen abzeichnet', 'purpose': 'Ablauf nachvollziehbar machen', 'required': False, 'fallback': WITHOUT_MOTION},
    'boundaries': ['Risiko: Chronik erzählt nur einen Fall, Besucher mit anderem Raum fühlen sich nicht gemeint', 'Risiko: Aktenoptik wirkt bürokratisch'],
    'brandProfile': R(brand),
}, brand)

add('CreativeThesis', 'thesis-b-passleiste', {
    'title': 'Die Passleiste',
    'thesisType': 'bold',
    'coreIdea': 'Die Schiefe des Hauses ist kein Makel, sondern der Anfang: Eine einzige keilförmige Leiste nimmt sie auf.',
    'visualMetaphor': 'Ein schmaler Eichenkeil zwischen gerader Kante und schiefer Wand, der sich durch die ganze Seite zieht',
    'narrative': ['Ihre Wand ist nicht gerade', 'So messen wir das', 'Der Korpus bleibt gerade', 'Die Leiste nimmt die Schiefe auf', 'Messen Sie Ihre Nische selbst'],
    'emotionalArc': ['Ertappt fühlen', 'Verstehen', 'Selbst ausprobieren'],
    'brandEvidence': [{'sourceId': 'brand-eiche-form', 'kind': 'creative_hypothesis', 'note': 'Direkt aus dem zweiten Unterscheidungsmerkmal abgeleitet'}],
    'signatureProposal': {'concept': 'Formular, das aus vier eingegebenen Maßen die eigene Nische und ihre Passleiste zeichnet', 'purpose': 'Anfrage mit Substanz statt Kontaktformular', 'required': True, 'fallback': 'Ohne JavaScript bleiben Anleitung und Beispielzeichnung lesbar'},
    'boundaries': ['Risiko: technische Zeichnungen wirken kühl und ohne Foto weniger wohnlich', 'Risiko: fachlich angreifbar, muss gegengelesen werden', 'Grenze: Keine Maße behaupten, die als echte Messung gelesen werden könnten'],
    'brandProfile': R(brand),
}, brand)

add('CreativeThesis', 'thesis-c-stueckliste', {
    'title': 'Die Stückliste',
    'thesisType': 'contrast',
    'coreIdea': 'Keine Bilder, keine Versprechen: Die Seite besteht aus den Positionen, aus denen ein Möbel gebaut wird.',
    'visualMetaphor': 'Eine Holzliste als Seitenstruktur, Typografie statt Bildwelt',
    'narrative': ['Pos. 1 Seite links', 'Pos. 2 Seite rechts', 'Pos. 7 Passleiste', 'Pos. 12 Ihr Raum'],
    'emotionalArc': ['Irritation', 'Neugier', 'Respekt'],
    'brandEvidence': [{'sourceId': 'brand-eiche-form', 'kind': 'creative_hypothesis', 'note': 'Stützt den trockenen Handwerkerton'}],
    'signatureProposal': {'concept': 'Positionen klappen zu Erklärungen auf', 'purpose': 'Tiefe bei Bedarf', 'required': False, 'fallback': 'Alle Positionen offen'},
    'boundaries': ['Risiko: Privatkunden sehen kein Ergebnis und können sich ihr Möbel nicht vorstellen', 'Risiko: Selbstgefällig, wenn der Nutzen nicht sofort klar wird'],
    'brandProfile': R(brand),
}, brand)

issues = {o['artifactId']: store.validate(o) for o in (store.get(i, 1) for i in (
    'brief-eiche-form', 'brand-eiche-form', 'thesis-a-werkakte', 'thesis-b-passleiste', 'thesis-c-stueckliste'))}
for name, found in issues.items():
    print(name, store.get(name, 1)['status'], 'OK' if not found else found)
