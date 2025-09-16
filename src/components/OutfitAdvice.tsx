import React from 'react';
import { sliceNextHours, generateOutfitAdvice, buildAdvice } from '../logic/rules';
import type { Hour } from '../logic/types';
import type { OutfitAdvice as OutfitAdviceType } from '../logic/rules';

interface OutfitAdviceProps {
  hours: Hour[];
}

const OutfitAdvice: React.FC<OutfitAdviceProps> = ({ hours }) => {
  const { stats, hours: nextHours } = sliceNextHours(hours, 6);
  const advice = generateOutfitAdvice(stats);
  const structuredAdvice = buildAdvice(nextHours);

  if (advice.length === 0) {
    return null;
  }

  const groupedAdvice = advice.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, OutfitAdviceType[]>);

  const categoryTitles = {
    clothing: 'What to Wear',
    accessories: 'Don\'t Forget',
    safety: 'Safety First',
    comfort: 'Comfort Tips'
  };

  const categoryOrder: (keyof typeof categoryTitles)[] = ['clothing', 'accessories', 'safety', 'comfort'];

  return (
    <div className="outfit-advice">
      <div className="outfit-advice-header">
        <h3>
          <span className="advice-icon">👔</span>
          Outfit & Safety Advice
        </h3>
        <p className="advice-subtitle">
          Based on the next 6 hours of weather conditions
        </p>
      </div>

      {/* Structured advice summary */}
      {structuredAdvice && (structuredAdvice.badges.length > 0 || structuredAdvice.text) && (
        <div className="structured-advice-summary">
          {structuredAdvice.badges.length > 0 && (
            <div className="advice-badges">
              {structuredAdvice.badges.map((badge, index) => (
                <span key={index} className="advice-badge">{badge}</span>
              ))}
            </div>
          )}
          {structuredAdvice.text && (
            <p className="advice-summary-text">{structuredAdvice.text}</p>
          )}
        </div>
      )}

      <div className="advice-grid">
        {categoryOrder.map(category => {
          const categoryAdvice = groupedAdvice[category];
          if (!categoryAdvice || categoryAdvice.length === 0) return null;

          return (
            <div key={category} className="advice-category">
              <h4 className="category-title">{categoryTitles[category]}</h4>
              <div className="advice-items">
                {categoryAdvice.map(item => (
                  <div
                    key={item.id}
                    className={`advice-item severity-${item.severity}`}
                    style={{ '--advice-color': item.color } as React.CSSProperties}
                  >
                    <div className="advice-item-header">
                      <span className="advice-item-icon">{item.icon}</span>
                      <span className={`severity-badge severity-${item.severity}`}>
                        {item.severity === 'high' ? 'Important' : 
                         item.severity === 'medium' ? 'Recommended' : 'Tip'}
                      </span>
                    </div>
                    <p className="advice-message">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weather stats summary */}
      <div className="weather-stats-summary">
        <div className="stat-item">
          <span className="stat-icon">🌡️</span>
          <span className="stat-text">
            {Math.round(stats.minApparent)}° - {Math.round(stats.maxApparent)}°
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌧️</span>
          <span className="stat-text">{Math.round(stats.maxPOP)}% chance</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">☀️</span>
          <span className="stat-text">UV {Math.round(stats.maxUV)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">💨</span>
          <span className="stat-text">{Math.round(stats.maxWind)} km/h</span>
        </div>
      </div>
    </div>
  );
};

export default OutfitAdvice;
