import type { BusinessDocument } from './business-document';

export type SectionType = 'hld' | 'lld' | 'guide' | 'reference';

export interface HDDSectionConfig {
  id: string;
  label: string;
  icon: string;
  type: SectionType;
  description: string;
  promptKey: string;
}

export interface HDDContext {
  idea: string;
  context: string | null;
  constraints: string | null;
  businessDocument?: BusinessDocument;
}

// Default section configurations
export const DEFAULT_SECTIONS: HDDSectionConfig[] = [
  {
    id: 'architecture',
    label: 'Architecture Overview',
    icon: '🏗️',
    type: 'hld',
    description: 'High-level system architecture and design',
    promptKey: 'architecture',
  },
  {
    id: 'deployment',
    label: 'Deployment Guide',
    icon: '🚀',
    type: 'guide',
    description: 'Step-by-step deployment instructions',
    promptKey: 'deployment',
  },
  {
    id: 'dataflow',
    label: 'Data Flow',
    icon: '🔄',
    type: 'hld',
    description: 'Data flow diagrams and processing',
    promptKey: 'dataflow',
  },
  {
    id: 'users',
    label: 'User Guide',
    icon: '👥',
    type: 'guide',
    description: 'User documentation and personas',
    promptKey: 'users',
  },
];

// Map business document sections to HDD sections
export function getSectionsFromBusinessDoc(doc: BusinessDocument): HDDSectionConfig[] {
  const sections: HDDSectionConfig[] = [];
  const baseSections = new Set<string>();

  // Always include architecture if there's system design or requirements
  if (doc.systemDesign || doc.requirements.functional.length > 0) {
    sections.push({
      id: 'architecture',
      label: 'Architecture Overview',
      icon: '🏗️',
      type: 'hld',
      description: 'High-level system architecture and component design',
      promptKey: 'architecture',
    });
    baseSections.add('architecture');
  }

  // Include data flow if there are data flows defined
  if (doc.dataFlows && doc.dataFlows.length > 0) {
    sections.push({
      id: 'dataflow',
      label: 'Data Flow',
      icon: '🔄',
      type: 'hld',
      description: 'Data flow diagrams and processing pipeline',
      promptKey: 'dataflow',
    });
    baseSections.add('dataflow');
  }

  // Include user documentation if there are stakeholders
  if (doc.stakeholders && doc.stakeholders.length > 0) {
    sections.push({
      id: 'users',
      label: 'User Documentation',
      icon: '👥',
      type: 'guide',
      description: 'User personas, roles, and journey maps',
      promptKey: 'users',
    });
    baseSections.add('users');
  }

  // Include deployment if there's deployment info
  if (doc.deployment) {
    sections.push({
      id: 'deployment',
      label: 'Deployment Guide',
      icon: '🚀',
      type: 'guide',
      description: 'Deployment steps and infrastructure',
      promptKey: 'deployment',
    });
    baseSections.add('deployment');
  }

  // Add API design LLD if there are functional requirements
  if (doc.requirements.functional.length > 3) {
    sections.push({
      id: 'api-design',
      label: 'API Design',
      icon: '🔌',
      type: 'lld',
      description: 'Detailed API endpoints and contracts',
      promptKey: 'apiDesign',
    });
  }

  // Add database LLD if system design mentions databases
  if (doc.systemDesign?.toLowerCase().includes('database') ||
      doc.systemDesign?.toLowerCase().includes('data store')) {
    sections.push({
      id: 'database',
      label: 'Database Design',
      icon: '🗄️',
      type: 'lld',
      description: 'Database schema and data models',
      promptKey: 'database',
    });
  }

  // Add security section if there are non-functional security requirements
  if (doc.requirements.nonFunctional.some(r =>
    r.toLowerCase().includes('security') ||
    r.toLowerCase().includes('auth') ||
    r.toLowerCase().includes('privacy'))) {
    sections.push({
      id: 'security',
      label: 'Security Architecture',
      icon: '🔐',
      type: 'lld',
      description: 'Security measures and authentication flows',
      promptKey: 'security',
    });
  }

  // Add infrastructure section if there are deployment constraints
  if (doc.constraints.some(c =>
    c.toLowerCase().includes('infrastructure') ||
    c.toLowerCase().includes('cloud') ||
    c.toLowerCase().includes('aws') ||
    c.toLowerCase().includes('azure') ||
    c.toLowerCase().includes('kubernetes'))) {
    sections.push({
      id: 'infrastructure',
      label: 'Infrastructure',
      icon: '🏢',
      type: 'guide',
      description: 'Infrastructure and environment setup',
      promptKey: 'infrastructure',
    });
  }

  // Add testing section if there are quality requirements
  if (doc.requirements.nonFunctional.some(r =>
    r.toLowerCase().includes('test') ||
    r.toLowerCase().includes('quality') ||
    r.toLowerCase().includes('performance'))) {
    sections.push({
      id: 'testing',
      label: 'Testing Strategy',
      icon: '🧪',
      type: 'guide',
      description: 'Testing approaches and quality assurance',
      promptKey: 'testing',
    });
  }

  // Ensure we have at least the core sections
  if (sections.length === 0) {
    sections.push(...DEFAULT_SECTIONS);
  }

  return sections;
}

// Get all available section IDs for validation
export function getAvailableSectionIds(): string[] {
  return [
    ...DEFAULT_SECTIONS.map(s => s.id),
    'api-design',
    'database',
    'security',
    'infrastructure',
    'testing',
  ];
}
