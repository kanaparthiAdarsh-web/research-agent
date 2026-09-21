export type ProviderType = 'openalex' | 'semantic_scholar' | 'arxiv' | 'crossref' | 'uploaded' | 'test';

export type PaperStatus = 'discovered' | 'retrieved' | 'processed' | 'failed';

export type EvidenceVerificationState = 'unverified' | 'verified' | 'contradicted' | 'uncertain';

export type LimitationCategory = 'data_related' | 'methodological' | 'technical' | 'theoretical' | 'scope';

export interface Paper {
  doi: string;
  title: string;
  authors: string[];
  abstract?: string;
  publication_date?: string;
  venue?: string;
  year?: number;
  url?: string;
  full_text_url?: string;
  provider: ProviderType | string;
  provider_id?: string;
  status: PaperStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Chunk {
  id: string;
  paper_doi: string;
  content: string;
  page_number?: number;
  section_title?: string;
  created_at?: string;
}

export interface PaperCard {
  doi: string;
  title: string;
  summary: string;
  key_findings: string[];
  methodology?: string;
  datasets: string[];
  metrics: string[];
  limitations: string[];
  terminology?: Record<string, string>;
  created_at?: string;
}

export interface Evidence {
  id: string;
  paper_doi: string;
  content: string;
  quote: string;
  context: string;
  verification_state: EvidenceVerificationState;
  confidence: number;
  provenance?: Record<string, unknown>;
  created_at?: string;
}

export interface Comparison {
  id: string;
  paper1_doi: string;
  paper2_doi: string;
  similarity_score: number;
  methodology_comparison?: string;
  dataset_comparison?: string;
  metric_comparison?: string;
  result_comparison?: string;
  created_at?: string;
}

export interface Limitation {
  id: string;
  paper_doi: string;
  text: string;
  category: LimitationCategory | string;
  original_text: string;
  evidence_id?: string;
  created_at?: string;
}

export interface Gap {
  id: string;
  description: string;
  supporting_evidence: string[];
  related_limitations: string[];
  counterevidence: string[];
  verified: boolean;
  coverage: number;
  uncertainty_expressed: boolean;
  created_at?: string;
}

export interface ResearchDirection {
  id: string;
  description: string;
  methodology?: string;
  datasets: string[];
  feasibility_notes?: string;
  supporting_evidence: string[];
  created_at?: string;
}

export interface Job {
  id: string;
  research_question: string;
  status: 'started' | 'discovering' | 'ingesting' | 'indexing' | 'generating_cards' | 'extracting_evidence' | 'comparing' | 'clustering_limitations' | 'finding_gaps' | 'synthesizing_directions' | 'completed' | 'failed';
  progress: number;
  total_papers: number;
  processed_papers: number;
  current_stage?: string;
  logs?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowStats {
  paperCount: number;
  paperCardCount: number;
  evidenceCount: number;
  comparisonCount: number;
  limitationCount: number;
  gapCount: number;
  directionCount: number;
}
