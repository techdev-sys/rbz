import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ stages, currentStep, onStepChange, completedStages = new Set(), progress }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`rbz-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Sidebar Header */}
            <div className="rbz-sidebar-header">
                {!isCollapsed && (
                    <div className="rbz-sidebar-brand">
                        <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="rbz-sidebar-logo" />
                        <div className="rbz-brand-text">
                            <h5 className="mb-0">Reserve Bank of Zimbabwe</h5>
                            <small>Institution Licensing</small>
                        </div>
                    </div>
                )}
                <button
                    className="rbz-sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? '→' : '←'}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="rbz-sidebar-nav">
                <div className="rbz-nav-section">
                    {!isCollapsed && (
                        <div className="rbz-nav-section-title">Application Stages</div>
                    )}
                    <ul className="rbz-nav-list">
                        {stages.map((stage) => {
                            const isComplete = completedStages.has(stage.id);
                            const isCurrent = stage.id === currentStep;
                            const isDisabled = !stage.component;

                            return (
                                <li key={stage.id} className="rbz-nav-item">
                                    <button
                                        className={`rbz-nav-link ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}
                                        onClick={() => !isDisabled && onStepChange(stage.id)}
                                        disabled={isDisabled}
                                        title={isCollapsed ? stage.name : ''}
                                    >
                                        <div className="rbz-nav-icon">
                                            {isComplete ? '✓' : stage.id}
                                        </div>
                                        {!isCollapsed && (
                                            <div className="rbz-nav-content">
                                                <div className="rbz-nav-title">{stage.name}</div>
                                                {isCurrent && (
                                                    <div className="rbz-nav-status">In Progress</div>
                                                )}
                                                {isComplete && (
                                                    <div className="rbz-nav-status complete">Completed</div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            {/* Sidebar Footer */}
            {!isCollapsed && (
                <div className="rbz-sidebar-footer">
                    <div className="rbz-progress-summary">
                        <div className="rbz-progress-text">
                            <strong>{Math.round(progress)}%</strong> Complete
                        </div>
                        <div className="rbz-progress-bar-mini">
                            <div
                                className="rbz-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <small className="text-muted">
                            {completedStages.size} of {stages.length} stages completed
                        </small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
