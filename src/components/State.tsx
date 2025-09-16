// State components for loading, error, and empty states
// 加载、错误和空状态组件

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading..."
}) => (
  <div className="state-container loading-state">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry
}) => (
  <div className="state-container error-state">
    <div className="error-icon">⚠️</div>
    <h3>Something went wrong</h3>
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="retry-button">
        Try Again
      </button>
    )}
  </div>
);

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction
}) => (
  <div className="state-container empty-state">
    <div className="empty-icon">🌤️</div>
    <h3>{title}</h3>
    <p>{message}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="action-button">
        {actionLabel}
      </button>
    )}
  </div>
);
