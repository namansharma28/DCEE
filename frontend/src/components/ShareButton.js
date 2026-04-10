import React, { useState } from 'react';
import './ShareButton.css';

const ShareButton = ({ code, language, onShare }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    title: '',
    description: '',
    isPublic: true,
    tags: []
  });

  const handleShare = async () => {
    if (!code.trim()) {
      alert('Please write some code before sharing!');
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch('/api/share/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        },
        body: JSON.stringify({
          title: shareOptions.title || `${language} Code`,
          code: code,
          language: language,
          description: shareOptions.description,
          is_public: shareOptions.isPublic,
          tags: shareOptions.tags
        })
      });

      const data = await response.json();

      if (data.success) {
        const fullShareURL = `${window.location.origin}${data.share_url}`;
        setShareResult({
          shareId: data.share_id,
          shareUrl: fullShareURL,
          message: data.message
        });
        
        if (onShare) {
          onShare(data);
        }
      } else {
        throw new Error(data.error || 'Failed to share code');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share code: ' + error.message);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const handleQuickShare = () => {
    handleShare();
  };

  const handleAdvancedShare = () => {
    setShowModal(true);
  };

  const handleModalShare = () => {
    setShowModal(false);
    handleShare();
  };

  return (
    <>
      <div className="share-button-container">
        <button 
          className="share-btn quick-share"
          onClick={handleQuickShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <span className="share-spinner"></span>
              Sharing...
            </>
          ) : (
            <>
              <span className="share-icon">🔗</span>
              Share
            </>
          )}
        </button>
        
        <button 
          className="share-btn advanced-share"
          onClick={handleAdvancedShare}
          disabled={isSharing}
          title="Advanced sharing options"
        >
          ⚙️
        </button>
      </div>

      {/* Share Result */}
      {shareResult && (
        <div className="share-result">
          <div className="share-success">
            <span className="success-icon">✅</span>
            <span>Code shared successfully!</span>
          </div>
          <div className="share-url-container">
            <input 
              type="text" 
              value={shareResult.shareUrl} 
              readOnly 
              className="share-url-input"
            />
            <button 
              className="copy-btn"
              onClick={() => copyToClipboard(shareResult.shareUrl)}
            >
              Copy
            </button>
          </div>
          <button 
            className="close-result-btn"
            onClick={() => setShareResult(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Advanced Share Modal */}
      {showModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="modal-header">
              <h3>Share Code</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={shareOptions.title}
                  onChange={(e) => setShareOptions({...shareOptions, title: e.target.value})}
                  placeholder={`${language} Code`}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={shareOptions.description}
                  onChange={(e) => setShareOptions({...shareOptions, description: e.target.value})}
                  placeholder="Optional description..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={shareOptions.isPublic}
                    onChange={(e) => setShareOptions({...shareOptions, isPublic: e.target.checked})}
                  />
                  Make this share public
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleModalShare}
                disabled={isSharing}
              >
                {isSharing ? 'Sharing...' : 'Share Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;