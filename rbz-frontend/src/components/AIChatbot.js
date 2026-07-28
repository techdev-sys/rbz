import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './AIChatbot.css';

const AI_SERVICE_URL = '/chat';

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: "Welcome to the **RBZ Licensing Assistant**. I can guide you through the application process:\n\n• What each application stage requires\n• Document requirements and formats\n• Minimum capital and governance requirements\n• Where to find things in this portal\n\n*This is automated procedural guidance only — it is not regulatory advice, and licensing decisions rest with the Registrar. For case-specific questions, use the application correspondence with your assigned examiner.*",
    timestamp: new Date(),
    isWelcome: true,
};

const INITIAL_SUGGESTIONS = [
    "What documents do I need?",
    "Explain the application stages",
    "What are director requirements?",
    "Minimum capital requirements",
];

// Simple markdown-like renderer
const formatMessage = (text) => {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
};

const AIChatbot = ({ companyId, currentStage, stageName, institutionName, userName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // Stage-aware welcome tips — keyed by wizard stage NAME so they always
    // match the screen the applicant is actually on.
    const getStageHint = useCallback(() => {
        const hints = {
            'Company Profile': "**Tip:** Make sure your Company Name exactly matches your Certificate of Incorporation. Choose 'Credit-Only' unless you plan to accept deposits from the public.",
            'Ownership Structure': "**Tip:** List ALL shareholders who own 10% or more. Corporate shareholders must also disclose their underlying beneficial owners.",
            'Directors & Governance': "**Tip:** Each director needs 5 key documents: Certified ID, CV (chronological format), Police Clearance, Tax Clearance, and Net Worth Affidavit.",
            'Application Form': "**Tip:** The contact person named here will receive all correspondence about this application — use someone who can respond promptly.",
            'Capital Structure': "**Tip:** Issued shares × par value should equal your issued share capital. Minimum capital: USD 25,000 equivalent (Credit-Only) or USD 5,000,000 equivalent (Deposit-Taking).",
            'Products & Services': "**Tip:** Describe all loan products clearly. Interest rates and all charges must be clearly disclosed.",
            'Financial Projections': "**Tip:** Provide at least 3 years of projections and state your key assumptions.",
            'Growth & Development': "**Tip:** Set out your growth strategy, branch or rollout plans, and supporting market analysis.",
            'Compliance Declaration': "**Tip:** Review your declarations carefully — false or inaccurate declarations can lead to refusal of the application.",
            'Documents Upload': "**Tip:** Include your last 6 months of bank statements and any audited financial statements. Each document is checked automatically on upload.",
            'Application Review': "**Tip:** Check every stage shows as complete before submitting. Once submitted, your application goes to a Bank Examiner for review.",
        };
        return hints[stageName] || null;
    }, [stageName]);

    // Show stage hint when stage changes
    useEffect(() => {
        if (stageName) {
            const hint = getStageHint();
            if (hint && messages.length <= 1) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: `hint-${stageName}`,
                        role: 'assistant',
                        content: hint,
                        timestamp: new Date(),
                        isHint: true,
                    }]);
                    setSuggestions(getStageSuggestions(stageName));
                }, 1500);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stageName]);

    const getStageSuggestions = (stage) => {
        const stageSuggestions = {
            'Company Profile': ["What license type should I choose?", "What is a Certificate of Incorporation?", "Required contact details"],
            'Ownership Structure': ["What is a CR11 form?", "How to calculate share percentages?", "What is an ultimate beneficial owner?"],
            'Directors & Governance': ["Documents needed per director", "What format should the CV be?", "How many board committees are required?"],
            'Application Form': ["Who should be the contact person?", "What declarations are required?", "What happens after I submit?"],
            'Capital Structure': ["Minimum capital requirements", "Authorized vs issued shares", "Proving capital injection"],
            'Products & Services': ["What products can I offer?", "How must rates be disclosed?", "Target market definition"],
            'Financial Projections': ["How many years of projections?", "What financial statements are needed?", "Proving source of funds"],
            'Growth & Development': ["What goes in the growth plan?", "Is a branch rollout plan needed?", "What market analysis is expected?"],
            'Compliance Declaration': ["What am I declaring here?", "Who signs the declaration?", "What if information is inaccurate?"],
            'Documents Upload': ["What bank statements are needed?", "Are audited financials required?", "Why was my document flagged?"],
            'Application Review': ["Is my application complete?", "What happens after submission?", "How long does review take?"],
        };
        return stageSuggestions[stage] || INITIAL_SUGGESTIONS;
    };

    const buildHistory = () => {
        return messages
            .filter(m => !m.isWelcome && !m.isHint && m.role !== 'system')
            .slice(-10) // Keep last 10 messages for context window
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content,
            }));
    };

    const sendMessage = async (messageText = null) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        setInput('');
        setSuggestions([]);

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const payload = {
                message: text,
                companyId: companyId ? companyId.toString() : null,
                currentStage: currentStage || null,
                currentStageName: stageName || null,
                institutionName: institutionName || null,
                history: buildHistory(),
            };

            const response = await axios.post(AI_SERVICE_URL, payload, {
                timeout: 30000,
            });

            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.data.reply,
                citations: response.data.citations || [],
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMsg]);

            if (response.data.suggestions && response.data.suggestions.length > 0) {
                setSuggestions(response.data.suggestions);
            } else {
                setSuggestions(getStageSuggestions(currentStage));
            }

            if (!isOpen) {
                setHasUnread(true);
            }
        } catch (error) {
            console.error('AI Chat error:', error);
            const errorMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment, or contact us at **licensing@rbz.zw** or **+263 242 703000**.",
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMsg]);
            setSuggestions(["Try again", "Contact support", "What documents do I need?"]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        setHasUnread(false);
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    const clearChat = () => {
        if (window.confirm('Clear conversation history?')) {
            setMessages([WELCOME_MESSAGE]);
            setSuggestions(INITIAL_SUGGESTIONS);
        }
    };

    // FAB button when closed
    if (!isOpen) {
        return (
            <div className="ai-chatbot-fab-container">
                {hasUnread && <div className="ai-unread-badge">1</div>}
                <div className="ai-fab-tooltip">
                    <span>Licensing guidance</span>
                    <div className="ai-fab-tooltip-arrow"></div>
                </div>
                <button
                    className="ai-fab-btn"
                    onClick={handleOpen}
                    title="Open the RBZ Licensing Assistant"
                    id="ai-chatbot-fab-button"
                >
                    <img src="/rbz-logo.png" alt="RBZ" className="ai-fab-logo" />
                </button>
            </div>
        );
    }

    return (
        <div className={`ai-chatbot-window ${isMinimized ? 'minimized' : ''}`} id="ai-chatbot-window">
            {/* Header */}
            <div className="ai-chat-header">
                <div className="ai-header-left">
                    <div className="ai-avatar">
                        <img src="/rbz-logo.png" alt="RBZ" className="ai-avatar-img" />
                        <span className="ai-online-dot"></span>
                    </div>
                    <div className="ai-header-info">
                        <span className="ai-header-name">RBZ Licensing Assistant</span>
                        <span className="ai-header-sub">
                            {isLoading ? (
                                <span className="ai-header-typing">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    typing...
                                </span>
                            ) : currentStage ? `Stage ${currentStage} · Online` : 'Licensing Guide · Online'}
                        </span>
                    </div>
                </div>
                <div className="ai-header-actions">
                    <button className="ai-icon-btn" onClick={clearChat} title="Clear chat">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                    </button>
                    <button className="ai-icon-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? 'Expand' : 'Minimize'}>
                        {isMinimized ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        )}
                    </button>
                    <button className="ai-icon-btn ai-close-btn" onClick={() => setIsOpen(false)} title="Close">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Context Banner */}
            {!isMinimized && stageName && (
                <div className="ai-context-banner">
                    {currentStage && <span className="ai-context-stage">Stage {currentStage}</span>}
                    <span className="ai-context-text">{stageName}</span>
                    {institutionName && <span className="ai-context-institution">· {institutionName}</span>}
                </div>
            )}

            {/* Messages */}
            {!isMinimized && (
                <div className="ai-messages-container">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`ai-message-wrapper ${msg.role === 'user' ? 'user-side' : 'ai-side'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="ai-msg-avatar">
                                    <img src="/rbz-logo.png" alt="RBZ" />
                                </div>
                            )}
                            <div className={`ai-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble-bot'} ${msg.isError ? 'error-bubble' : ''} ${msg.isHint ? 'hint-bubble' : ''}`}>
                                <div
                                    className="ai-bubble-content"
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                />
                                {msg.citations?.length > 0 && (
                                    <div className="ai-citation-list">
                                        <span className="ai-citation-label">Official sources</span>
                                        {msg.citations.map((citation) => (
                                            <a
                                                className="ai-citation-card"
                                                href={citation.documentUrl}
                                                key={citation.documentId + '-' + citation.page}
                                                rel="noreferrer"
                                                target="_blank"
                                            >
                                                <strong>{citation.title} · {citation.section ? `Section ${citation.section} · ` : ''}p. {citation.page}</strong>
                                                <span>“{citation.quote}”</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <div className="ai-bubble-time">
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                        <div className="ai-message-wrapper ai-side">
                            <div className="ai-msg-avatar">
                                <img src="/rbz-logo.png" alt="RBZ" />
                            </div>
                            <div className="ai-bubble ai-bubble-bot typing-indicator-bubble">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Quick Suggestions */}
            {!isMinimized && suggestions.length > 0 && !isLoading && (
                <div className="ai-suggestions-bar">
                    {suggestions.slice(0, 3).map((s, i) => (
                        <button
                            key={i}
                            className="ai-suggestion-chip"
                            onClick={() => handleSuggestionClick(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            {!isMinimized && (
                <div className="ai-input-area">
                    <div className="ai-input-wrapper">
                        <textarea
                            ref={inputRef}
                            className="ai-input"
                            placeholder="Ask about stages, documents or requirements..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isLoading}
                            id="ai-chatbot-input"
                        />
                        <button
                            className={`ai-send-btn ${input.trim() ? 'active' : ''}`}
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            id="ai-chatbot-send-button"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="ai-input-hint">
                        Automated guidance only — not regulatory advice · Enter to send
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
