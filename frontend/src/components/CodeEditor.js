import React, { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ShareButton from './ShareButton';
import './CodeEditor.css';

const CodeEditor = ({ language, code, onChange, onShare }) => {
  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'cpp': return 'cpp';
      case 'python': return 'python';
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      default: return 'plaintext';
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    theme: 'vs-dark',
    // Reduce console errors and improve stability
    mouseWheelZoom: false,
    contextmenu: true,
    selectOnLineNumbers: true,
    glyphMargin: false,
    folding: false,
    // Keep essential features but reduce noise
    quickSuggestions: {
      other: false,
      comments: false,
      strings: false
    },
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    wordBasedSuggestions: false,
    // Disable some touch-related features that cause errors
    multiCursorModifier: 'ctrlCmd',
    accessibilitySupport: 'off'
  };

  // Configure Monaco Editor to reduce console warnings
  useEffect(() => {
    // This helps reduce Monaco Editor console warnings
    if (window.monaco) {
      window.monaco.editor.setTheme('vs-dark');
    }
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    // Configure editor after mount to reduce warnings
    editor.updateOptions({
      accessibilitySupport: 'off'
    });
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <div className="editor-title-section">
          <span className="editor-title">Code Editor</span>
          <span className="editor-hint">Press Ctrl+Enter to run</span>
        </div>
        <div className="editor-actions">
          <ShareButton 
            code={code} 
            language={language} 
            onShare={onShare}
          />
        </div>
      </div>
      
      <div className="editor-container">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={onChange}
          options={editorOptions}
          theme="vs-dark"
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};

export default CodeEditor;