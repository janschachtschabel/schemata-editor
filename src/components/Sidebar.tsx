import { useState, useRef } from 'react';
import { useSchemaStore, useAvailableSchemas } from '../store/schema-store';
import type { ContextEntry } from '../types/schema';
import { 
  FolderOpen, 
  FileJson, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Settings,
  Download,
  Upload,
  Layers,
  GitBranch
} from 'lucide-react';
import { cn } from '../utils/cn';
import { CreateContextDialog } from './dialogs/CreateContextDialog';
import { CreateSchemaDialog } from './dialogs/CreateSchemaDialog';
import { VersionDialog } from './dialogs/VersionDialog';

export function Sidebar() {
  const {
    contextRegistry,
    contextManifests,
    activeContext,
    activeVersion,
    activeSchemaFile,
    hasUnsavedChanges,
    setActiveContext,
    setActiveVersion,
    setActiveSchema,
    deleteContext,
    sidebarCollapsed,
    toggleSidebar,
    exportAsZip,
    importFromZip,
  } = useSchemaStore();

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);

  // Handle export as ZIP
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAsZip();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export fehlgeschlagen.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle import from ZIP
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const success = await importFromZip(file);
      if (success) {
        alert(`Import erfolgreich! Schemas wurden geladen.`);
      } else {
        alert('Import fehlgeschlagen. Bitte ZIP-Format prüfen.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import fehlgeschlagen.');
    }
    
    // Reset input
    e.target.value = '';
  };

  const availableSchemas = useAvailableSchemas();
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set(['default']));
  const [showCreateContext, setShowCreateContext] = useState(false);
  const [showCreateSchema, setShowCreateSchema] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);

  const toggleContext = (contextName: string) => {
    const newExpanded = new Set(expandedContexts);
    if (newExpanded.has(contextName)) {
      newExpanded.delete(contextName);
    } else {
      newExpanded.add(contextName);
    }
    setExpandedContexts(newExpanded);
  };

  if (!contextRegistry) {
    return (
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-4">Keine Kontexte geladen</div>
      </aside>
    );
  }

  return (
    <aside className={cn(
      "bg-card border-r flex flex-col transition-all duration-300",
      sidebarCollapsed ? "w-12" : "w-72"
    )}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        {!sidebarCollapsed && (
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Schema Editor
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-accent rounded"
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            !sidebarCollapsed && "rotate-180"
          )} />
        </button>
      </div>

      {!sidebarCollapsed && (
        <>
          {/* Toolbar */}
          <div className="p-2 border-b flex gap-1">
            <button
              onClick={() => setShowCreateContext(true)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              title="Neuen Kontext erstellen"
            >
              <Plus className="h-3 w-3" />
              Kontext
            </button>
            <button
              onClick={() => setShowCreateSchema(true)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              title="Neues Schema erstellen"
            >
              <Plus className="h-3 w-3" />
              Schema
            </button>
          </div>

          {/* Context Tree */}
          <div className="flex-1 overflow-auto p-2">
            {Object.entries(contextRegistry.contexts).map(([contextName, entry]) => {
              const contextEntry = entry as ContextEntry;
              const manifest = contextManifests.get(contextName);
              const isExpanded = expandedContexts.has(contextName);
              const isActive = activeContext === contextName;
              const versions = manifest ? Object.keys(manifest.versions) : [contextEntry.defaultVersion];

              return (
                <div key={contextName} className="mb-1">
                  {/* Context Header */}
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group",
                      isActive ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    onClick={() => {
                      toggleContext(contextName);
                      setActiveContext(contextName);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <FolderOpen className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="flex-1 text-sm font-medium truncate">
                      {contextEntry.name}
                    </span>
                    {contextName !== 'default' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Kontext "${contextEntry.name}" wirklich löschen?`)) {
                            deleteContext(contextName);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && isActive && (
                    <div className="ml-4 mt-1 space-y-1">
                      {/* Version Selector */}
                      <div className="flex items-center gap-2 px-2 py-1">
                        <span className="text-xs text-muted-foreground">Version:</span>
                        <select
                          value={activeVersion}
                          onChange={(e) => setActiveVersion(e.target.value)}
                          className="text-xs bg-background border rounded px-1 py-0.5 flex-1"
                        >
                          {versions.map(v => (
                            <option key={v} value={v}>v{v}</option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowVersionDialog(true);
                          }}
                          className="p-1 hover:bg-accent rounded"
                          title="Versionen verwalten"
                        >
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Schema Files */}
                      <div className="space-y-0.5">
                        {availableSchemas.map(schemaFile => (
                          <div
                            key={schemaFile}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm",
                              activeSchemaFile === schemaFile
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-accent/50"
                            )}
                            onClick={() => setActiveSchema(schemaFile)}
                          >
                            <FileJson className="h-3.5 w-3.5" />
                            <span className="truncate">{schemaFile}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t space-y-1">
            {hasUnsavedChanges && (
              <div className="text-xs text-amber-600 flex items-center gap-1 px-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Ungespeicherte Änderungen
              </div>
            )}
            <div className="flex gap-1">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border rounded hover:bg-accent disabled:opacity-50"
              >
                <Download className="h-3 w-3" />
                {isExporting ? 'Lädt...' : 'Export'}
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border rounded hover:bg-accent"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleImport}
                className="hidden"
              />
              <button className="p-1.5 border rounded hover:bg-accent">
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      {showCreateContext && (
        <CreateContextDialog onClose={() => setShowCreateContext(false)} />
      )}
      {showCreateSchema && (
        <CreateSchemaDialog onClose={() => setShowCreateSchema(false)} />
      )}
      {showVersionDialog && (
        <VersionDialog onClose={() => setShowVersionDialog(false)} />
      )}
    </aside>
  );
}
