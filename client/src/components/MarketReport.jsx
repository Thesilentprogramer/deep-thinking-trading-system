import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp } from 'lucide-react';
import FinancialRatios from './FinancialRatios';
import PriceChart from './PriceChart';
import ConfidenceGauge from './ConfidenceGauge';
import DebateReplay from './DebateReplay';

const ReportSection = ({ title, content, children, isOpenDefault = false }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    if (!content && !children) return null;

    return (
        <div className="report-section">
            <button onClick={() => setIsOpen(!isOpen)} className="report-section-header">
                <span className="report-section-title">{title}</span>
                {isOpen ? <ChevronUp size={16} style={{ opacity: 0.4 }} /> : <ChevronDown size={16} style={{ opacity: 0.4 }} />}
            </button>

            {isOpen && (
                <div className="report-section-content markdown-content">
                    {children ? children : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    )}
                </div>
            )}
        </div>
    );
};

const MarketReport = ({ data, ticker, streaming = false }) => {
    if (!data) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.final_decision && (
                <div className="card" style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', marginBottom: '1.5rem' }}>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        marginBottom: '1rem',
                        color: 'var(--text-secondary)',
                    }}>
                        Final Verdict
                    </h2>
                    <div className={`signal-badge ${data.final_signal === 'BUY' ? 'signal-buy' :
                        data.final_signal === 'SELL' ? 'signal-sell' : 'signal-hold'
                        }`} style={{ fontSize: '1.2rem', padding: '0.4rem 1.5rem', marginBottom: '1.5rem', display: 'inline-flex' }}>
                        {data.final_signal}
                    </div>

                    <ConfidenceGauge text={data.final_decision} />

                    <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {data.final_decision}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Interactive Price Chart */}
            <PriceChart ticker={ticker} />

            <ReportSection title="Market Technical Analysis" content={data.market_report} />
            <ReportSection title="Social Sentiment" content={data.sentiment_report} />
            <ReportSection title="News & Macro" content={data.news_report} />

            <FinancialRatios ticker={ticker} />

            <ReportSection title="Fundamental Analysis" content={data.fundamentals_report} />

            <ReportSection title="Agent Debate Replay" isOpenDefault={true}>
                <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <DebateReplay debateText={data.research_debate} />
                </div>
            </ReportSection>

            <ReportSection title="Research Manager's Plan" content={data.research_verdict} isOpenDefault={true} />
            <ReportSection title="Trader's Execution Plan" content={data.trader_plan} />
            <ReportSection title="Risk Management Debate" content={data.risk_debate} />
        </div>
    );
};

export default MarketReport;
