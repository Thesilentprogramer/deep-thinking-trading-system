import React from 'react';

const ConfidenceGauge = ({ text }) => {
    // Look for "Confidence: X%" OR "Confidence: Y/10" in the text
    let score = null;

    const percentMatch = text?.match(/Confidence:\s*(\d+)%/i);
    if (percentMatch) {
        score = parseInt(percentMatch[1], 10);
    } else {
        const outOfTenMatch = text?.match(/Confidence:\s*(\d+)\/10/i);
        if (outOfTenMatch) {
            score = parseInt(outOfTenMatch[1], 10) * 10;
        }
    }

    if (score === null || isNaN(score)) return null;

    let color = '#f87171'; // Red for low confidence
    if (score >= 80) color = '#4ade80'; // Green
    else if (score >= 50) color = '#fbbf24'; // Yellow

    const strokeWidth = 8;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                {/* Background circle */}
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                {/* Center text */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{score}%</span>
                </div>
            </div>
            <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Agent Alignment
                </h3>
                <p style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>
                    Confidence Score
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Based on consensus between the Research, Trader, and Risk teams.
                </p>
            </div>
        </div>
    );
};

export default ConfidenceGauge;
