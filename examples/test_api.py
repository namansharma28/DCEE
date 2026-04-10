#!/usr/bin/env python3
"""
Test script for the Code Execution Engine API
"""

import requests
import json
import time
import websocket
import threading

API_BASE = "http://localhost:8080"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    response = requests.get(f"{API_BASE}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_supported_languages():
    """Test getting supported languages"""
    print("🔍 Testing supported languages...")
    response = requests.get(f"{API_BASE}/languages")
    print(f"Status: {response.status_code}")
    print(f"Languages: {response.json()}")
    print()

def test_code_execution(code, language):
    """Test code execution with polling"""
    print(f"🔍 Testing {language} code execution...")
    
    # Submit code
    payload = {
        "code": code,
        "language": language,
        "user_id": "test_user"
    }
    
    response = requests.post(f"{API_BASE}/execute", json=payload)
    print(f"Submit Status: {response.status_code}")
    
    if response.status_code != 202:
        print(f"Error: {response.json()}")
        return
    
    job_data = response.json()
    job_id = job_data["job_id"]
    print(f"Job ID: {job_id}")
    
    # Poll for result
    print("Waiting for result...")
    response = requests.get(f"{API_BASE}/result/{job_id}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Execution completed!")
        print(f"Status: {result['status']}")
        print(f"Output: {result['output']}")
        if result['error']:
            print(f"Error: {result['error']}")
        print(f"Execution Time: {result['execution_time']}")
        print(f"Exit Code: {result['exit_code']}")
    else:
        print(f"❌ Failed to get result: {response.json()}")
    
    print()

def test_websocket(code, language):
    """Test code execution with WebSocket"""
    print(f"🔍 Testing {language} WebSocket execution...")
    
    # Submit code
    payload = {
        "code": code,
        "language": language,
        "user_id": "test_user_ws"
    }
    
    response = requests.post(f"{API_BASE}/execute", json=payload)
    if response.status_code != 202:
        print(f"Error submitting code: {response.json()}")
        return
    
    job_id = response.json()["job_id"]
    print(f"Job ID: {job_id}")
    
    # Connect to WebSocket
    ws_url = f"ws://localhost:8080/ws/{job_id}"
    
    def on_message(ws, message):
        data = json.loads(message)
        print(f"📨 WebSocket message: {data['type']}")
        
        if data['type'] == 'complete':
            result = data['content']
            print(f"✅ Execution completed via WebSocket!")
            print(f"Status: {result['status']}")
            print(f"Output: {result['output']}")
            if result['error']:
                print(f"Error: {result['error']}")
            print(f"Execution Time: {result['execution_time']}")
            ws.close()
    
    def on_error(ws, error):
        print(f"❌ WebSocket error: {error}")
    
    def on_close(ws, close_status_code, close_msg):
        print("🔌 WebSocket connection closed")
    
    def on_open(ws):
        print("🔌 WebSocket connection opened")
    
    ws = websocket.WebSocketApp(ws_url,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    
    # Run WebSocket in a separate thread
    ws_thread = threading.Thread(target=ws.run_forever)
    ws_thread.daemon = True
    ws_thread.start()
    
    # Wait for completion
    ws_thread.join(timeout=30)
    print()

def main():
    """Run all tests"""
    print("🚀 Code Execution Engine API Tests")
    print("=" * 50)
    
    # Basic API tests
    test_health_check()
    test_supported_languages()
    
    # Test different languages
    test_cases = [
        {
            "language": "python",
            "code": '''
print("Hello from Python!")
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(f"Squared numbers: {squared}")
print(f"Sum: {sum(squared)}")
'''
        },
        {
            "language": "javascript",
            "code": '''
console.log("Hello from Node.js!");
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log("Doubled:", doubled);
console.log("Sum:", doubled.reduce((a, b) => a + b, 0));
'''
        },
        {
            "language": "cpp",
            "code": '''
#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Numbers: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
'''
        }
    ]
    
    # Test with polling
    for test_case in test_cases:
        test_code_execution(test_case["code"], test_case["language"])
    
    # Test WebSocket (Python example)
    test_websocket(test_cases[0]["code"], test_cases[0]["language"])
    
    print("🎉 All tests completed!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Tests interrupted by user")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")