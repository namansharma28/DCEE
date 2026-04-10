import axios from 'axios';

const API_BASE_URL = ''; // Use relative URLs since React is served by the same Go server

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds
});

export const executeCode = async (code, language, headers = {}) => {
  try {
    const response = await api.post('/execute', {
      code,
      language,
      user_id: 'web-user'
    }, { headers });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to execute code');
  }
};

export const getResult = async (jobId) => {
  try {
    const response = await api.get(`/result/${jobId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 408) {
      throw new Error('Still processing...');
    }
    throw new Error(error.response?.data?.error || 'Failed to get result');
  }
};

export const getSupportedLanguages = async () => {
  try {
    const response = await api.get('/languages');
    return response.data;
  } catch (error) {
    throw new Error('Failed to get supported languages');
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API health check failed');
  }
};