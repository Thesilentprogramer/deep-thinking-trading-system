import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DebateReplay = ({ debateText }) => {
    const [messages, setMessages] = useState([]);
    const [visibleCount, setVisibleCount] = useState(0);
    const containerRef = useRef(null);

    // Parse the raw debate text into a list of messages
    useEffect(() => {
        if (!debateText || typeof debateText !== 'string') return;

        // Split by the pattern "Agent Name: Message"
        // Wait, the history is structured as "\nBull Analyst: message\nBear Analyst: message"
        // Let's split by double newline or known prefixes
        const lines = debateText.split('\n\n').filter(Boolean);
        const parsedMessages = [];

        for (const line of lines) {
            const match = line.match(/^(Bull Analyst|Bear Analyst|Risky Analyst|Safe Analyst|Neutral Analyst):\s*(.*)/is);
            if (match) {
                parsedMessages.push({ speaker: match[1], text: match[2].trim() });
            } else {
                // If the regex didn't match perfectly but it's still text, just append it to the last message or add as generic
                if (parsedMessages.length > 0) {
                    parsedMessages[parsedMessages.length - 1].text += '\n\n' + line;
                } else {
                    parsedMessages.push({ speaker: 'System', text: line.trim() });
                }
            }
        }

        setMessages(parsedMessages);
        setVisibleCount(0);
    }, [debateText]);

    // Animate messages staggering in
    useEffect(() => {
        if (visibleCount < messages.length) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => prev + 1);
            }, 800); // 800ms delay between messages
            return () => clearTimeout(timer);
        }
    }, [visibleCount, messages.length]);

    // Auto-scroll to bottom as new messages appear
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [visibleCount]);

    if (!debateText) return <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Pending...</div>;

    return (
        <div ref={containerRef} style={{
            display: 'flex', flexDirection: 'column', gap: '1rem',
            maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem'
        }}>
            {messages.slice(0, visibleCount).map((msg, idx) => {
                const isBull = msg.speaker.includes('Bull') || msg.speaker.includes('Risky');
                const isBear = msg.speaker.includes('Bear') || msg.speaker.includes('Safe');

                let bgColor = 'rgba(255,255,255,0.05)';
                let align = 'flex-start';
                let speakerColor = 'var(--text-secondary)';

                if (isBull) {
                    bgColor = 'rgba(74, 222, 128, 0.08)';
                    align = 'flex-end';
                    speakerColor = '#4ade80';
                } else if (isBear) {
                    bgColor = 'rgba(248, 113, 113, 0.08)';
                    align = 'flex-start';
                    speakerColor = '#f87171';
                }

                return (
                    <div key={idx} style={{
                        alignSelf: align,
                        maxWidth: '85%',
                        background: bgColor,
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.05)',
                        animation: 'fadeInUp 0.4s ease-out forwards',
                        opacity: 0,
                        transform: 'translateY(10px)'
                    }}>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: speakerColor, marginBottom: '0.5rem', fontWeight: 600 }}>
                            {msg.speaker}
                        </div>
                        <div className="markdown-content" style={{ fontSize: '0.95rem', margin: 0 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                    </div>
                );
            })}

            <style>{`
                @keyframes fadeInUp {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .markdown-content p:last-child {
                    margin-bottom: 0;
                }
            `}</style>
        </div>
    );
};

export default DebateReplay;
