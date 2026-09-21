"""Storage schemas for the literature review system with cross-layer compatibility."""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class Provider(str, Enum):
    OPENALEX = "openalex"
    SEMANTIC_SCHOLAR = "semantic_scholar"
    ARXIV = "arxiv"
    CROSSREF = "crossref"
    UPLOADED = "uploaded"
    TEST = "test"


class PaperStatus(str, Enum):
    DISCOVERED = "discovered"
    RETRIEVED = "retrieved"
    PROCESSED = "processed"
    FAILED = "failed"


class EvidenceVerificationState(str, Enum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"
    CONTRADICTED = "contradicted"
    UNCERTAIN = "uncertain"


class Paper(BaseModel):
    doi: str
    title: str
    authors: List[str] = []
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    venue: Optional[str] = None
    year: Optional[int] = None
    url: Optional[str] = None
    full_text_url: Optional[str] = None
    provider: Provider | str = Provider.OPENALEX
    provider_id: str = ""
    status: PaperStatus = PaperStatus.DISCOVERED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def id(self) -> str:
        return self.doi

    @property
    def pdf_url(self) -> Optional[str]:
        return self.full_text_url

    @property
    def source(self) -> Any:
        return self.provider

    @property
    def open_access(self) -> bool:
        return True


class Chunk(BaseModel):
    id: str
    paper_doi: str
    content: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    section_type: Optional[str] = None
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def chunk_id(self) -> str:
        return self.id

    @property
    def paper_id(self) -> str:
        return self.paper_doi

    @property
    def text(self) -> str:
        return self.content

    @property
    def page_numbers(self) -> List[int]:
        return [self.page_number] if self.page_number is not None else []


class PaperCard(BaseModel):
    doi: str
    title: str
    summary: str
    key_findings: List[str] = []
    methodology: Optional[str] = None
    datasets: List[str] = []
    metrics: List[str] = []
    limitations: List[str] = []
    terminology: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def paper_id(self) -> str:
        return self.doi

    @property
    def research_problem(self) -> Optional[str]:
        return self.summary

    @property
    def research_question(self) -> Optional[str]:
        return self.summary

    @property
    def key_results(self) -> List[str]:
        return self.key_findings

    @property
    def contributions(self) -> List[str]:
        return self.key_findings

    @property
    def evaluation_metrics(self) -> List[str]:
        return self.metrics

    @property
    def models(self) -> List[str]:
        return []

    @property
    def future_work(self) -> List[str]:
        return []

    @property
    def evidence_references(self) -> List[Dict[str, Any]]:
        return []

    @property
    def extraction_confidence(self) -> float:
        return 0.9


class Evidence(BaseModel):
    id: str
    paper_doi: str
    content: str
    quote: str
    context: str = ""
    verification_state: EvidenceVerificationState | str = EvidenceVerificationState.UNVERIFIED
    confidence: float = 0.0
    provenance: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def claim_id(self) -> str:
        return self.id

    @property
    def paper_id(self) -> str:
        return self.paper_doi

    @property
    def exact_quote(self) -> str:
        return self.quote

    @property
    def verification_status(self) -> str:
        if hasattr(self.verification_state, "value"):
            return self.verification_state.value
        return str(self.verification_state)

    @property
    def claim_type(self) -> str:
        return self.provenance.get("claim_type", "result") if isinstance(self.provenance, dict) else "result"

    @property
    def section(self) -> str:
        if isinstance(self.provenance, dict):
            return self.provenance.get("section", "Methods / Results")
        return "Methods / Results"

    @property
    def page_numbers(self) -> List[int]:
        if isinstance(self.provenance, dict):
            pages = self.provenance.get("page") or self.provenance.get("pages")
            if isinstance(pages, list):
                return pages
            elif isinstance(pages, int):
                return [pages]
        return []


class Comparison(BaseModel):
    id: str
    paper1_doi: str
    paper2_doi: str
    similarity_score: float = 0.0
    methodology_comparison: Optional[str] = None
    dataset_comparison: Optional[str] = None
    metric_comparison: Optional[str] = None
    result_comparison: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def comparison_id(self) -> str:
        return self.id

    @property
    def paper_ids(self) -> List[str]:
        return [self.paper1_doi, self.paper2_doi]


class Limitation(BaseModel):
    id: str
    paper_doi: str
    text: str = ""
    category: str = "General"
    original_text: str = ""
    normalized_description: str = ""
    confidence: float = 0.8
    evidence_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def limitation_id(self) -> str:
        return self.id

    @property
    def paper_id(self) -> str:
        return self.paper_doi


class Gap(BaseModel):
    id: str
    description: str
    supporting_evidence: List[str] = []
    related_limitations: List[str] = []
    counterevidence: List[str] = []
    verified: bool = False
    coverage: float = 0.0
    uncertainty_expressed: bool = True
    category: str = "methodological"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def gap_id(self) -> str:
        return self.id

    @property
    def gap_candidate_id(self) -> str:
        return self.id

    @property
    def coverage_status(self) -> str:
        if self.counterevidence and len(self.counterevidence) > 0:
            return "partially_addressed"
        return "limited_evidence"

    @property
    def supporting_papers(self) -> List[str]:
        return []

    @property
    def initial_confidence(self) -> float:
        return 0.85

    @property
    def related_limitation_clusters(self) -> List[str]:
        return self.related_limitations


class ResearchDirection(BaseModel):
    id: str
    description: str
    methodology: Optional[str] = None
    datasets: List[str] = []
    feasibility_notes: Optional[str] = None
    supporting_evidence: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def direction_id(self) -> str:
        return self.id

    @property
    def proposed_problem(self) -> str:
        return self.description

    @property
    def motivation(self) -> str:
        return self.description

    @property
    def suggested_methodology(self) -> Optional[str]:
        return self.methodology

    @property
    def possible_datasets(self) -> List[str]:
        return self.datasets

    @property
    def candidate_models(self) -> List[str]:
        return []

    @property
    def evaluation_strategy(self) -> Optional[str]:
        return "Empirical evaluation on target benchmarks."

    @property
    def evaluation_metrics(self) -> List[str]:
        return []

    @property
    def feasibility_considerations(self) -> Optional[str]:
        return self.feasibility_notes

    @property
    def required_resources(self) -> Optional[str]:
        return "Standard compute environment."

    @property
    def assumptions(self) -> List[str]:
        return []

    @property
    def priority(self) -> str:
        return "high"

    @property
    def novelty_potential(self) -> str:
        return "potential"


class Job(BaseModel):
    id: str
    research_question: str
    status: str
    progress: float = 0.0
    total_papers: int = 0
    processed_papers: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def job_id(self) -> str:
        return self.id

    @property
    def topic(self) -> str:
        return self.research_question
