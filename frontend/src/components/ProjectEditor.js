import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import LoadingSpinner from './LoadingSpinner';
import { executeCode, getResult } from '../services/api';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Plus, 
  FileText, 
  Trash2,
  Share2,
  Folder,
  FolderPlus
} from 'lucide-react';
import './ProjectEditor.css';

const ProjectEditor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, getAuthHeaders } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [status, setStatus] = useState('ready');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    // Don't redirect if still loading auth status
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchProject();
  }, [projectId, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (selectedFile) {
      setCode(selectedFile.content);
      setOutput('');
      setStatus('ready');
      setExecutionTime(null);
    }
  }, [selectedFile]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setProject(data.project);
        // Select the main file or first file by default
        const mainFile = data.project.files.find(f => f.id === data.project.main_file) || data.project.files[0];
        if (mainFile) {
          setSelectedFile(mainFile);
        }
      } else {
        console.error('Failed to fetch project:', data.error);
        navigate('/projects');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setOutput('Error: Please enter some code to execute.');
      setStatus('error');
      return;
    }

    setIsRunning(true);
    setOutput('Executing code...');
    setStatus('running');
    setExecutionTime(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      const response = await executeCode(code, project.language, headers);
      const jobId = response.job_id;

      let attempts = 0;
      const maxAttempts = 30;

      const pollResult = async () => {
        try {
          const result = await getResult(jobId);
          
          if (result.status === 'success') {
            setOutput(result.output || 'Code executed successfully (no output)');
            setStatus('success');
            setExecutionTime((result.execution_time / 1e9).toFixed(2));
          } else if (result.status === 'error') {
            setOutput(result.error || 'Unknown error occurred');
            setStatus('error');
            setExecutionTime(result.execution_time ? (result.execution_time / 1e9).toFixed(2) : null);
          } else {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollResult, 1000);
            } else {
              setOutput('Execution timeout - code took too long to run');
              setStatus('error');
            }
            return;
          }
        } catch (error) {
          if (error.response?.status === 408 || error.response?.status === 404) {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollResult, 1000);
            } else {
              setOutput('Execution timeout - please try again');
              setStatus('error');
            }
          } else {
            setOutput(`Error: ${error.message}`);
            setStatus('error');
          }
        }
      };

      setTimeout(pollResult, 500);

    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      // Update the file content in the project
      const updatedFiles = project.files.map(file => 
        file.id === selectedFile.id 
          ? { ...file, content: code, updated_at: new Date().toISOString() }
          : file
      );

      const updatedProject = {
        ...project,
        files: updatedFiles,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          is_public: project.is_public,
          tags: project.tags,
          files: updatedFiles
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setProject(updatedProject);
        setSelectedFile({ ...selectedFile, content: code });
        // Show success feedback
        console.log('File saved successfully');
      } else {
        console.error('Failed to save file:', data.error);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    // Determine the file path based on selected folder
    let filePath = newFileName;
    if (selectedFolder) {
      filePath = `${selectedFolder}/${newFileName}`;
    }

    const newFile = {
      id: Date.now().toString(),
      name: newFileName,
      path: filePath,
      content: '',
      language: getFileLanguage(newFileName),
      size: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedFiles = [...project.files, newFile];
    
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          is_public: project.is_public,
          tags: project.tags,
          files: updatedFiles
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setProject({ ...project, files: updatedFiles });
        setSelectedFile(newFile);
        setShowNewFileModal(false);
        setNewFileName('');
        setSelectedFolder(null);
      } else {
        console.error('Failed to create file:', data.error);
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    // Determine the folder path based on selected folder
    let folderPath = newFolderName;
    if (selectedFolder) {
      folderPath = `${selectedFolder}/${newFolderName}`;
    }

    // Create a placeholder file to represent the folder
    const folderFile = {
      id: `folder_${Date.now()}`,
      name: '.folder',
      path: `${folderPath}/.folder`,
      content: '',
      language: 'plaintext',
      size: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedFiles = [...project.files, folderFile];
    
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          is_public: project.is_public,
          tags: project.tags,
          files: updatedFiles
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setProject({ ...project, files: updatedFiles });
        setShowNewFolderModal(false);
        setNewFolderName('');
      } else {
        console.error('Failed to create folder:', data.error);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleShareProject = async () => {
    try {
      const response = await fetch('/api/share/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          project_id: projectId,
          title: project.name,
          description: project.description,
          is_public: true,
          tags: project.tags || []
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const shareUrl = `${window.location.origin}/share/${data.share_id}`;
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert(`Project shared successfully! Link copied to clipboard:\n${shareUrl}`);
        } catch (err) {
          alert(`Project shared successfully! Share link:\n${shareUrl}`);
        }
      } else {
        alert('Failed to share project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to share project:', error);
      alert('Failed to share project');
    }
  };

  const getFileLanguage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'cpp': case 'cc': case 'cxx': return 'cpp';
      case 'java': return 'java';
      case 'h': case 'hpp': return 'cpp';
      default: return project?.language || 'plaintext';
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return '🐍';
      case 'js': return '🟨';
      case 'cpp': case 'cc': case 'cxx': case 'h': case 'hpp': return '⚡';
      case 'java': return '☕';
      case 'md': return '📝';
      case 'txt': return '📄';
      default: return <FileText size={16} />;
    }
  };

  // Organize files into folder structure
  const organizeFiles = () => {
    const structure = {};
    
    project.files.forEach(file => {
      if (file.name === '.folder') return; // Skip folder placeholder files
      
      const parts = file.path.split('/');
      if (parts.length === 1) {
        // Root level file
        if (!structure['_root']) structure['_root'] = [];
        structure['_root'].push(file);
      } else {
        // File in folder
        const folder = parts.slice(0, -1).join('/');
        if (!structure[folder]) structure[folder] = [];
        structure[folder].push(file);
      }
    });
    
    return structure;
  };

  const getFolders = () => {
    const folders = new Set();
    project.files.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        // Add all parent folders
        for (let i = 1; i < parts.length; i++) {
          folders.add(parts.slice(0, i).join('/'));
        }
      }
    });
    return Array.from(folders).sort();
  };

  if (loading) {
    return (
      <>
        <Header user={user} />
        <div className="project-editor">
          <div className="container">
            <LoadingSpinner />
          </div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header user={user} />
        <div className="project-editor">
          <div className="container">
            <div className="error-message">
              <h2>Project not found</h2>
              <p>The project you're looking for doesn't exist or you don't have access to it.</p>
              <button className="btn btn-primary" onClick={() => navigate('/projects')}>
                Back to Projects
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
      <div className="project-editor">
        <div className="container">
          {/* Project Header */}
          <div className="project-header">
            <div className="project-info">
              <button 
                className="back-button"
                onClick={() => navigate('/projects')}
              >
                <ArrowLeft size={16} />
                Back to Projects
              </button>
              <div className="project-details">
                <h1>{project.name}</h1>
                {project.description && <p>{project.description}</p>}
                <div className="project-meta">
                  <span className="language-badge">{project.language}</span>
                  <span className="file-count">{project.files.length} files</span>
                  {project.is_public && <span className="public-badge">Public</span>}
                </div>
              </div>
            </div>
            <div className="project-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleShareProject}
              >
                <Share2 size={16} />
                Share
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleSaveFile}
                disabled={!selectedFile}
              >
                <Save size={16} />
                Save
              </button>
              <button 
                className="btn btn-primary run-button" 
                onClick={handleRunCode}
                disabled={isRunning || !code.trim()}
              >
                {isRunning ? (
                  <>
                    <span className="loading">⟳</span>
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor Layout */}
          <div className="editor-layout">
            {/* File Sidebar */}
            <div className="file-sidebar">
              <div className="sidebar-header">
                <h3>Files</h3>
                <div className="sidebar-actions">
                  <button 
                    className="btn btn-small"
                    onClick={() => setShowNewFolderModal(true)}
                    title="Add new folder"
                  >
                    <FolderPlus size={14} />
                  </button>
                  <button 
                    className="btn btn-small"
                    onClick={() => setShowNewFileModal(true)}
                    title="Add new file"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="file-list">
                {/* Show folders first */}
                {getFolders().map((folder) => (
                  <div 
                    key={folder}
                    className={`file-item folder-item ${selectedFolder === folder ? 'selected' : ''}`}
                    onClick={() => setSelectedFolder(selectedFolder === folder ? null : folder)}
                  >
                    <Folder size={16} />
                    <span className="file-name">{folder.split('/').pop()}</span>
                  </div>
                ))}
                
                {/* Show files organized by folder */}
                {Object.entries(organizeFiles()).map(([folder, files]) => (
                  <div key={folder} className={folder === '_root' ? '' : 'folder-contents'}>
                    {folder !== '_root' && selectedFolder === folder && (
                      <div className="folder-label">{folder}/</div>
                    )}
                    {(folder === '_root' || selectedFolder === folder) && files.map((file) => (
                      <div 
                        key={file.id}
                        className={`file-item ${selectedFile?.id === file.id ? 'active' : ''} ${folder !== '_root' ? 'nested' : ''}`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <span className="file-icon">{getFileIcon(file.name)}</span>
                        <span className="file-name">{file.name}</span>
                        {file.id === project.main_file && (
                          <span className="main-badge">main</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div className="editor-area">
              {selectedFile ? (
                <>
                  <div className="editor-header">
                    <div className="file-tab">
                      <span className="file-icon">{getFileIcon(selectedFile.name)}</span>
                      <span className="file-name">{selectedFile.name}</span>
                    </div>
                  </div>
                  
                  <div className="editor-workspace">
                    <div className="code-panel">
                      <CodeEditor 
                        language={selectedFile.language}
                        code={code}
                        onChange={setCode}
                        onShare={(shareData) => console.log('Shared:', shareData)}
                      />
                    </div>
                    
                    <div className="output-panel">
                      <OutputPanel 
                        output={output}
                        status={status}
                        executionTime={executionTime}
                        isRunning={isRunning}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-file-selected">
                  <h3>No file selected</h3>
                  <p>Select a file from the sidebar to start editing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New File</h3>
              <button 
                className="modal-close"
                onClick={() => setShowNewFileModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {selectedFolder && (
                <div className="folder-context">
                  <Folder size={14} />
                  <span>Creating in: {selectedFolder}/</span>
                </div>
              )}
              <div className="form-group">
                <label>File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="example.py"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowNewFileModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button 
                className="modal-close"
                onClick={() => setShowNewFolderModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {selectedFolder && (
                <div className="folder-context">
                  <Folder size={14} />
                  <span>Creating in: {selectedFolder}/</span>
                </div>
              )}
              <div className="form-group">
                <label>Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="src"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowNewFolderModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectEditor;