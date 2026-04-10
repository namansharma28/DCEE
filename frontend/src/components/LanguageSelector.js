import React from 'react';
import './LanguageSelector.css';

const LANGUAGES = [
  { value: 'python', label: '🐍 Python' },
  { value: 'cpp', label: '⚡ C++' },
  { value: 'javascript', label: '🟨 JavaScript' },
  { value: 'java', label: '☕ Java' }
];

const LanguageSelector = ({ language, onLanguageChange }) => {
  return (
    <div className="language-selector">
      <label className="language-label">Language:</label>
      <select 
        className="language-select"
        value={language} 
        onChange={(e) => onLanguageChange(e.target.value)}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;