import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, Badge, CloseButton } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/chat';

/**
 * ApplicationChat - Real-time collaboration tool
 * Connects to RBZ Backend for persistence and AI Learning
 */
const ApplicationChat = ({ companyId, currentUserRole, userName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && companyId) {
            loadMessages();
            const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, companyId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${companyId}`);
            setMessages(response.data);
        } catch (error) {
            console.error("Error loading chat", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const payload = {
            companyId: parseInt(companyId),
            senderRole: currentUserRole === 'examiner' ? 'EXAMINER' : 'APPLICANT',
            senderName: userName || (currentUserRole === 'examiner' ? 'Bank Examiner' : 'Applicant'),
            content: newMessage
        };

        try {
            // Optimistic update
            const tempMsg = { ...payload, timestamp: new Date(), id: Date.now() }; // Temp ID
            setMessages([...messages, tempMsg]);
            setNewMessage('');

            await axios.post(`${API_BASE_URL}/send`, payload);
            loadMessages(); // Sync with server for real ID/Timestamp
        } catch (error) {
            console.error("Error sending message", error);
            alert("Failed to send message. System may be offline.");
        }
    };

    if (!isOpen) {
        return (
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
                <Button
                    variant="primary"
                    className="rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px', backgroundColor: '#003366', borderColor: '#003366', padding: 0, overflow: 'hidden' }}
                    onClick={() => setIsOpen(true)}
                >
                    <img src="/rbz-logo.png" alt="RBZ Agent" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }} />
                </Button>
            </div>
        );
    }

    return (
        <Card
            className="shadow-lg border-0"
            style={{
                position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px', zIndex: 9999,
                display: 'flex', flexDirection: 'column'
            }}
        >
            <Card.Header className="text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#003366' }}>
                <div className="d-flex align-items-center gap-2">
                    <img src="/rbz-logo.png" alt="RBZ Logo" style={{ width: '25px', height: '25px', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }} />
                    <strong className="me-2">RBZ Secure Chat</strong>
                    <Badge bg="success" className="sml-dot">● Online</Badge>
                </div>
                <CloseButton variant="white" onClick={() => setIsOpen(false)} />
            </Card.Header>
            <Card.Body style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                <div className="text-center small text-muted mb-3">
                    Channel Secure & Encrypted by RBZ System
                </div>
                {messages.map((msg, index) => {
                    const isMe = (currentUserRole === 'examiner' && msg.senderRole === 'EXAMINER') ||
                        (currentUserRole !== 'examiner' && msg.senderRole !== 'EXAMINER' && msg.senderRole !== 'SYSTEM');

                    return (
                        <div
                            key={msg.id || index}
                            className={`d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`}
                        >
                            <div
                                className={`p-2 rounded shadow-sm ${msg.senderRole === 'SYSTEM' ? 'bg-secondary text-white small text-center w-100' :
                                    isMe ? 'bg-primary text-white' : 'bg-white border'
                                    }`}
                                style={{ maxWidth: '85%' }}
                            >
                                {!isMe && msg.senderRole !== 'SYSTEM' && (
                                    <div className="small fw-bold mb-1">{msg.senderName}</div>
                                )}
                                <div>{msg.content}</div>
                            </div>
                            {msg.senderRole !== 'SYSTEM' && (
                                <small className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                </small>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </Card.Body>
            <Card.Footer className="bg-white">
                <Form onSubmit={handleSend} className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" variant="primary" style={{ backgroundColor: '#003366' }}>
                        ➤
                    </Button>
                </Form>
            </Card.Footer>
        </Card>
    );
};

export default ApplicationChat;
