"""
Title Synthesis Service for SIF Sentinel.
Generates concise, human-readable display titles for safety incident reports
while preserving the original telemetry evidence in full.
"""
import re
from typing import Optional, Dict, Any


def generate_display_title(
    description: Optional[str],
    raw_source: Optional[Dict[str, Any]] = None,
    max_length: int = 90
) -> str:
    """
    Synthesizes a short display title (approx 60-90 characters) for UI display.
    Strips PDF headers, case-study codes, bilingual prefixes, dates, and metadata boilerplate.
    Preserves original description/evidence completely untouched.
    """
    if not description or not str(description).strip():
        return "Safety Incident Observation"

    # 1. Check raw_source for explicit title fields
    if raw_source and isinstance(raw_source, dict):
        for key in ["title", "incident_title", "event_title", "subject"]:
            val = raw_source.get(key)
            if val and isinstance(val, str) and len(val.strip()) > 3:
                return _truncate_at_word_boundary(val.strip(), max_length)

    text = str(description).strip()

    # 2. Extract from explicit inline 'Title: ...' or 'Subject: ...'
    title_match = re.search(
        r'\b(?:Title|Subject|Event\s+Title)\s*[:\-]\s*([^\n\r]+)',
        text,
        re.IGNORECASE
    )
    if title_match:
        extracted = title_match.group(1).strip()
        # Clean nested sub-headers like "Brief Description: ..."
        extracted = re.sub(
            r'^(?:Brief\s+Description|Details|Summary)\s*[:\-]\s*',
            '',
            extracted,
            flags=re.IGNORECASE
        ).strip()
        if len(extracted) > 5:
            # Cut at first sentence dot if appropriate
            first_period = extracted.find('.')
            if 10 < first_period <= max_length:
                return extracted[:first_period].strip()
            return _truncate_at_word_boundary(extracted, max_length)

    # 3. Check if text has a dedicated 'Description:' or 'Incident Description:' block
    desc_match = re.search(
        r'(?<!of\s)\b(?:Incident\s+Description|Description|Observation\s+Details|Event\s+Details|What\s+Happened)\s*[:\-]\s*(.+)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    if desc_match:
        cleaned = desc_match.group(1).strip()
    else:
        cleaned = text

    # 4. Strip known boilerplate, case study prefixes, OISD codes, and document headers
    # Strip non-ASCII Devanagari/Hindi bilingual prefixes (e.g., केस स्टडी)
    cleaned = re.sub(r'[\u0900-\u097F]+', '', cleaned)
    # Strip case study markers and OISD codes
    cleaned = re.sub(r'\bCASE\s+STUDY\b[\s/]*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bOISD(?:/[A-Z0-9\-_]+)+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bDt\.?:\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r'\b(?:INCIDENT\s+INVESTIGATION\s+REPORT|OFFSHORE\s+RIG\s+INCIDENT\s+REPORT|SAFETY\s+OBSERVATION\s+REPORT|SITE\s+OBSERVATION\s+LOG|INCIDENT\s+REPORT)\b',
        '',
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(r'\bINTRODUCTION\b', '', cleaned, flags=re.IGNORECASE)

    # Strip key-value metadata clauses
    cleaned = re.sub(
        r'\b(?:Location|Site|Facility|Plant|Unit|Department|Dept|Division|Contractor|Company|Vendor)\s*[:\-]\s*[^,\n\r]+[,\n\r]?',
        '',
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(
        r'\b(?:Date\s+of\s+Incident|Incident\s+Date|Report\s+Date|Occurred\s+On|Date)\s*[:\-]\s*[^,\n\r]+[,\n\r]?',
        '',
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(r'\b\d{4}-\d{2}-\d{2}\b', '', cleaned)

    # 5. Clean punctuation and collapse whitespace
    cleaned = re.sub(r'[/\-_:;,]{2,}', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    cleaned = re.sub(r'^[^\w]+', '', cleaned).strip()

    if len(cleaned) <= max_length:
        return cleaned

    # 6. Extract first sentence if length exceeds max_length
    first_dot = cleaned.find('.')
    if 10 < first_dot <= max_length:
        return cleaned[:first_dot + 1].strip()

    return _truncate_at_word_boundary(cleaned, max_length)



def _truncate_at_word_boundary(text: str, max_length: int) -> str:
    """Truncates string to max_length at word boundaries with ellipsis."""
    clean_text = re.sub(r'\s+', ' ', text).strip()
    if len(clean_text) <= max_length:
        return clean_text
    truncated = clean_text[:max_length - 3]
    if ' ' in truncated:
        truncated = truncated.rsplit(' ', 1)[0]
    return truncated.rstrip(' ,;:-.') + '...'
