"""Storage repositories for research data - using canonical app.schemas."""

import logging
import sqlite3
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
import json

# Use canonical schemas from app.schemas
from app.schemas import (
    PaperMetadata, PaperCard, ChunkData, SourceClaim as Evidence,
    MethodologyComparison, DatasetComparison, ResultsComparison,
    PaperComparisonMatrix, LimitationExtraction as Limitation, LimitationCluster,
    GapCandidate, GapVerification, Counterevidence, ResearchDirection,
    GapAnalysisResult, ResearchJob, WorkflowStatus, WorkflowStep, StepResult
)
from app.exceptions import StorageError

logger = logging.getLogger(__name__)


class SQLiteConnection:
    """Manages SQLite database connection and schema."""
    
    def __init__(self, db_path: str):
        """
        Initialize SQLite connection.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
    
    def connect(self) -> sqlite3.Connection:
        """Get or create database connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(
                self.db_path,
                check_same_thread=False,
                isolation_level=None  # Autocommit mode
            )
            self._conn.row_factory = sqlite3.Row
            self._create_tables()
        return self._conn
    
    def close(self):
        """Close database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None
    
    def _create_tables(self):
        """Create database tables if they don't exist."""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Papers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS papers (
                id TEXT PRIMARY KEY,
                title TEXT,
                authors TEXT,
                year INTEGER,
                venue TEXT,
                doi TEXT,
                arxiv_id TEXT,
                url TEXT,
                pdf_url TEXT,
                abstract TEXT,
                source TEXT,
                citation_count INTEGER,
                open_access BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # PaperCards table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS paper_cards (
                paper_id TEXT PRIMARY KEY,
                research_problem TEXT,
                research_question TEXT,
                methodology TEXT,
                models TEXT,
                datasets TEXT,
                evaluation_metrics TEXT,
                key_results TEXT,
                contributions TEXT,
                limitations TEXT,
                future_work TEXT,
                terminology TEXT,
                evidence_references TEXT,
                extraction_confidence REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paper_id) REFERENCES papers(id)
            )
        """)
        
        # Chunks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                chunk_id TEXT PRIMARY KEY,
                paper_id TEXT,
                text TEXT,
                section_type TEXT,
                section_title TEXT,
                page_numbers TEXT,
                position_in_section INTEGER,
                is_partial BOOLEAN,
                metadata TEXT,
                embedding_semantic BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paper_id) REFERENCES papers(id)
            )
        """)
        
        # Claims/Evidence table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS claims (
                claim_id TEXT PRIMARY KEY,
                paper_id TEXT,
                chunk_id TEXT,
                claim_type TEXT,
                content TEXT,
                exact_quote TEXT,
                page_numbers TEXT,
                section TEXT,
                confidence REAL,
                entailment_score REAL,
                verification_status TEXT,
                verification_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paper_id) REFERENCES papers(id),
                FOREIGN KEY (chunk_id) REFERENCES chunks(chunk_id)
            )
        """)
        
        # Comparison table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS comparisons (
                comparison_id TEXT PRIMARY KEY,
                research_topic TEXT,
                paper_ids TEXT,
                methodology TEXT,
                datasets TEXT,
                results TEXT,
                limitations_summary TEXT,
                summary TEXT,
                key_insights TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Limitations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS limitations (
                limitation_id TEXT PRIMARY KEY,
                paper_id TEXT,
                chunk_id TEXT,
                original_text TEXT,
                normalized_description TEXT,
                category TEXT,
                subcategory TEXT,
                affected_methods TEXT,
                affected_datasets TEXT,
                page_numbers TEXT,
                section TEXT,
                confidence REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paper_id) REFERENCES papers(id)
            )
        """)
        
        # Limitation clusters table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS limitation_clusters (
                cluster_id TEXT PRIMARY KEY,
                theme TEXT,
                category TEXT,
                description TEXT,
                member_limitations TEXT,
                source_papers TEXT,
                representative_quotes TEXT,
                frequency INTEGER,
                severity TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Gaps table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gap_candidates (
                gap_id TEXT PRIMARY KEY,
                research_topic TEXT,
                description TEXT,
                category TEXT,
                supporting_papers TEXT,
                supporting_evidence TEXT,
                related_limitation_clusters TEXT,
                affected_methods TEXT,
                affected_datasets TEXT,
                initial_confidence REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Gap verifications table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gap_verifications (
                verification_id TEXT PRIMARY KEY,
                gap_candidate_id TEXT,
                coverage_status TEXT,
                supporting_evidence_count INTEGER,
                counterevidence TEXT,
                coverage_summary TEXT,
                reasoning TEXT,
                assessment_confidence REAL,
                novelty_disclaimer TEXT,
                verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (gap_candidate_id) REFERENCES gap_candidates(gap_id)
            )
        """)
        
        # Research directions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS research_directions (
                direction_id TEXT PRIMARY KEY,
                research_topic TEXT,
                proposed_problem TEXT,
                motivation TEXT,
                suggested_methodology TEXT,
                possible_datasets TEXT,
                candidate_models TEXT,
                evaluation_strategy TEXT,
                evaluation_metrics TEXT,
                feasibility_considerations TEXT,
                required_resources TEXT,
                assumptions TEXT,
                supporting_evidence TEXT,
                evidence_paper_ids TEXT,
                related_gap_ids TEXT,
                priority TEXT,
                novelty_potential TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Research jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS research_jobs (
                job_id TEXT PRIMARY KEY,
                topic TEXT,
                subquestions TEXT,
                year_min INTEGER,
                year_max INTEGER,
                conferences TEXT,
                max_papers INTEGER,
                status TEXT,
                progress_percentage REAL,
                current_step TEXT,
                step_results TEXT,
                discovered_paper_ids TEXT,
                processed_paper_ids TEXT,
                failed_paper_ids TEXT,
                paper_card_ids TEXT,
                evidence_ids TEXT,
                comparison_id TEXT,
                limitation_cluster_ids TEXT,
                gap_candidate_ids TEXT,
                verification_ids TEXT,
                direction_ids TEXT,
                errors TEXT,
                warnings TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                updated_at TIMESTAMP,
                completed_at TIMESTAMP,
                can_resume BOOLEAN,
                checkpoint_data TEXT
            )
        """)
        
        conn.commit()
        logger.info("Database tables created at %s", self.db_path)


class PaperRepository:
    """Repository for paper metadata operations."""
    
    def __init__(self, db: SQLiteConnection):
        self.db = db
    
    def save(self, paper: Any) -> bool:
        """Save a paper to the database."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            paper_id = getattr(paper, "id", getattr(paper, "doi", "paper_unknown"))
            paper_doi = getattr(paper, "doi", getattr(paper, "id", None))
            source_val = getattr(paper, "source", getattr(paper, "provider", None))
            if hasattr(source_val, "value"):
                source_val = source_val.value
            
            cursor.execute("""
                INSERT OR REPLACE INTO papers 
                (id, title, authors, year, venue, doi, arxiv_id, url, pdf_url, 
                 abstract, source, citation_count, open_access)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                paper_id,
                getattr(paper, "title", ""),
                json.dumps(getattr(paper, "authors", [])) if getattr(paper, "authors", None) else None,
                getattr(paper, "year", None),
                getattr(paper, "venue", None),
                paper_doi,
                getattr(paper, "arxiv_id", None),
                getattr(paper, "url", None),
                getattr(paper, "pdf_url", getattr(paper, "full_text_url", None)),
                getattr(paper, "abstract", None),
                source_val,
                getattr(paper, "citation_count", 0),
                getattr(paper, "open_access", False),
            ))
            
            conn.commit()
            return True
            
        except Exception as e:
            logger.error("Failed to save paper %s: %s", getattr(paper, "id", getattr(paper, "doi", "")), e)
            return False

    def save_paper(self, paper: Any) -> Any:
        """Compatibility save_paper returning the paper."""
        self.save(paper)
        return paper
    
    def get(self, paper_id: str) -> Optional[Any]:
        """Get a paper by ID or DOI."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM papers WHERE id = ? OR doi = ?", (paper_id, paper_id))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return self._row_to_paper(row)
            
        except Exception as e:
            logger.error("Failed to get paper %s: %s", paper_id, e)
            return None

    def get_paper(self, paper_id: str) -> Optional[Any]:
        """Compatibility get_paper method."""
        return self.get(paper_id)
    
    def get_all(self) -> List[Any]:
        """Get all papers."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM papers")
            rows = cursor.fetchall()
            
            return [self._row_to_paper(row) for row in rows]
            
        except Exception as e:
            logger.error("Failed to get all papers: %s", e)
            return []
    
    def _row_to_paper(self, row: sqlite3.Row) -> Any:
        """Convert database row to PaperMetadata."""
        authors = json.loads(row["authors"]) if row["authors"] else []
        return PaperMetadata(
            id=row["id"],
            title=row["title"] or "",
            authors=authors,
            year=row["year"],
            venue=row["venue"],
            doi=row["doi"],
            arxiv_id=row["arxiv_id"],
            url=row["url"],
            pdf_url=row["pdf_url"],
            abstract=row["abstract"],
            source=row["source"],
            citation_count=row["citation_count"] or 0,
            open_access=bool(row["open_access"]),
        )


class PaperCardRepository:
    """Repository for PaperCard operations."""
    
    def __init__(self, db: SQLiteConnection):
        self.db = db
    
    def save(self, card: Any) -> bool:
        """Save a PaperCard to the database."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            paper_id = getattr(card, "paper_id", getattr(card, "doi", "card_unknown"))
            created_at = getattr(card, "created_at", None)
            created_at_str = created_at.isoformat() if created_at and hasattr(created_at, "isoformat") else datetime.utcnow().isoformat()
            
            cursor.execute("""
                INSERT OR REPLACE INTO paper_cards 
                (paper_id, research_problem, research_question, methodology,
                 models, datasets, evaluation_metrics, key_results, contributions,
                 limitations, future_work, terminology, evidence_references,
                 extraction_confidence, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                paper_id,
                getattr(card, "research_problem", getattr(card, "summary", "")),
                getattr(card, "research_question", getattr(card, "title", "")),
                getattr(card, "methodology", ""),
                json.dumps(getattr(card, "models", [])),
                json.dumps(getattr(card, "datasets", [])),
                json.dumps(getattr(card, "evaluation_metrics", getattr(card, "metrics", []))),
                json.dumps(getattr(card, "key_results", getattr(card, "key_findings", []))),
                json.dumps(getattr(card, "contributions", [])),
                json.dumps(getattr(card, "limitations", [])),
                json.dumps(getattr(card, "future_work", [])),
                json.dumps(getattr(card, "terminology", {})),
                json.dumps(getattr(card, "evidence_references", [])),
                getattr(card, "extraction_confidence", 0.9),
                created_at_str,
            ))
            
            conn.commit()
            return True
            
        except Exception as e:
            logger.error("Failed to save PaperCard %s: %s", getattr(card, "paper_id", getattr(card, "doi", "")), e)
            return False

    def save_paper_card(self, card: Any) -> Any:
        """Compatibility save_paper_card method returning the card."""
        self.save(card)
        return card
    
    def get(self, paper_id: str) -> Optional[Any]:
        """Get a PaperCard by paper ID or DOI."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM paper_cards WHERE paper_id = ?", (paper_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return self._row_to_card(row)
            
        except Exception as e:
            logger.error("Failed to get PaperCard %s: %s", paper_id, e)
            return None

    def get_paper_card(self, paper_id: str) -> Optional[Any]:
        """Compatibility get_paper_card method."""
        return self.get(paper_id)

    def get_by_doi(self, doi: str) -> Optional[Any]:
        """Compatibility get_by_doi method."""
        return self.get(doi)
    
    def get_all(self) -> List[Any]:
        """Get all PaperCards."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM paper_cards")
            rows = cursor.fetchall()
            
            return [self._row_to_card(row) for row in rows]
            
        except Exception as e:
            logger.error("Failed to get all PaperCards: %s", e)
            return []

    def _row_to_card(self, row: sqlite3.Row) -> PaperCard:
        """Convert database row to PaperCard."""
        return PaperCard(
            paper_id=row["paper_id"],
            research_problem=row["research_problem"] or "",
            research_question=row["research_question"] or "",
            methodology=row["methodology"] or "",
            models=json.loads(row["models"]) if row["models"] else [],
            datasets=json.loads(row["datasets"]) if row["datasets"] else [],
            evaluation_metrics=json.loads(row["evaluation_metrics"]) if row["evaluation_metrics"] else [],
            key_results=json.loads(row["key_results"]) if row["key_results"] else [],
            contributions=json.loads(row["contributions"]) if row["contributions"] else [],
            limitations=json.loads(row["limitations"]) if row["limitations"] else [],
            future_work=json.loads(row["future_work"]) if row["future_work"] else [],
            terminology=json.loads(row["terminology"]) if row["terminology"] else {},
            evidence_references=json.loads(row["evidence_references"]) if row["evidence_references"] else [],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            extraction_confidence=row["extraction_confidence"] or 0.0,
        )


class JobRepository:
    """Repository for research job operations."""
    
    def __init__(self, db: SQLiteConnection):
        self.db = db
    
    def save(self, job: Any) -> bool:
        """Save a research job to the database."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            job_id = getattr(job, "job_id", getattr(job, "id", f"job_{uuid4().hex[:8]}"))
            topic = getattr(job, "topic", getattr(job, "research_question", ""))
            status_val = getattr(job, "status", "pending")
            if hasattr(status_val, "value"):
                status_val = status_val.value
            
            progress = getattr(job, "progress_percentage", getattr(job, "progress", 0.0))
            current_step = getattr(job, "current_step", None)
            if hasattr(current_step, "value"):
                current_step = current_step.value

            step_results = getattr(job, "step_results", {})
            if isinstance(step_results, dict):
                sr_serialized = {}
                for k, v in step_results.items():
                    if hasattr(v, "model_dump"):
                        sr_serialized[k] = v.model_dump()
                    elif isinstance(v, dict):
                        sr_serialized[k] = v
                    else:
                        sr_serialized[k] = str(v)
                step_results_json = json.dumps(sr_serialized)
            else:
                step_results_json = "{}"
            
            created_at = getattr(job, "created_at", datetime.utcnow())
            created_at_str = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at)

            updated_at = getattr(job, "updated_at", datetime.utcnow())
            updated_at_str = updated_at.isoformat() if hasattr(updated_at, "isoformat") else str(updated_at)

            started_at = getattr(job, "started_at", None)
            started_at_str = started_at.isoformat() if started_at and hasattr(started_at, "isoformat") else None

            completed_at = getattr(job, "completed_at", None)
            completed_at_str = completed_at.isoformat() if completed_at and hasattr(completed_at, "isoformat") else None

            cursor.execute("""
                INSERT OR REPLACE INTO research_jobs 
                (job_id, topic, subquestions, year_min, year_max, conferences,
                 max_papers, status, progress_percentage, current_step,
                 step_results, discovered_paper_ids, processed_paper_ids,
                 failed_paper_ids, paper_card_ids, evidence_ids, comparison_id,
                 limitation_cluster_ids, gap_candidate_ids, verification_ids,
                 direction_ids, errors, warnings, created_at, started_at,
                 updated_at, completed_at, can_resume, checkpoint_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                job_id,
                topic,
                json.dumps(getattr(job, "subquestions", [])) if getattr(job, "subquestions", None) else None,
                getattr(job, "year_min", None),
                getattr(job, "year_max", None),
                json.dumps(getattr(job, "conferences", [])) if getattr(job, "conferences", None) else None,
                getattr(job, "max_papers", getattr(job, "total_papers", 10)),
                status_val,
                progress,
                current_step,
                step_results_json,
                json.dumps(getattr(job, "discovered_paper_ids", [])),
                json.dumps(getattr(job, "processed_paper_ids", [])),
                json.dumps(getattr(job, "failed_paper_ids", [])),
                json.dumps(getattr(job, "paper_card_ids", [])),
                json.dumps(getattr(job, "evidence_ids", [])),
                getattr(job, "comparison_id", None),
                json.dumps(getattr(job, "limitation_cluster_ids", [])),
                json.dumps(getattr(job, "gap_candidate_ids", [])),
                json.dumps(getattr(job, "verification_ids", [])),
                json.dumps(getattr(job, "direction_ids", [])),
                json.dumps(getattr(job, "errors", [])),
                json.dumps(getattr(job, "warnings", [])),
                created_at_str,
                started_at_str,
                updated_at_str,
                completed_at_str,
                getattr(job, "can_resume", False),
                json.dumps(getattr(job, "checkpoint_data", None)) if getattr(job, "checkpoint_data", None) else None,
            ))
            
            conn.commit()
            return True
            
        except Exception as e:
            logger.error("Failed to save job %s: %s", getattr(job, "job_id", getattr(job, "id", "")), e)
            return False

    def create_job(self, job: Any) -> Any:
        """Create and save job."""
        self.save(job)
        return job

    def save_job(self, job: Any) -> Any:
        """Save and return job."""
        self.save(job)
        return job

    def update_job(self, job_id: str, **kwargs) -> Optional[Any]:
        """Update job fields in database."""
        job = self.get(job_id)
        if not job:
            return None
        for k, v in kwargs.items():
            if hasattr(job, k):
                setattr(job, k, v)
        setattr(job, "updated_at", datetime.utcnow())
        self.save(job)
        return job
    
    def get(self, job_id: str) -> Optional[Any]:
        """Get a research job by ID."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM research_jobs WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return self._row_to_job(row)
            
        except Exception as e:
            logger.error("Failed to get job %s: %s", job_id, e)
            return None

    def get_job(self, job_id: str) -> Optional[Any]:
        """Compatibility get_job method."""
        return self.get(job_id)
    
    def get_all(self) -> List[Any]:
        """Get all research jobs."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM research_jobs ORDER BY created_at DESC")
            rows = cursor.fetchall()
            
            return [self._row_to_job(row) for row in rows]
            
        except Exception as e:
            logger.error("Failed to get all jobs: %s", e)
            return []
    
    def _row_to_job(self, row: sqlite3.Row) -> ResearchJob:
        """Convert database row to ResearchJob."""
        from app.schemas.workflow import WorkflowStep
        
        step_results = {}
        if row["step_results"]:
            try:
                sr_data = json.loads(row["step_results"])
                for k, v in sr_data.items():
                    step_results[k] = v
            except Exception:
                pass
        
        return ResearchJob(
            job_id=row["job_id"],
            topic=row["topic"] or "",
            subquestions=json.loads(row["subquestions"]) if row["subquestions"] else None,
            year_min=row["year_min"],
            year_max=row["year_max"],
            conferences=json.loads(row["conferences"]) if row["conferences"] else None,
            max_papers=row["max_papers"] or 10,
            status=WorkflowStatus(row["status"]) if row["status"] in [s.value for s in WorkflowStatus] else WorkflowStatus.PENDING,
            progress_percentage=row["progress_percentage"] or 0.0,
            current_step=WorkflowStep(row["current_step"]) if row["current_step"] in [s.value for s in WorkflowStep] else None,
            step_results=step_results,
            discovered_paper_ids=json.loads(row["discovered_paper_ids"]) if row["discovered_paper_ids"] else [],
            processed_paper_ids=json.loads(row["processed_paper_ids"]) if row["processed_paper_ids"] else [],
            failed_paper_ids=json.loads(row["failed_paper_ids"]) if row["failed_paper_ids"] else [],
            paper_card_ids=json.loads(row["paper_card_ids"]) if row["paper_card_ids"] else [],
            evidence_ids=json.loads(row["evidence_ids"]) if row["evidence_ids"] else [],
            comparison_id=row["comparison_id"],
            limitation_cluster_ids=json.loads(row["limitation_cluster_ids"]) if row["limitation_cluster_ids"] else [],
            gap_candidate_ids=json.loads(row["gap_candidate_ids"]) if row["gap_candidate_ids"] else [],
            verification_ids=json.loads(row["verification_ids"]) if row["verification_ids"] else [],
            direction_ids=json.loads(row["direction_ids"]) if row["direction_ids"] else [],
            errors=json.loads(row["errors"]) if row["errors"] else [],
            warnings=json.loads(row["warnings"]) if row["warnings"] else [],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.utcnow(),
            started_at=datetime.fromisoformat(row["started_at"]) if row["started_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.utcnow(),
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
            can_resume=bool(row["can_resume"]),
            checkpoint_data=json.loads(row["checkpoint_data"]) if row["checkpoint_data"] else None,
        )


class EvidenceRepository:
    """Repository for claims and evidence operations."""

    def __init__(self, db: SQLiteConnection):
        self.db = db

    def save(self, ev: Any) -> bool:
        """Save a claim or evidence to the claims table."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()

            claim_id = getattr(ev, "claim_id", getattr(ev, "id", f"claim_{uuid4().hex[:8]}"))
            paper_id = getattr(ev, "paper_id", getattr(ev, "paper_doi", "unknown"))
            chunk_id = getattr(ev, "chunk_id", None)
            claim_type = getattr(ev, "claim_type", "claim")
            if hasattr(claim_type, "value"):
                claim_type = claim_type.value
            
            content = getattr(ev, "content", "")
            exact_quote = getattr(ev, "exact_quote", getattr(ev, "quote", None))
            page_numbers = json.dumps(getattr(ev, "page_numbers", [])) if getattr(ev, "page_numbers", None) else None
            section = getattr(ev, "section", getattr(ev, "context", None))
            confidence = getattr(ev, "confidence", 0.5)
            entailment_score = getattr(ev, "entailment_score", None)
            
            status = getattr(ev, "verification_status", getattr(ev, "verification_state", "unverified"))
            if hasattr(status, "value"):
                status = status.value

            verification_notes = getattr(ev, "verification_notes", None)
            created_at = getattr(ev, "created_at", None)
            created_at_str = created_at.isoformat() if created_at and hasattr(created_at, "isoformat") else datetime.utcnow().isoformat()

            cursor.execute("""
                INSERT OR REPLACE INTO claims
                (claim_id, paper_id, chunk_id, claim_type, content, exact_quote,
                 page_numbers, section, confidence, entailment_score, verification_status,
                 verification_notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                claim_id, paper_id, chunk_id, str(claim_type), content, exact_quote,
                page_numbers, section, confidence, entailment_score, str(status),
                verification_notes, created_at_str
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save evidence %s: %s", getattr(ev, "id", getattr(ev, "claim_id", "")), e)
            return False

    def save_evidence(self, ev: Any) -> Any:
        self.save(ev)
        return ev

    def save_multiple_evidence(self, ev_list: List[Any]) -> List[Any]:
        for ev in ev_list:
            self.save(ev)
        return ev_list

    def get(self, claim_id: str) -> Optional[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM claims WHERE claim_id = ?", (claim_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            logger.error("Failed to get claim %s: %s", claim_id, e)
            return None

    def get_by_paper(self, paper_id: str) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM claims WHERE paper_id = ?", (paper_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get claims for paper %s: %s", paper_id, e)
            return []

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM claims")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get all claims: %s", e)
            return []


class LimitationRepository:
    """Repository for limitation operations."""

    def __init__(self, db: SQLiteConnection):
        self.db = db

    def save(self, lim: Any) -> bool:
        """Save a limitation to the database."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()

            lim_id = getattr(lim, "limitation_id", getattr(lim, "id", f"lim_{uuid4().hex[:8]}"))
            paper_id = getattr(lim, "paper_id", getattr(lim, "paper_doi", "unknown"))
            chunk_id = getattr(lim, "chunk_id", None)
            original_text = getattr(lim, "original_text", "")
            normalized = getattr(lim, "normalized_description", getattr(lim, "text", ""))
            category = getattr(lim, "category", "Other")
            if hasattr(category, "value"):
                category = category.value
            
            confidence = getattr(lim, "confidence", 0.5)
            created_at = getattr(lim, "created_at", None)
            created_at_str = created_at.isoformat() if created_at and hasattr(created_at, "isoformat") else datetime.utcnow().isoformat()

            cursor.execute("""
                INSERT OR REPLACE INTO limitations
                (limitation_id, paper_id, chunk_id, original_text, normalized_description,
                 category, subcategory, affected_methods, affected_datasets, page_numbers,
                 section, confidence, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lim_id, paper_id, chunk_id, original_text, normalized,
                str(category), getattr(lim, "subcategory", None),
                json.dumps(getattr(lim, "affected_methods", [])),
                json.dumps(getattr(lim, "affected_datasets", [])),
                json.dumps(getattr(lim, "page_numbers", [])) if getattr(lim, "page_numbers", None) else None,
                getattr(lim, "section", None), confidence, created_at_str
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save limitation %s: %s", getattr(lim, "id", getattr(lim, "limitation_id", "")), e)
            return False

    def save_limitation(self, lim: Any) -> Any:
        self.save(lim)
        return lim

    def save_multiple_limitations(self, lim_list: List[Any]) -> List[Any]:
        for lim in lim_list:
            self.save(lim)
        return lim_list

    def save_clusters(self, clusters: Any) -> bool:
        """Save limitation clusters."""
        try:
            conn = self.db.connect()
            cursor = conn.cursor()

            cluster_items = []
            if hasattr(clusters, "items"):
                for cid, mems in clusters.items():
                    cat = getattr(mems[0], "category", "Other") if mems else "Other"
                    if hasattr(cat, "value"):
                        cat = cat.value
                    cluster_items.append({
                        "cluster_id": str(cid),
                        "theme": f"Theme {cid}",
                        "category": str(cat),
                        "description": f"Cluster of {len(mems)} limitations",
                        "member_limitations": [getattr(m, "id", getattr(m, "limitation_id", str(i))) for i, m in enumerate(mems)],
                        "source_papers": list(set(getattr(m, "paper_doi", getattr(m, "paper_id", "")) for m in mems)),
                        "representative_quotes": [getattr(m, "original_text", "") for m in mems[:2]],
                        "frequency": len(mems),
                        "severity": "moderate"
                    })
            elif isinstance(clusters, list):
                for c in clusters:
                    cat = getattr(c, "category", "Other")
                    if hasattr(cat, "value"):
                        cat = cat.value
                    cluster_items.append({
                        "cluster_id": getattr(c, "cluster_id", f"cluster_{uuid4().hex[:8]}"),
                        "theme": getattr(c, "theme", ""),
                        "category": str(cat),
                        "description": getattr(c, "description", ""),
                        "member_limitations": getattr(c, "member_limitations", []),
                        "source_papers": getattr(c, "source_papers", []),
                        "representative_quotes": getattr(c, "representative_quotes", []),
                        "frequency": getattr(c, "frequency", 1),
                        "severity": getattr(c, "severity", "moderate")
                    })

            for ci in cluster_items:
                cursor.execute("""
                    INSERT OR REPLACE INTO limitation_clusters
                    (cluster_id, theme, category, description, member_limitations,
                     source_papers, representative_quotes, frequency, severity, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ci["cluster_id"], ci["theme"], ci["category"], ci["description"],
                    json.dumps(ci["member_limitations"]), json.dumps(ci["source_papers"]),
                    json.dumps(ci["representative_quotes"]), ci["frequency"], ci["severity"],
                    datetime.utcnow().isoformat()
                ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save limitation clusters: %s", e)
            return False

    def get_clusters(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM limitation_clusters")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get limitation clusters: %s", e)
            return []

    def get_by_paper(self, paper_id: str) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM limitations WHERE paper_id = ?", (paper_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get limitations for paper %s: %s", paper_id, e)
            return []

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM limitations")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get all limitations: %s", e)
            return []


class ComparisonRepository:
    """Repository for paper comparisons."""

    def __init__(self, db: SQLiteConnection):
        self.db = db

    def save(self, comp: Any) -> bool:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cid = getattr(comp, "id", getattr(comp, "comparison_id", f"comp_{uuid4().hex[:8]}"))
            topic = getattr(comp, "research_topic", "")
            paper_ids = [getattr(comp, "paper1_doi", ""), getattr(comp, "paper2_doi", "")] if hasattr(comp, "paper1_doi") else getattr(comp, "paper_ids", [])

            cursor.execute("""
                INSERT OR REPLACE INTO comparisons
                (comparison_id, research_topic, paper_ids, methodology, datasets,
                 results, limitations_summary, summary, key_insights, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                cid, topic, json.dumps(paper_ids),
                getattr(comp, "methodology_comparison", None),
                getattr(comp, "dataset_comparison", None),
                getattr(comp, "result_comparison", None),
                getattr(comp, "metric_comparison", None),
                str(getattr(comp, "similarity_score", 0.0)),
                json.dumps([]),
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save comparison: %s", e)
            return False

    def save_comparison(self, comp: Any) -> Any:
        self.save(comp)
        return comp

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM comparisons")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get comparisons: %s", e)
            return []


class GapRepository:
    """Repository for gap candidates and verifications."""

    def __init__(self, db: SQLiteConnection):
        self.db = db

    def save_gap(self, gap: Any) -> bool:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            gid = getattr(gap, "gap_id", getattr(gap, "id", f"gap_{uuid4().hex[:8]}"))
            topic = getattr(gap, "research_topic", "Research Topic")
            desc = getattr(gap, "description", "")
            cat = getattr(gap, "category", "empirical")
            if hasattr(cat, "value"):
                cat = cat.value

            supporting_evidence = getattr(gap, "supporting_evidence", [])
            related_limitations = getattr(gap, "related_limitations", getattr(gap, "related_limitation_clusters", []))
            
            cursor.execute("""
                INSERT OR REPLACE INTO gap_candidates
                (gap_id, research_topic, description, category, supporting_papers,
                 supporting_evidence, related_limitation_clusters, affected_methods,
                 affected_datasets, initial_confidence, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                gid, topic, desc, str(cat),
                json.dumps(getattr(gap, "supporting_papers", [])),
                json.dumps(supporting_evidence),
                json.dumps(related_limitations),
                json.dumps(getattr(gap, "affected_methods", [])),
                json.dumps(getattr(gap, "affected_datasets", [])),
                getattr(gap, "initial_confidence", 0.7),
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save gap: %s", e)
            return False

    def save_gaps(self, gaps: List[Any]) -> List[Any]:
        for g in gaps:
            self.save_gap(g)
        return gaps

    def save_verification(self, ver: Any) -> bool:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            vid = getattr(ver, "verification_id", f"ver_{uuid4().hex[:8]}")
            gid = getattr(ver, "gap_candidate_id", getattr(ver, "gap_id", ""))
            status = getattr(ver, "coverage_status", "limited_evidence")
            if hasattr(status, "value"):
                status = status.value
            
            ce = getattr(ver, "counterevidence", [])
            ce_serialized = []
            for item in ce:
                if hasattr(item, "model_dump"):
                    ce_serialized.append(item.model_dump())
                elif isinstance(item, dict):
                    ce_serialized.append(item)
                else:
                    ce_serialized.append(str(item))

            cursor.execute("""
                INSERT OR REPLACE INTO gap_verifications
                (verification_id, gap_candidate_id, coverage_status,
                 supporting_evidence_count, counterevidence, coverage_summary,
                 reasoning, assessment_confidence, verified_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vid, gid, str(status),
                getattr(ver, "supporting_evidence_count", 0),
                json.dumps(ce_serialized),
                getattr(ver, "coverage_summary", ""),
                getattr(ver, "reasoning", ""),
                getattr(ver, "assessment_confidence", 0.7),
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save gap verification: %s", e)
            return False

    def get_gaps(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM gap_candidates")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get gaps: %s", e)
            return []

    def get_verifications(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM gap_verifications")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get verifications: %s", e)
            return []

    def get_all(self) -> Dict[str, Any]:
        return {
            "gaps": self.get_gaps(),
            "verifications": self.get_verifications()
        }


class ResearchDirectionRepository:
    """Repository for research directions."""

    def __init__(self, db: SQLiteConnection):
        self.db = db

    def save(self, d: Any) -> bool:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            did = getattr(d, "direction_id", getattr(d, "id", f"dir_{uuid4().hex[:8]}"))
            topic = getattr(d, "research_topic", "")
            proposed = getattr(d, "proposed_problem", getattr(d, "description", ""))
            motivation = getattr(d, "motivation", "")
            methodology = getattr(d, "suggested_methodology", getattr(d, "methodology", None))

            cursor.execute("""
                INSERT OR REPLACE INTO research_directions
                (direction_id, research_topic, proposed_problem, motivation,
                 suggested_methodology, possible_datasets, candidate_models,
                 evaluation_strategy, evaluation_metrics, feasibility_considerations,
                 required_resources, assumptions, supporting_evidence,
                 evidence_paper_ids, related_gap_ids, priority, novelty_potential,
                 created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                did, topic, proposed, motivation, methodology,
                json.dumps(getattr(d, "possible_datasets", getattr(d, "datasets", []))),
                json.dumps(getattr(d, "candidate_models", [])),
                getattr(d, "evaluation_strategy", None),
                json.dumps(getattr(d, "evaluation_metrics", [])),
                json.dumps([getattr(d, "feasibility_notes", "")] if hasattr(d, "feasibility_notes") and d.feasibility_notes else getattr(d, "feasibility_considerations", [])),
                json.dumps(getattr(d, "required_resources", [])),
                json.dumps(getattr(d, "assumptions", [])),
                json.dumps(getattr(d, "supporting_evidence", [])),
                json.dumps(getattr(d, "evidence_paper_ids", [])),
                json.dumps(getattr(d, "related_gap_ids", [])),
                getattr(d, "priority", "medium"),
                getattr(d, "novelty_potential", "potential"),
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to save direction: %s", e)
            return False

    def save_direction(self, d: Any) -> Any:
        self.save(d)
        return d

    def save_directions(self, directions: List[Any]) -> List[Any]:
        for d in directions:
            self.save(d)
        return directions

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            conn = self.db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM research_directions")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to get research directions: %s", e)
            return []


# Convenience functions for creating repositories
_db_instance: Optional[SQLiteConnection] = None


def get_database(db_path: str = "research_agent.db") -> SQLiteConnection:
    """Get or create database connection."""
    global _db_instance
    if _db_instance is None or _db_instance.db_path != db_path:
        _db_instance = SQLiteConnection(db_path)
    return _db_instance


def get_repositories(db_path: str = "research_agent.db"):
    """Get all repositories with a shared database connection."""
    db = get_database(db_path)
    paper_card_repo = PaperCardRepository(db)
    evidence_repo = EvidenceRepository(db)
    limitation_repo = LimitationRepository(db)
    comparison_repo = ComparisonRepository(db)
    gap_repo = GapRepository(db)
    direction_repo = ResearchDirectionRepository(db)
    job_repo = JobRepository(db)
    paper_repo = PaperRepository(db)

    return {
        "papers": paper_repo,
        "paper_cards": paper_card_repo,
        "papercards": paper_card_repo,
        "jobs": job_repo,
        "evidence": evidence_repo,
        "claims": evidence_repo,
        "limitations": limitation_repo,
        "comparisons": comparison_repo,
        "gaps": gap_repo,
        "directions": direction_repo,
    }
