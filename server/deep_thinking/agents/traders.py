import functools
from ..llm import quick_thinking_llm, deep_thinking_llm
from ..memory import trader_memory, risk_manager_memory
from ..state import AgentState

def create_trader(llm, memory):
    def trader_node(state, name):
        prompt = f"""You are a trading agent. Based on the provided investment plan, create a concise trading proposal. 
        Your response must end with 'FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL**'.
        
        Proposed Investment Plan: {state['investment_plan']}"""
        result = llm.invoke(prompt)
        return {"trader_investment_plan": result.content, "sender": name}
    return trader_node

def create_risk_debator(llm, role_prompt, agent_name):
    def risk_debator_node(state):
        # Get the arguments from the other two debaters.
        risk_state = state['risk_debate_state']
        opponents_args = []
        if agent_name != 'Risky Analyst' and risk_state['current_risky_response']: opponents_args.append(f"Risky: {risk_state['current_risky_response']}")
        if agent_name != 'Safe Analyst' and risk_state['current_safe_response']: opponents_args.append(f"Safe: {risk_state['current_safe_response']}")
        if agent_name != 'Neutral Analyst' and risk_state['current_neutral_response']: opponents_args.append(f"Neutral: {risk_state['current_neutral_response']}")
        
        opponents_str = "\n".join(opponents_args)
        prompt = f"""{role_prompt}
        Here is the trader's plan: {state['trader_investment_plan']}
        Debate history: {risk_state['history']}
        Your opponents' last arguments:
{opponents_str}
        Critique or support the plan from your perspective."""
        
        response = llm.invoke(prompt).content
        
        # Update state
        new_risk_state = risk_state.copy()
        new_risk_state['history'] += f"\n{agent_name}: {response}"
        new_risk_state['latest_speaker'] = agent_name
        if agent_name == 'Risky Analyst': new_risk_state['current_risky_response'] = response
        elif agent_name == 'Safe Analyst': new_risk_state['current_safe_response'] = response
        else: new_risk_state['current_neutral_response'] = response
        new_risk_state['count'] += 1
        return {"risk_debate_state": new_risk_state}

    return risk_debator_node

def create_risk_manager(llm, memory):
    def risk_manager_node(state):
        prompt = f"""As the Portfolio Manager, your decision is final. Review the trader's plan and the risk debate.
        Provide a final, binding decision: Buy, Sell, or Hold, and a brief justification.
        
        Trader's Plan: {state['trader_investment_plan']}
        Risk Debate: {state['risk_debate_state']['history']}"""
        response = llm.invoke(prompt).content
        return {"final_trade_decision": response}
    return risk_manager_node

trader_node_func = create_trader(quick_thinking_llm, trader_memory)
trader_node = functools.partial(trader_node_func, name="Trader")

risky_prompt = "You are the Risky Risk Analyst. You advocate for high-reward opportunities and bold strategies."
safe_prompt = "You are the Safe/Conservative Risk Analyst. You prioritize capital preservation and minimizing volatility."
neutral_prompt = "You are the Neutral Risk Analyst. You provide a balanced perspective, weighing both benefits and risks."

risky_node = create_risk_debator(quick_thinking_llm, risky_prompt, "Risky Analyst")
safe_node = create_risk_debator(quick_thinking_llm, safe_prompt, "Safe Analyst")
neutral_node = create_risk_debator(quick_thinking_llm, neutral_prompt, "Neutral Analyst")
risk_manager_node = create_risk_manager(quick_thinking_llm, risk_manager_memory)
