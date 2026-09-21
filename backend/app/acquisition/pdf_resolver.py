"""
Paper Acquisition Module - Resolves and retrieves full-text PDFs for discovered papers.
Uses httpx for asynchronous HTTP requests with SSRF protection, timeouts, and validation.
"""
import hashlib
import logging
import re
from pathlib import Path
from typing import Optional, Dict, Any, Union
from datetime import datetime
import httpx

from app.security.validators import InputValidator

logger = logging.getLogger(__name__)


class PDFResolver:
    """Resolves accessible full-text sources for papers and downloads them securely."""
    
    def __init__(self, storage_dir: str = "pdf_storage", timeout: float = 30.0, max_file_size: int = 50 * 1024 * 1024):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.validator = InputValidator()
        self.timeout = timeout
        self.max_file_size = max_file_size
        
    async def resolve_pdf_url(self, paper: Any) -> Optional[str]:
        """
        Resolve an accessible PDF URL for a paper.
        
        Priority:
        1. Direct PDF URL from metadata (pdf_url or full_text_url)
        2. arXiv PDF (if arXiv paper)
        3. OpenAccess / Unpaywall resolution via DOI
        4. Direct landing page URL if pointing to a PDF
        
        Returns:
            PDF URL if found, None otherwise
        """
        # 1. Check for direct PDF URL in metadata
        direct_url = getattr(paper, "pdf_url", None) or getattr(paper, "full_text_url", None)
        if direct_url and self.validator.validate_url(direct_url):
            return direct_url
            
        paper_url = getattr(paper, "url", None)
        if paper_url and paper_url.lower().endswith(".pdf") and self.validator.validate_url(paper_url):
            return paper_url
        
        # 2. Try arXiv PDF
        provider_val = getattr(paper, "source", getattr(paper, "provider", None))
        if hasattr(provider_val, "value"):
            provider_val = provider_val.value
        doi_val = getattr(paper, "doi", "") or getattr(paper, "id", "")
        
        if str(provider_val).lower() == "arxiv" or "arxiv" in str(doi_val).lower() or (paper_url and "arxiv.org" in paper_url):
            arxiv_id = self._extract_arxiv_id(paper)
            if arxiv_id:
                return f"https://arxiv.org/pdf/{arxiv_id}.pdf"
        
        # 3. Try DOI-based resolution via Unpaywall
        if doi_val and str(doi_val).startswith("10."):
            doi_pdf = await self._try_doi_resolution(str(doi_val))
            if doi_pdf:
                return doi_pdf
        
        return None
    
    def _extract_arxiv_id(self, paper: Any) -> Optional[str]:
        """Extract arXiv ID from paper metadata."""
        doi = getattr(paper, "doi", "") or ""
        if doi:
            match = re.search(r'arXiv[:\.]?(\d{4}\.\d{4,5})', doi, re.IGNORECASE)
            if match:
                return match.group(1)
            match = re.search(r'arxiv:(\d{4}\.\d{4,5})', doi, re.IGNORECASE)
            if match:
                return match.group(1)
        
        url = getattr(paper, "url", "") or ""
        if url:
            match = re.search(r'arxiv\.org/(?:abs|pdf)/(\d{4}\.\d{4,5})', url)
            if match:
                return match.group(1)
        
        arxiv_id = getattr(paper, "arxiv_id", None)
        if arxiv_id:
            return str(arxiv_id)
        
        provider_id = getattr(paper, "provider_id", None)
        if provider_id and '.' in str(provider_id):
            return str(provider_id)
        
        return None
    
    async def _try_doi_resolution(self, doi: str) -> Optional[str]:
        """Try to resolve DOI to an open access PDF via Unpaywall."""
        try:
            url = f"https://api.unpaywall.org/v2/{doi}?email=unpaywall_research@example.com"
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('is_oa', False):
                        best_oa = data.get('best_oa_location', {})
                        if best_oa.get('url_for_pdf'):
                            pdf_url = best_oa['url_for_pdf']
                            if self.validator.validate_url(pdf_url):
                                return pdf_url
                        elif best_oa.get('url') and best_oa.get('host_type') != 'publisher':
                            pdf_url = best_oa['url']
                            if self.validator.validate_url(pdf_url):
                                return pdf_url
        except Exception as e:
            logger.debug(f"Unpaywall DOI resolution failed for {doi}: {e}")
        
        return None
    
    async def retrieve_pdf(self, paper: Any, pdf_url: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve PDF from URL and store locally with safety checks.
        
        Returns:
            Dictionary with retrieval metadata or None on failure
        """
        if not self.validator.validate_url(pdf_url):
            logger.warning("Rejected invalid/unsafe PDF URL: %s", pdf_url)
            return None
        
        paper_id = getattr(paper, "doi", None) or getattr(paper, "id", "unknown_paper")
        
        try:
            headers = {
                "User-Agent": "ResearchAgent/1.0 (Academic research tool; mailto:research@example.com)"
            }
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True, headers=headers) as client:
                response = await client.get(pdf_url)
                if response.status_code != 200:
                    logger.warning("Failed to fetch PDF %s (HTTP %s)", pdf_url, response.status_code)
                    return None
                
                pdf_content = response.content
                
                # Check size
                if not self.validator.validate_content_size(len(pdf_content), self.max_file_size):
                    logger.warning("PDF exceeds maximum allowed size (%d bytes): %s", len(pdf_content), pdf_url)
                    return None
                
                # Validate it's actually a PDF by magic bytes
                if not self.validator.validate_pdf_magic_number(pdf_content):
                    logger.warning("Downloaded content is not a valid PDF (%s)", pdf_url)
                    return None
                
                # Generate content hash
                content_hash = hashlib.sha256(pdf_content).hexdigest()
                
                # Create safe filename
                safe_id = re.sub(r'[^\w\-_\.]', '_', str(paper_id))
                filename = f"{safe_id}.pdf"
                local_path = self.storage_dir / filename
                
                # Save to local storage
                with open(local_path, 'wb') as f:
                    f.write(pdf_content)
                
                return {
                    "paper_doi": str(paper_id),
                    "source_url": pdf_url,
                    "local_path": str(local_path),
                    "content_hash": content_hash,
                    "file_size": len(pdf_content),
                    "retrieved_at": datetime.utcnow().isoformat(),
                    "status": "success"
                }
                
        except Exception as e:
            logger.error("Failed to retrieve PDF for %s from %s: %s", paper_id, pdf_url, e)
            return {
                "paper_doi": str(paper_id),
                "source_url": pdf_url,
                "error": str(e),
                "status": "failed",
                "retrieved_at": datetime.utcnow().isoformat()
            }
    
    def get_local_pdf_path(self, paper: Any) -> Optional[Path]:
        """Get local path for already-retrieved PDF."""
        paper_id = getattr(paper, "doi", None) or getattr(paper, "id", "unknown_paper")
        safe_id = re.sub(r'[^\w\-_\.]', '_', str(paper_id))
        filename = f"{safe_id}.pdf"
        local_path = self.storage_dir / filename
        
        if local_path.exists():
            return local_path
        
        return None
