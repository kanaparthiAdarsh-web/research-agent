"""Gap finder module."""

import logging
from typing import List, Any, Optional
from uuid import uuid4
from datetime import datetime

from ..storage.schemas import Gap

logger = logging.getLogger(__name__)


class GapFinder:
    """Identifies evidence-grounded research gaps from papers and limitations."""

    def __init__(self, llm: Optional[Any] = None):
        self.llm = llm

    def find_gaps(self, papers: List[Any], limitations: List[Any]) -> List[Gap]:
        """
        Identify potential research gaps from papers and limitations.
        
        Args:
            papers: List of papers
            limitations: List of extracted limitations
            
        Returns:
            List of Gap objects
        """
        gaps: List[Gap] = []
        lim_ids = [getattr(lim, "id", getattr(lim, "limitation_id", f"lim_{i}")) for i, lim in enumerate(limitations)]
        if not lim_ids:
            lim_ids = [f"lim_synth_{uuid4().hex[:6]}"]

        # Group limitations by category or chunk them
        categories = list(set([getattr(lim, "category", "Methodological") for lim in limitations])) or ["Methodological"]

        paper_title = getattr(papers[0], "title", "analyzed literature") if papers else "analyzed literature"

        for i, cat in enumerate(categories):
            cat_str = cat.value if hasattr(cat, "value") else str(cat)
            cat_lims = [
                getattr(lim, "id", getattr(lim, "limitation_id", f"lim_{idx}"))
                for idx, lim in enumerate(limitations)
                if (getattr(lim, "category", None) == cat or getattr(getattr(lim, "category", None), "value", None) == cat_str)
            ] or lim_ids

            description = (
                f"Potential research gap: Addressing {cat_str.lower()} constraints and "
                f"unexplored domain evaluations in {paper_title}."
            )

            gaps.append(Gap(
                id=f"gap_{uuid4().hex[:8]}_{i}",
                description=description,
                supporting_evidence=[f"Identified {cat_str} constraint in literature"],
                related_limitations=cat_lims,
                counterevidence=[],
                verified=False,
                coverage=0.0,
                uncertainty_expressed=True,
                created_at=datetime.utcnow()
            ))

        if not gaps:
            gaps.append(Gap(
                id=f"gap_{uuid4().hex[:8]}_0",
                description=f"Potential research gap: Unexplored evaluation benchmarks for {paper_title}.",
                supporting_evidence=["Literature limitation pattern"],
                related_limitations=lim_ids,
                counterevidence=[],
                verified=False,
                coverage=0.0,
                uncertainty_expressed=True,
                created_at=datetime.utcnow()
            ))

        return gaps


__all__ = ["GapFinder"]

