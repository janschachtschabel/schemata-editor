import { useEffect } from 'react';
import { useSchemaStore } from './store/schema-store';
import { Sidebar } from './components/Sidebar';
import { SchemaEditor } from './components/SchemaEditor';
import { FieldEditor } from './components/FieldEditor';
import { Toaster } from './components/ui/toaster';

function App() {
  const { loadContextRegistry, isLoading, error } = useSchemaStore();

  useEffect(() => {
    loadContextRegistry();
  }, [loadContextRegistry]);

  if (isLoading && !useSchemaStore.getState().contextRegistry) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Schema-Kontexte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Context & Schema Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Schema Editor */}
        <div className="flex-1 overflow-auto border-r">
          <SchemaEditor />
        </div>

        {/* Field Editor Panel */}
        <div className="w-[400px] overflow-auto bg-muted/30">
          <FieldEditor />
        </div>
      </main>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg">
          {error}
        </div>
      )}

      <Toaster />
    </div>
  );
}

export default App;
