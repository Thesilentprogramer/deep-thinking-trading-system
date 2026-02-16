import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import FinancialRatios from './FinancialRatios';

const ReportSection = ({ title, content, isOpenDefault = false }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    if (!content) return null;

    return (
        <div className="report-section">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="report-section-header"
            >
                <span>
                    <FileText size={18} className="text-accent-yellow" />
                    {title}
                </span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isOpen && (
                <div className="report-section-body markdown-content animate-fadeIn">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

const MarketReport = ({ data, ticker }) => {
    if (!data) return null;

    return (
        <div className="space-y-6 w-full animate-fadeIn">
            {data.final_decision && (
                <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
                    <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                        Final Verdict
                    </h2>
                    <div className={`text-4xl font-extrabold mb-4 p-4 rounded-lg inline-block
                        ${data.final_signal === 'BUY' ? 'bg-accent-green/20 text-accent-green border border-accent-green' :
                            data.final_signal === 'SELL' ? 'bg-accent-red/20 text-accent-red border border-accent-red' :
                                'bg-yellow-500/20 text-yellow-500 border border-yellow-500'}
                    `} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                        {data.final_signal}
                    </div>
                    <div className="markdown-content" style={{ borderLeft: '3px solid var(--accent-yellow)', paddingLeft: '1rem' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {data.final_decision}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <ReportSection title="Market Technical Analysis" content={data.market_report} />
                <ReportSection title="Social Sentiment" content={data.sentiment_report} />
                <ReportSection title="News & Macro" content={data.news_report} />

                <FinancialRatios ticker={ticker} />

                <ReportSection title="Fundamental Analysis" content={data.fundamentals_report} />

                <ReportSection title="Bull vs Bear Debate" content={`### 🐂 The Bull Case\n${data.bull_case}\n\n---\n\n### 🐻 The Bear Case\n${data.bear_case}`} />

                <ReportSection title="Research Manager's Plan" content={data.research_verdict} isOpenDefault={true} />
                <ReportSection title="Trader's Execution Plan" content={data.trader_plan} />
                <ReportSection title="Risk Management Debate" content={data.risk_debate} />
            </div>
        </div>
    );
};

export default MarketReport;
