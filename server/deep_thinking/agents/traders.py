import functools
from ..llm import quick_thinking_llm, deep_thinking_llm
from ..memory import trader_memory, risk_manager_memory
from ..state import AgentState

def create_trader(llm, memory):
    def trader_node(state, name):
        prompt = f"""You are a trading agent. Your job is to faithfully translate the research team's investment plan into a concrete trading proposal.

CRITICAL RULES:
1. Do NOT override or second-guess the research team's recommendation. If they recommend BUY, your proposal should be BUY.
2. Focus on execution details: position sizing, entry/exit points, stop-losses, and timeframes.
3. Reference the numeric scores from the investment plan to justify your proposal.
4. Your response must end with: FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL**

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
        Critique or support the plan from your perspective. End with your SCORE: X/10."""
        
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
        prompt = f"""As the Portfolio Manager, synthesize the trader's plan and the risk debate to make a final, balanced decision.

STEP 1: Score these dimensions (1-10 each):
- Upside Potential: How much room for gains? (based on the trader's plan and risky analyst's arguments)
- Downside Risk: How severe are the risks? (based on the safe analyst's arguments — HIGHER = MORE downside)
- Confidence: 0-100% gauge derived from agent alignment (e.g., if Research Manager, Trader, and Risk Debate all align on BUY -> 90%+, split decision -> 50-60%).

STEP 2: Decision logic:
- If Upside > Downside AND Confidence >= 50% → BUY
- If Upside ≈ Downside (within 2 points) OR Confidence < 50% → HOLD
- If Downside > Upside by 3+ points → SELL

CRITICAL: Do NOT default to SELL out of caution. Be data-driven. If the research team recommended BUY with strong scores, you need strong counter-evidence to override that.

Trader's Plan: {state['trader_investment_plan']}
Risk Debate: {state['risk_debate_state']['history']}

Provide your scores, reasoning, and final decision. End with:
FINAL DECISION: **BUY/HOLD/SELL** (Upside: X/10, Downside: X/10, Confidence: X%)"""
        response = llm.invoke(prompt).content
        return {"final_trade_decision": response}
    return risk_manager_node

trader_node_func = create_trader(quick_thinking_llm, trader_memory)
trader_node = functools.partial(trader_node_func, name="Trader")

risky_prompt = """You are the Risky Risk Analyst. You advocate for high-reward opportunities and bold strategies.

RULES:
1. Quantify the reward-to-risk ratio with specific numbers from the data.
2. Highlight asymmetric upside opportunities the safe analyst may underweight.
3. Do NOT dismiss risks, but argue why the potential reward justifies them.
4. End with: REWARD-TO-RISK SCORE: X/10 (10 = exceptional reward relative to risk)."""

safe_prompt = """You are the Safe/Conservative Risk Analyst. You prioritize capital preservation and minimizing volatility.

RULES:
1. Quantify actual loss probability with specific data points (not vague fears).
2. Identify concrete downside scenarios and their likelihood.
3. Do NOT exaggerate risks. Be precise about what the data shows vs. hypothetical fears.
4. End with: SAFETY SCORE: X/10 (10 = very safe, minimal downside risk)."""

neutral_prompt = """You are the Neutral Risk Analyst. You provide a balanced, objective perspective.

RULES:
1. Weigh both the risky and safe analysts' arguments fairly.
2. Identify which side has stronger data-backed evidence.
3. Provide an explicit weighted assessment, not a wishy-washy middle ground.
4. End with: BALANCED SCORE: X/10 (>6 = favors the trade, <4 = against, 4-6 = truly neutral)."""

risky_node = create_risk_debator(quick_thinking_llm, risky_prompt, "Risky Analyst")
safe_node = create_risk_debator(quick_thinking_llm, safe_prompt, "Safe Analyst")
neutral_node = create_risk_debator(quick_thinking_llm, neutral_prompt, "Neutral Analyst")
risk_manager_node = create_risk_manager(quick_thinking_llm, risk_manager_memory)
