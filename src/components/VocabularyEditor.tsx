import { useState } from 'react';
import type { Vocabulary, VocabularyConcept, LocalizedString } from '../types/schema';
import { 
  Plus, 
  Trash2, 
  Download,
  BookOpen,
  Link,
  Tag,
  Globe,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface VocabularyEditorProps {
  vocabulary: Vocabulary | undefined;
  onUpdate: (vocabulary: Vocabulary | undefined) => void;
}

export function VocabularyEditor({ vocabulary, onUpdate }: VocabularyEditorProps) {
  const [expandedConcepts, setExpandedConcepts] = useState<Set<number>>(new Set());
  const [skohubUrl, setSkohubUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // No vocabulary configured
  if (!vocabulary) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 border rounded-lg bg-muted/30">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <h4 className="font-medium mb-2">Kein Vokabular konfiguriert</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Füge ein kontrolliertes Vokabular hinzu, um die Eingabewerte einzuschränken.
          </p>
          <button
            onClick={() => onUpdate({
              type: 'closed',
              concepts: []
            })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Vokabular erstellen
          </button>
        </div>
      </div>
    );
  }

  const toggleConcept = (index: number) => {
    const newExpanded = new Set(expandedConcepts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedConcepts(newExpanded);
  };

  const addConcept = () => {
    onUpdate({
      ...vocabulary,
      concepts: [
        ...vocabulary.concepts,
        {
          label: { de: 'Neues Konzept', en: 'New Concept' },
          uri: '',
        }
      ]
    });
  };

  const updateConcept = (index: number, updates: Partial<VocabularyConcept>) => {
    const newConcepts = [...vocabulary.concepts];
    newConcepts[index] = { ...newConcepts[index], ...updates };
    onUpdate({ ...vocabulary, concepts: newConcepts });
  };

  const deleteConcept = (index: number) => {
    const newConcepts = vocabulary.concepts.filter((_, i) => i !== index);
    onUpdate({ ...vocabulary, concepts: newConcepts });
  };

  const getLocalizedValue = (value: LocalizedString | string | undefined, lang: 'de' | 'en'): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || '';
  };

  const setLocalizedValue = (
    current: LocalizedString | string | undefined,
    lang: 'de' | 'en',
    newValue: string
  ): LocalizedString => {
    const base = typeof current === 'string' 
      ? { de: current, en: current }
      : { de: '', en: '', ...current };
    return { ...base, [lang]: newValue };
  };

  // Import from SKOHUB
  const importFromSkohub = async () => {
    if (!skohubUrl) return;
    
    setIsImporting(true);
    try {
      // Fetch SKOS vocabulary from SKOHUB
      const response = await fetch(skohubUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch SKOHUB vocabulary');
      }
      
      const data = await response.json();
      
      // Parse SKOS concepts - support multiple formats
      let concepts: VocabularyConcept[] = [];
      let schemeUri = skohubUrl;
      
      // Format 1: ConceptScheme with hasTopConcept (OpenEduHub SKOHUB format)
      if (data.type === 'ConceptScheme' && data.hasTopConcept) {
        schemeUri = data.id || skohubUrl;
        
        concepts = data.hasTopConcept.map((item: any) => {
          // Parse altLabels - can be object with language keys or array
          let altLabels: LocalizedString | string[] | undefined;
          if (item.altLabel) {
            if (Array.isArray(item.altLabel.de) || Array.isArray(item.altLabel.en)) {
              // Format: { de: ["Alt1", "Alt2"], en: ["Alt1", "Alt2"] }
              altLabels = {
                de: Array.isArray(item.altLabel.de) ? item.altLabel.de.join(', ') : (item.altLabel.de || ''),
                en: Array.isArray(item.altLabel.en) ? item.altLabel.en.join(', ') : (item.altLabel.en || ''),
              };
            } else {
              altLabels = {
                de: item.altLabel.de || '',
                en: item.altLabel.en || '',
              };
            }
          }
          
          return {
            label: {
              de: item.prefLabel?.de || '',
              en: item.prefLabel?.en || '',
            },
            uri: item.id || '',
            altLabels,
            description: item.definition ? {
              de: item.definition?.de || '',
              en: item.definition?.en || '',
            } : undefined,
          };
        });
      }
      // Format 2: @graph with Concepts (JSON-LD)
      else if (data['@graph']) {
        concepts = data['@graph']
          .filter((item: any) => item['@type'] === 'skos:Concept' || item.type === 'Concept')
          .map((item: any) => ({
            label: {
              de: item.prefLabel?.de || item['skos:prefLabel']?.['@value'] || item['@id'],
              en: item.prefLabel?.en || item['skos:prefLabel']?.['@value'] || item['@id'],
            },
            uri: item['@id'] || item.id,
            description: item.definition ? {
              de: item.definition?.de || '',
              en: item.definition?.en || '',
            } : undefined,
          }));
      }
      // Format 3: Simple array
      else if (Array.isArray(data)) {
        concepts = data.map((item: any) => ({
          label: {
            de: item.prefLabel?.de || item.label?.de || item.label || '',
            en: item.prefLabel?.en || item.label?.en || item.label || '',
          },
          uri: item.uri || item.id || item['@id'] || '',
        }));
      }
      
      if (concepts.length === 0) {
        alert('Keine Konzepte in der Datei gefunden.');
        return;
      }
      
      // Ask user whether to replace or merge
      const replace = vocabulary.concepts.length > 0 
        ? confirm(`${concepts.length} Konzepte gefunden.\n\nOK = Bestehende ersetzen\nAbbrechen = Zu bestehenden hinzufügen`)
        : true;
      
      // Update vocabulary
      onUpdate({
        ...vocabulary,
        type: 'skos',
        scheme: schemeUri,
        concepts: replace ? concepts : [...vocabulary.concepts, ...concepts],
      });
      
      setSkohubUrl('');
      alert(`${concepts.length} Konzepte erfolgreich importiert!`);
    } catch (error) {
      console.error('Failed to import from SKOHUB:', error);
      alert('Import fehlgeschlagen. Bitte URL überprüfen.\n\nHinweis: CORS kann den Import blockieren. Versuche es mit einer anderen URL oder lade die JSON-Datei manuell.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Vocabulary Settings */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Typ</label>
          <select
            value={vocabulary.type}
            onChange={(e) => onUpdate({ ...vocabulary, type: e.target.value as Vocabulary['type'] })}
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="closed">Geschlossen (nur vordefinierte Werte)</option>
            <option value="skos">SKOS (mit URIs)</option>
            <option value="open">Offen (mit Vorschlägen)</option>
          </select>
        </div>

        {vocabulary.type === 'skos' && (
          <div>
            <label className="block text-sm font-medium mb-1">SKOS Scheme URI</label>
            <input
              type="text"
              value={vocabulary.scheme || ''}
              onChange={(e) => onUpdate({ ...vocabulary, scheme: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
              placeholder="http://w3id.org/openeduhub/vocabs/..."
            />
          </div>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={vocabulary.hierarchical || false}
            onChange={(e) => onUpdate({ ...vocabulary, hierarchical: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Hierarchisches Vokabular</span>
        </label>
      </div>

      {/* SKOHUB Import */}
      <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          SKOHUB Import
        </h4>
        
        {/* URL Import */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Von URL laden:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skohubUrl}
              onChange={(e) => setSkohubUrl(e.target.value)}
              placeholder="https://vocabs.openeduhub.de/.../index.json"
              className="flex-1 px-3 py-1.5 border rounded-md bg-background text-sm"
            />
            <button
              onClick={importFromSkohub}
              disabled={!skohubUrl || isImporting}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm disabled:opacity-50 flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              {isImporting ? 'Lädt...' : 'Import'}
            </button>
          </div>
        </div>
        
        {/* JSON Paste Import */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Oder JSON einfügen:</label>
          <div className="flex gap-2">
            <textarea
              placeholder='{"type":"ConceptScheme","hasTopConcept":[...]}'
              className="flex-1 px-3 py-1.5 border rounded-md bg-background text-xs font-mono h-16 resize-none"
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                try {
                  const data = JSON.parse(text);
                  // Reuse the same parsing logic
                  let concepts: VocabularyConcept[] = [];
                  let schemeUri = '';
                  
                  if (data.type === 'ConceptScheme' && data.hasTopConcept) {
                    schemeUri = data.id || '';
                    concepts = data.hasTopConcept.map((item: any) => ({
                      label: {
                        de: item.prefLabel?.de || '',
                        en: item.prefLabel?.en || '',
                      },
                      uri: item.id || '',
                      altLabels: item.altLabel ? {
                        de: Array.isArray(item.altLabel.de) ? item.altLabel.de.join(', ') : (item.altLabel.de || ''),
                        en: Array.isArray(item.altLabel.en) ? item.altLabel.en.join(', ') : (item.altLabel.en || ''),
                      } : undefined,
                    }));
                  } else if (data['@graph']) {
                    concepts = data['@graph']
                      .filter((item: any) => item['@type'] === 'skos:Concept' || item.type === 'Concept')
                      .map((item: any) => ({
                        label: {
                          de: item.prefLabel?.de || item['@id'],
                          en: item.prefLabel?.en || item['@id'],
                        },
                        uri: item['@id'] || item.id,
                      }));
                  } else if (Array.isArray(data)) {
                    concepts = data.map((item: any) => ({
                      label: {
                        de: item.prefLabel?.de || item.label?.de || '',
                        en: item.prefLabel?.en || item.label?.en || '',
                      },
                      uri: item.uri || item.id || '',
                    }));
                  }
                  
                  if (concepts.length > 0) {
                    const replace = vocabulary.concepts.length > 0 
                      ? confirm(`${concepts.length} Konzepte gefunden.\n\nOK = Bestehende ersetzen\nAbbrechen = Zu bestehenden hinzufügen`)
                      : true;
                    
                    onUpdate({
                      ...vocabulary,
                      type: 'skos',
                      scheme: schemeUri || vocabulary.scheme,
                      concepts: replace ? concepts : [...vocabulary.concepts, ...concepts],
                    });
                    
                    alert(`${concepts.length} Konzepte erfolgreich importiert!`);
                    (e.target as HTMLTextAreaElement).value = '';
                  } else {
                    alert('Keine Konzepte im JSON gefunden.');
                  }
                } catch (err) {
                  alert('Ungültiges JSON-Format.');
                }
                e.preventDefault();
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Unterstützt: SKOHUB ConceptScheme, JSON-LD @graph, Array
          </p>
        </div>
      </div>

      {/* Concepts List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Konzepte ({vocabulary.concepts.length})</h4>
          <button
            onClick={addConcept}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Hinzufügen
          </button>
        </div>

        {vocabulary.concepts.length === 0 ? (
          <div className="text-center p-4 border rounded-lg text-sm text-muted-foreground">
            Keine Konzepte definiert
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-auto">
            {vocabulary.concepts.map((concept, index) => {
              const isExpanded = expandedConcepts.has(index);
              
              return (
                <div key={index} className="border rounded-lg bg-card">
                  {/* Concept Header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50"
                    onClick={() => toggleConcept(index)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate text-sm">
                      {getLocalizedValue(concept.label, 'de') || 'Unbenannt'}
                    </span>
                    {concept.uri && (
                      <Link className="h-3 w-3 text-muted-foreground" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Konzept wirklich löschen?')) {
                          deleteConcept(index);
                        }
                      }}
                      className="p-1 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>

                  {/* Concept Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t space-y-3">
                      {/* Labels */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">🇩🇪 Label</label>
                          <input
                            type="text"
                            value={getLocalizedValue(concept.label, 'de')}
                            onChange={(e) => updateConcept(index, {
                              label: setLocalizedValue(concept.label, 'de', e.target.value)
                            })}
                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">🇬🇧 Label</label>
                          <input
                            type="text"
                            value={getLocalizedValue(concept.label, 'en')}
                            onChange={(e) => updateConcept(index, {
                              label: setLocalizedValue(concept.label, 'en', e.target.value)
                            })}
                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                          />
                        </div>
                      </div>

                      {/* URI */}
                      <div>
                        <label className="text-xs text-muted-foreground">URI</label>
                        <input
                          type="text"
                          value={concept.uri || ''}
                          onChange={(e) => updateConcept(index, { uri: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
                          placeholder="http://..."
                        />
                      </div>

                      {/* Value (if different from label) */}
                      <div>
                        <label className="text-xs text-muted-foreground">Value (optional, falls abweichend)</label>
                        <input
                          type="text"
                          value={concept.value || ''}
                          onChange={(e) => updateConcept(index, { value: e.target.value || undefined })}
                          className="w-full px-2 py-1 border rounded text-sm bg-background"
                        />
                      </div>

                      {/* Icon */}
                      <div>
                        <label className="text-xs text-muted-foreground">Icon (Material Icons Name)</label>
                        <input
                          type="text"
                          value={concept.icon || ''}
                          onChange={(e) => updateConcept(index, { icon: e.target.value || undefined })}
                          className="w-full px-2 py-1 border rounded text-sm bg-background"
                          placeholder="event, person, school..."
                        />
                      </div>

                      {/* Schema File (for content types) */}
                      <div>
                        <label className="text-xs text-muted-foreground">Schema-Datei (für Inhaltsarten)</label>
                        <input
                          type="text"
                          value={concept.schema_file || ''}
                          onChange={(e) => updateConcept(index, { schema_file: e.target.value || undefined })}
                          className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
                          placeholder="event.json"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remove Vocabulary */}
      <button
        onClick={() => {
          if (confirm('Vokabular wirklich entfernen?')) {
            onUpdate(undefined);
          }
        }}
        className="w-full px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10"
      >
        Vokabular entfernen
      </button>
    </div>
  );
}
