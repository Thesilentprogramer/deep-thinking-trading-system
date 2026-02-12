from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, RemoveMessage
from .state import AgentState
from .config import config
from .agents.analysts import (
    market_analyst_node,
    social_analyst_node,
    news_analyst_node,
    fundamentals_analyst_node
)
from .agents.researchers import (
    bull_researcher_node,
    bear_researcher_node,
    research_manager_node
)
from .agents.traders import (
    trader_node,
    risky_node,
    safe_node,
    neutral_node,
    risk_manager_node
)

class ConditionalLogic:
    def __init__(self, max_debate_rounds=1, max_risk_discuss_rounds=1):
        self.max_debate_rounds = max_debate_rounds
        self.max_risk_discuss_rounds = max_risk_discuss_rounds

    def should_continue_debate(self, state: AgentState) -> str:
        if state["investment_debate_state"]["count"] >= 2 * self.max_debate_rounds:
            return "Research Manager"
        return "Bear Researcher" if state["investment_debate_state"]["current_response"].startswith("Bull") else "Bull Researcher"

    def should_continue_risk_analysis(self, state: AgentState) -> str:
        if state["risk_debate_state"]["count"] >= 3 * self.max_risk_discuss_rounds:
            return "Risk Judge"
        speaker = state["risk_debate_state"]["latest_speaker"]
        if speaker == "Risky Analyst": return "Safe Analyst"
        if speaker == "Safe Analyst": return "Neutral Analyst"
        return "Risky Analyst"


conditional_logic = ConditionalLogic(
    max_debate_rounds=config['max_debate_rounds'],
    max_risk_discuss_rounds=config['max_risk_discuss_rounds']
)

# Construction of StateGraph
workflow = StateGraph(AgentState)

# Add Analyst Nodes (each node calls tools directly, no ToolNode needed)
workflow.add_node("Market Analyst", market_analyst_node)
workflow.add_node("Social Analyst", social_analyst_node)
workflow.add_node("News Analyst", news_analyst_node)
workflow.add_node("Fundamentals Analyst", fundamentals_analyst_node)

# Add Researcher Nodes
workflow.add_node("Bull Researcher", bull_researcher_node)
workflow.add_node("Bear Researcher", bear_researcher_node)
workflow.add_node("Research Manager", research_manager_node)

# Add Trader and Risk Nodes
workflow.add_node("Trader", trader_node)
workflow.add_node("Risky Analyst", risky_node)
workflow.add_node("Safe Analyst", safe_node)
workflow.add_node("Neutral Analyst", neutral_node)
workflow.add_node("Risk Judge", risk_manager_node)

# Define Entry Point and Edges
# Simple linear flow for analysts (no more ReAct tool loops)
workflow.set_entry_point("Market Analyst")
workflow.add_edge("Market Analyst", "Social Analyst")
workflow.add_edge("Social Analyst", "News Analyst")
workflow.add_edge("News Analyst", "Fundamentals Analyst")
workflow.add_edge("Fundamentals Analyst", "Bull Researcher")

# Research debate loop
workflow.add_conditional_edges("Bull Researcher", conditional_logic.should_continue_debate)
workflow.add_conditional_edges("Bear Researcher", conditional_logic.should_continue_debate)
workflow.add_edge("Research Manager", "Trader")

# Risk debate loop
workflow.add_edge("Trader", "Risky Analyst")
workflow.add_conditional_edges("Risky Analyst", conditional_logic.should_continue_risk_analysis)
workflow.add_conditional_edges("Safe Analyst", conditional_logic.should_continue_risk_analysis)
workflow.add_conditional_edges("Neutral Analyst", conditional_logic.should_continue_risk_analysis)

workflow.add_edge("Risk Judge", END)

# Compile Graph
graph = workflow.compile()
print("Graph compiled successfully.")
