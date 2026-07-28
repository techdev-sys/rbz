import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Form, Badge, CloseButton, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = '/api/chat';
const OPEN_POLL_MS = 3000;      // refresh cadence while the panel is open
const CLOSED_POLL_MS = 20000;   // light unread check while the bubble is closed

/**
 * ApplicationChat — applicant ↔ examiner messaging for one application.
 * Persisted server-side; identity and access are enforced by the backend.
 *
 * Shows an unread-count badge on the closed bubble. "Last read" is tracked
 * per user+application in localStorage.
 */
const ApplicationChat = ({ companyId, currentUserRole, userName, bottomOffset = 20, side = 'right' }) => {
    const sideStyle = side === 'left' ? { left: '20px' } : { right: '20px' };
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendError, setSendError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const isOpenRef = useRef(false);
    isOpenRef.current = isOpen;

    const lastReadKey = `chatLastRead_${currentUserRole}_${companyId}`;

    const isFromOtherSide = useCallback((msg) => {
        if (msg.senderRole === 'SYSTEM') return false;
        return currentUserRole === 'examiner'
            ? msg.senderRole !== 'EXAMINER'
            : msg.senderRole === 'EXAMINER';
    }, [currentUserRole]);

    const markAllRead = useCallback(() => {
        localStorage.setItem(lastReadKey, new Date().toISOString());
        setUnreadCount(0);
    }, [lastReadKey]);

    const computeUnread = useCallback((msgs) => {
        const lastRead = localStorage.getItem(lastReadKey);
        const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
        return msgs.filter(
            (m) => isFromOtherSide(m) && m.timestamp && new Date(m.timestamp).getTime() > lastReadTime
        ).length;
    }, [lastReadKey, isFromOtherSide]);

    const loadMessages = useCallback(async () => {
        if (!companyId) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/${companyId}`);
            const msgs = response.data || [];
            setMessages(msgs);
            if (isOpenRef.current) {
                // Reading the thread — everything is seen.
                localStorage.setItem(lastReadKey, new Date().toISOString());
                setUnreadCount(0);
            } else {
                setUnreadCount(computeUnread(msgs));
            }
        } catch (error) {
            console.error('Error loading chat', error);
        }
    }, [companyId, computeUnread, lastReadKey]);

    // Poll: fast while open, slow unread-check while closed.
    useEffect(() => {
        if (!companyId) return;
        loadMessages();
        const interval = setInterval(loadMessages, isOpen ? OPEN_POLL_MS : CLOSED_POLL_MS);
        return () => clearInterval(interval);
    }, [isOpen, companyId, loadMessages]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        markAllRead();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content) return;
        setSendError(null);

        // Optimistic render; the poll replaces it with the server row.
        const tempMsg = {
            id: `temp-${Date.now()}`,
            companyId: parseInt(companyId),
            senderRole: currentUserRole === 'examiner' ? 'EXAMINER' : 'APPLICANT',
            senderName: userName || (currentUserRole === 'examiner' ? 'Bank Examiner' : 'Applicant'),
            content,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, tempMsg]);
        setNewMessage('');

        try {
            await axios.post(`${API_BASE_URL}/send`, { companyId: parseInt(companyId), content });
            loadMessages();
        } catch (error) {
            console.error('Error sending message', error);
            setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
            setNewMessage(content); // give the text back so nothing is lost
            const serverMsg = typeof error?.response?.data === 'string' ? error.response.data : null;
            setSendError(serverMsg || 'The message could not be sent. Please check your connection and try again.');
        }
    };

    const dayLabel = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (!companyId) return null;

    if (!isOpen) {
        return (
            <div style={{ position: 'fixed', bottom: `${bottomOffset}px`, ...sideStyle, zIndex: 9999 }}>
                <Button
                    variant="primary"
                    className="rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px', backgroundColor: '#003366', borderColor: '#003366', padding: 0, overflow: 'visible', position: 'relative' }}
                    onClick={handleOpen}
                    aria-label={unreadCount > 0 ? `Open secure chat — ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'Open secure chat'}
                >
                    <img src="/rbz-logo.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }} />
                    {unreadCount > 0 && (
                        <span
                            style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                background: '#dc3545', color: 'white', borderRadius: '50%',
                                minWidth: '22px', height: '22px', fontSize: '0.72rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid white', padding: '0 4px',
                            }}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </div>
        );
    }

    let lastDay = null;

    return (
        <Card
            className="shadow-lg border-0"
            style={{
                position: 'fixed', bottom: `${bottomOffset}px`, ...sideStyle, width: '350px', height: '500px', zIndex: 9999,
                display: 'flex', flexDirection: 'column'
            }}
        >
            <Card.Header className="text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#003366' }}>
                <div className="d-flex align-items-center gap-2">
                    <img src="/rbz-logo.png" alt="RBZ Logo" style={{ width: '25px', height: '25px', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }} />
                    <strong className="me-2">RBZ Secure Chat</strong>
                    <Badge bg="success" className="sml-dot">● Online</Badge>
                </div>
                <CloseButton variant="white" onClick={() => { markAllRead(); setIsOpen(false); }} />
            </Card.Header>
            <Card.Body style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                <div className="text-center small text-muted mb-3">
                    Messages are visible to the applicant and the assigned RBZ examination team.
                </div>
                {messages.length === 0 && (
                    <div className="text-center small text-muted py-4">
                        No messages yet. {currentUserRole === 'examiner'
                            ? 'Use this channel to request clarifications from the applicant.'
                            : 'Use this channel to reach the examination team about your application.'}
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = (currentUserRole === 'examiner' && msg.senderRole === 'EXAMINER') ||
                        (currentUserRole !== 'examiner' && msg.senderRole !== 'EXAMINER' && msg.senderRole !== 'SYSTEM');

                    const msgDay = msg.timestamp ? new Date(msg.timestamp).toDateString() : null;
                    const showDay = msgDay && msgDay !== lastDay;
                    if (msgDay) lastDay = msgDay;

                    return (
                        <React.Fragment key={msg.id || index}>
                            {showDay && (
                                <div className="text-center my-2">
                                    <span className="small text-muted" style={{ background: '#eceff1', borderRadius: '10px', padding: '2px 10px', fontSize: '0.68rem' }}>
                                        {dayLabel(msg.timestamp)}
                                    </span>
                                </div>
                            )}
                            <div className={`d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                                <div
                                    className={`p-2 rounded shadow-sm ${msg.senderRole === 'SYSTEM' ? 'bg-secondary text-white small text-center w-100' :
                                        isMe ? 'bg-primary text-white' : 'bg-white border'
                                        }`}
                                    style={{ maxWidth: '85%' }}
                                >
                                    {!isMe && msg.senderRole !== 'SYSTEM' && (
                                        <div className="small fw-bold mb-1">{msg.senderName}</div>
                                    )}
                                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                                </div>
                                {msg.senderRole !== 'SYSTEM' && (
                                    <small className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                    </small>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </Card.Body>
            <Card.Footer className="bg-white">
                {sendError && (
                    <Alert variant="danger" className="py-1 px-2 mb-2 small" dismissible onClose={() => setSendError(null)}>
                        {sendError}
                    </Alert>
                )}
                <Form onSubmit={handleSend} className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        maxLength={4000}
                        autoFocus
                    />
                    <Button type="submit" variant="primary" style={{ backgroundColor: '#003366' }} aria-label="Send message">
                        ➤
                    </Button>
                </Form>
            </Card.Footer>
        </Card>
    );
};

export default ApplicationChat;
