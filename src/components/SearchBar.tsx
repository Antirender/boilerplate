// Search bar component for city search
// 城市搜索栏组件

import React, { useState, useEffect, useCallback } from 'react';
import { geocodeCity, GeocodeError } from '../services/geocode';

interface CityResult {
  name: string;
  lat: number;
  lon: number;
}

interface SearchBarProps {
  onResult: (result: CityResult) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onResult,
  onError,
  onLoading,
  placeholder = "Search for a city...",
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 400ms debounce for future use (currently not used for fetching)
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Future use: this could trigger auto-suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      // Could implement auto-suggestions here
      console.log('Debounced query for potential auto-suggestions:', debouncedQuery);
    }
  }, [debouncedQuery]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    onLoading(true);

    try {
      const result = await geocodeCity(query.trim());
      onResult(result);
      onError(''); // Clear any previous errors
    } catch (error) {
      const errorMessage = error instanceof GeocodeError 
        ? error.message 
        : 'Failed to search for location';
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
      onLoading(false);
    }
  }, [query, isSubmitting, onResult, onError, onLoading]);

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        className="search-input"
      />
      <button 
        type="submit" 
        disabled={disabled || !query.trim() || isSubmitting}
        className="search-button"
      >
        {isSubmitting ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};
