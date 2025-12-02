import { useState } from 'react';
import { useSchemaStore } from '../../store/schema-store';
import { X, GitBranch, Plus, History, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface VersionDialogProps {
  onClose: () => void;
}

export function VersionDialog({ onClose }: VersionDialogProps) {
  const {
    activeContext,
    activeVersion,
    contextManifests,
    createVersion,
    deleteVersion,
    setActiveVersion,
  } = useSchemaStore();

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [newVersion, setNewVersion] = useState('');
  const [basedOnVersion, setBasedOnVersion] = useState(activeVersion);
  const [description, setDescription] = useState('');

  const manifest = contextManifests.get(activeContext);
  const versions = manifest ? Object.entries(manifest.versions).sort((a, b) => b[0].localeCompare(a[0])) : [];

  const handleCreate = () => {
    if (!newVersion.trim()) return;
    
    createVersion(activeContext, newVersion.trim(), basedOnVersion);
    setActiveVersion(newVersion.trim());
    onClose();
  };

  const handleDelete = (version: string) => {
    if (versions.length <= 1) {
      alert('Kann die letzte Version nicht löschen.');
      return;
    }
    if (confirm(`Version ${version} wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      deleteVersion(activeContext, version);
      if (activeVersion === version) {
        // Switch to another version
        const otherVersion = versions.find(([v]) => v !== version);
        if (otherVersion) {
          setActiveVersion(otherVersion[0]);
        }
      }
    }
  };

  const suggestNextVersion = () => {
    if (!manifest) return '1.0.0';
    
    const latestVersion = Object.keys(manifest.versions).sort((a, b) => b.localeCompare(a))[0];
    const parts = latestVersion.split('.');
    
    // Increment patch version
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-background rounded-lg shadow-xl w-[500px] max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Versionen verwalten</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('list')}
            className={cn(
              "flex-1 px-4 py-2 text-sm border-b-2 transition-colors",
              mode === 'list' ? "border-primary text-primary" : "border-transparent hover:bg-accent"
            )}
          >
            <History className="h-4 w-4 inline mr-2" />
            Versionen
          </button>
          <button
            onClick={() => {
              setMode('create');
              setNewVersion(suggestNextVersion());
            }}
            className={cn(
              "flex-1 px-4 py-2 text-sm border-b-2 transition-colors",
              mode === 'create' ? "border-primary text-primary" : "border-transparent hover:bg-accent"
            )}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Neue Version
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[400px] overflow-auto">
          {mode === 'list' ? (
            <div className="space-y-2">
              {versions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Keine Versionen vorhanden</p>
              ) : (
                versions.map(([version, entry]) => (
                  <div 
                    key={version}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg",
                      version === activeVersion ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={cn(
                          "w-3 h-3 rounded-full",
                          version === activeVersion ? "bg-primary" : "bg-muted"
                        )}
                      />
                      <div>
                        <div className="font-medium">v{version}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.releaseDate || 'Kein Datum'}
                          {entry.isDefault && ' • Standard'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {version !== activeVersion && (
                        <button
                          onClick={() => {
                            setActiveVersion(version);
                            onClose();
                          }}
                          className="px-2 py-1 text-xs hover:bg-accent rounded"
                        >
                          Auswählen
                        </button>
                      )}
                      {versions.length > 1 && (
                        <button
                          onClick={() => handleDelete(version)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          title="Version löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {/* Changelog Preview for Active Version */}
              {(versions.find(([v]) => v === activeVersion)?.[1].changelog?.length ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Changelog für v{activeVersion}</h3>
                  <div className="space-y-1 text-xs">
                    {versions.find(([v]) => v === activeVersion)?.[1].changelog?.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex gap-2 py-1">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          entry.type === 'added' && "bg-green-100 text-green-700",
                          entry.type === 'changed' && "bg-blue-100 text-blue-700",
                          entry.type === 'removed' && "bg-red-100 text-red-700",
                          entry.type === 'fixed' && "bg-amber-100 text-amber-700"
                        )}>
                          {entry.type}
                        </span>
                        <span className="text-muted-foreground">{entry.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Version Number */}
              <div>
                <label className="block text-sm font-medium mb-1">Versionsnummer</label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="z.B. 1.9.0"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: Major.Minor.Patch (z.B. 1.9.0)
                </p>
              </div>

              {/* Based On */}
              <div>
                <label className="block text-sm font-medium mb-1">Basiert auf</label>
                <select
                  value={basedOnVersion}
                  onChange={(e) => setBasedOnVersion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  {versions.map(([version]) => (
                    <option key={version} value={version}>v{version}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Alle Schemas werden von dieser Version kopiert
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung der neuen Version..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                />
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-xs">
                <strong>Hinweis:</strong> Eine neue Version kopiert alle Schemas der Basisversion.
                Änderungen werden automatisch im Changelog dokumentiert.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Abbrechen
          </button>
          {mode === 'create' && (
            <button
              onClick={handleCreate}
              disabled={!newVersion.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Version erstellen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
