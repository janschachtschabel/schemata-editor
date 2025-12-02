/**
 * Complete TypeScript Type Definitions for Schema Structure
 * Based on analysis of metadata-agent-canvas-oeh schemas
 */

// ============================================================================
// Localized Strings
// ============================================================================

export interface LocalizedString {
  de: string;
  en: string;
}

// ============================================================================
// Vocabulary Concepts
// ============================================================================

export interface VocabularyConcept {
  /** Display label (localized) */
  label: LocalizedString | string;
  /** URI for SKOS vocabularies */
  uri?: string;
  /** Value for closed vocabularies (if different from label) */
  value?: string;
  /** Description (localized) */
  description?: LocalizedString | string;
  /** Alternative labels for matching */
  altLabels?: LocalizedString | string[];
  /** Icon name (Material Icons) */
  icon?: string;
  /** Reference to schema file (for content types in core.json) */
  schema_file?: string;
  /** Parent URI for hierarchical vocabularies */
  broader?: string;
  /** Child URIs for hierarchical vocabularies */
  narrower?: string[];
}

export interface Vocabulary {
  /** Type: 'skos' for SKOS vocabularies, 'closed' for simple select */
  type: 'skos' | 'closed' | 'open';
  /** SKOS scheme URI */
  scheme?: string;
  /** Whether vocabulary is hierarchical */
  hierarchical?: boolean;
  /** List of concepts */
  concepts: VocabularyConcept[];
  /** External SKOHUB URL for importing concepts */
  skohubUrl?: string;
}

// ============================================================================
// Index Configuration
// ============================================================================

export interface IndexConfig {
  /** Include in fulltext search */
  fulltext?: boolean;
  /** Include in keyword (exact match) search */
  keyword?: boolean;
}

// ============================================================================
// Normalization Configuration
// ============================================================================

export interface NormalizationConfig {
  /** Trim whitespace from start/end */
  trim?: boolean;
  /** Collapse multiple whitespace to single space */
  collapseWhitespace?: boolean;
  /** Remove duplicate values (for arrays) */
  deduplicate?: boolean;
  /** Map vocabulary labels to URIs */
  map_labels_to_uris?: boolean;
  /** Case transformation: 'lower', 'upper', 'title' */
  case?: 'lower' | 'upper' | 'title';
}

// ============================================================================
// Validation Configuration
// ============================================================================

export interface ValidationConfig {
  /** Regex pattern for validation */
  pattern?: string;
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** Minimum numeric value */
  min?: number;
  /** Maximum numeric value */
  max?: number;
  /** Must be integer (for numbers) */
  integer?: boolean;
}

// ============================================================================
// Complex Field Items (for arrays of objects)
// ============================================================================

export interface FieldVariant {
  /** Type discriminator value */
  '@type': string;
  /** Variant label */
  label: LocalizedString | string;
  /** Variant description */
  description?: LocalizedString | string;
  /** Fields within this variant */
  fields: SchemaField[];
}

export interface FieldItems {
  /** Datatype of items: 'string', 'object', etc. */
  datatype: string;
  /** Discriminator field for polymorphic objects */
  discriminator?: string;
  /** Variants for polymorphic objects */
  variants?: FieldVariant[];
}

// ============================================================================
// System Configuration
// ============================================================================

export interface SystemConfig {
  /** Path in data structure */
  path: string;
  /** URI (often same as path) */
  uri: string;
  /** Data type: 'string', 'array', 'uri', 'number', 'date', 'boolean', 'object' */
  datatype: 'string' | 'array' | 'uri' | 'number' | 'date' | 'boolean' | 'object';
  /** Can have multiple values */
  multiple: boolean;
  /** Field is required */
  required: boolean;
  /** Ask user for this field */
  ask_user: boolean;
  /** AI can fill this field */
  ai_fillable: boolean;
  /** Field maps to repository */
  repo_field?: boolean;
  /** Index configuration */
  index?: IndexConfig;
  /** Vocabulary for controlled values */
  vocabulary?: Vocabulary;
  /** Normalization rules */
  normalization?: NormalizationConfig;
  /** Validation rules */
  validation?: ValidationConfig;
  /** Item configuration for arrays */
  items?: FieldItems;
}

// ============================================================================
// Prompt Instructions
// ============================================================================

export interface PromptInstructions {
  /** Require exact label match for vocabulary */
  labelExactMatch?: boolean;
  /** Custom extraction instructions */
  extractionHints?: string;
}

// ============================================================================
// Schema Field
// ============================================================================

export interface SchemaField {
  /** Unique field identifier (e.g., 'cclom:title', 'schema:startDate') */
  id: string;
  /** Group this field belongs to */
  group?: string;
  /** Display label */
  label: LocalizedString | string;
  /** Field description */
  description?: LocalizedString | string;
  /** Example values */
  examples?: {
    de?: (string | string[])[];
    en?: (string | string[])[];
  };
  /** AI extraction prompt hints */
  prompt?: LocalizedString;
  /** Instructions for AI prompt building */
  promptInstructions?: PromptInstructions;
  /** System/technical configuration */
  system: SystemConfig;
}

// ============================================================================
// Schema Group
// ============================================================================

export interface SchemaGroup {
  /** Unique group identifier */
  id: string;
  /** Display label */
  label: LocalizedString | string;
  /** Description */
  description?: LocalizedString | string;
  /** Display order (lower = first) */
  order?: number;
}

// ============================================================================
// Schema Definition
// ============================================================================

export interface SchemaDefinition {
  /** Profile identifier (e.g., 'core:descriptive', 'type:event') */
  profileId: string;
  /** Schema version */
  version: string;
  /** JSON-LD context */
  '@context'?: Record<string, string>;
  /** Field groups */
  groups: SchemaGroup[];
  /** Fields */
  fields: SchemaField[];
  /** Output template (optional, auto-generated if missing) */
  output_template?: Record<string, unknown>;
}

// ============================================================================
// Context and Version Management
// ============================================================================

export interface VersionEntry {
  /** Release date in ISO format */
  releaseDate: string;
  /** Is this the default version */
  isDefault?: boolean;
  /** List of schema files in this version */
  schemas: string[];
  /** Changelog entries */
  changelog?: ChangelogEntry[];
}

export interface ContextManifest {
  /** Context name identifier */
  contextName: string;
  /** Display name */
  name: string;
  /** Based on another context (e.g., 'default@1.8.0') */
  basedOn?: string;
  /** Available versions */
  versions: Record<string, VersionEntry>;
}

export interface ContextEntry {
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Default version */
  defaultVersion: string;
  /** Folder path */
  path: string;
  /** Based on another context */
  basedOn?: string;
}

export interface ContextRegistry {
  /** Available contexts */
  contexts: Record<string, ContextEntry>;
  /** Default context name */
  defaultContext: string;
}

// ============================================================================
// Changelog
// ============================================================================

export interface ChangelogEntry {
  /** Timestamp */
  date: string;
  /** Type of change */
  type: 'added' | 'changed' | 'removed' | 'fixed';
  /** Description */
  description: string;
  /** Affected field ID (if applicable) */
  fieldId?: string;
  /** Author (optional) */
  author?: string;
}

// ============================================================================
// Content Type Definition (in core.json ccm:oeh_flex_lrt)
// ============================================================================

export interface ContentType {
  /** Display label */
  label: LocalizedString;
  /** Icon name */
  icon: string;
  /** Associated schema file */
  schema_file: string;
}

// ============================================================================
// Editor State Types
// ============================================================================

export interface EditorState {
  /** Currently selected context */
  activeContext: string;
  /** Currently selected version */
  activeVersion: string;
  /** Currently selected schema */
  activeSchema: string | null;
  /** Currently selected field */
  activeField: string | null;
  /** Unsaved changes flag */
  hasUnsavedChanges: boolean;
}
