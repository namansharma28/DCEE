import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { 
  Copy, 
  Edit3, 
  ExternalLink, 
  Eye, 
  Calendar, 
  User, 
  Tag,
  FileText,
  FolderOpen
} from 'lucide-react';

const ShareView = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const [share, setShare] = useState(null);
  const [shareType, setShareType] = useState('code'); // 'code' or 'project'
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShare();
  }, [shareId]);

  const fetchShare = async () => {
    try {
      const response = await fetch(`/api/share/${shareId}`);
      const data = await response.json();

      if (data.success) {
        setShare(data.share);
        setShareType(data.type || 'code');
        
        // If it's a project share, select the main file or first file
        if (data.type === 'project' && data.share.files && data.share.files.length > 0) {
          const mainFile = data.share.files.find(f => f.id === data.share.main_file) || data.share.files[0];
          setSelectedFile(mainFile);
        }
      } else {
        setError(data.message || 'Share not found');
      }
    } catch (err) {
      setError('Failed to load shared content');
    } finally {
      setLoading(false);
    }
  };

  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'cpp': return 'cpp';
      case 'python': return 'python';
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      default: return 'plaintext';
    }
  };

  const handleCopyCode = async () => {
    try {
      let codeToCopy = '';
      
      if (shareType === 'project' && selectedFile) {
        codeToCopy = selectedFile.content;
      } else {
        codeToCopy = share.code;
      }
      
      await navigator.clipboard.writeText(codeToCopy);
      alert('Code copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareType === 'project' && selectedFile ? selectedFile.content : share.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Code copied to clipboard!');
    }
  };

  const handleOpenProject = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to open this project');
      navigate('/login');
      return;
    }

    try {
      // Create a new project from the shared project
      const response = await fetch('/api/project/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: `${share.title} (Copy)`,
          description: share.description || `Copied from shared project`,
          language: share.language,
          is_public: false,
          tags: share.tags || []
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const projectId = data.project.id;
        
        // Update the project with all files from the shared project
        const updateResponse = await fetch(`/api/project/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            name: `${share.title} (Copy)`,
            description: share.description || `Copied from shared project`,
            is_public: false,
            tags: share.tags || [],
            files: share.files
          })
        });

        const updateData = await updateResponse.json();
        
        if (updateData.success) {
          // Navigate to the new project
          navigate(`/project/${projectId}`);
        } else {
          alert('Failed to copy project files: ' + updateData.error);
        }
      } else {
        alert('Failed to create project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      alert('Failed to open project');
    }
  };

  const editorOptions = {
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    theme: 'vs-dark',
    mouseWheelZoom: false,
    contextmenu: false,
    selectOnLineNumbers: true,
    glyphMargin: false,
    folding: true,
    quickSuggestions: false,
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    wordBasedSuggestions: false,
    accessibilitySupport: 'off'
  };

  if (loading) {
    return (
      <>
        <Header user={user} />
        <div className="share-view">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading shared code...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header user={user} />
        <div className="share-view">
          <div className="container">
            <div className="error-container">
              <div className="error-icon">❌</div>
              <h2>Share Not Found</h2>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} />
      <div className="share-view">
        <div className="container">
          {/* Share Header */}
          <div className="share-header">
            <div className="share-info">
              <h1 className="share-title">
                {share.title || `${share.language} Code`}
              </h1>
              {share.description && (
                <p className="share-description">{share.description}</p>
              )}
              <div className="share-meta">
                <span className="meta-item">
                  <Tag size={14} />
                  <span className="meta-label">Language:</span>
                  <span className="language-badge">{share.language}</span>
                </span>
                {share.author_name && (
                  <span className="meta-item">
                    <User size={14} />
                    <span className="meta-label">By:</span>
                    <span className="author-name">{share.author_name}</span>
                  </span>
                )}
                <span className="meta-item">
                  <Eye size={14} />
                  <span className="meta-label">Views:</span>
                  <span className="view-count">{share.view_count}</span>
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  <span className="meta-label">Shared:</span>
                  <span className="share-date">
                    {new Date(share.created_at).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="share-actions">
              {shareType === 'project' ? (
                <button className="btn btn-primary" onClick={handleOpenProject}>
                  <FolderOpen size={16} />
                  Open Project
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={handleCopyCode}>
                    <Copy size={16} />
                    Copy Code
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    localStorage.setItem('shared_code', JSON.stringify({
                      code: share.code,
                      language: share.language,
                      title: share.title
                    }));
                    navigate('/editor');
                  }}>
                    <Edit3 size={16} />
                    Open in Editor
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Code Display */}
          {shareType === 'project' && share.files ? (
            <div className="project-share-container">
              {/* File Sidebar for Projects */}
              <div className="project-files-sidebar">
                <div className="sidebar-header">
                  <FolderOpen size={16} />
                  <h3>Project Files</h3>
                </div>
                <div className="file-list">
                  {share.files.map((file) => (
                    <div 
                      key={file.id}
                      className={`file-item ${selectedFile?.id === file.id ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <FileText size={14} />
                      <span className="file-name">{file.name}</span>
                      {file.id === share.main_file && (
                        <span className="main-badge">main</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Code Editor for Selected File */}
              <div className="project-code-container">
                {selectedFile ? (
                  <>
                    <div className="code-header">
                      <span className="code-title">{selectedFile.name}</span>
                      <span className="code-language">{selectedFile.language}</span>
                    </div>
                    <div className="code-editor-container">
                      <Editor
                        height="500px"
                        language={getMonacoLanguage(selectedFile.language)}
                        value={selectedFile.content}
                        options={editorOptions}
                        theme="vs-dark"
                      />
                    </div>
                  </>
                ) : (
                  <div className="no-file-selected">
                    <FileText size={48} />
                    <h3>Select a file to view</h3>
                    <p>Choose a file from the sidebar to see its contents</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="share-code-container">
              <div className="code-header">
                <span className="code-title">Code</span>
                <span className="code-language">{share.language}</span>
              </div>
              <div className="code-editor-container">
                <Editor
                  height="500px"
                  language={getMonacoLanguage(share.language)}
                  value={share.code}
                  options={editorOptions}
                  theme="vs-dark"
                />
              </div>
            </div>
          )}

          {/* Execution Result */}
          {share.has_result && share.result && (
            <div className="share-result-container">
              <div className="result-header">
                <span className="result-title">Execution Result</span>
                <span className={`result-status ${share.result.status}`}>
                  {share.result.status}
                </span>
              </div>
              <div className="result-content">
                <pre className="result-output">{share.result.output || share.result.error}</pre>
                {share.result.execution_time && (
                  <div className="result-meta">
                    Execution time: {(share.result.execution_time / 1e9).toFixed(2)}s
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {share.tags && share.tags.length > 0 && (
            <div className="share-tags">
              <span className="tags-label">Tags:</span>
              {share.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShareView;
