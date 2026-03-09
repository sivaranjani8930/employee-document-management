import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document APIs
export const uploadDocument = async (formData) => {
  return await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const searchDocuments = async (filters) => {
  return await api.post('/search/', filters);
};

export const downloadDocument = async (docId) => {
  return await api.get(`/documents/${docId}/download`, {
    responseType: 'blob'
  });
};

export const updateDocument = async (docId, formData) => {
  return await api.post(`/documents/${docId}/update`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getDocumentVersions = async (docId) => {
  return await api.get(`/documents/${docId}/versions`);
};

export const downloadVersion = async (versionId) => {
  return await api.get(`/documents/versions/${versionId}/download`, {
    responseType: 'blob'
  });
};

// Notifications / Expiry APIs
export const getExpiries = async () => {
  return await api.get('/notifications/expiries');
};

export const triggerExpiryNotifications = async () => {
  return await api.post('/notifications/expiries/check-and-send');
};

// Employee APIs
export const getEmployees = async () => {
  return await api.get('/employees/');
};

// Category APIs
export const getCategories = async () => {
  return await api.get('/categories/');
};

export const addCategory = async (data) => {
  return await api.post('/categories/', data);
};

// Template APIs
export const getTemplates = async () => {
  return await api.get('/templates/');
};

export const createTemplate = async (data) => {
  return await api.post('/templates/', data);
};

export const updateTemplate = async (id, data) => {
  return await api.put(`/templates/${id}`, data);
};

export const generateLetter = async (templateId, data) => {
  return await api.post(`/templates/${templateId}/generate`, data);
};

export default api;