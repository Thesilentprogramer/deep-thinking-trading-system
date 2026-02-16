import os
from langchain_openai import ChatOpenAI
from .config import config

# Ensure NVIDIA_API_KEY is set
if not os.environ.get("NVIDIA_API_KEY"):
    raise ValueError("NVIDIA_API_KEY environment variable is missing. Please set it in your .env file.")

# NVIDIA uses an OpenAI-compatible API, so we use ChatOpenAI with a custom base_url.
deep_thinking_llm = ChatOpenAI(
    model=config["deep_think_llm"],
    base_url=config["nvidia_base_url"],
    api_key=os.environ["NVIDIA_API_KEY"],
    temperature=0.6,
    top_p=0.95,
    max_tokens=8192,
)

quick_thinking_llm = ChatOpenAI(
    model=config["quick_think_llm"],
    base_url=config["nvidia_base_url"],
    api_key=os.environ["NVIDIA_API_KEY"],
    temperature=0.6,
    top_p=0.95,
    max_tokens=8192,
)

print("LLMs initialized successfully (NVIDIA API).")
print(f"Deep Thinking LLM: {config['deep_think_llm']}")
print(f"Quick Thinking LLM: {config['quick_think_llm']}")
