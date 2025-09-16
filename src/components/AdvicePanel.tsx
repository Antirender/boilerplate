import React from 'react';

interface AdvicePanelProps {
  badges: string[];
  text: string;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ badges, text }) => {
  // Hide panel when there's no advice
  if (badges.length === 0 && !text) {
    return null;
  }

  return (
    <div className="advice-panel" role="complementary" aria-labelledby="advice-panel-heading">
      <div className="advice-panel-header">
        <h3 id="advice-panel-heading" className="advice-panel-title">
          <span className="advice-panel-icon" aria-hidden="true">💡</span>
          Weather Guidance
        </h3>
      </div>

      <div className="advice-panel-content">
        {badges.length > 0 && (
          <div className="advice-badges" role="group" aria-label="Weather recommendations">
            {badges.map((badge, index) => (
              <span 
                key={index} 
                className="advice-chip" 
                role="button" 
                tabIndex={0}
                aria-label={`Weather recommendation: ${badge}`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {text && (
          <p className="advice-summary" aria-label="Weather summary">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdvicePanel;
