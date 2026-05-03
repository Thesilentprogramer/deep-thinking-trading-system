import os
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

def _get_env_or_fail(var: str) -> str:
    val = os.environ.get(var)
    if not val:
        raise ValueError(f"Environment variable {var} is not set.")
    return val

# Configuration dictionary
config = {
    "results_dir": "./results",
    # LLM settings
    "llm_provider": "nvidia",
    "nvidia_base_url": "https://integrate.api.nvidia.com/v1",
    "deep_think_llm": "meta/llama-3.1-70b-instruct",
    "quick_think_llm": "meta/llama-3.1-8b-instruct",
    # Debate and discussion settings
    "max_debate_rounds": 3, # Bull vs. Bear debate rounds
    "max_risk_discuss_rounds": 2, # Risk team debate rounds
    "max_recur_limit": 100,
    # Tool settings
    "online_tools": True, # Use live APIs instead of cached data
    "data_cache_dir": "./data_cache", # Directory for caching online data
    # Notification Settings
    "notification_server_url": os.environ.get("NOTIFICATION_SERVER_URL", "http://localhost:3001"),
    "notification_secret": os.environ.get("NOTIFICATION_SECRET", ""),
}

# Create the cache directory if it doesn't exist
os.makedirs(config["data_cache_dir"], exist_ok=True)
