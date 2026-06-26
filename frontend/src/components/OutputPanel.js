import React from 'react';

const OutputPanel = ({ output, stderr, status, executionTime, isRunning }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'running': return '○';
      default: return '○';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'running': return 'Running';
      default: return 'Ready';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      case 'running': return 'status-running';
      default: return 'status-ready';
    }
  };

  return (
    <div className="output-panel">
      <div className="output-header">
        <div className="output-title">
          <span>Output</span>
        </div>
        
        <div className="output-status">
          <span className={`status-indicator ${getStatusClass()}`}>
            <span className={isRunning ? 'loading' : ''}>{getStatusIcon()}</span>
            {getStatusText()}
          </span>
          
          {executionTime && (
            <span className="execution-time">
              {executionTime}s
            </span>
          )}
        </div>
      </div>
      
      <div className="output-content">
        {output || stderr ? (
          <>
            {output && <pre className="output-text">{output}</pre>}
            {stderr && (
              <div className="output-error-wrapper">
                <div className="output-error-header">Standard Error (stderr):</div>
                <pre className="output-error-text">{stderr}</pre>
              </div>
            )}
          </>
        ) : (
          <div className="output-placeholder">
            <div className="placeholder-icon">▸</div>
            <div className="placeholder-text">
              Click "Run Code" to see the output
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
