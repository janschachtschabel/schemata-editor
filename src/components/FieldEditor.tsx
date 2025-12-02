import { useState, useEffect, useCallback, useRef } from 'react';
import { useSchemaStore, useActiveSchema, useActiveField } from '../store/schema-store';
import type { SchemaField, LocalizedString, SystemConfig } from '../types/schema';
import { 
  Settings2, 
  Type, 
  List, 
  Link, 
  Hash, 
  Calendar, 
  ToggleLeft,
  Box,
  BookOpen,
  AlertCircle,
  Globe,
  Sparkles,
  Database,
  Search,
  FileText,
  Save,
  HelpCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { VocabularyEditor } from './VocabularyEditor';

// Tooltip texts for all options
const TOOLTIPS = {
  // Basic
  id: 'Eindeutiger technischer Bezeichner im Format namespace:name (z.B. cclom:title)',
  group: 'Die Gruppe, in der dieses Feld im Editor angezeigt wird',
  labelDe: 'Anzeigename des Feldes auf Deutsch',
  labelEn: 'Anzeigename des Feldes auf Englisch',
  descriptionDe: 'Beschreibung/Hilfetext für Nutzer auf Deutsch',
  descriptionEn: 'Beschreibung/Hilfetext für Nutzer auf Englisch',
  promptDe: 'Zusätzliche Anweisungen für die KI-Extraktion',
  
  // System
  datatype: 'Der Datentyp bestimmt, wie der Wert gespeichert und validiert wird',
  path: 'Technischer Pfad zum Feld in der Datenstruktur',
  uri: 'URI für semantische Verknüpfung (z.B. Dublin Core, Schema.org)',
  required: 'Pflichtfeld: Muss vor dem Speichern ausgefüllt werden',
  multiple: 'Mehrfachwerte: Erlaubt mehrere Einträge (z.B. mehrere Schlagwörter)',
  ask_user: 'Nutzer fragen: Feld wird im Formular angezeigt',
  ai_fillable: 'KI-füllbar: KI kann dieses Feld automatisch extrahieren',
  repo_field: 'Repository-Feld: Wird direkt im Repository gespeichert',
  fulltext: 'Volltext-Index: Feld ist volltextdurchsuchbar',
  keyword: 'Keyword-Index: Feld ist als exakter Begriff filterbar',
  
  // Normalization
  trim: 'Entfernt Leerzeichen am Anfang und Ende des Textes',
  collapseWhitespace: 'Reduziert mehrfache Leerzeichen auf ein einzelnes',
  deduplicate: 'Entfernt doppelte Werte aus der Liste',
  map_labels_to_uris: 'Wandelt Vokabular-Labels automatisch in URIs um',
  
  // Validation
  pattern: 'Regulärer Ausdruck zur Validierung (z.B. ^https?://.*$ für URLs)',
  minLength: 'Minimale Zeichenlänge des Wertes',
  maxLength: 'Maximale Zeichenlänge des Wertes',
};

export function FieldEditor() {
  const { activeSchemaFile, activeFieldId, updateField } = useSchemaStore();
  const schema = useActiveSchema();
  const field = useActiveField();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'system' | 'vocabulary'>('basic');
  
  // Local state buffer for editing
  const [localField, setLocalField] = useState<SchemaField | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Sync local state when field changes
  useEffect(() => {
    if (field) {
      setLocalField(JSON.parse(JSON.stringify(field)));
      setHasLocalChanges(false);
    } else {
      setLocalField(null);
    }
  }, [field?.id, activeFieldId]);

  // Save changes to store
  const saveChanges = useCallback(() => {
    if (localField && activeSchemaFile && activeFieldId && hasLocalChanges) {
      updateField(activeSchemaFile, activeFieldId, localField);
      setHasLocalChanges(false);
    }
  }, [localField, activeSchemaFile, activeFieldId, hasLocalChanges, updateField]);

  // Save when switching to a different field (cleanup effect)
  const localFieldRef = useRef(localField);
  const hasChangesRef = useRef(hasLocalChanges);
  
  useEffect(() => {
    localFieldRef.current = localField;
    hasChangesRef.current = hasLocalChanges;
  }, [localField, hasLocalChanges]);
  
  // When field changes, save the previous field's data
  useEffect(() => {
    return () => {
      // Save on unmount or field switch
      if (hasChangesRef.current && localFieldRef.current && activeSchemaFile) {
        // This will be called when switching fields - but we can't call updateField here
        // because it might cause issues. Just let the user save manually.
      }
    };
  }, [activeFieldId, activeSchemaFile]);

  // Empty state
  if (!field || !schema || !activeSchemaFile || !localField) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <Settings2 className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Kein Feld ausgewählt</h3>
        <p className="text-sm text-center">
          Wähle ein Feld aus dem Schema aus, um es zu bearbeiten.
        </p>
      </div>
    );
  }

  const handleLocalUpdate = (updates: Partial<SchemaField>) => {
    setLocalField(prev => prev ? { ...prev, ...updates } : null);
    setHasLocalChanges(true);
  };

  const handleSystemUpdate = (updates: Partial<SystemConfig>) => {
    handleLocalUpdate({
      system: { ...localField.system, ...updates }
    });
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

  const datatypeIcons: Record<string, React.ReactNode> = {
    string: <Type className="h-4 w-4" />,
    array: <List className="h-4 w-4" />,
    uri: <Link className="h-4 w-4" />,
    number: <Hash className="h-4 w-4" />,
    date: <Calendar className="h-4 w-4" />,
    boolean: <ToggleLeft className="h-4 w-4" />,
    object: <Box className="h-4 w-4" />,
  };

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <header className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold truncate">{getLocalizedValue(localField.label, 'de') || localField.id}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">{localField.id}</p>
          </div>
          {hasLocalChanges && (
            <button
              onClick={saveChanges}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              Speichern
            </button>
          )}
        </div>
        {hasLocalChanges && (
          <p className="text-xs text-amber-600 mt-2">Ungespeicherte Änderungen (Tab zum nächsten Feld möglich)</p>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b bg-card">
        {[
          { id: 'basic', label: 'Basis', icon: <FileText className="h-4 w-4" /> },
          { id: 'system', label: 'System', icon: <Settings2 className="h-4 w-4" /> },
          { id: 'vocabulary', label: 'Vokabular', icon: <BookOpen className="h-4 w-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'basic' && (
          <BasicTab
            field={localField}
            schema={schema}
            onUpdate={handleLocalUpdate}
            getLocalizedValue={getLocalizedValue}
            setLocalizedValue={setLocalizedValue}
          />
        )}

        {activeTab === 'system' && (
          <SystemTab
            field={localField}
            onSystemUpdate={handleSystemUpdate}
            datatypeIcons={datatypeIcons}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyEditor
            vocabulary={localField.system.vocabulary}
            onUpdate={(vocab) => {
              handleSystemUpdate({ vocabulary: vocab });
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Label with Tooltip Helper
// ============================================================================

interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  className?: string;
}

function LabelWithTooltip({ label, tooltip, className = '' }: LabelWithTooltipProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className} group relative`}>
      <span>{label}</span>
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
      {/* Tooltip on hover */}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {tooltip}
      </div>
    </div>
  );
}

// ============================================================================
// Basic Tab
// ============================================================================

interface BasicTabProps {
  field: SchemaField;
  schema: { groups: { id: string; label: LocalizedString | string }[] };
  onUpdate: (updates: Partial<SchemaField>) => void;
  getLocalizedValue: (value: LocalizedString | string | undefined, lang: 'de' | 'en') => string;
  setLocalizedValue: (current: LocalizedString | string | undefined, lang: 'de' | 'en', newValue: string) => LocalizedString;
}

function BasicTab({ field, schema, onUpdate, getLocalizedValue, setLocalizedValue }: BasicTabProps) {
  return (
    <div className="space-y-6">
      {/* ID */}
      <div>
        <LabelWithTooltip label="ID" tooltip={TOOLTIPS.id} className="text-sm font-medium mb-1" />
        <input
          type="text"
          value={field.id}
          onChange={(e) => onUpdate({ id: e.target.value })}
          className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
          placeholder="namespace:fieldname"
        />
      </div>

      {/* Group */}
      <div>
        <LabelWithTooltip label="Gruppe" tooltip={TOOLTIPS.group} className="text-sm font-medium mb-1" />
        <select
          value={field.group || ''}
          onChange={(e) => onUpdate({ group: e.target.value || undefined })}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Keine Gruppe</option>
          {schema.groups.map(g => (
            <option key={g.id} value={g.id}>
              {typeof g.label === 'string' ? g.label : g.label.de || g.id}
            </option>
          ))}
        </select>
      </div>

      {/* Labels */}
      <div className="space-y-3">
        <span className="text-sm font-medium">Label</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <LabelWithTooltip label="🇩🇪 Deutsch" tooltip={TOOLTIPS.labelDe} className="text-xs text-muted-foreground mb-1" />
            <input
              type="text"
              value={getLocalizedValue(field.label, 'de')}
              onChange={(e) => onUpdate({ label: setLocalizedValue(field.label, 'de', e.target.value) })}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            />
          </div>
          <div>
            <LabelWithTooltip label="🇬🇧 English" tooltip={TOOLTIPS.labelEn} className="text-xs text-muted-foreground mb-1" />
            <input
              type="text"
              value={getLocalizedValue(field.label, 'en')}
              onChange={(e) => onUpdate({ label: setLocalizedValue(field.label, 'en', e.target.value) })}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <span className="text-sm font-medium">Beschreibung</span>
        <div className="space-y-2">
          <div>
            <LabelWithTooltip label="🇩🇪 Deutsch" tooltip={TOOLTIPS.descriptionDe} className="text-xs text-muted-foreground mb-1" />
            <textarea
              value={getLocalizedValue(field.description, 'de')}
              onChange={(e) => onUpdate({ description: setLocalizedValue(field.description, 'de', e.target.value) })}
              rows={2}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
            />
          </div>
          <div>
            <LabelWithTooltip label="🇬🇧 English" tooltip={TOOLTIPS.descriptionEn} className="text-xs text-muted-foreground mb-1" />
            <textarea
              value={getLocalizedValue(field.description, 'en')}
              onChange={(e) => onUpdate({ description: setLocalizedValue(field.description, 'en', e.target.value) })}
              rows={2}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="space-y-3">
        <LabelWithTooltip label="KI-Prompt Hinweis" tooltip={TOOLTIPS.promptDe} className="text-sm font-medium" />
        <textarea
          value={getLocalizedValue(field.prompt, 'de')}
          onChange={(e) => onUpdate({ prompt: setLocalizedValue(field.prompt, 'de', e.target.value) as LocalizedString })}
          rows={2}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
          placeholder="Zusätzliche Anweisungen für KI-Extraktion"
        />
      </div>
    </div>
  );
}

// ============================================================================
// System Tab
// ============================================================================

interface SystemTabProps {
  field: SchemaField;
  onSystemUpdate: (updates: Partial<SystemConfig>) => void;
  datatypeIcons: Record<string, React.ReactNode>;
}

function SystemTab({ field, onSystemUpdate, datatypeIcons }: SystemTabProps) {
  const datatypes = ['string', 'array', 'uri', 'number', 'date', 'boolean', 'object'];

  return (
    <div className="space-y-6">
      {/* Datatype */}
      <div>
        <LabelWithTooltip label="Datentyp" tooltip={TOOLTIPS.datatype} className="text-sm font-medium mb-2" />
        <div className="grid grid-cols-4 gap-2">
          {datatypes.map(dt => (
            <button
              key={dt}
              type="button"
              onClick={() => onSystemUpdate({ datatype: dt as SystemConfig['datatype'] })}
              className={cn(
                "flex flex-col items-center gap-1 p-2 border rounded-md text-xs transition-colors",
                field.system.datatype === dt
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent"
              )}
            >
              {datatypeIcons[dt]}
              {dt}
            </button>
          ))}
        </div>
      </div>

      {/* Path & URI */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <LabelWithTooltip label="Path" tooltip={TOOLTIPS.path} className="text-sm font-medium mb-1" />
          <input
            type="text"
            value={field.system.path}
            onChange={(e) => onSystemUpdate({ path: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
          />
        </div>
        <div>
          <LabelWithTooltip label="URI" tooltip={TOOLTIPS.uri} className="text-sm font-medium mb-1" />
          <input
            type="text"
            value={field.system.uri}
            onChange={(e) => onSystemUpdate({ uri: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
          />
        </div>
      </div>

      {/* Boolean Flags */}
      <div className="space-y-3">
        <span className="text-sm font-medium">Eigenschaften</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'required', label: 'Pflichtfeld', icon: <AlertCircle className="h-4 w-4" />, tooltip: TOOLTIPS.required },
            { key: 'multiple', label: 'Mehrfachwerte', icon: <List className="h-4 w-4" />, tooltip: TOOLTIPS.multiple },
            { key: 'ask_user', label: 'Nutzer fragen', icon: <Globe className="h-4 w-4" />, tooltip: TOOLTIPS.ask_user },
            { key: 'ai_fillable', label: 'KI-füllbar', icon: <Sparkles className="h-4 w-4" />, tooltip: TOOLTIPS.ai_fillable },
            { key: 'repo_field', label: 'Repository-Feld', icon: <Database className="h-4 w-4" />, tooltip: TOOLTIPS.repo_field },
          ].map(prop => (
            <div key={prop.key} className="relative group">
              <button
                type="button"
                onClick={() => {
                  const currentValue = !!field.system[prop.key as keyof SystemConfig];
                  onSystemUpdate({ [prop.key]: !currentValue });
                }}
                className={cn(
                  "flex items-center gap-2 p-2 border rounded-md transition-colors w-full",
                  field.system[prop.key as keyof SystemConfig]
                    ? "border-primary bg-primary/10"
                    : "hover:bg-accent"
                )}
              >
                {prop.icon}
                <span className="text-sm">{prop.label}</span>
              </button>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {prop.tooltip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Index Configuration */}
      <div>
        <span className="text-sm font-medium mb-2 block">Index-Konfiguration</span>
        <div className="flex gap-2">
          <div className="relative group">
            <button
              type="button"
              onClick={() => onSystemUpdate({ index: { ...field.system.index, fulltext: !field.system.index?.fulltext } })}
              className={cn(
                "flex items-center gap-2 p-2 border rounded-md transition-colors",
                field.system.index?.fulltext
                  ? "border-primary bg-primary/10"
                  : "hover:bg-accent"
              )}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Volltext</span>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {TOOLTIPS.fulltext}
            </div>
          </div>
          <div className="relative group">
            <button
              type="button"
              onClick={() => onSystemUpdate({ index: { ...field.system.index, keyword: !field.system.index?.keyword } })}
              className={cn(
                "flex items-center gap-2 p-2 border rounded-md transition-colors",
                field.system.index?.keyword
                  ? "border-primary bg-primary/10"
                  : "hover:bg-accent"
              )}
            >
              <Hash className="h-4 w-4" />
              <span className="text-sm">Keyword</span>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {TOOLTIPS.keyword}
            </div>
          </div>
        </div>
      </div>

      {/* Validation */}
      <div>
        <span className="text-sm font-medium mb-2 block">Validierung</span>
        <div className="space-y-2">
          <div>
            <LabelWithTooltip label="Pattern (Regex)" tooltip={TOOLTIPS.pattern} className="text-xs text-muted-foreground mb-1" />
            <input
              type="text"
              value={field.system.validation?.pattern || ''}
              onChange={(e) => onSystemUpdate({ 
                validation: { ...field.system.validation, pattern: e.target.value || undefined }
              })}
              className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
              placeholder="^https?://.*$"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <LabelWithTooltip label="Min. Länge" tooltip={TOOLTIPS.minLength} className="text-xs text-muted-foreground mb-1" />
              <input
                type="number"
                value={field.system.validation?.minLength || ''}
                onChange={(e) => onSystemUpdate({ 
                  validation: { ...field.system.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined }
                })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip label="Max. Länge" tooltip={TOOLTIPS.maxLength} className="text-xs text-muted-foreground mb-1" />
              <input
                type="number"
                value={field.system.validation?.maxLength || ''}
                onChange={(e) => onSystemUpdate({ 
                  validation: { ...field.system.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined }
                })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Normalization */}
      <div>
        <span className="text-sm font-medium mb-2 block">Normalisierung</span>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'trim', label: 'Trim', tooltip: TOOLTIPS.trim },
            { key: 'collapseWhitespace', label: 'Whitespace', tooltip: TOOLTIPS.collapseWhitespace },
            { key: 'deduplicate', label: 'Deduplizieren', tooltip: TOOLTIPS.deduplicate },
            { key: 'map_labels_to_uris', label: 'Labels → URIs', tooltip: TOOLTIPS.map_labels_to_uris },
          ].map(norm => (
            <div key={norm.key} className="relative group">
              <button
                type="button"
                onClick={() => {
                  const currentValue = !!field.system.normalization?.[norm.key as keyof typeof field.system.normalization];
                  onSystemUpdate({ normalization: { ...field.system.normalization, [norm.key]: !currentValue } });
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs transition-colors",
                  field.system.normalization?.[norm.key as keyof typeof field.system.normalization]
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
              >
                <span className={cn(
                  "w-3 h-3 rounded border flex items-center justify-center text-[10px]",
                  field.system.normalization?.[norm.key as keyof typeof field.system.normalization]
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}>
                  {field.system.normalization?.[norm.key as keyof typeof field.system.normalization] && '✓'}
                </span>
                {norm.label}
              </button>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {norm.tooltip}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
