import { useState } from 'react';
import { useSchemaStore } from '../../store/schema-store';
import { X } from 'lucide-react';

interface CreateSchemaDialogProps {
  onClose: () => void;
}

export function CreateSchemaDialog({ onClose }: CreateSchemaDialogProps) {
  const { activeContext, createSchema, getContentTypes, addContentType } = useSchemaStore();
  
  const [schemaFile, setSchemaFile] = useState('');
  const [profileId, setProfileId] = useState('type:');
  const [displayNameDe, setDisplayNameDe] = useState('');
  const [displayNameEn, setDisplayNameEn] = useState('');
  const [icon, setIcon] = useState('article');
  const [addAsContentType, setAddAsContentType] = useState(true);

  const handleCreate = () => {
    if (!schemaFile || !displayNameDe) {
      alert('Bitte Dateiname und deutsche Bezeichnung ausfüllen');
      return;
    }

    // Ensure .json extension
    const fileName = schemaFile.endsWith('.json') ? schemaFile : `${schemaFile}.json`;
    
    // Create the schema
    createSchema(fileName, profileId, displayNameDe);
    
    // Add as content type if selected
    if (addAsContentType) {
      addContentType({
        label: { de: displayNameDe, en: displayNameEn || displayNameDe },
        icon,
        schema_file: fileName,
      });
    }
    
    onClose();
  };

  // Common icons for content types
  const commonIcons = [
    'article', 'event', 'person', 'business', 'school', 'work',
    'menu_book', 'chat', 'build', 'assignment', 'science',
    'psychology', 'groups', 'video_library', 'podcasts'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Neues Schema erstellen</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Info */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            Das Schema wird im Kontext <strong>{activeContext}</strong> erstellt.
          </div>

          {/* Schema File Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Dateiname
            </label>
            <input
              type="text"
              value={schemaFile}
              onChange={(e) => setSchemaFile(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              className="w-full px-3 py-2 border rounded-md bg-background font-mono"
              placeholder="neues_schema.json"
            />
          </div>

          {/* Profile ID */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Profile ID
            </label>
            <input
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background font-mono"
              placeholder="type:neues_schema"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: namespace:bezeichner (z.B. type:event, core:descriptive)
            </p>
          </div>

          {/* Display Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                🇩🇪 Bezeichnung
              </label>
              <input
                type="text"
                value={displayNameDe}
                onChange={(e) => setDisplayNameDe(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Neuer Inhaltstyp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                🇬🇧 Label
              </label>
              <input
                type="text"
                value={displayNameEn}
                onChange={(e) => setDisplayNameEn(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="New Content Type"
              />
            </div>
          </div>

          {/* Add as Content Type */}
          <div className="border rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addAsContentType}
                onChange={(e) => setAddAsContentType(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Als Inhaltsart in core.json registrieren</span>
            </label>
            
            {addAsContentType && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="flex flex-wrap gap-1">
                  {commonIcons.map(iconName => (
                    <button
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={`px-2 py-1 text-xs border rounded ${
                        icon === iconName 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'hover:bg-accent'
                      }`}
                    >
                      {iconName}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background mt-2 text-sm"
                  placeholder="Icon-Name eingeben"
                />
              </div>
            )}
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
            disabled={!schemaFile || !displayNameDe}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Schema erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
