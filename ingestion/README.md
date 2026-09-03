# LEGAL-Nexus - Legal Corpus Ingestion

The `ingestion/` module is responsible for extracting, parsing, and chunking legal acts, central and state codes, High Court/Supreme Court judgments, and statutory circulars into structured MongoDB `legalSources` and `legalChunks`.

## Quick Start

```bash
cd ingestion
pip install -r requirements.txt
python pipeline.py
```
