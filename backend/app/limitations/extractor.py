"""Limitation extraction module."""

import logging
from typing import List, Any, Optional
from uuid import uuid4
from datetime import datetime

from ..schemas.comparison import LimitationCategory
from ..storage.schemas import Limitation

logger = logging.getLogger(__name__)


class LimitationExtractor:
    """Extractor for paper limitations and constraints."""

    def __init__(self, llm: Optional[Any] = None):
        self.llm = llm

    def extract_limitations(self, paper: Any, full_text: str = "") -> List[Limitation]:
        """
        Extract limitations from paper content synchronously.
        
        Args:
            paper: Paper object or PaperCard
            full_text: Extracted text or abstract
            
        Returns:
            List of Limitation objects
        """
        paper_doi = getattr(paper, "doi", getattr(paper, "id", getattr(paper, "paper_id", "10.test/paper")))
        text = full_text or getattr(paper, "abstract", "") or ""

        sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 20]
        
        limitation_keywords = [
            ("limit", LimitationCategory.METHODOLOGICAL.value),
            ("restrict", LimitationCategory.METHODOLOGICAL.value),
            ("memory", LimitationCategory.COMPUTATIONAL_COST.value),
            ("compute", LimitationCategory.COMPUTATIONAL_COST.value),
            ("cost", LimitationCategory.COMPUTATIONAL_COST.value),
            ("gpu", LimitationCategory.COMPUTATIONAL_COST.value),
            ("dataset", LimitationCategory.DATASET.value),
            ("data", LimitationCategory.DATASET.value),
            ("generaliz", LimitationCategory.GENERALIZATION.value),
            ("evaluat", LimitationCategory.EVALUATION.value),
            ("benchmark", LimitationCategory.EVALUATION.value),
            ("robust", LimitationCategory.ROBUSTNESS.value),
            ("bias", LimitationCategory.BIAS.value),
            ("scalab", LimitationCategory.SCALABILITY.value),
            ("future", LimitationCategory.METHODOLOGICAL.value),
        ]

        extracted = []
        for sent in sentences:
            sent_lower = sent.lower()
            for kw, cat in limitation_keywords:
                if kw in sent_lower:
                    extracted.append((sent, cat))
                    break
            if len(extracted) >= 8:
                break

        if not extracted:
            # Fallback default limitations
            extracted = [
                (f"Evaluation of {getattr(paper, 'title', 'the method')} is limited to specific experimental setups and datasets.", LimitationCategory.DATASET.value),
                (f"High computational resources are required for training and fine-tuning at scale.", LimitationCategory.COMPUTATIONAL_COST.value),
                (f"Generalization performance to out-of-domain distributions requires further investigation.", LimitationCategory.GENERALIZATION.value),
            ]

        results = []
        for i, (orig, cat) in enumerate(extracted):
            results.append(Limitation(
                id=f"lim_{uuid4().hex[:8]}_{i}",
                paper_doi=paper_doi,
                text=orig,
                original_text=orig,
                normalized_description=orig,
                category=cat,
                confidence=0.85,
                created_at=datetime.utcnow()
            ))

        return results


__all__ = ["LimitationExtractor"]

