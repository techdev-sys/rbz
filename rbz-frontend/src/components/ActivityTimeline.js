import React, { useEffect, useState } from 'react';
import { getActivityTimeline } from '../services/api';

const EVENT_STYLE = {
    DOCUMENT_UPLOADED: { icon: '📤', color: '#1565c0' },
    DOCUMENT_VERDICT:  { icon: '🔎', color: '#7c5a00' },
    STAGE_REVIEW:      { icon: '🛡️', color: '#4a4a8a' },
    CHAT:              { icon: '💬', color: '#1a6b8a' },
    LICENCE:           { icon: '🏛️', color: '#1a5c2e' },
};

const styleFor = (event) => {
    if (event.type === 'DOCUMENT_VERDICT' && event.title?.startsWith('Document rejected')) {
        return { icon: '✗', color: '#8b1a1a' };
    }
    if (event.type === 'STAGE_REVIEW' && event.title?.startsWith('Stage flagged')) {
        return { icon: '⚠', color: '#8b1a1a' };
    }
    if (event.type === 'STAGE_REVIEW' && event.title?.startsWith('Stage approved')) {
        return { icon: '✓', color: '#1a5c2e' };
    }
    return EVENT_STYLE[event.type] || { icon: '•', color: '#666' };
};

const formatWhen = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * ActivityTimeline — one chronological view of everything that has happened
 * on an application: uploads, examiner verdicts, stage reviews, chat, licence.
 * Used on the applicant dashboard and the examiner review screen.
 */
const ActivityTimeline = ({ companyId, maxEvents = 12, compact = false }) => {
    const [events, setEvents] = useState(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!companyId) return;
        let cancelled = false;
        getActivityTimeline(companyId)
            .then((res) => { if (!cancelled) setEvents(res.data?.events || []); })
            .catch(() => { if (!cancelled) setEvents([]); });
        return () => { cancelled = true; };
    }, [companyId]);

    if (!companyId || events === null) return null;
    if (events.length === 0) {
        return (
            <div className="activity-timeline activity-timeline-empty">
                <div className="activity-timeline-title">Application activity</div>
                <div className="activity-empty-mark">01</div>
                <div className="activity-empty-title">Application record established</div>
                <div className="activity-empty-copy">Saved actions, document submissions and RBZ correspondence will appear here.</div>
            </div>
        );
    }

    const visible = expanded ? events : events.slice(0, maxEvents);

    return (
        <div className={`activity-timeline${compact ? ' activity-timeline-compact' : ''}`}>
            <div className="activity-timeline-title">
                Application activity
            </div>
            <div>
                {visible.map((event, i) => {
                    const s = styleFor(event);
                    const isLast = i === visible.length - 1;
                    return (
                        <div key={i} style={{ display: 'flex', gap: 12 }}>
                            {/* Marker + connector */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                    background: `${s.color}14`, border: `1.5px solid ${s.color}55`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', color: s.color,
                                }}>
                                    {s.icon}
                                </div>
                                {!isLast && <div style={{ width: 2, flex: 1, background: '#eceff1', minHeight: 12 }} />}
                            </div>
                            {/* Content */}
                            <div style={{ paddingBottom: isLast ? 0 : 14, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2a2a2a' }}>{event.title}</div>
                                {event.detail && (
                                    <div style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'pre-wrap' }}>{event.detail}</div>
                                )}
                                <div style={{ fontSize: '0.68rem', color: '#a5a5a5', marginTop: 2 }}>
                                    {formatWhen(event.timestamp)}{event.actor ? ` · ${event.actor}` : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {events.length > maxEvents && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        background: 'none', border: 'none', color: '#003366', cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: 600, padding: '6px 0 0', textDecoration: 'underline',
                    }}
                >
                    {expanded ? 'Show less' : `Show all ${events.length} events`}
                </button>
            )}
        </div>
    );
};

export default ActivityTimeline;
