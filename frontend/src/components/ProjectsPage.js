import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    language: 'python',
    isPublic: false,
    tags: []
  });

  useEffect(() => {
    // Don't redirect if still loading auth status
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchProjects();
    fetchTemplates();
  }, [isAuthenticated, authLoading, navigate]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/project/user/list', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/project/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/project/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          description: '',
          language: 'python',
          isPublic: false,
          tags: []
        });
        fetchProjects();
        
        // Navigate to the new project
        navigate(`/project/${data.project.id}`);
      } else {
        alert('Failed to create project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  const handleCreateFromTemplate = async (templateId, projectData) => {
    try {
      const response = await fetch(`/api/project/template/${templateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        fetchProjects();
        
        // Navigate to the new project
        navigate(`/project/${data.project.id}`);
      } else {
        alert('Failed to create project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create project from template:', error);
      alert('Failed to create project from template');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        fetchProjects();
      } else {
        alert('Failed to delete project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'python': return 'PY';
      case 'javascript': return 'JS';
      case 'cpp': return 'C++';
      case 'java': return 'JV';
      default: return 'FL';
    }
  };

  if (loading) {
    return (
      <>
        <Header user={user} />
        <div className="projects-page">
          <div className="container">
            <LoadingSpinner />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} />
      <div className="projects-page">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-content">
              <h1>My Projects</h1>
              <p>Create, manage, and organize your coding projects</p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTemplateModal(true)}
              >
                📋 From Template
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                ➕ New Project
              </button>
            </div>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">[ ]</div>
              <h2>No projects yet</h2>
              <p>Create your first project to get started with coding!</p>
              <div className="empty-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Project
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowTemplateModal(true)}
                >
                  Use Template
                </button>
              </div>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <div className="project-info">
                      <span className="language-icon">
                        {getLanguageIcon(project.language)}
                      </span>
                      <div className="project-details">
                        <h3 className="project-name">{project.name}</h3>
                        <span className="project-language">{project.language}</span>
                      </div>
                    </div>
                    <div className="project-actions">
                      <button 
                        className="action-btn"
                        onClick={() => navigate(`/project/${project.id}`)}
                        title="Open project"
                      >
                        📝
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  
                  <div className="project-meta">
                    <span className="meta-item">
                      {project.files?.length || 0} files
                    </span>
                    <span className="meta-item">
                      {formatDate(project.updated_at)}
                    </span>
                    {project.is_public && (
                      <span className="meta-item public-badge">
                        Public
                      </span>
                    )}
                  </div>
                  
                  {project.tags && project.tags.length > 0 && (
                    <div className="project-tags">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="tag more">+{project.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="modal-body">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="What does this project do?"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Language</label>
                <select
                  value={createForm.language}
                  onChange={(e) => setCreateForm({...createForm, language: e.target.value})}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createForm.isPublic}
                    onChange={(e) => setCreateForm({...createForm, isPublic: e.target.checked})}
                  />
                  Make this project public
                </label>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal template-modal">
            <div className="modal-header">
              <h3>Choose Template</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="templates-grid">
                {templates.map((template) => (
                  <div 
                    key={template.id} 
                    className="template-card"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="template-header">
                      <span className="template-icon">
                        {getLanguageIcon(template.language)}
                      </span>
                      <div className="template-info">
                        <h4>{template.name}</h4>
                        <span className="template-language">{template.language}</span>
                      </div>
                    </div>
                    <p className="template-description">{template.description}</p>
                    <div className="template-files">
                      {template.files.length} files
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Project Creation Modal */}
      {selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create from {selectedTemplate.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedTemplate(null)}
              >
                ×
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateFromTemplate(selectedTemplate.id, {
                  name: formData.get('name'),
                  description: formData.get('description')
                });
              }}
              className="modal-body"
            >
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder={selectedTemplate.name}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder={selectedTemplate.description}
                  rows="3"
                />
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectsPage;
