import { create } from 'zustand';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type {
  ContextRegistry,
  ContextManifest,
  SchemaDefinition,
  SchemaField,
  SchemaGroup,
  ChangelogEntry,
  ContentType,
} from '../types/schema';

// ============================================================================
// Store State Interface
// ============================================================================

interface SchemaStoreState {
  // Registry & Manifests
  contextRegistry: ContextRegistry | null;
  contextManifests: Map<string, ContextManifest>;
  
  // Loaded Schemas
  schemas: Map<string, SchemaDefinition>;
  
  // Editor State
  activeContext: string;
  activeVersion: string;
  activeSchemaFile: string | null;
  activeFieldId: string | null;
  
  // UI State
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Sidebar State
  sidebarCollapsed: boolean;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface SchemaStoreActions {
  // Loading
  loadContextRegistry: () => Promise<void>;
  loadContextManifest: (contextName: string) => Promise<void>;
  loadSchema: (contextName: string, version: string, schemaFile: string) => Promise<void>;
  
  // Navigation
  setActiveContext: (contextName: string) => void;
  setActiveVersion: (version: string) => void;
  setActiveSchema: (schemaFile: string | null) => void;
  setActiveField: (fieldId: string | null) => void;
  
  // Context Management
  createContext: (contextName: string, displayName: string, basedOn?: string, selectedSchemas?: string[]) => void;
  deleteContext: (contextName: string) => void;
  
  // Version Management
  createVersion: (contextName: string, version: string, basedOnVersion?: string) => void;
  
  // Schema Management
  createSchema: (schemaFile: string, profileId: string, displayName: string) => void;
  deleteSchema: (schemaFile: string) => void;
  updateSchema: (schemaFile: string, schema: Partial<SchemaDefinition>) => void;
  
  // Field Management
  addField: (schemaFile: string, field: SchemaField) => void;
  updateField: (schemaFile: string, fieldId: string, field: Partial<SchemaField>) => void;
  deleteField: (schemaFile: string, fieldId: string) => void;
  moveField: (schemaFile: string, fieldId: string, newIndex: number) => void;
  
  // Group Management
  addGroup: (schemaFile: string, group: SchemaGroup) => void;
  updateGroup: (schemaFile: string, groupId: string, updates: Partial<SchemaGroup>) => void;
  deleteGroup: (schemaFile: string, groupId: string) => void;
  
  // Version Management
  deleteVersion: (contextName: string, version: string) => void;
  
  // Content Types (core.json)
  getContentTypes: () => ContentType[];
  addContentType: (contentType: ContentType) => void;
  removeContentType: (schemaFile: string) => void;
  
  // Changelog
  addChangelogEntry: (contextName: string, version: string, entry: ChangelogEntry) => void;
  
  // Save/Export
  saveAll: () => Promise<void>;
  exportContext: (contextName: string) => string;
  exportAll: () => Promise<string>;
  exportAsZip: () => Promise<void>;
  importFromZip: (file: File) => Promise<boolean>;
  loadAllSchemas: () => Promise<void>;
  importData: (jsonData: string) => boolean;
  
  // UI
  toggleSidebar: () => void;
  setError: (error: string | null) => void;
  markUnsaved: () => void;
  markSaved: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: SchemaStoreState = {
  contextRegistry: null,
  contextManifests: new Map(),
  schemas: new Map(),
  activeContext: 'default',
  activeVersion: '1.8.0',
  activeSchemaFile: null,
  activeFieldId: null,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
  sidebarCollapsed: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useSchemaStore = create<SchemaStoreState & SchemaStoreActions>((set, get) => ({
  ...initialState,

  // -------------------------------------------------------------------------
  // Loading Actions
  // -------------------------------------------------------------------------
  
  loadContextRegistry: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/schemata/context-registry.json');
      if (!response.ok) throw new Error('Failed to load context registry');
      const registry = await response.json();
      set({ contextRegistry: registry, isLoading: false });
      
      // Load manifests for all contexts
      for (const contextName of Object.keys(registry.contexts)) {
        await get().loadContextManifest(contextName);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadContextManifest: async (contextName: string) => {
    try {
      const registry = get().contextRegistry;
      if (!registry) return;
      
      const contextEntry = registry.contexts[contextName];
      if (!contextEntry) return;
      
      const response = await fetch(`/schemata/${contextEntry.path}/manifest.json`);
      if (!response.ok) throw new Error(`Failed to load manifest for ${contextName}`);
      
      const manifest = await response.json();
      const manifests = new Map(get().contextManifests);
      manifests.set(contextName, manifest);
      set({ contextManifests: manifests });
    } catch (error) {
      console.warn(`Could not load manifest for ${contextName}:`, error);
    }
  },

  loadSchema: async (contextName: string, version: string, schemaFile: string) => {
    set({ isLoading: true, error: null });
    try {
      const registry = get().contextRegistry;
      if (!registry) throw new Error('Context registry not loaded');
      
      const contextEntry = registry.contexts[contextName];
      if (!contextEntry) throw new Error(`Context ${contextName} not found`);
      
      const path = `/schemata/${contextEntry.path}/v${version}/${schemaFile}`;
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load schema ${schemaFile}`);
      
      const schema = await response.json();
      const cacheKey = `${contextName}@${version}/${schemaFile}`;
      
      const schemas = new Map(get().schemas);
      schemas.set(cacheKey, schema);
      set({ schemas, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // -------------------------------------------------------------------------
  // Navigation Actions
  // -------------------------------------------------------------------------

  setActiveContext: (contextName: string) => {
    const registry = get().contextRegistry;
    if (registry?.contexts[contextName]) {
      const version = registry.contexts[contextName].defaultVersion;
      set({ activeContext: contextName, activeVersion: version, activeSchemaFile: null, activeFieldId: null });
    }
  },

  setActiveVersion: (version: string) => {
    set({ activeVersion: version, activeSchemaFile: null, activeFieldId: null });
  },

  setActiveSchema: (schemaFile: string | null) => {
    set({ activeSchemaFile: schemaFile, activeFieldId: null });
    if (schemaFile) {
      const { activeContext, activeVersion } = get();
      get().loadSchema(activeContext, activeVersion, schemaFile);
    }
  },

  setActiveField: (fieldId: string | null) => {
    set({ activeFieldId: fieldId });
  },

  // -------------------------------------------------------------------------
  // Context Management
  // -------------------------------------------------------------------------

  createContext: (contextName: string, displayName: string, basedOn?: string, selectedSchemas?: string[]) => {
    const registry = get().contextRegistry;
    if (!registry) return;
    
    // Create new context entry
    const newRegistry: ContextRegistry = {
      ...registry,
      contexts: {
        ...registry.contexts,
        [contextName]: {
          name: displayName,
          description: basedOn ? `Based on ${basedOn}` : '',
          defaultVersion: '1.0.0',
          path: contextName,
          basedOn: basedOn,
        }
      }
    };
    
    // Create manifest
    const manifest: ContextManifest = {
      contextName,
      name: displayName,
      basedOn,
      versions: {
        '1.0.0': {
          releaseDate: new Date().toISOString().split('T')[0],
          isDefault: true,
          schemas: selectedSchemas || ['core.json'],
        }
      }
    };
    
    const manifests = new Map(get().contextManifests);
    manifests.set(contextName, manifest);
    
    set({ contextRegistry: newRegistry, contextManifests: manifests });
    get().markUnsaved();
  },

  deleteContext: (contextName: string) => {
    if (contextName === 'default') {
      set({ error: 'Cannot delete default context' });
      return;
    }
    
    const registry = get().contextRegistry;
    if (!registry) return;
    
    const { [contextName]: _, ...remainingContexts } = registry.contexts;
    const newRegistry: ContextRegistry = {
      ...registry,
      contexts: remainingContexts,
    };
    
    const manifests = new Map(get().contextManifests);
    manifests.delete(contextName);
    
    set({ 
      contextRegistry: newRegistry, 
      contextManifests: manifests,
      activeContext: 'default',
    });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Version Management
  // -------------------------------------------------------------------------

  createVersion: (contextName: string, version: string, basedOnVersion?: string) => {
    const manifests = get().contextManifests;
    const manifest = manifests.get(contextName);
    if (!manifest) return;
    
    const baseVersion = basedOnVersion || Object.keys(manifest.versions)[0];
    const baseSchemas = manifest.versions[baseVersion]?.schemas || ['core.json'];
    
    // Copy all schemas from the base version
    const schemas = new Map(get().schemas);
    const registry = get().contextRegistry;
    const contextPath = registry?.contexts[contextName]?.path || contextName;
    
    baseSchemas.forEach(schemaFile => {
      const baseCacheKey = `${contextName}@${baseVersion}/${schemaFile}`;
      const newCacheKey = `${contextName}@${version}/${schemaFile}`;
      const baseSchema = schemas.get(baseCacheKey);
      
      if (baseSchema) {
        // Deep copy the schema and update version
        const newSchema = JSON.parse(JSON.stringify(baseSchema));
        newSchema.version = version;
        schemas.set(newCacheKey, newSchema);
      }
    });
    
    const updatedManifest: ContextManifest = {
      ...manifest,
      versions: {
        ...manifest.versions,
        [version]: {
          releaseDate: new Date().toISOString().split('T')[0],
          isDefault: false,
          schemas: [...baseSchemas],
          changelog: [{
            date: new Date().toISOString(),
            type: 'added',
            description: `Version ${version} erstellt basierend auf ${baseVersion}`,
          }],
        }
      }
    };
    
    const newManifests = new Map(manifests);
    newManifests.set(contextName, updatedManifest);
    set({ contextManifests: newManifests, schemas });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Schema Management
  // -------------------------------------------------------------------------

  createSchema: (schemaFile: string, profileId: string, displayName: string) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const newSchema: SchemaDefinition = {
      profileId,
      version: activeVersion,
      '@context': {
        schema: 'https://schema.org/',
      },
      groups: [
        { id: 'general', label: { de: 'Allgemein', en: 'General' } }
      ],
      fields: [],
    };
    
    const schemas = new Map(get().schemas);
    schemas.set(cacheKey, newSchema);
    
    // Update manifest
    const manifests = get().contextManifests;
    const manifest = manifests.get(activeContext);
    if (manifest) {
      const versionEntry = manifest.versions[activeVersion];
      if (versionEntry && !versionEntry.schemas.includes(schemaFile)) {
        versionEntry.schemas.push(schemaFile);
        const newManifests = new Map(manifests);
        newManifests.set(activeContext, manifest);
        set({ contextManifests: newManifests });
      }
    }
    
    set({ schemas, activeSchemaFile: schemaFile });
    get().markUnsaved();
  },

  deleteSchema: (schemaFile: string) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = new Map(get().schemas);
    schemas.delete(cacheKey);
    
    // Update manifest
    const manifests = get().contextManifests;
    const manifest = manifests.get(activeContext);
    if (manifest) {
      const versionEntry = manifest.versions[activeVersion];
      if (versionEntry) {
        versionEntry.schemas = versionEntry.schemas.filter(s => s !== schemaFile);
        const newManifests = new Map(manifests);
        newManifests.set(activeContext, manifest);
        set({ contextManifests: newManifests });
      }
    }
    
    set({ schemas, activeSchemaFile: null, activeFieldId: null });
    get().markUnsaved();
  },

  updateSchema: (schemaFile: string, updates: Partial<SchemaDefinition>) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const updatedSchema = { ...schema, ...updates };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Field Management
  // -------------------------------------------------------------------------

  addField: (schemaFile: string, field: SchemaField) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const updatedSchema = {
      ...schema,
      fields: [...schema.fields, field],
    };
    
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas, activeFieldId: field.id });
    get().markUnsaved();
  },

  updateField: (schemaFile: string, fieldId: string, updates: Partial<SchemaField>) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const updatedFields = schema.fields.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    );
    
    const updatedSchema = { ...schema, fields: updatedFields };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  deleteField: (schemaFile: string, fieldId: string) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const updatedSchema = {
      ...schema,
      fields: schema.fields.filter(f => f.id !== fieldId),
    };
    
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas, activeFieldId: null });
    get().markUnsaved();
  },

  moveField: (schemaFile: string, fieldId: string, newIndex: number) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const fields = [...schema.fields];
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    if (currentIndex === -1) return;
    
    const [field] = fields.splice(currentIndex, 1);
    fields.splice(newIndex, 0, field);
    
    const updatedSchema = { ...schema, fields };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Group Management
  // -------------------------------------------------------------------------

  addGroup: (schemaFile: string, group: SchemaGroup) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const updatedSchema = {
      ...schema,
      groups: [...schema.groups, group],
    };
    
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  updateGroup: (schemaFile: string, groupId: string, updates: Partial<SchemaGroup>) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const updatedGroups = schema.groups.map((g: SchemaGroup) => 
      g.id === groupId ? { ...g, ...updates } : g
    );
    
    const updatedSchema = { ...schema, groups: updatedGroups };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  deleteGroup: (schemaFile: string, groupId: string) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/${schemaFile}`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    // Remove group and unassign fields from this group
    const updatedGroups = schema.groups.filter((g: SchemaGroup) => g.id !== groupId);
    const updatedFields = schema.fields.map((f: SchemaField) => 
      f.group === groupId ? { ...f, group: undefined } : f
    );
    
    const updatedSchema = { ...schema, groups: updatedGroups, fields: updatedFields };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Version Management Extended
  // -------------------------------------------------------------------------

  deleteVersion: (contextName: string, version: string) => {
    const manifests = get().contextManifests;
    const manifest = manifests.get(contextName);
    if (!manifest) return;
    
    const { [version]: _, ...remainingVersions } = manifest.versions;
    
    // Don't delete if it's the last version
    if (Object.keys(remainingVersions).length === 0) {
      set({ error: 'Kann letzte Version nicht löschen' });
      return;
    }
    
    const updatedManifest = { ...manifest, versions: remainingVersions };
    const newManifests = new Map(manifests);
    newManifests.set(contextName, updatedManifest);
    
    set({ contextManifests: newManifests });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Content Types
  // -------------------------------------------------------------------------

  getContentTypes: () => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/core.json`;
    
    const schema = get().schemas.get(cacheKey);
    if (!schema) return [];
    
    const field = schema.fields.find(f => f.id === 'ccm:oeh_flex_lrt');
    if (!field?.system?.vocabulary?.concepts) return [];
    
    return field.system.vocabulary.concepts
      .filter(c => c.schema_file)
      .map(c => ({
        label: c.label as { de: string; en: string },
        icon: c.icon || 'article',
        schema_file: c.schema_file!,
      }));
  },

  addContentType: (contentType: ContentType) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/core.json`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const fieldIndex = schema.fields.findIndex(f => f.id === 'ccm:oeh_flex_lrt');
    if (fieldIndex === -1) return;
    
    const field = schema.fields[fieldIndex];
    if (!field.system.vocabulary) return;
    
    const newConcept = {
      label: contentType.label,
      icon: contentType.icon,
      schema_file: contentType.schema_file,
    };
    
    const updatedField = {
      ...field,
      system: {
        ...field.system,
        vocabulary: {
          ...field.system.vocabulary,
          concepts: [...field.system.vocabulary.concepts, newConcept],
        }
      }
    };
    
    const updatedFields = [...schema.fields];
    updatedFields[fieldIndex] = updatedField;
    
    const updatedSchema = { ...schema, fields: updatedFields };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  removeContentType: (schemaFile: string) => {
    const { activeContext, activeVersion } = get();
    const cacheKey = `${activeContext}@${activeVersion}/core.json`;
    
    const schemas = get().schemas;
    const schema = schemas.get(cacheKey);
    if (!schema) return;
    
    const fieldIndex = schema.fields.findIndex(f => f.id === 'ccm:oeh_flex_lrt');
    if (fieldIndex === -1) return;
    
    const field = schema.fields[fieldIndex];
    if (!field.system.vocabulary) return;
    
    const updatedField = {
      ...field,
      system: {
        ...field.system,
        vocabulary: {
          ...field.system.vocabulary,
          concepts: field.system.vocabulary.concepts.filter(c => c.schema_file !== schemaFile),
        }
      }
    };
    
    const updatedFields = [...schema.fields];
    updatedFields[fieldIndex] = updatedField;
    
    const updatedSchema = { ...schema, fields: updatedFields };
    const newSchemas = new Map(schemas);
    newSchemas.set(cacheKey, updatedSchema);
    
    set({ schemas: newSchemas });
    get().markUnsaved();
  },

  // -------------------------------------------------------------------------
  // Changelog
  // -------------------------------------------------------------------------

  addChangelogEntry: (contextName: string, version: string, entry: ChangelogEntry) => {
    const manifests = get().contextManifests;
    const manifest = manifests.get(contextName);
    if (!manifest) return;
    
    const versionEntry = manifest.versions[version];
    if (!versionEntry) return;
    
    const changelog = versionEntry.changelog || [];
    versionEntry.changelog = [entry, ...changelog];
    
    const newManifests = new Map(manifests);
    newManifests.set(contextName, manifest);
    set({ contextManifests: newManifests });
  },

  // -------------------------------------------------------------------------
  // Save/Export
  // -------------------------------------------------------------------------

  saveAll: async () => {
    // In a real implementation, this would save to the file system
    // For now, we'll just download the files
    console.log('Save all triggered - implement file system save');
    get().markSaved();
  },

  exportContext: (contextName: string) => {
    const registry = get().contextRegistry;
    const manifest = get().contextManifests.get(contextName);
    const schemas = get().schemas;
    
    const exportData = {
      registry: registry?.contexts[contextName],
      manifest,
      schemas: {} as Record<string, SchemaDefinition>,
    };
    
    // Collect all schemas for this context
    schemas.forEach((schema, key) => {
      if (key.startsWith(`${contextName}@`)) {
        const schemaFile = key.split('/').pop()!;
        exportData.schemas[schemaFile] = schema;
      }
    });
    
    return JSON.stringify(exportData, null, 2);
  },

  loadAllSchemas: async () => {
    const manifests = get().contextManifests;
    const registry = get().contextRegistry;
    if (!registry) return;
    
    // Load all schemas for all contexts and versions
    for (const [contextName, manifest] of manifests) {
      for (const [version, versionEntry] of Object.entries(manifest.versions)) {
        for (const schemaFile of versionEntry.schemas) {
          const cacheKey = `${contextName}@${version}/${schemaFile}`;
          
          // Skip if already loaded
          if (get().schemas.has(cacheKey)) continue;
          
          try {
            const contextPath = registry.contexts[contextName]?.path || contextName;
            const path = `/schemata/${contextPath}/v${version}/${schemaFile}`;
            const response = await fetch(path);
            
            if (response.ok) {
              const schema = await response.json();
              const schemas = new Map(get().schemas);
              schemas.set(cacheKey, schema);
              set({ schemas });
            }
          } catch (error) {
            console.warn(`Failed to load ${cacheKey}:`, error);
          }
        }
      }
    }
  },

  exportAll: async () => {
    // First, load all schemas
    await get().loadAllSchemas();
    
    const registry = get().contextRegistry;
    const manifests = get().contextManifests;
    const schemas = get().schemas;
    
    // Build complete export structure
    const exportData: Record<string, any> = {
      'context-registry.json': registry,
      contexts: {} as Record<string, any>,
    };
    
    // Export each context
    manifests.forEach((manifest, contextName) => {
      const contextData: Record<string, any> = {
        'manifest.json': manifest,
        versions: {} as Record<string, Record<string, SchemaDefinition>>,
      };
      
      // Group schemas by version
      schemas.forEach((schema, key) => {
        // Key format: contextName@version/schemaFile.json
        const match = key.match(/^([^@]+)@([^/]+)\/(.+)$/);
        if (match && match[1] === contextName) {
          const version = match[2];
          const schemaFile = match[3];
          
          if (!contextData.versions[version]) {
            contextData.versions[version] = {};
          }
          contextData.versions[version][schemaFile] = schema;
        }
      });
      
      exportData.contexts[contextName] = contextData;
    });
    
    return JSON.stringify(exportData, null, 2);
  },

  importData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate structure
      if (!data['context-registry.json'] && !data.contexts) {
        console.error('Invalid import format');
        return false;
      }
      
      // Import registry
      if (data['context-registry.json']) {
        set({ contextRegistry: data['context-registry.json'] });
      }
      
      // Import contexts and schemas
      if (data.contexts) {
        const newManifests = new Map(get().contextManifests);
        const newSchemas = new Map(get().schemas);
        
        Object.entries(data.contexts).forEach(([contextName, contextData]: [string, any]) => {
          // Import manifest
          if (contextData['manifest.json']) {
            newManifests.set(contextName, contextData['manifest.json']);
          }
          
          // Import schemas for each version
          if (contextData.versions) {
            Object.entries(contextData.versions).forEach(([version, schemas]: [string, any]) => {
              Object.entries(schemas).forEach(([schemaFile, schema]: [string, any]) => {
                const cacheKey = `${contextName}@${version}/${schemaFile}`;
                newSchemas.set(cacheKey, schema);
              });
            });
          }
        });
        
        set({ contextManifests: newManifests, schemas: newSchemas });
      }
      
      get().markUnsaved();
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  },

  exportAsZip: async () => {
    // First load all schemas
    await get().loadAllSchemas();
    
    const zip = new JSZip();
    const registry = get().contextRegistry;
    const manifests = get().contextManifests;
    const schemas = get().schemas;
    
    if (!registry) return;
    
    // Add context-registry.json at root
    zip.file('context-registry.json', JSON.stringify(registry, null, 2));
    
    // Add each context with its manifest and schemas
    manifests.forEach((manifest, contextName) => {
      const contextPath = registry.contexts[contextName]?.path || contextName;
      const contextFolder = zip.folder(contextPath);
      if (!contextFolder) return;
      
      // Add manifest.json
      contextFolder.file('manifest.json', JSON.stringify(manifest, null, 2));
      
      // Add schemas for each version
      Object.entries(manifest.versions).forEach(([version, versionEntry]) => {
        const versionFolder = contextFolder.folder(`v${version}`);
        if (!versionFolder) return;
        
        versionEntry.schemas.forEach(schemaFile => {
          const cacheKey = `${contextName}@${version}/${schemaFile}`;
          const schema = schemas.get(cacheKey);
          if (schema) {
            versionFolder.file(schemaFile, JSON.stringify(schema, null, 2));
          }
        });
      });
    });
    
    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `schemata-export-${new Date().toISOString().split('T')[0]}.zip`);
  },

  importFromZip: async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Look for context-registry.json
      const registryFile = zip.file('context-registry.json');
      if (!registryFile) {
        console.error('No context-registry.json found in ZIP');
        return false;
      }
      
      const registryContent = await registryFile.async('string');
      const registry: ContextRegistry = JSON.parse(registryContent);
      
      const newManifests = new Map<string, ContextManifest>();
      const newSchemas = new Map<string, SchemaDefinition>();
      
      // Process each context folder
      for (const [contextName, contextEntry] of Object.entries(registry.contexts)) {
        const contextPath = contextEntry.path || contextName;
        
        // Look for manifest.json in context folder
        const manifestFile = zip.file(`${contextPath}/manifest.json`);
        if (manifestFile) {
          const manifestContent = await manifestFile.async('string');
          const manifest: ContextManifest = JSON.parse(manifestContent);
          newManifests.set(contextName, manifest);
          
          // Load schemas for each version
          for (const [version, versionEntry] of Object.entries(manifest.versions)) {
            for (const schemaFile of versionEntry.schemas) {
              const schemaPath = `${contextPath}/v${version}/${schemaFile}`;
              const schemaZipFile = zip.file(schemaPath);
              if (schemaZipFile) {
                const schemaContent = await schemaZipFile.async('string');
                const schema: SchemaDefinition = JSON.parse(schemaContent);
                const cacheKey = `${contextName}@${version}/${schemaFile}`;
                newSchemas.set(cacheKey, schema);
              }
            }
          }
        }
      }
      
      set({ 
        contextRegistry: registry,
        contextManifests: newManifests,
        schemas: newSchemas,
      });
      
      get().markUnsaved();
      return true;
    } catch (error) {
      console.error('ZIP import failed:', error);
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // UI Actions
  // -------------------------------------------------------------------------

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setError: (error: string | null) => {
    set({ error });
  },

  markUnsaved: () => {
    set({ hasUnsavedChanges: true });
  },

  markSaved: () => {
    set({ hasUnsavedChanges: false });
  },
}));

// ============================================================================
// Selector Hooks
// ============================================================================

export const useActiveSchema = () => {
  const { activeContext, activeVersion, activeSchemaFile, schemas } = useSchemaStore();
  if (!activeSchemaFile) return null;
  const cacheKey = `${activeContext}@${activeVersion}/${activeSchemaFile}`;
  return schemas.get(cacheKey) || null;
};

export const useActiveField = () => {
  const schema = useActiveSchema();
  const { activeFieldId } = useSchemaStore();
  if (!schema || !activeFieldId) return null;
  return schema.fields.find(f => f.id === activeFieldId) || null;
};

export const useAvailableSchemas = () => {
  const { activeContext, activeVersion, contextManifests } = useSchemaStore();
  const manifest = contextManifests.get(activeContext);
  if (!manifest) return [];
  return manifest.versions[activeVersion]?.schemas || [];
};
