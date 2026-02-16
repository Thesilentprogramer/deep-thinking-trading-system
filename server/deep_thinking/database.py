import os
import certifi
from datetime import datetime, timezone
from pymongo import MongoClient
from .config import config as app_config

_client = None
_db = None

def init_db():
    """Connect to MongoDB Atlas and return the database handle."""
    global _client, _db
    uri = os.environ.get("MONGODB_URI") or os.environ.get("Mongodb_uri")
    if not uri:
        raise ValueError("MONGODB_URI environment variable is not set. Add it to your .env file.")
    
    _client = MongoClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    # Verify connection
    _client.admin.command("ping")
    _db = _client["deep_thinking"]
    
    # Ensure index on created_at for fast sorting
    _db.analysis_runs.create_index("created_at", unique=False)
    print("✅ Connected to MongoDB Atlas (database: deep_thinking)")
    return _db


def create_run(run_id: str, ticker: str, trade_date: str):
    """Insert a new analysis run with 'running' status."""
    doc = {
        "_id": run_id,
        "ticker": ticker.upper(),
        "trade_date": trade_date,
        "status": "running",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "error": None,
        "final_signal": None,
        "reports": {},
    }
    _db.analysis_runs.insert_one(doc)
    return doc


def complete_run(run_id: str, reports: dict, final_signal: str):
    """Update a run with completed reports and signal."""
    _db.analysis_runs.update_one(
        {"_id": run_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "final_signal": final_signal,
            "reports": reports,
        }}
    )


def fail_run(run_id: str, error_msg: str):
    """Mark a run as failed with an error message."""
    _db.analysis_runs.update_one(
        {"_id": run_id},
        {"$set": {
            "status": "failed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "error": error_msg,
        }}
    )


def get_run(run_id: str) -> dict | None:
    """Fetch a single run by ID."""
    return _db.analysis_runs.find_one({"_id": run_id})


def get_all_runs() -> list:
    """Fetch all runs, newest first. Returns summary fields only."""
    cursor = _db.analysis_runs.find(
        {},
        {
            "_id": 1, "ticker": 1, "trade_date": 1, "status": 1,
            "final_signal": 1, "created_at": 1, "completed_at": 1, "error": 1,
        }
    ).sort("created_at", -1)
    return list(cursor)


def delete_run(run_id: str) -> bool:
    """Delete a single run. Returns True if deleted."""
    result = _db.analysis_runs.delete_one({"_id": run_id})
    return result.deleted_count > 0
