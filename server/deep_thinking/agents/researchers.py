from ..llm import quick_thinking_llm, deep_thinking_llm
from ..memory import bull_memory, bear_memory, invest_judge_memory
from ..state import AgentState

def create_researcher_node(llm, memory, role_prompt, agent_name):
    def researcher_node(state):
        # Combine all reports and debate history for context.
        situation_summary = f"""
        Market Report: {state['market_report']}
        Sentiment Report: {state['sentiment_report']}
        News Report: {state['news_report']}
        Fundamentals Report: {state['fundamentals_report']}
        """
        past_memories = memory.get_memories(situation_summary)
        past_memory_str = "\n".join([mem['recommendation'] for mem in past_memories])
        
        prompt = f"""{role_prompt}
        Here is the current state of the analysis:
        {situation_summary}
        Conversation history: {state['investment_debate_state']['history']}
        Your opponent's last argument: {state['investment_debate_state']['current_response']}
        Reflections from similar past situations: {past_memory_str or 'No past memories found.'}
        Based on all this information, present your argument conversationally."""
        
        response = llm.invoke(prompt)
        argument = f"{agent_name}: {response.content}"
        
        # Update the debate state
        debate_state = state['investment_debate_state'].copy()
        debate_state['history'] += "\n" + argument
        if agent_name == 'Bull Analyst':
            debate_state['bull_history'] += "\n" + argument
        else:
            debate_state['bear_history'] += "\n" + argument
        debate_state['current_response'] = argument
        debate_state['count'] += 1
        return {"investment_debate_state": debate_state}

    return researcher_node

bull_prompt = """You are a Bull Analyst. Your goal is to build the strongest possible case FOR investing in this stock.

RULES:
1. You MUST ground every argument in specific data points from the reports (cite numbers, percentages, trends).
2. Highlight growth catalysts, competitive moats, improving margins, positive momentum, and favorable sentiment.
3. Directly counter the Bear's arguments with data, not opinions.
4. Do NOT be timid or hedge excessively. If the data supports a bullish case, argue it confidently.
5. End your argument with: CONVICTION SCORE: X/10 (where 10 = extremely bullish, based on data strength).

Remember: Your job is to advocate FOR the stock. Let the data guide your conviction level."""

bear_prompt = """You are a Bear Analyst. Your goal is to build the strongest possible case AGAINST investing in this stock.

RULES:
1. You MUST ground every argument in specific data points from the reports (cite numbers, percentages, trends).
2. Highlight risks: overvaluation, declining metrics, competitive threats, negative sentiment, macro headwinds.
3. Directly counter the Bull's arguments with data, not opinions.
4. Do NOT exaggerate risks beyond what the data actually shows. Be precise about what the data says.
5. End your argument with: RISK SCORE: X/10 (where 10 = extremely risky, based on data strength).

Remember: Your job is to advocate AGAINST the stock. Let the data guide your risk assessment."""

bull_researcher_node = create_researcher_node(quick_thinking_llm, bull_memory, bull_prompt, "Bull Analyst")
bear_researcher_node = create_researcher_node(quick_thinking_llm, bear_memory, bear_prompt, "Bear Analyst")

def create_research_manager(llm, memory):
    def research_manager_node(state):
        prompt = f"""As the Research Manager, you must make a data-driven decision based on the Bull vs Bear debate.

STEP 1: Score the stock on these dimensions (1-10 each, based on the evidence presented):
- Growth Potential: (revenue growth, market expansion, catalysts)
- Value: (P/E, margins, FCF relative to peers and history)
- Momentum: (price trends, technical indicators, sentiment)
- Risk Level: (debt, competition, macro threats — LOWER score = MORE risk)

STEP 2: Calculate the average of all four scores.

STEP 3: Make your decision using these thresholds:
- Average > 6.0 → Recommend BUY
- Average 4.0 to 6.0 → Recommend HOLD
- Average < 4.0 → Recommend SELL

CRITICAL: Do NOT default to SELL out of caution. Let the numeric scores drive your decision.
If the bull case presented strong data-backed arguments, the scores should reflect that.

Debate History:
{state['investment_debate_state']['history']}

Provide your scores, calculation, and final recommendation. End with:
RECOMMENDATION: **BUY/HOLD/SELL** (Average Score: X.X/10)"""
        response = llm.invoke(prompt)
        return {"investment_plan": response.content}
    return research_manager_node

research_manager_node = create_research_manager(quick_thinking_llm, invest_judge_memory)
