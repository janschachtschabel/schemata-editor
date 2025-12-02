import { useState } from 'react';
import { useSchemaStore, useActiveSchema } from '../store/schema-store';
import type { SchemaField, SchemaGroup } from '../types/schema';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Copy, 
  Edit2,
  ChevronDown,
  ChevronRight,
  FileJson,
  Layers
} from 'lucide-react';
import { cn } from '../utils/cn';

export function SchemaEditor() {
  const {
    activeSchemaFile,
    activeFieldId,
    setActiveField,
    deleteField,
    addField,
    addGroup,
    updateGroup,
    deleteGroup,
    deleteSchema,
  } = useSchemaStore();

  const schema = useActiveSchema();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState({ de: '', en: '' });

  // Handler for adding a new field
  const handleAddField = (groupId: string) => {
    if (!activeSchemaFile) return;
    
    // Generate unique field ID
    const timestamp = Date.now();
    const newFieldId = `custom:field_${timestamp}`;
    
    const newField: SchemaField = {
      id: newFieldId,
      group: groupId,
      label: { de: 'Neues Feld', en: 'New Field' },
      description: { de: '', en: '' },
      prompt: { de: '', en: '' },
      system: {
        path: newFieldId,
        uri: newFieldId,
        datatype: 'string',
        multiple: false,
        required: false,
        ask_user: true,
        ai_fillable: true,
        repo_field: false,
      }
    };
    
    addField(activeSchemaFile, newField);
    setActiveField(newFieldId);
  };

  // Empty state
  if (!activeSchemaFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <FileJson className="h-16 w-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">Kein Schema ausgewählt</h2>
        <p className="text-sm text-center max-w-md">
          Wähle ein Schema aus der Seitenleiste aus oder erstelle ein neues Schema, 
          um mit der Bearbeitung zu beginnen.
        </p>
      </div>
    );
  }

  // Loading state
  if (!schema) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group fields by group
  const fieldsByGroup = new Map<string, SchemaField[]>();
  const ungroupedFields: SchemaField[] = [];

  schema.fields.forEach(field => {
    if (field.group) {
      const groupFields = fieldsByGroup.get(field.group) || [];
      groupFields.push(field);
      fieldsByGroup.set(field.group, groupFields);
    } else {
      ungroupedFields.push(field);
    }
  });

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupLabel = (group: SchemaGroup): string => {
    if (typeof group.label === 'string') return group.label;
    return group.label.de || group.label.en || group.id;
  };

  const getFieldLabel = (field: SchemaField): string => {
    if (typeof field.label === 'string') return field.label;
    return field.label.de || field.label.en || field.id;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            {activeSchemaFile}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              v{schema.version}
            </span>
            <button
              onClick={() => {
                if (confirm(`Schema "${activeSchemaFile}" wirklich löschen?`)) {
                  deleteSchema(activeSchemaFile!);
                }
              }}
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
              title="Schema löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{schema.fields.length} Felder</span>
          <span>{schema.groups.length} Gruppen</span>
          <span className="font-mono text-xs">{schema.profileId}</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Groups */}
        {schema.groups.map(group => {
          const groupFields = fieldsByGroup.get(group.id) || [];
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div key={group.id} className="mb-4 border rounded-lg bg-card">
              {/* Group Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-accent/50 rounded-t-lg group"
                onClick={() => toggleGroup(group.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Layers className="h-4 w-4 text-primary" />
                {editingGroup === group.id ? (
                  <input
                    type="text"
                    defaultValue={getGroupLabel(group)}
                    autoFocus
                    className="flex-1 px-2 py-0.5 border rounded text-sm bg-background"
                    onBlur={(e) => {
                      updateGroup(activeSchemaFile!, group.id, { 
                        label: { de: e.target.value, en: e.target.value } 
                      });
                      setEditingGroup(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateGroup(activeSchemaFile!, group.id, { 
                          label: { de: (e.target as HTMLInputElement).value, en: (e.target as HTMLInputElement).value } 
                        });
                        setEditingGroup(null);
                      }
                      if (e.key === 'Escape') setEditingGroup(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="font-medium">{getGroupLabel(group)}</span>
                )}
                <span className="text-xs text-muted-foreground ml-auto mr-2">
                  {groupFields.length} Felder
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGroup(group.id);
                  }}
                  className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100"
                  title="Gruppe umbenennen"
                >
                  <Edit2 className="h-3 w-3 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Gruppe "${getGroupLabel(group)}" löschen? Felder bleiben erhalten.`)) {
                      deleteGroup(activeSchemaFile!, group.id);
                    }
                  }}
                  className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100"
                  title="Gruppe löschen"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>

              {/* Group Fields */}
              {isExpanded && (
                <div className="border-t">
                  {groupFields.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Keine Felder in dieser Gruppe
                    </div>
                  ) : (
                    <div className="divide-y">
                      {groupFields.map(field => (
                        <FieldRow
                          key={field.id}
                          field={field}
                          isActive={activeFieldId === field.id}
                          onClick={() => setActiveField(field.id)}
                          onDelete={() => {
                            if (confirm(`Feld "${getFieldLabel(field)}" wirklich löschen?`)) {
                              deleteField(activeSchemaFile!, field.id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Add Field Button */}
                  <div className="p-2 border-t">
                    <button
                      onClick={() => handleAddField(group.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                    >
                      <Plus className="h-4 w-4" />
                      Feld hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Group Button */}
        {showAddGroup ? (
          <div className="mb-4 border rounded-lg bg-card p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName.de}
                onChange={(e) => setNewGroupName({ de: e.target.value, en: e.target.value })}
                placeholder="Gruppenname..."
                autoFocus
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newGroupName.de) {
                    const groupId = newGroupName.de.toLowerCase().replace(/\s+/g, '_');
                    addGroup(activeSchemaFile!, {
                      id: groupId,
                      label: { de: newGroupName.de, en: newGroupName.en || newGroupName.de }
                    });
                    setNewGroupName({ de: '', en: '' });
                    setShowAddGroup(false);
                  }
                  if (e.key === 'Escape') {
                    setShowAddGroup(false);
                    setNewGroupName({ de: '', en: '' });
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newGroupName.de) {
                    const groupId = newGroupName.de.toLowerCase().replace(/\s+/g, '_');
                    addGroup(activeSchemaFile!, {
                      id: groupId,
                      label: { de: newGroupName.de, en: newGroupName.en || newGroupName.de }
                    });
                    setNewGroupName({ de: '', en: '' });
                    setShowAddGroup(false);
                  }
                }}
                disabled={!newGroupName.de}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
              >
                Erstellen
              </button>
              <button
                onClick={() => {
                  setShowAddGroup(false);
                  setNewGroupName({ de: '', en: '' });
                }}
                className="px-3 py-2 border rounded-md text-sm hover:bg-accent"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddGroup(true)}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Neue Gruppe hinzufügen
          </button>
        )}

        {/* Ungrouped Fields */}
        {ungroupedFields.length > 0 && (
          <div className="mb-4 border rounded-lg bg-card">
            <div className="px-4 py-3 border-b">
              <span className="font-medium text-muted-foreground">Ohne Gruppe</span>
              <span className="text-xs text-muted-foreground ml-2">
                {ungroupedFields.length} Felder
              </span>
            </div>
            <div className="divide-y">
              {ungroupedFields.map(field => (
                <FieldRow
                  key={field.id}
                  field={field}
                  isActive={activeFieldId === field.id}
                  onClick={() => setActiveField(field.id)}
                  onDelete={() => {
                    if (confirm(`Feld "${getFieldLabel(field)}" wirklich löschen?`)) {
                      deleteField(activeSchemaFile!, field.id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Field Row Component
// ============================================================================

interface FieldRowProps {
  field: SchemaField;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function FieldRow({ field, isActive, onClick, onDelete }: FieldRowProps) {
  const getFieldLabel = (f: SchemaField): string => {
    if (typeof f.label === 'string') return f.label;
    return f.label.de || f.label.en || f.id;
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

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer group",
        isActive ? "bg-primary/10" : "hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab opacity-0 group-hover:opacity-100" />

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{getFieldLabel(field)}</span>
          {field.system.required && (
            <span className="text-xs text-destructive">*</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono truncate">
          {field.id}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1">
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded",
          getDatatypeBadge(field.system.datatype)
        )}>
          {field.system.datatype}
        </span>
        {field.system.vocabulary && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
            vocab
          </span>
        )}
        {field.system.multiple && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            multi
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Copy field
          }}
          className="p-1 hover:bg-accent rounded"
          title="Duplizieren"
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-destructive/20 rounded"
          title="Löschen"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );
}
