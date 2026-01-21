import React, { useState } from 'react';
import './CircularProgress.css';

const CircularProgress = ({ currentStep, totalSteps, stageName, progress }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const strokeDasharray = 2 * Math.PI * 45; // Circumference for radius 45
    const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {/* Floating Circular Progress */}
            <div
                className="rbz-circular-progress-float"
                onClick={toggleExpanded}
                title="View progress details"
            >
                <svg width="80" height="80" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth="8"
                    />

                    {/* Progress Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#goldGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 50 50)"
                        className="rbz-progress-circle"
                    />

                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Percentage Text */}
                <div className="rbz-progress-percentage">
                    {Math.round(progress)}%
                </div>

                {/* Pulse Animation */}
                <div className="rbz-progress-pulse"></div>
            </div>

            {/* Expanded Modal */}
            {isExpanded && (
                <div className="rbz-progress-modal-backdrop" onClick={toggleExpanded}>
                    <div className="rbz-progress-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="rbz-modal-close" onClick={toggleExpanded}>
                            ✕
                        </button>

                        <div className="rbz-modal-content">
                            {/* Large Circular Progress */}
                            <div className="rbz-circular-progress-large">
                                <svg width="200" height="200" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="rgba(200, 159, 86, 0.2)"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="url(#goldGradientLarge)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        transform="rotate(-90 50 50)"
                                        className="rbz-progress-circle-large"
                                    />
                                    <defs>
                                        <linearGradient id="goldGradientLarge" x1="0%" y1="0%" x2="100%">
                                            <stop offset="0%" stopColor="#D4A356" />
                                            <stop offset="100%" stopColor="#B8860B" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="rbz-progress-percentage-large">
                                    <div className="percentage-value">{Math.round(progress)}%</div>
                                    <div className="percentage-label">Complete</div>
                                </div>
                            </div>

                            {/* Progress Details */}
                            <div className="rbz-modal-details">
                                <h3 className="rbz-modal-title">Application Progress</h3>

                                <div className="rbz-current-stage">
                                    <div className="stage-label">Current Stage</div>
                                    <div className="stage-value">
                                        <span className="stage-number">Stage {currentStep}</span>
                                        <span className="stage-name">{stageName}</span>
                                    </div>
                                </div>

                                <div className="rbz-progress-stats">
                                    <div className="stat-item">
                                        <div className="stat-value">{currentStep - 1}</div>
                                        <div className="stat-label">Completed</div>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-item">
                                        <div className="stat-value">1</div>
                                        <div className="stat-label">In Progress</div>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-item">
                                        <div className="stat-value">{totalSteps - currentStep}</div>
                                        <div className="stat-label">Remaining</div>
                                    </div>
                                </div>

                                <div className="rbz-progress-bar-modal">
                                    <div className="progress-bar-track">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <span className="progress-bar-label">
                                                {currentStep} of {totalSteps} stages
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button className="rbz-modal-button" onClick={toggleExpanded}>
                                    Continue Application
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CircularProgress;
