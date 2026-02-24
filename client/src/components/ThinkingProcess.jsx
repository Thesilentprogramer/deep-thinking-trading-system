import React from 'react';
import { CheckCircle, Circle, Loader } from 'lucide-react';

const steps = [
  { id: 'Market Analyst', label: 'Market Analysis' },
  { id: 'Social Analyst', label: 'Social Sentiment' },
  { id: 'News Analyst', label: 'News Gathering' },
  { id: 'Fundamentals Analyst', label: 'Fundamentals Check' },
  { id: 'Research Manager', label: 'Research Debate' },
  { id: 'Trader', label: 'Invest Proposal' },
  { id: 'Risk Judge', label: 'Risk Assessment' },
];

const ThinkingProcess = ({ activeStep, completedSteps = [] }) => {
  const isComplete = activeStep === 'completed';

  return (
    <div className="card thinking-card">
      <div className="thinking-header">Agent Reasoning</div>
      <div className="thinking-steps">
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          const isCompleted = completedSteps.includes(step.id) || isComplete;

          let stepClass = 'thinking-step thinking-step-pending';
          if (isActive) stepClass = 'thinking-step thinking-step-active';
          if (isCompleted) stepClass = 'thinking-step thinking-step-done';

          return (
            <div key={step.id} className={stepClass}>
              <span className="thinking-step-icon">
                {isCompleted ? (
                  <CheckCircle size={14} />
                ) : isActive ? (
                  <Loader size={14} className="animate-pulse" />
                ) : (
                  <Circle size={14} />
                )}
              </span>
              <span>{step.label}</span>
              {isActive && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.4 }}>processing</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThinkingProcess;
