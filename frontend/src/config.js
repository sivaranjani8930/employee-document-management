// API Configuration
// Environment-specific configuration can be added here

const API_CONFIG = {
  // Render deployed backend URL
  BACKEND_URL: 'https://employee-document-management-backend.onrender.com',
  
  // Local development backend URL (for fallback/override)
  // BACKEND_URL: 'http://localhost:5000',
};

export const API_BASE_URL = `${API_CONFIG.BACKEND_URL}/api`;

export default API_CONFIG;
