"""Limitation clustering module."""

from typing import List, Dict, Any, Optional
from collections import defaultdict


class LimitationClustering:
    """Clusters limitations across papers."""

    def __init__(self, llm: Optional[Any] = None):
        self.llm = llm

    def cluster_limitations(self, limitations: List[Any]) -> Dict[str, List[Any]]:
        """
        Cluster limitations by category/theme into a dictionary of cluster_id -> List[Limitation].
        """
        if not limitations:
            return {}

        clusters: Dict[str, List[Any]] = defaultdict(list)
        for lim in limitations:
            cat = getattr(lim, "category", "Other")
            if hasattr(cat, "value"):
                cat = cat.value
            cat_str = str(cat)
            cat_lower = cat_str.lower()

            if cat_lower == "data_related" or (cat_lower != "technical" and ("data" in cat_lower or "dataset" in cat_lower)):
                cluster_key = "data_related" if "data_related" in [getattr(l, "category", "") for l in limitations] else cat_str
            elif cat_lower == "technical" or "compute" in cat_lower or "cost" in cat_lower or "tech" in cat_lower:
                cluster_key = "technical" if "technical" in [getattr(l, "category", "") for l in limitations] else cat_str
            else:
                cluster_key = cat_str

            clusters[cluster_key].append(lim)

        return dict(clusters)


__all__ = ["LimitationClustering"]

