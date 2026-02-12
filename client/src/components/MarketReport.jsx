import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

const ReportSection = ({ title, content, isOpenDefault = false }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    if (!content) return null;

    return (
        <div className="mb-4 border border-glass-border rounded-lg overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-bg-secondary hover:bg-bg-card transition-colors text-left"
            >
                <span className="font-semibold text-lg flex items-center gap-2">
                    <FileText size={18} className="text-accent-blue" />
                    {title}
                </span>
                {isOpen ? <ChevronUp size={20} className="text-text-secondary" /> : <ChevronDown size={20} className="text-text-secondary" />}
            </button>

            {isOpen && (
                <div className="p-6 bg-card markdown-content animate-fadeIn">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

const MarketReport = ({ data }) => {
    if (!data) return null;

    return (
        <div className="space-y-6 w-full animate-fadeIn">
            {data.final_decision && (
                <div className="card bg-gradient-to-r from-bg-card to-bg-secondary border-l-4 border-l-accent-purple mb-8">
                    <h2 className="text-2xl font-bold mb-2">Final Verdict</h2>
                    <div className={`text-4xl font-extrabold mb-4 p-4 rounded-lg inline-block
                ${data.final_signal === 'BUY' ? 'bg-accent-green/20 text-accent-green border border-accent-green' :
                            data.final_signal === 'SELL' ? 'bg-accent-red/20 text-accent-red border border-accent-red' :
                                'bg-yellow-500/20 text-yellow-500 border border-yellow-500'}
            `}>
                        {data.final_signal}
                    </div>
                    <p className="text-lg text-text-primary italic border-l-2 border-glass-border pl-4">
                        "{data.final_decision}"
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <ReportSection title="Market Technical Analysis" content={data.market_report} />
                <ReportSection title="Social Sentiment" content={data.sentiment_report} />
                <ReportSection title="News & Macro" content={data.news_report} />
                <ReportSection title="Fundamental Analysis" content={data.fundamentals_report} />

                <ReportSection title="Bull vs Bear Debate" content={`### The Bull Case\n${data.bull_case}\n\n---\n\n### The Bear Case\n${data.bear_case}`} />

                <ReportSection title="Research Manager's Plan" content={data.research_verdict} isOpenDefault={true} />
                <ReportSection title="Trader's Execution Plan" content={data.trader_plan} />
                <ReportSection title="Risk Management Debate" content={data.risk_debate} />
            </div>
        </div>
    );
};

export default MarketReport;
