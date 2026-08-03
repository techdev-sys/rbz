import React, { useState } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { authenticateUser, friendlyError } from '../services/api';

const LoginSelection = ({ onSelectRole }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const persistStaffSession = (data, role) => {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userRole', role);
        if (data.fullName) localStorage.setItem('examinerUsername', data.fullName);
        if (data.employeeId) localStorage.setItem('examinerEmployeeId', data.employeeId);
        if (data.designation) localStorage.setItem('examinerDesignation', data.designation);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password) {
            setError('Username and password are required.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await authenticateUser('examiner', username.trim(), password);
            const data = response.data;
            if (!data?.token) {
                setError('Authentication failed. Please try again.');
                return;
            }
            // The account itself determines seniority — there is no role picker.
            const actualRole = data.role === 'SENIOR_BE' || data.role === 'SENIOR_EXAMINER'
                ? 'senior_be'
                : 'examiner';
            persistStaffSession(data, actualRole);
            onSelectRole(actualRole);
        } catch (err) {
            setError(friendlyError(err, 'Sign in failed. Please verify your details and try again.'));
        } finally {
            setLoading(false);
        }
    };

    const baseTextStyle = { fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" };

    return (
        <div style={{
            minHeight: '100vh',
            background:
                'radial-gradient(circle at 80% 10%, rgba(184,150,110,0.12) 0%, transparent 50%),' +
                'radial-gradient(circle at 10% 90%, rgba(26,82,118,0.30) 0%, transparent 50%),' +
                'linear-gradient(160deg, #000d1a 0%, #001a33 50%, #000a17 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            ...baseTextStyle
        }}>
            <div style={{
                background: 'rgba(220, 38, 38, 0.10)',
                border: '1px solid rgba(220, 38, 38, 0.40)',
                borderRadius: '4px',
                padding: '8px 18px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px #ef4444',
                    animation: 'pulse 2s ease-in-out infinite'
                }} />
                <span style={{
                    color: '#fca5a5',
                    fontSize: '0.7rem',
                    letterSpacing: '1.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                }}>
                    Restricted &middot; Authorised Personnel Only
                </span>
            </div>

            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '440px',
                overflow: 'hidden',
                boxShadow: '0 30px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.02)',
            }}>
                {/* Header */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '32px 36px 24px',
                    textAlign: 'center',
                }}>
                    <img
                        src="/rbz-logo.png"
                        alt="Reserve Bank of Zimbabwe"
                        style={{
                            height: '60px',
                            background: 'white',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            marginBottom: '18px'
                        }}
                    />
                    <div style={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        letterSpacing: '0.2px'
                    }}>
                        Reserve Bank of Zimbabwe
                    </div>
                    <div style={{
                        color: 'rgba(184,150,110,0.95)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '1.2px',
                        marginTop: '6px',
                        textTransform: 'uppercase'
                    }}>
                        Bank Supervision &middot; Surveillance &middot; Financial Stability
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <span style={{
                            background: 'rgba(184,150,110,0.10)',
                            border: '1px solid rgba(184,150,110,0.30)',
                            color: '#B8966E',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            padding: '4px 14px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                        }}>
                            Bank Examiner Portal
                        </span>
                    </div>
                </div>

                {/* Form */}
                <div style={{ padding: '32px 36px 36px' }}>
                    {error && (
                        <Alert
                            variant="danger"
                            dismissible
                            onClose={() => setError(null)}
                            style={{
                                fontSize: '0.82rem',
                                background: 'rgba(220, 38, 38, 0.12)',
                                border: '1px solid rgba(220, 38, 38, 0.30)',
                                color: '#fca5a5',
                                borderRadius: '6px',
                                padding: '10px 14px'
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit} noValidate>
                        {/* Username */}
                        <Form.Group className="mb-3">
                            <Form.Label style={{
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1.2px',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontWeight: 700
                            }}>
                                RBZ Email Address
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. s.chinogara@rbz.co.zw"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoFocus
                                autoComplete="username"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    padding: '11px 14px',
                                    borderRadius: '6px',
                                }}
                            />
                        </Form.Group>

                        {/* Password */}
                        <Form.Group className="mb-4">
                            <Form.Label style={{
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1.2px',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontWeight: 700
                            }}>
                                Password
                            </Form.Label>
                            <div style={{ position: 'relative' }}>
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        padding: '11px 50px 11px 14px',
                                        borderRadius: '6px',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontWeight: 700,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </Form.Group>

                        <Button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: loading
                                    ? 'rgba(184,150,110,0.5)'
                                    : 'linear-gradient(135deg, #B8966E 0%, #9A7B3F 100%)',
                                border: 'none',
                                color: '#001a33',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                padding: '12px',
                                borderRadius: '6px',
                                letterSpacing: '0.5px',
                                transition: 'all 0.15s',
                            }}
                        >
                            {loading
                                ? <Spinner size="sm" animation="border" />
                                : 'Sign in to Bank Examiner Portal'}
                        </Button>
                    </Form>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '28px', textAlign: 'center', maxWidth: '440px' }}>
                <div style={{
                    color: 'rgba(255, 255, 255, 0.25)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.3px',
                    lineHeight: 1.6
                }}>
                    This system is for authorised Reserve Bank of Zimbabwe personnel only.
                    Unauthorised access is a criminal offence under the Reserve Bank of Zimbabwe
                    Act [Chapter 22:15] and the Computer Crime and Cybercrime Act [Chapter 9:23].
                    All activity is logged and monitored.
                </div>
                <a
                    href="/"
                    style={{
                        display: 'inline-block',
                        marginTop: '18px',
                        color: 'rgba(255, 255, 255, 0.35)',
                        fontSize: '0.72rem',
                        textDecoration: 'none',
                        fontWeight: 500,
                        letterSpacing: '0.3px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >
                    ← Return to public portal
                </a>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

export default LoginSelection;
