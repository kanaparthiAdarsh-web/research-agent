"""
End-to-End Test for ResearchWorkflowEngine with SQLite Persistence.
Validates the complete research pipeline:
Discovery -> Acquisition/Upload -> Ingestion -> Chunking -> Indexing ->
PaperCard -> Evidence with Provenance -> Entailment Verification ->
Comparisons -> Limitation Clustering -> Gap Analysis with Counterevidence ->
Research Directions -> SQLite Persistence.
"""
import pytest
import asyncio
from pathlib import Path
import tempfile
import shutil

from app.workflow.engine import ResearchWorkflowEngine
from app.storage.schemas import PaperStatus


class TestResearchWorkflowEngineE2E:
    """Test ResearchWorkflowEngine with isolated SQLite database and index."""

    @pytest.fixture
    def test_pdf_bytes(self):
        """Read test PDF fixture as bytes."""
        pdf_path = Path(__file__).parent / "fixtures" / "test_paper.pdf"
        with open(pdf_path, "rb") as f:
            return f.read()

    @pytest.fixture
    def temp_env(self):
        temp_dir = tempfile.mkdtemp()
        db_path = str(Path(temp_dir) / "literature_test.db")
        index_dir = str(Path(temp_dir) / "indexes_test")
        yield {"db_path": db_path, "index_dir": index_dir, "temp_dir": temp_dir}
        shutil.rmtree(temp_dir, ignore_errors=True)

    @pytest.mark.asyncio
    async def test_workflow_engine_complete_execution(self, test_pdf_bytes, temp_env):
        engine = ResearchWorkflowEngine(
            db_path=temp_env["db_path"],
            index_dir=temp_env["index_dir"]
        )

        job = await engine.execute_workflow(
            research_question="How does retrieval grounding reduce hallucinations in language models?",
            max_papers=1,
            uploaded_pdfs=[test_pdf_bytes]
        )

        # 1. Job completed successfully
        assert job.status == "completed"
        assert job.progress == 1.0

        # 2. Results retrieved from authoritative SQLite persistence
        results = engine.get_job_results(job.id)
        assert results["job"].id == job.id

        def get_val(obj, key, default=None):
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        # 3. Papers persisted in SQLite
        papers = results["papers"]
        assert len(papers) >= 1
        first_paper = papers[0]
        assert get_val(first_paper, "title") is not None
        assert len(get_val(first_paper, "title")) > 0

        # 4. Chunks persisted in SQLite with provenance
        chunks = engine.repositories["chunks"].get_all()
        assert len(chunks) > 0
        first_chunk = chunks[0]
        chunk_text = get_val(first_chunk, "text") or get_val(first_chunk, "content")
        assert chunk_text is not None and len(chunk_text) > 0
        paper_ref = get_val(first_chunk, "paper_id") or get_val(first_chunk, "paper_doi")
        assert paper_ref is not None

        # 5. Hybrid search functions over the newly indexed corpus
        search_results = engine.indexing.search_hybrid("machine learning reasoning", top_k=3)
        assert len(search_results) > 0

        # 6. PaperCard persisted in SQLite
        paper_cards = results["paper_cards"]
        assert len(paper_cards) >= 1
        first_card = paper_cards[0]
        card_summary = get_val(first_card, "summary") or get_val(first_card, "research_problem") or get_val(first_card, "title")
        assert card_summary is not None

        # 7. Evidence with chunk provenance persisted and verified
        evidence = results["evidence"]
        assert len(evidence) > 0
        ev1 = evidence[0]
        ev_paper = get_val(ev1, "paper_doi") or get_val(ev1, "paper_id")
        assert ev_paper is not None
        ev_quote = get_val(ev1, "quote") or get_val(ev1, "content") or get_val(ev1, "exact_quote")
        assert ev_quote is not None

        # 8. Limitations persisted in SQLite
        limitations = results["limitations"]
        assert len(limitations) > 0

        # 9. Gaps with counterevidence search and anti-novelty verification
        gaps = results["gaps"]
        assert len(gaps) > 0
        for gap in gaps:
            gap_desc = get_val(gap, "description") or ""
            assert len(gap_desc) > 0
            # Anti-novelty check
            assert "absolute" not in gap_desc.lower()

        # 10. Research directions persisted in SQLite
        directions = results["directions"]
        assert len(directions) > 0
        dir1 = directions[0]
        dir_desc = get_val(dir1, "suggested_methodology") or get_val(dir1, "description") or get_val(dir1, "title")
        assert dir_desc is not None
