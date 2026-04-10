import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import LanguageSelector from './components/LanguageSelector';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProjectsPage from './components/ProjectsPage';
import ProjectEditor from './components/ProjectEditor';
import ShareView from './components/ShareView';
import LoadingSpinner from './components/LoadingSpinner';
import { executeCode, getResult } from './services/api';
import './App.css';

const SAMPLE_CODE = {
  python: `# Welcome to CodeRunner!
print("Hello, Python! 🐍")

# Let's do some calculations
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(f"Numbers: {numbers}")
print(f"Squared: {squared}")

# Working with functions
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("\\nFibonacci sequence:")
for i in range(8):
    print(f"F({i}) = {fibonacci(i)}")`,

  cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    cout << "Hello, C++! ⚡" << endl;
    
    // Working with vectors
    vector<int> numbers = {5, 2, 8, 1, 9, 3};
    cout << "Original: ";
    for(int n : numbers) {
        cout << n << " ";
    }
    cout << endl;
    
    // Sort and display
    sort(numbers.begin(), numbers.end());
    cout << "Sorted: ";
    for(int n : numbers) {
        cout << n << " ";
    }
    cout << endl;
    
    // Calculate sum
    int sum = 0;
    for(int n : numbers) {
        sum += n;
    }
    cout << "Sum: " << sum << endl;
    
    return 0;
}`,

  javascript: `// Welcome to CodeRunner!
console.log("Hello, JavaScript! 🟨");

// Working with arrays
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const evenNumbers = numbers.filter(n => n % 2 === 0);
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log("Original numbers:", numbers);
console.log("Even numbers:", evenNumbers);
console.log("Doubled:", doubled);
console.log("Sum:", sum);

// Working with objects
const person = {
    name: "Alice",
    age: 30,
    skills: ["JavaScript", "Python", "React"],
    greet() {
        return "Hi, I'm " + this.name + "!";
    }
};

console.log("\\n" + person.greet());
console.log("Skills:", person.skills.join(", "));`,

  java: `import java.util.*;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java! ☕");
        
        // Working with Lists
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        List<Integer> evenNumbers = numbers.stream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());
            
        List<Integer> doubled = numbers.stream()
            .map(n -> n * 2)
            .collect(Collectors.toList());
            
        int sum = numbers.stream()
            .mapToInt(Integer::intValue)
            .sum();
        
        System.out.println("Original: " + numbers);
        System.out.println("Even numbers: " + evenNumbers);
        System.out.println("Doubled: " + doubled);
        System.out.println("Sum: " + sum);
        
        // Working with Maps
        Map<String, Integer> grades = new HashMap<>();
        grades.put("Alice", 95);
        grades.put("Bob", 87);
        grades.put("Charlie", 92);
        
        System.out.println("\\nGrades: " + grades);
        
        double average = grades.values().stream()
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);
            
        System.out.println("Average: " + String.format("%.1f", average));
    }
}`
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/project/:projectId" element={<ProjectEditor />} />
            <Route path="/editor" element={<CodeEditorApp />} />
            <Route path="/share/:shareId" element={<ShareView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Separate component for the code editor functionality
function CodeEditorApp() {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(SAMPLE_CODE.python);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [status, setStatus] = useState('ready');

  useEffect(() => {
    // Check if there's shared code to load
    const sharedCode = localStorage.getItem('shared_code');
    if (sharedCode) {
      try {
        const parsed = JSON.parse(sharedCode);
        setLanguage(parsed.language);
        setCode(parsed.code);
        // Clear the shared code from localStorage after loading
        localStorage.removeItem('shared_code');
        setOutput('');
        setStatus('ready');
        setExecutionTime(null);
        return; // Don't load sample code if we have shared code
      } catch (error) {
        console.error('Failed to parse shared code:', error);
        localStorage.removeItem('shared_code');
      }
    }
    
    // Load sample code for the selected language
    setCode(SAMPLE_CODE[language]);
    setOutput('');
    setStatus('ready');
    setExecutionTime(null);
  }, [language]);

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
      // Get auth headers if user is logged in
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      // Submit code for execution
      const response = await executeCode(code, language, headers);
      const jobId = response.job_id;

      // Poll for results
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
            // Still running, continue polling
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
            // Still processing, continue polling
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

      // Start polling after a short delay
      setTimeout(pollResult, 500);

    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearCode = () => {
    setCode('');
    setOutput('');
    setStatus('ready');
    setExecutionTime(null);
  };

  const handleResetCode = () => {
    setCode(SAMPLE_CODE[language]);
    setOutput('');
    setStatus('ready');
    setExecutionTime(null);
  };

  const handleShare = (shareData) => {
    // Optional: Show success message or update UI
    console.log('Code shared successfully:', shareData);
    
    // You could add a toast notification here
    // or update user stats if needed
  };

  return (
    <>
      <Header user={user} />
      
      <main className="main-content">
        <div className="container">
          {/* User Status Banner */}
          {isAuthenticated && (
            <div className="user-status-banner">
              <div className="status-content">
                <div className="status-info">
                  <span className="status-icon">✅</span>
                  <span className="status-text">
                    Signed in as <strong>{user?.name}</strong>
                  </span>
                </div>
                <div className="status-stats">
                  <span className="stat">
                    <span className="stat-label">Executions:</span>
                    <span className="stat-value">{user?.total_executions || 0}</span>
                  </span>
                  <span className="stat">
                    <span className="stat-label">Shares:</span>
                    <span className="stat-value">{user?.total_shares || 0}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="editor-section">
            <div className="editor-header">
              <div className="editor-controls">
                <LanguageSelector 
                  language={language} 
                  onLanguageChange={setLanguage} 
                />
                
                <div className="action-buttons">
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleClearCode}
                    disabled={isRunning}
                  >
                    Clear
                  </button>
                  
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleResetCode}
                    disabled={isRunning}
                  >
                    Reset
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
                        ▶ Run Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="editor-workspace">
              <div className="code-panel">
                <CodeEditor 
                  language={language}
                  code={code}
                  onChange={setCode}
                  onShare={handleShare}
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
          </div>
        </div>
      </main>
    </>
  );
}

export default App;