import React from 'react';
import { Brain, CheckCircle, Circle, RefreshCw } from 'lucide-react';

const steps = [
  { id: 'Market Analyst', label: 'Market Analysis', icon: Brain },
  { id: 'Social Analyst', label: 'Social Sentiment', icon: Brain },
  { id: 'News Analyst', label: 'News Gathering', icon: Brain },
  { id: 'Fundamentals Analyst', label: 'Fundamentals Check', icon: Brain },
  { id: 'Research Manager', label: 'Research Debate', icon: RefreshCw },
  { id: 'Trader', label: 'Invest Proposal', icon: Brain },
  { id: 'Risk Judge', label: 'Risk Assessment', icon: Brain },
];

const ThinkingProcess = ({ activeStep, completedSteps = [] }) => {
  // If activeStep matches one of our defined steps, or if the process is complete
  const isComplete = activeStep === 'completed';

  return (
    <div className="card w-full mb-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Brain className="text-accent-purple" />
        Agent Reasoning Process
      </h3>
      
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-glass-border transform -translate-x-1/2"></div>
        
        <div className="space-y-6 relative">
          {steps.map((step, index) => {
            const isActive = activeStep === step.id;
            const isCompleted = completedSteps.includes(step.id) || isComplete;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-60'}`}>
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center z-10 
                    border-2 transition-colors duration-300
                    ${isActive ? 'bg-bg-secondary border-accent-blue text-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                      isCompleted ? 'bg-accent-green border-accent-green text-white' : 
                      'bg-bg-primary border-glass-border text-text-secondary'}
                  `}>
                  {isCompleted ? <CheckCircle size={20} /> : isActive ? <RefreshCw className="animate-spin" size={20} /> : <Circle size={20} />}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-semibold ${isActive ? 'text-accent-blue' : isCompleted ? 'text-accent-green' : 'text-text-secondary'}`}>
                    {step.label}
                  </h4>
                  {isActive && <p className="text-sm text-text-secondary animate-pulse">Processing...</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThinkingProcess;
