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

bull_prompt = "You are a Bull Analyst. Your goal is to argue for investing in the stock. Focus on growth potential, competitive advantages, and positive indicators from the reports. Counter the bear's arguments effectively."
bear_prompt = "You are a Bear Analyst. Your goal is to argue against investing in the stock. Focus on risks, challenges, and negative indicators. Counter the bull's arguments effectively."

bull_researcher_node = create_researcher_node(quick_thinking_llm, bull_memory, bull_prompt, "Bull Analyst")
bear_researcher_node = create_researcher_node(quick_thinking_llm, bear_memory, bear_prompt, "Bear Analyst")

def create_research_manager(llm, memory):
    def research_manager_node(state):
        prompt = f"""As the Research Manager, your role is to critically evaluate the debate between the Bull and Bear analysts and make a definitive decision.
        Summarize the key points, then provide a clear recommendation: Buy, Sell, or Hold. Develop a detailed investment plan for the trader, including your rationale and strategic actions.
        
        Debate History:
        {state['investment_debate_state']['history']}"""
        response = llm.invoke(prompt)
        return {"investment_plan": response.content}
    return research_manager_node

research_manager_node = create_research_manager(quick_thinking_llm, invest_judge_memory)
