import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import LoadingSpinner from './LoadingSpinner';
import { getResult } from '../services/api';
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

const ProjectEditor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, getAuthHeaders } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [prevSelectedFileId, setPrevSelectedFileId] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [status, setStatus] = useState('ready');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // Custom states added for Stdin, Stderr, and reactive Unsaved Indicators
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [stderr, setStderr] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState({});
  
  // Load unsaved changes from localStorage on mount
  const getUnsavedChanges = () => {
    try {
      const saved = localStorage.getItem(`project_${projectId}_unsaved`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };
  
  const saveUnsavedChanges = (fileId, content) => {
    try {
      const unsaved = getUnsavedChanges();
      unsaved[fileId] = content;
      localStorage.setItem(`project_${projectId}_unsaved`, JSON.stringify(unsaved));
      setUnsavedChanges(unsaved);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };
  
  const clearUnsavedChanges = (fileId) => {
    try {
      const unsaved = getUnsavedChanges();
      delete unsaved[fileId];
      localStorage.setItem(`project_${projectId}_unsaved`, JSON.stringify(unsaved));
      setUnsavedChanges(unsaved);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  };

  useEffect(() => {
    // Close context menu when clicking anywhere
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    setUnsavedChanges(getUnsavedChanges());
    setStdin('');
    setShowStdin(false);
    setStderr('');
  }, [projectId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning && code.trim()) {
          handleRunCode();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedFile) {
          handleSaveFile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, code, stdin, selectedFile, project]);

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
    if (selectedFile && selectedFile.id !== prevSelectedFileId) {
      // Load content for the new file (check localStorage first)
      const unsaved = getUnsavedChanges();
      const fileContent = unsaved[selectedFile.id] !== undefined 
        ? unsaved[selectedFile.id] 
        : selectedFile.content;
      
      setCode(fileContent);
      setOutput('');
      setStatus('ready');
      setExecutionTime(null);
      setPrevSelectedFileId(selectedFile.id);
    }
  }, [selectedFile, prevSelectedFileId, projectId]);

  // Auto-save code changes to localStorage
  useEffect(() => {
    if (selectedFile && code !== undefined) {
      if (code === selectedFile.content) {
        // Content matches original, clear any unsaved status
        clearUnsavedChanges(selectedFile.id);
        return;
      }
      
      const timeoutId = setTimeout(() => {
        saveUnsavedChanges(selectedFile.id, code);
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [code, selectedFile, projectId]);

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
    setStderr('');
    setStatus('running');
    setExecutionTime(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      // Get all files with current unsaved changes
      const unsaved = getUnsavedChanges();
      const allFiles = project.files
        .filter(f => f.name !== '.folder' && f.name !== '.gitkeep')
        .map(file => ({
          ...file,
          content: file.id === selectedFile.id 
            ? code 
            : (unsaved[file.id] !== undefined ? unsaved[file.id] : file.content)
        }));

      // Prepare multi-file execution request
      const executionRequest = {
        language: selectedFile ? getFileLanguage(selectedFile.name) : project.language,
        files: allFiles,
        main_file: selectedFile?.path || project.files[0]?.path,
        stdin: stdin
      };

      console.log('Execution request:', executionRequest);

      const response = await fetch('/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify(executionRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Execution failed');
      }

      const data = await response.json();
      const jobId = data.job_id;

      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      let attempts = 0;
      const maxAttempts = 30;
      let completed = false;

      // HTTP Polling Fallback
      const pollResult = async () => {
        if (completed) return;
        try {
          const result = await getResult(jobId);
          
          if (result.status === 'success') {
            completed = true;
            setOutput(result.output || 'Code executed successfully (no output)');
            setStderr(result.error || '');
            setStatus('success');
            setExecutionTime((result.execution_time / 1e9).toFixed(2));
            setIsRunning(false);
          } else if (result.status === 'error') {
            completed = true;
            setOutput(result.output || '');
            setStderr(result.error || 'Unknown error occurred');
            setStatus('error');
            setExecutionTime(result.execution_time ? (result.execution_time / 1e9).toFixed(2) : null);
            setIsRunning(false);
          } else {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollResult, 1000);
            } else {
              completed = true;
              setOutput('Execution timeout - code took too long to run');
              setStatus('error');
              setIsRunning(false);
            }
            return;
          }
        } catch (error) {
          if (error.response?.status === 408 || error.response?.status === 404) {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollResult, 1000);
            } else {
              completed = true;
              setOutput('Execution timeout - please try again');
              setStatus('error');
              setIsRunning(false);
            }
          } else {
            completed = true;
            setOutput(`Error: ${error.message}`);
            setStatus('error');
            setIsRunning(false);
          }
        }
      };

      // Try WebSocket connection first
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${jobId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for execution job:', jobId);
      };

      ws.onmessage = (event) => {
        try {
          const wsData = JSON.parse(event.data);
          if (wsData.type === 'status') {
            setOutput(wsData.content || 'Executing...');
          } else if (wsData.type === 'complete') {
            completed = true;
            const result = wsData.content;
            if (result.status === 'success') {
              setOutput(result.output || 'Code executed successfully (no output)');
              setStderr(result.error || '');
              setStatus('success');
              setExecutionTime((result.execution_time / 1e9).toFixed(2));
            } else {
              setOutput(result.output || '');
              setStderr(result.error || 'Unknown error occurred');
              setStatus('error');
              setExecutionTime(result.execution_time ? (result.execution_time / 1e9).toFixed(2) : null);
            }
            setIsRunning(false);
            ws.close();
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error, falling back to polling:', error);
        if (!completed) {
          pollResult();
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        // If WebSocket closed without completing, fallback to polling
        if (!completed) {
          pollResult();
        }
      };

    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setStatus('error');
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
        // Update local project state
        setProject({ ...project, files: updatedFiles });
        // Update selected file reference
        const updatedFile = updatedFiles.find(f => f.id === selectedFile.id);
        setSelectedFile(updatedFile);
        // Clear unsaved changes for this file from localStorage
        clearUnsavedChanges(selectedFile.id);
        console.log('File saved successfully');
      } else {
        console.error('Failed to save file:', data.error);
        alert('Failed to save file: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
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
      name: '.gitkeep',
      path: `${folderPath}/.gitkeep`,
      content: '# This file keeps the folder in version control',
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
        // Expand the parent folder and the new folder
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          if (selectedFolder) {
            newSet.add(selectedFolder);
          }
          newSet.add(folderPath);
          return newSet;
        });
        setShowNewFolderModal(false);
        setNewFolderName('');
      } else {
        console.error('Failed to create folder:', data.error);
        alert('Failed to create folder: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
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

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type // 'file' or 'folder'
    });
  };

  const handleCreateFileInFolder = () => {
    setSelectedFolder(contextMenu.item);
    setShowNewFileModal(true);
    setContextMenu(null);
  };

  const handleCreateFolderInFolder = () => {
    setSelectedFolder(contextMenu.item);
    setShowNewFolderModal(true);
    setContextMenu(null);
  };

  const handleSetMainFile = async () => {
    if (!contextMenu || contextMenu.type !== 'file') return;
    const file = contextMenu.item;

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
          files: project.files,
          main_file: file.path
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setProject(prev => ({ ...prev, main_file: file.path }));
      } else {
        console.error('Failed to set main file:', data.error);
        alert('Failed to set main file: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to set main file:', error);
      alert('Failed to set main file');
    }
    setContextMenu(null);
  };

  const handleRenameItem = () => {
    const newName = prompt(`Enter new name for ${contextMenu.item.name || contextMenu.item}:`);
    if (!newName || !newName.trim()) return;

    if (contextMenu.type === 'file') {
      const file = contextMenu.item;
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');

      const updatedFiles = project.files.map(f =>
        f.id === file.id
          ? { ...f, name: newName, path: newPath, updated_at: new Date().toISOString() }
          : f
      );

      updateProjectFiles(updatedFiles);
    } else if (contextMenu.type === 'folder') {
      const oldFolderPath = contextMenu.item;
      const pathParts = oldFolderPath.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newFolderPath = pathParts.join('/');

      const updatedFiles = project.files.map(f => {
        if (f.path.startsWith(oldFolderPath + '/')) {
          const newPath = f.path.replace(oldFolderPath, newFolderPath);
          return { ...f, path: newPath, updated_at: new Date().toISOString() };
        }
        return f;
      });

      updateProjectFiles(updatedFiles);
    }
    setContextMenu(null);
  };

  const handleDeleteItem = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${contextMenu.item.name || contextMenu.item}?`
    );
    if (!confirmDelete) return;

    if (contextMenu.type === 'file') {
      const file = contextMenu.item;
      const updatedFiles = project.files.filter(f => f.id !== file.id);
      
      // If deleting the selected file, select another file
      if (selectedFile?.id === file.id) {
        setSelectedFile(updatedFiles[0] || null);
        setCode(updatedFiles[0]?.content || '');
      }

      await updateProjectFiles(updatedFiles);
    } else if (contextMenu.type === 'folder') {
      const folderPath = contextMenu.item;
      const updatedFiles = project.files.filter(f => !f.path.startsWith(folderPath + '/'));
      
      // If deleting a folder containing the selected file, select another file
      if (selectedFile && selectedFile.path.startsWith(folderPath + '/')) {
        setSelectedFile(updatedFiles[0] || null);
        setCode(updatedFiles[0]?.content || '');
      }

      await updateProjectFiles(updatedFiles);
    }
    setContextMenu(null);
  };

  const updateProjectFiles = async (updatedFiles) => {
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
      } else {
        console.error('Failed to update project:', data.error);
        alert('Failed to update project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project');
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
      case 'py': return 'PY';
      case 'js': return 'JS';
      case 'cpp': case 'cc': case 'cxx': case 'h': case 'hpp': return 'C++';
      case 'java': return 'JV';
      case 'md': return 'MD';
      case 'txt': return 'TXT';
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

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const buildFileTree = () => {
    const tree = {
      name: 'root',
      path: '',
      type: 'folder',
      children: []
    };

    const filesByPath = {};
    
    // First pass: create all folders and files
    project.files.forEach(file => {
      if (file.name === '.folder' || file.name === '.gitkeep') {
        // Don't show placeholder files, but use them to create folder structure
        const parts = file.path.split('/');
        let currentPath = '';
        
        // Create folder structure up to the placeholder file
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
          
          if (!filesByPath[currentPath]) {
            filesByPath[currentPath] = {
              name: folderName,
              path: currentPath,
              type: 'folder',
              children: []
            };
          }
        }
        return; // Skip adding the placeholder file itself
      }
      
      const parts = file.path.split('/');
      let currentPath = '';
      
      // Create folder structure
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        if (!filesByPath[currentPath]) {
          filesByPath[currentPath] = {
            name: folderName,
            path: currentPath,
            type: 'folder',
            children: []
          };
        }
      }
      
      // Add the file
      filesByPath[file.path] = {
        ...file,
        type: 'file'
      };
    });

    // Second pass: build tree structure
    Object.values(filesByPath).forEach(item => {
      const parts = item.path.split('/');
      
      if (parts.length === 1) {
        // Root level item
        tree.children.push(item);
      } else {
        // Nested item - find parent
        const parentPath = parts.slice(0, -1).join('/');
        const parent = filesByPath[parentPath];
        if (parent && parent.children) {
          parent.children.push(item);
        }
      }
    });

    // Sort children: folders first, then files
    const sortChildren = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };
    sortChildren(tree);

    return tree.children;
  };

  const renderFileTree = (items, depth = 0) => {
    return items.map(item => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.has(item.path);
        return (
          <div key={item.path} className="tree-item">
            <div
              className={`file-item folder-item ${selectedFolder === item.path ? 'selected' : ''}`}
              style={{ paddingLeft: `${depth * 0.75 + 0.75}rem` }}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.path);
                setSelectedFolder(item.path);
              }}
              onContextMenu={(e) => handleContextMenu(e, item.path, 'folder')}
            >
              <span className="expand-icon">
                {isExpanded ? '▾' : '▸'}
              </span>
              <span className="folder-icon">
                {isExpanded ? '[−]' : '[+]'}
              </span>
              <span className="file-name">{item.name}</span>
              <span className="item-count">({item.children?.length || 0})</span>
            </div>
            {isExpanded && item.children && item.children.length > 0 && (
              <div className="folder-children">
                {renderFileTree(item.children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={item.id}
            className={`file-item file-item-leaf ${selectedFile?.id === item.id ? 'active' : ''}`}
            style={{ paddingLeft: `${depth * 0.75 + 2}rem` }}
            onClick={() => setSelectedFile(item)}
            onContextMenu={(e) => handleContextMenu(e, item, 'file')}
          >
            <span className="file-icon">{getFileIcon(item.name)}</span>
            <span className="file-name">
              {item.name}
              {unsavedChanges[item.id] !== undefined && <span className="unsaved-indicator">●</span>}
            </span>
            {(item.path === project.main_file || item.id === project.main_file) && (
              <span className="main-badge">main</span>
            )}
          </div>
        );
      }
    });
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
                    <span className="loading">○</span>
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
            <div className="file-sidebar" onClick={() => setSelectedFolder(null)}>
              <div className="sidebar-header" onClick={(e) => e.stopPropagation()}>
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
              <div className="file-list" onClick={(e) => e.stopPropagation()}>
                {renderFileTree(buildFileTree())}
              </div>
            </div>

            {/* Editor Area */}
            <div className="editor-area">
              {selectedFile ? (
                <>
                  <div className="editor-header">
                    <div className="file-tab">
                      <span className="file-icon">{getFileIcon(selectedFile.name)}</span>
                      <span className="file-name">
                        {selectedFile.name}
                        {unsavedChanges[selectedFile.id] !== undefined && <span className="unsaved-indicator">●</span>}
                      </span>
                    </div>
                  </div>
                  
                  <div className="editor-workspace">
                    <div className="code-panel">
                      <CodeEditor 
                        language={getFileLanguage(selectedFile.name)}
                        code={code}
                        onChange={setCode}
                        onShare={(shareData) => console.log('Shared:', shareData)}
                      />
                      
                      <div className={`stdin-section ${showStdin ? 'open' : ''}`}>
                        <div className="stdin-header" onClick={() => setShowStdin(!showStdin)}>
                          <div className="stdin-title">
                            Standard Input (stdin)
                            {stdin.trim() && <span className="stdin-badge">active</span>}
                          </div>
                          <span className="stdin-toggle">{showStdin ? 'Hide Input' : 'Show Input'}</span>
                        </div>
                        {showStdin && (
                          <div className="stdin-body">
                            <textarea
                              className="stdin-textarea"
                              placeholder="Provide input for your program here (e.g. text inputs separated by newlines)..."
                              value={stdin}
                              onChange={(e) => setStdin(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="output-panel">
                      <OutputPanel 
                        output={output}
                        stderr={stderr}
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
              {!selectedFolder && (
                <div className="folder-context" style={{ background: '#1a1a1a', color: '#a3a3a3' }}>
                  <Folder size={14} />
                  <span>Creating in: / (root directory)</span>
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
              {!selectedFolder && (
                <div className="folder-context" style={{ background: '#1a1a1a', color: '#a3a3a3' }}>
                  <Folder size={14} />
                  <span>Creating in: / (root directory)</span>
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

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' && (
            <>
              <div className="context-menu-item" onClick={handleCreateFileInFolder}>
                <Plus size={14} />
                <span>New File</span>
              </div>
              <div className="context-menu-item" onClick={handleCreateFolderInFolder}>
                <FolderPlus size={14} />
                <span>New Folder</span>
              </div>
              <div className="context-menu-divider"></div>
            </>
          )}
          {contextMenu.type === 'file' && (
            <>
              <div className="context-menu-item" onClick={handleSetMainFile}>
                <Play size={14} />
                <span>Set as Main File</span>
              </div>
              <div className="context-menu-divider"></div>
            </>
          )}
          <div className="context-menu-item" onClick={handleRenameItem}>
            <FileText size={14} />
            <span>Rename</span>
          </div>
          <div className="context-menu-item context-menu-item-danger" onClick={handleDeleteItem}>
            <Trash2 size={14} />
            <span>Delete</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectEditor;
