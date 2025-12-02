import { useState } from 'react';
import { useSchemaStore } from '../../store/schema-store';
import { X } from 'lucide-react';

interface CreateContextDialogProps {
  onClose: () => void;
}

export function CreateContextDialog({ onClose }: CreateContextDialogProps) {
  const { contextRegistry, contextManifests, createContext } = useSchemaStore();
  
  const [contextName, setContextName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [basedOn, setBasedOn] = useState<string>('default');
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>(['core.json']);

  // Get schemas from the base context
  const baseManifest = contextManifests.get(basedOn);
  const baseVersion = contextRegistry?.contexts[basedOn]?.defaultVersion || '1.8.0';
  const availableSchemas = baseManifest?.versions[baseVersion]?.schemas || [];

  const handleCreate = () => {
    if (!contextName || !displayName) {
      alert('Bitte Name und Anzeigename ausfüllen');
      return;
    }

    // Validate context name (lowercase, no spaces)
    const validName = contextName.toLowerCase().replace(/\s+/g, '_');
    
    createContext(validName, displayName, basedOn, selectedSchemas);
    onClose();
  };

  const toggleSchema = (schemaFile: string) => {
    if (schemaFile === 'core.json') return; // core.json is always required
    
    setSelectedSchemas(prev => 
      prev.includes(schemaFile)
        ? prev.filter(s => s !== schemaFile)
        : [...prev, schemaFile]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Neuen Kontext erstellen</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Context Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Kontext-Name (technisch)
            </label>
            <input
              type="text"
              value={contextName}
              onChange={(e) => setContextName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="mein_kontext"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kleinbuchstaben, Unterstriche erlaubt. Wird als Ordnername verwendet.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Anzeigename
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Mein Kontext"
            />
          </div>

          {/* Based On */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Basiert auf
            </label>
            <select
              value={basedOn}
              onChange={(e) => {
                setBasedOn(e.target.value);
                setSelectedSchemas(['core.json']);
              }}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              {contextRegistry && Object.entries(contextRegistry.contexts).map(([name, entry]) => (
                <option key={name} value={name}>
                  {(entry as { name: string }).name} ({name})
                </option>
              ))}
            </select>
          </div>

          {/* Schema Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Schemas übernehmen
            </label>
            <div className="border rounded-md p-2 max-h-48 overflow-auto space-y-1">
              {availableSchemas.map(schema => (
                <label
                  key={schema}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
                    selectedSchemas.includes(schema) ? 'bg-primary/10' : 'hover:bg-accent'
                  } ${schema === 'core.json' ? 'opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSchemas.includes(schema)}
                    onChange={() => toggleSchema(schema)}
                    disabled={schema === 'core.json'}
                    className="rounded"
                  />
                  <span className="text-sm">{schema}</span>
                  {schema === 'core.json' && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      (erforderlich)
                    </span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedSchemas.length} von {availableSchemas.length} Schemas ausgewählt
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={!contextName || !displayName}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
