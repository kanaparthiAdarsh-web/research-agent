"""Security validators for input validation and sanitization."""
import re
from typing import Optional
from urllib.parse import urlparse
import os
import hashlib


class InputValidator:
    """Validate various inputs for security."""
    
    @staticmethod
    def validate_url(url: str, allow_private: bool = False) -> bool:
        """Validate URL format, safety, and SSRF protection."""
        try:
            result = urlparse(url)
            # Check if it's a safe scheme
            if result.scheme not in ['http', 'https']:
                return False
            
            # Check for suspicious patterns
            if '..' in result.path or ';' in result.netloc or '@' in result.netloc:
                return False
                
            hostname = (result.hostname or "").lower()
            if not hostname:
                return False

            if not allow_private:
                # SSRF Protection: Block localhost, loopback, link-local, and private addresses
                blocked_hosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254', 'metadata.google.internal']
                if hostname in blocked_hosts or hostname.endswith('.local') or hostname.endswith('.internal'):
                    return False
                
                # Check private IPv4 patterns
                parts = hostname.split('.')
                if len(parts) == 4 and all(p.isdigit() for p in parts):
                    ip_nums = [int(p) for p in parts]
                    if ip_nums[0] == 10:  # 10.0.0.0/8
                        return False
                    if ip_nums[0] == 127:  # 127.0.0.0/8
                        return False
                    if ip_nums[0] == 169 and ip_nums[1] == 254:  # 169.254.0.0/16
                        return False
                    if ip_nums[0] == 172 and 16 <= ip_nums[1] <= 31:  # 172.16.0.0/12
                        return False
                    if ip_nums[0] == 192 and ip_nums[1] == 168:  # 192.168.0.0/16
                        return False
                    if ip_nums[0] == 0:
                        return False

            return all([result.scheme, result.netloc])
        except Exception:
            return False

    @staticmethod
    def validate_content_size(data_len: int, max_bytes: int = 50 * 1024 * 1024) -> bool:
        """Validate that content length does not exceed max_bytes (default 50MB)."""
        return 0 < data_len <= max_bytes
    
    @staticmethod
    def validate_doi(doi: str) -> bool:
        """Validate DOI format."""
        # Basic DOI pattern: 10.xxxx/xxxxx
        doi_pattern = r'^10\.\d{4,9}/[^\s]+$'
        # Also accept DOIs with http/https prefixes
        full_doi_pattern = r'^(https?://(dx\.)?doi\.org/)?10\.\d{4,9}/[^\s]+$'
        
        return bool(re.match(full_doi_pattern, doi, re.IGNORECASE))
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal."""
        # Remove path components
        basename = os.path.basename(filename)
        # Remove dangerous characters
        sanitized = re.sub(r'[^\w\-_\.]', '_', basename)
        return sanitized
    
    @staticmethod
    def validate_file_type(content_type: str, allowed_types: list) -> bool:
        """Validate file content type."""
        return content_type.lower() in [t.lower() for t in allowed_types]
    
    @staticmethod
    def validate_pdf_magic_number(data: bytes) -> bool:
        """Validate that data starts with PDF magic number."""
        return data.startswith(b'%PDF')
    
    @staticmethod
    def generate_content_hash(data: bytes) -> str:
        """Generate SHA256 hash of content."""
        return hashlib.sha256(data).hexdigest()


class Sanitizer:
    """Input sanitization utilities."""
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """Basic text sanitization."""
        if not text:
            return text
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Remove obvious script/iframe tags (be careful not to over-sanitize academic text)
        import re
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.IGNORECASE | re.DOTALL)
        
        return text
    
    @staticmethod
    def sanitize_path(path: str) -> str:
        """Sanitize path to prevent directory traversal."""
        # Remove .. components
        parts = path.replace('\\', '/').split('/')
        clean_parts = [p for p in parts if p not in ('', '..', '.')]
        return '/'.join(clean_parts)
