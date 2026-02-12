import os
import chromadb
from langchain_openai import OpenAIEmbeddings
from .config import config

class FinancialSituationMemory:
    def __init__(self, name, config):
        # Use NVIDIA's embedding model via OpenAI-compatible endpoint
        self.embedding_model = OpenAIEmbeddings(
            model="nvidia/nv-embedqa-e5-v5",
            base_url=config["nvidia_base_url"],
            api_key=os.environ.get("NVIDIA_API_KEY", ""),
        )
        self.chroma_client = chromadb.Client(chromadb.config.Settings(allow_reset=True))
        self.situation_collection = self.chroma_client.create_collection(name=name)

    def get_embedding(self, text):
        return self.embedding_model.embed_query(text)

    def add_situations(self, situations_and_advice):
        if not situations_and_advice:
            return
        offset = self.situation_collection.count()
        ids = [str(offset + i) for i, _ in enumerate(situations_and_advice)]
        situations = [s for s, r in situations_and_advice]
        recommendations = [r for s, r in situations_and_advice]
        embeddings = [self.get_embedding(s) for s in situations]
        self.situation_collection.add(
            documents=situations,
            metadatas=[{"recommendation": rec} for rec in recommendations],
            embeddings=embeddings,
            ids=ids,
        )

    def get_memories(self, current_situation, n_matches=1):
        if self.situation_collection.count() == 0:
            return []
        query_embedding = self.get_embedding(current_situation)
        results = self.situation_collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_matches, self.situation_collection.count()),
            include=["metadatas"],
        )
        return [{'recommendation': meta['recommendation']} for meta in results['metadatas'][0]]

# Initialize separate memories for different agents
bull_memory = FinancialSituationMemory("bull_memory", config)
bear_memory = FinancialSituationMemory("bear_memory", config)
trader_memory = FinancialSituationMemory("trader_memory", config)
invest_judge_memory = FinancialSituationMemory("invest_judge_memory", config)
risk_manager_memory = FinancialSituationMemory("risk_manager_memory", config)
