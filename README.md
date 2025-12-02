# Schemata Editor

Ein grafischer Editor zur Verwaltung von JSON-Schemata für Metadaten im WLO/OpenEduHub-Kontext.

## Features

### Kontext-Verwaltung
- ✅ Erstellen neuer Kontexte (mit Basiskontext-Vererbung)
- ✅ Löschen von Kontexten
- ✅ Automatische Registry-Aktualisierung

### Versions-Management
- ✅ Mehrere Versionen pro Kontext
- ✅ Neue Version basierend auf bestehender erstellen
- ✅ Schemas werden automatisch kopiert
- ✅ Changelog-System für Änderungen
- ✅ Versionen löschen

### Schema-Editor
- ✅ Erstellen neuer Schema-Dateien
- ✅ Löschen von Schemas
- ✅ Gruppen verwalten (erstellen, bearbeiten, löschen)
- ✅ Felder verwalten (erstellen, bearbeiten, löschen, sortieren)

### Feld-Editor
- ✅ Alle Feld-Eigenschaften bearbeitbar
- ✅ Mehrsprachige Labels/Beschreibungen (DE/EN)
- ✅ Datentyp-Konfiguration
- ✅ Validierungsregeln
- ✅ Normalisierungsregeln (trim, whitespace, lowercase, etc.)
- ✅ Tooltips für alle Optionen

### Vokabular-Editor
- ✅ SKOS-Vokabulare bearbeiten
- ✅ SKOHUB-Import (URL oder JSON-Paste)
- ✅ Konzepte mit URIs, Labels, altLabels
- ✅ Mehrsprachige Unterstützung

### Import/Export
- ✅ **ZIP-Export**: Kompletter schemata-Ordner als ZIP
- ✅ **ZIP-Import**: ZIP-Datei importieren
- ✅ Registry und Manifeste immer aktuell

## Installation

### Voraussetzungen
- Node.js 18+
- npm

### Setup

```bash
# Repository klonen und in Editor-Verzeichnis wechseln
cd schemata-editor

# Dependencies installieren
npm install

# Schemata-Ordner kopieren (von metadata-agent-canvas-oeh)
npm run setup
```

## Entwicklung

```bash
# Dev-Server starten
npm run dev

# Der Editor ist unter http://localhost:3000 erreichbar
```

## Bedienung

### Sidebar (links)
- **Kontexte**: Aufklappbare Liste aller Kontexte
- **Versionen**: Dropdown zur Versionsauswahl + Branch-Icon für Versionsverwaltung
- **Schemas**: Klick öffnet Schema im Editor
- **Export/Import**: Buttons im Footer

### Schema-Editor (Mitte)
- **Gruppen**: Abschnitte zum Organisieren von Feldern
- **Felder**: Klick öffnet Feld-Editor rechts
- **+Feld**: Neues Feld zur aktuellen Gruppe hinzufügen

### Feld-Editor (rechts)
- **Basis-Tab**: ID, Gruppe, Labels, Beschreibungen
- **System-Tab**: Datentyp, Pflichtfeld, KI-Optionen
- **Vokabular-Tab**: Konzepte, SKOHUB-Import
- **Erweitert-Tab**: Validierung, Normalisierung

## Schemata-Struktur

```
public/schemata/
├── context-registry.json      # Alle Kontexte
├── default/                   # Standard-Kontext
│   ├── manifest.json          # Versionen & Schema-Liste
│   └── v1.8.0/
│       ├── core.json
│       ├── event.json
│       ├── education_offer.json
│       ├── learning_material.json
│       ├── person.json
│       ├── organization.json
│       └── ...
└── mds_oeh/                   # Weiterer Kontext
    ├── manifest.json
    └── v1.8.0/
        └── ...
```

## Schema-Dateien

### context-registry.json

```json
{
  "contexts": {
    "default": {
      "name": "WLO/OEH Standard",
      "description": "Vollständiges Schema-Set",
      "defaultVersion": "1.8.0",
      "path": "default"
    }
  },
  "defaultContext": "default"
}
```

### manifest.json

```json
{
  "contextName": "default",
  "name": "WLO/OEH Standard",
  "versions": {
    "1.8.0": {
      "releaseDate": "2025-11-01",
      "isDefault": true,
      "schemas": ["core.json", "event.json", "..."],
      "changelog": [
        {
          "date": "2025-11-01T00:00:00.000Z",
          "type": "added",
          "description": "Initiale Version"
        }
      ]
    }
  }
}
```

### Schema-Felder

| Eigenschaft | Beschreibung |
|-------------|--------------|
| `id` | Eindeutiger Bezeichner (namespace:name) |
| `group` | Zugehörige Gruppe |
| `label` | Anzeigename `{de, en}` |
| `description` | Beschreibung `{de, en}` |
| `prompt` | KI-Prompt Hinweis `{de, en}` |
| `examples` | Beispielwerte `{de: [], en: []}` |
| `system.datatype` | string, array, uri, number, date, boolean, object |
| `system.required` | Pflichtfeld |
| `system.multiple` | Mehrfachwerte erlaubt |
| `system.ask_user` | Nutzer muss bestätigen |
| `system.ai_fillable` | KI kann Feld ausfüllen |
| `system.vocabulary` | Vokabular-Konfiguration (type, concepts, scheme) |
| `system.validation` | Validierungsregeln (pattern, minLength, etc.) |
| `system.normalization` | Normalisierungsregeln (trim, lowercase, etc.) |

## SKOHUB-Import

### Von URL

1. Feld auswählen → Tab "Vokabular"
2. SKOHUB-URL eingeben, z.B.:
   ```
   https://vocabs.openeduhub.de/w3id.org/openeduhub/vocabs/educationalContext/index.json
   ```
3. "Import" klicken

### JSON einfügen

Falls CORS blockiert:
1. URL im Browser öffnen
2. JSON kopieren
3. In Textfeld einfügen (Ctrl+V)

### Unterstützte Formate

- SKOHUB ConceptScheme mit `hasTopConcept`
- JSON-LD mit `@graph`
- Einfache Arrays

## ZIP Export/Import

### Export
1. Klick auf "Export" im Sidebar-Footer
2. Alle Schemas werden geladen (zeigt "Lädt...")
3. ZIP-Datei wird heruntergeladen

### Import
1. Klick auf "Import"
2. ZIP-Datei auswählen
3. Alle Kontexte, Versionen und Schemas werden geladen

### ZIP-Struktur

```
schemata-export-2025-12-02.zip
├── context-registry.json
├── default/
│   ├── manifest.json
│   └── v1.8.0/
│       ├── core.json
│       └── ...
└── mds_oeh/
    ├── manifest.json
    └── v1.8.0/
        └── ...
```

## Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | TailwindCSS |
| State | Zustand |
| Icons | Lucide React |
| UI Components | Radix UI |
| ZIP | JSZip + FileSaver |

## Projektstruktur

```
src/
├── App.tsx                     # Haupt-App
├── main.tsx                    # Entry Point
├── components/
│   ├── Sidebar.tsx             # Linke Navigation
│   ├── SchemaEditor.tsx        # Schema-Bearbeitung (Mitte)
│   ├── FieldEditor.tsx         # Feld-Bearbeitung (rechts)
│   ├── VocabularyEditor.tsx    # Vokabular-Tab
│   ├── dialogs/
│   │   ├── CreateContextDialog.tsx
│   │   ├── CreateSchemaDialog.tsx
│   │   └── VersionDialog.tsx
│   └── ui/
│       ├── Tooltip.tsx
│       └── toaster.tsx
├── store/
│   └── schema-store.ts         # Zustand Store
├── types/
│   └── schema.ts               # TypeScript Typen
└── utils/
    └── cn.ts                   # Classname Helper
```

## Docker

### Build & Run

```bash
# Mit Docker Compose (empfohlen)
docker-compose up -d

# Oder manuell
docker build -t schemata-editor .
docker run -d -p 8080:80 --name schemata-editor schemata-editor
```

Der Editor ist dann unter http://localhost:8080 erreichbar.

### Eigene Schemata einbinden

```bash
# Volume mounten
docker run -d -p 8080:80 \
  -v /pfad/zu/schemata:/usr/share/nginx/html/schemata \
  --name schemata-editor schemata-editor
```

Oder in `docker-compose.yml`:

```yaml
volumes:
  - ./my-schemata:/usr/share/nginx/html/schemata
```

### Produktions-Build

```bash
# Multi-Stage Build erstellt optimiertes Image (~25MB)
docker build -t schemata-editor:prod .
```

## Bekannte Einschränkungen

- Browser-basiert: Kein direkter Dateisystem-Zugriff
- CORS: Externer SKOHUB-Import kann blockiert sein (JSON-Paste als Fallback)
- Keine Echtzeit-Kollaboration

## Lizenz

MIT
