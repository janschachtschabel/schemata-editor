import React, { useState } from 'react';
import type { FieldItems, FieldVariant, SchemaField, LocalizedString, SystemConfig } from '../types/schema';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Box,
  Layers,
  Settings2,
  Type,
  List,
  Link,
  Hash,
  Calendar,
  ToggleLeft,
  AlertCircle,
  Sparkles,
  Globe,
  Database,
  Search,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { cn } from '../utils/cn';

// ============================================================================
// Props
// ============================================================================

interface SubFieldsEditorProps {
  items: FieldItems | undefined;
  onUpdate: (items: FieldItems | undefined) => void;
}

// ============================================================================
// Helpers
// ============================================================================

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

const datatypeOptions = ['string', 'array', 'uri', 'number', 'date', 'boolean', 'object'];

const datatypeIcons: Record<string, React.ReactNode> = {
  string: <Type className="h-3 w-3" />,
  array: <List className="h-3 w-3" />,
  uri: <Link className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  boolean: <ToggleLeft className="h-3 w-3" />,
  object: <Box className="h-3 w-3" />,
};

const getDatatypeBadge = (datatype: string) => {
  const colors: Record<string, string> = {
    string: 'bg-blue-100 text-blue-700',
    array: 'bg-purple-100 text-purple-700',
    uri: 'bg-green-100 text-green-700',
    number: 'bg-amber-100 text-amber-700',
    date: 'bg-pink-100 text-pink-700',
    boolean: 'bg-cyan-100 text-cyan-700',
    object: 'bg-orange-100 text-orange-700',
  };
  return colors[datatype] || 'bg-gray-100 text-gray-700';
};

// ============================================================================
// Main Component
// ============================================================================

export function SubFieldsEditor({ items, onUpdate }: SubFieldsEditorProps) {
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set());
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  // No items configured
  if (!items) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 border rounded-lg bg-muted/30">
          <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <h4 className="font-medium mb-2">Keine Unterfelder konfiguriert</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Definiere Objekt-Varianten mit verschachtelten Feldern für komplexe Datenstrukturen.
          </p>
          <button
            onClick={() => onUpdate({
              datatype: 'object',
              discriminator: '@type',
              variants: [{
                '@type': 'Default',
                label: { de: 'Standard', en: 'Default' },
                description: { de: '', en: '' },
                fields: [],
              }]
            })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Unterfelder erstellen
          </button>
        </div>
      </div>
    );
  }

  const toggleVariant = (index: number) => {
    const next = new Set(expandedVariants);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpandedVariants(next);
  };

  const toggleField = (key: string) => {
    const next = new Set(expandedFields);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedFields(next);
  };

  // ---- Variant CRUD ----

  const addVariant = () => {
    const variants = items.variants || [];
    onUpdate({
      ...items,
      variants: [
        ...variants,
        {
          '@type': `Variant${variants.length + 1}`,
          label: { de: 'Neue Variante', en: 'New Variant' },
          description: { de: '', en: '' },
          fields: [],
        }
      ]
    });
  };

  const updateVariant = (vIdx: number, updates: Partial<FieldVariant>) => {
    const variants = [...(items.variants || [])];
    variants[vIdx] = { ...variants[vIdx], ...updates };
    onUpdate({ ...items, variants });
  };

  const deleteVariant = (vIdx: number) => {
    const variants = (items.variants || []).filter((_, i) => i !== vIdx);
    onUpdate({ ...items, variants });
  };

  // ---- Sub-field CRUD ----

  const addSubField = (vIdx: number) => {
    const variants = [...(items.variants || [])];
    const ts = Date.now();
    const newField: SchemaField = {
      id: `field_${ts}`,
      label: { de: 'Neues Unterfeld', en: 'New Sub-field' },
      description: { de: '', en: '' },
      prompt: { de: '', en: '' },
      system: {
        path: `field_${ts}`,
        uri: '',
        datatype: 'string',
        multiple: false,
        required: false,
        ask_user: true,
        ai_fillable: true,
      }
    };
    variants[vIdx] = {
      ...variants[vIdx],
      fields: [...variants[vIdx].fields, newField],
    };
    onUpdate({ ...items, variants });
    // Auto-expand the new field
    toggleField(`${vIdx}-${variants[vIdx].fields.length - 1}`);
  };

  const updateSubField = (vIdx: number, fIdx: number, updates: Partial<SchemaField>) => {
    const variants = [...(items.variants || [])];
    const fields = [...variants[vIdx].fields];
    fields[fIdx] = { ...fields[fIdx], ...updates };
    variants[vIdx] = { ...variants[vIdx], fields };
    onUpdate({ ...items, variants });
  };

  const updateSubFieldSystem = (vIdx: number, fIdx: number, updates: Partial<SystemConfig>) => {
    const variants = [...(items.variants || [])];
    const fields = [...variants[vIdx].fields];
    fields[fIdx] = { ...fields[fIdx], system: { ...fields[fIdx].system, ...updates } };
    variants[vIdx] = { ...variants[vIdx], fields };
    onUpdate({ ...items, variants });
  };

  const deleteSubField = (vIdx: number, fIdx: number) => {
    const variants = [...(items.variants || [])];
    const fields = variants[vIdx].fields.filter((_, i) => i !== fIdx);
    variants[vIdx] = { ...variants[vIdx], fields };
    onUpdate({ ...items, variants });
  };

  const duplicateSubField = (vIdx: number, fIdx: number) => {
    const variants = [...(items.variants || [])];
    const original = variants[vIdx].fields[fIdx];
    const copy: SchemaField = JSON.parse(JSON.stringify(original));
    copy.id = `${original.id}_copy`;
    const fields = [...variants[vIdx].fields];
    fields.splice(fIdx + 1, 0, copy);
    variants[vIdx] = { ...variants[vIdx], fields };
    onUpdate({ ...items, variants });
  };

  return (
    <div className="space-y-4">
      {/* Items Config */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Item-Datentyp</label>
            <select
              value={items.datatype || 'object'}
              onChange={(e) => onUpdate({ ...items, datatype: e.target.value })}
              className="w-full px-2 py-1.5 border rounded text-sm bg-background"
            >
              <option value="object">object</option>
              <option value="string">string</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Discriminator</label>
            <input
              type="text"
              value={items.discriminator || ''}
              onChange={(e) => onUpdate({ ...items, discriminator: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border rounded text-sm font-mono bg-background"
              placeholder="@type"
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Varianten ({(items.variants || []).length})</h4>
          <button
            onClick={addVariant}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Variante
          </button>
        </div>

        <div className="space-y-3">
          {(items.variants || []).map((variant, vIdx) => {
            const isVExpanded = expandedVariants.has(vIdx);
            return (
              <div key={vIdx} className="border rounded-lg bg-card">
                {/* Variant Header */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent/50 group"
                  onClick={() => toggleVariant(vIdx)}
                >
                  {isVExpanded
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  }
                  <Box className="h-4 w-4 text-orange-500" />
                  <span className="flex-1 font-medium text-sm truncate">
                    {getLocalizedValue(variant.label, 'de') || variant['@type']}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @type={variant['@type']}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {variant.fields.length} Felder
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Variante "${getLocalizedValue(variant.label, 'de')}" löschen?`)) {
                        deleteVariant(vIdx);
                      }
                    }}
                    className="p-1 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>

                {/* Variant Content */}
                {isVExpanded && (
                  <div className="border-t">
                    {/* Variant Meta */}
                    <div className="px-3 py-3 space-y-3 bg-muted/20">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">@type</label>
                          <input
                            type="text"
                            value={variant['@type']}
                            onChange={(e) => updateVariant(vIdx, { '@type': e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">🇩🇪 Label</label>
                          <input
                            type="text"
                            value={getLocalizedValue(variant.label, 'de')}
                            onChange={(e) => updateVariant(vIdx, { label: setLocalizedValue(variant.label, 'de', e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">🇬🇧 Label</label>
                          <input
                            type="text"
                            value={getLocalizedValue(variant.label, 'en')}
                            onChange={(e) => updateVariant(vIdx, { label: setLocalizedValue(variant.label, 'en', e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">🇩🇪 Beschreibung</label>
                          <input
                            type="text"
                            value={getLocalizedValue(variant.description, 'de')}
                            onChange={(e) => updateVariant(vIdx, { description: setLocalizedValue(variant.description, 'de', e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">🇬🇧 Description</label>
                          <input
                            type="text"
                            value={getLocalizedValue(variant.description, 'en')}
                            onChange={(e) => updateVariant(vIdx, { description: setLocalizedValue(variant.description, 'en', e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-fields */}
                    <div className="divide-y">
                      {variant.fields.map((subField, fIdx) => {
                        const fieldKey = `${vIdx}-${fIdx}`;
                        const isFExpanded = expandedFields.has(fieldKey);

                        return (
                          <div key={fIdx} className="bg-background">
                            {/* Sub-field Row */}
                            <div
                              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-accent/30 group"
                              onClick={() => toggleField(fieldKey)}
                            >
                              {isFExpanded
                                ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              }
                              <span className="flex-1 text-sm truncate">
                                {getLocalizedValue(subField.label, 'de') || subField.id}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {subField.id}
                              </span>
                              <span className={cn("text-xs px-1.5 py-0.5 rounded", getDatatypeBadge(subField.system.datatype))}>
                                {subField.system.datatype}
                              </span>
                              {subField.system.required && (
                                <span className="text-xs text-destructive font-bold">*</span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); duplicateSubField(vIdx, fIdx); }}
                                className="p-0.5 hover:bg-accent rounded opacity-0 group-hover:opacity-100"
                                title="Duplizieren"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Unterfeld "${getLocalizedValue(subField.label, 'de')}" löschen?`)) {
                                    deleteSubField(vIdx, fIdx);
                                  }
                                }}
                                className="p-0.5 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>

                            {/* Sub-field Editor */}
                            {isFExpanded && (
                              <SubFieldDetail
                                field={subField}
                                vIdx={vIdx}
                                fIdx={fIdx}
                                onFieldUpdate={(updates) => updateSubField(vIdx, fIdx, updates)}
                                onSystemUpdate={(updates) => updateSubFieldSystem(vIdx, fIdx, updates)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Sub-field */}
                    <div className="p-2 border-t">
                      <button
                        onClick={() => addSubField(vIdx)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                      >
                        <Plus className="h-4 w-4" />
                        Unterfeld hinzufügen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remove Items */}
      <button
        onClick={() => {
          if (confirm('Alle Unterfelder entfernen?')) {
            onUpdate(undefined);
          }
        }}
        className="w-full px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10"
      >
        Unterfelder entfernen
      </button>
    </div>
  );
}

// ============================================================================
// Sub-field Detail Editor
// ============================================================================

interface SubFieldDetailProps {
  field: SchemaField;
  vIdx: number;
  fIdx: number;
  onFieldUpdate: (updates: Partial<SchemaField>) => void;
  onSystemUpdate: (updates: Partial<SystemConfig>) => void;
}

function SubFieldDetail({ field, vIdx, fIdx, onFieldUpdate, onSystemUpdate }: SubFieldDetailProps) {
  const [activeSection, setActiveSection] = useState<'basic' | 'system'>('basic');

  return (
    <div className="px-4 pb-3 border-t bg-muted/10">
      {/* Section Tabs */}
      <div className="flex gap-1 py-2 mb-2">
        <button
          onClick={() => setActiveSection('basic')}
          className={cn(
            "px-2 py-1 text-xs rounded",
            activeSection === 'basic' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
        >
          Basis
        </button>
        <button
          onClick={() => setActiveSection('system')}
          className={cn(
            "px-2 py-1 text-xs rounded",
            activeSection === 'system' ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
        >
          System
        </button>
      </div>

      {activeSection === 'basic' && (
        <div className="space-y-3">
          {/* ID */}
          <div>
            <label className="text-xs text-muted-foreground">ID</label>
            <input
              type="text"
              value={field.id}
              onChange={(e) => onFieldUpdate({ id: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
            />
          </div>

          {/* Labels */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">🇩🇪 Label</label>
              <input
                type="text"
                value={getLocalizedValue(field.label, 'de')}
                onChange={(e) => onFieldUpdate({ label: setLocalizedValue(field.label, 'de', e.target.value) })}
                className="w-full px-2 py-1 border rounded text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">🇬🇧 Label</label>
              <input
                type="text"
                value={getLocalizedValue(field.label, 'en')}
                onChange={(e) => onFieldUpdate({ label: setLocalizedValue(field.label, 'en', e.target.value) })}
                className="w-full px-2 py-1 border rounded text-sm bg-background"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">🇩🇪 Beschreibung</label>
              <input
                type="text"
                value={getLocalizedValue(field.description, 'de')}
                onChange={(e) => onFieldUpdate({ description: setLocalizedValue(field.description, 'de', e.target.value) })}
                className="w-full px-2 py-1 border rounded text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">🇬🇧 Description</label>
              <input
                type="text"
                value={getLocalizedValue(field.description, 'en')}
                onChange={(e) => onFieldUpdate({ description: setLocalizedValue(field.description, 'en', e.target.value) })}
                className="w-full px-2 py-1 border rounded text-sm bg-background"
              />
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs text-muted-foreground">🇩🇪 KI-Prompt</label>
            <textarea
              value={getLocalizedValue(field.prompt, 'de')}
              onChange={(e) => onFieldUpdate({ prompt: setLocalizedValue(field.prompt, 'de', e.target.value) as LocalizedString })}
              rows={2}
              className="w-full px-2 py-1 border rounded text-sm bg-background resize-none"
              placeholder="KI-Extraktionshinweis..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">🇬🇧 AI Prompt</label>
            <textarea
              value={getLocalizedValue(field.prompt, 'en')}
              onChange={(e) => onFieldUpdate({ prompt: setLocalizedValue(field.prompt, 'en', e.target.value) as LocalizedString })}
              rows={2}
              className="w-full px-2 py-1 border rounded text-sm bg-background resize-none"
              placeholder="AI extraction hint..."
            />
          </div>
        </div>
      )}

      {activeSection === 'system' && (
        <div className="space-y-3">
          {/* Datatype */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Datentyp</label>
            <div className="flex flex-wrap gap-1">
              {datatypeOptions.map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => onSystemUpdate({ datatype: dt as SystemConfig['datatype'] })}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 border rounded text-xs",
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Path</label>
              <input
                type="text"
                value={field.system.path}
                onChange={(e) => onSystemUpdate({ path: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URI</label>
              <input
                type="text"
                value={field.system.uri}
                onChange={(e) => onSystemUpdate({ uri: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
              />
            </div>
          </div>

          {/* Boolean Flags */}
          <div className="flex flex-wrap gap-1">
            {[
              { key: 'required', label: 'Pflicht', icon: <AlertCircle className="h-3 w-3" /> },
              { key: 'multiple', label: 'Mehrfach', icon: <List className="h-3 w-3" /> },
              { key: 'ask_user', label: 'Nutzer', icon: <Globe className="h-3 w-3" /> },
              { key: 'ai_fillable', label: 'KI', icon: <Sparkles className="h-3 w-3" /> },
            ].map(prop => (
              <button
                key={prop.key}
                type="button"
                onClick={() => {
                  const current = !!field.system[prop.key as keyof SystemConfig];
                  onSystemUpdate({ [prop.key]: !current });
                }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 border rounded text-xs",
                  field.system[prop.key as keyof SystemConfig]
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
              >
                {prop.icon}
                {prop.label}
              </button>
            ))}
          </div>

          {/* Validation Pattern */}
          <div>
            <label className="text-xs text-muted-foreground">Validation Pattern</label>
            <input
              type="text"
              value={field.system.validation?.pattern || ''}
              onChange={(e) => onSystemUpdate({
                validation: { ...field.system.validation, pattern: e.target.value || undefined }
              })}
              className="w-full px-2 py-1 border rounded text-sm font-mono bg-background"
              placeholder="^https?://.*$"
            />
          </div>

          {/* Min/Max for numbers */}
          {(field.system.datatype === 'number') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Min</label>
                <input
                  type="number"
                  value={field.system.validation?.min ?? ''}
                  onChange={(e) => onSystemUpdate({
                    validation: { ...field.system.validation, min: e.target.value ? parseFloat(e.target.value) : undefined }
                  })}
                  className="w-full px-2 py-1 border rounded text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max</label>
                <input
                  type="number"
                  value={field.system.validation?.max ?? ''}
                  onChange={(e) => onSystemUpdate({
                    validation: { ...field.system.validation, max: e.target.value ? parseFloat(e.target.value) : undefined }
                  })}
                  className="w-full px-2 py-1 border rounded text-sm bg-background"
                />
              </div>
            </div>
          )}

          {/* Nested sub-fields (recursive!) */}
          {(field.system.datatype === 'array' || field.system.datatype === 'object') && (
            <div className="mt-3 pt-3 border-t">
              <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Verschachtelte Unterfelder
              </h5>
              <SubFieldsEditor
                items={field.system.items}
                onUpdate={(newItems) => onSystemUpdate({ items: newItems })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
