import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <div className="loading-logo">⚡</div>
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
        <p className="loading-msg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
