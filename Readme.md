# Excel NLP + ML (React front + FastAPI backend)

## What this does
- Reads an Excel file (`backend/data/data.xlsx`) containing at least a `text` column (optionally `id` and `label`).
- Builds a TF-IDF vectorizer and a NearestNeighbors index for search.
- Optionally trains a classifier if `label` column exists.
- Exposes endpoints:
  - `GET /search?q=...&k=5`
  - `POST /predict` (json `{"text": "..."}`
  - `POST /upload` (multipart form file to replace dataset)

## Quick start (Linux / macOS / WSL)
### Backend
1. `cd backend`
2. (optional) create sample data: `python make_sample_data.py`
3. create venv & install:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
