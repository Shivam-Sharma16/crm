import axios from 'axios';

// Create axios instance with base URL from environment variable
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and user from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch logout action if store is available (synchronous check)
      try {
        const { getStoreRef } = require('../store/storeRef');
        const store = getStoreRef();
        if (store) {
          const { logout } = require('../store/slices/authSlice');
          store.dispatch(logout());
        }
      } catch (err) {
        // Store not available yet, localStorage clearing is sufficient
        // This will be picked up by Redux on next render
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login user
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Signup user
  signup: async (name, email, password, phone = '') => {
    const response = await apiClient.post('/api/auth/signup', {
      name,
      email,
      password,
      phone,
    });
    return response.data;
  },
};

// Admin Auth API functions
export const adminAPI = {
  // Administrator login
  login: async (email, password) => {
    const response = await apiClient.post('/api/admin/login', {
      email,
      password,
    });
    return response.data;
  },

  // Admin signup
  signup: async (name, email, password, phone = '') => {
    const response = await apiClient.post('/api/admin/signup', {
      name,
      email,
      password,
      phone,
    });
    return response.data;
  },

  // Create user (admin/administrator only)
  createUser: async (name, email, password, phone = '', role, services = []) => {
    const response = await apiClient.post('/api/admin/users', {
      name,
      email,
      password,
      phone,
      role,
      services,
    });
    return response.data;
  },

  // Get all users (admin/administrator only)
  getUsers: async () => {
    const response = await apiClient.get('/api/admin/users');
    return response.data;
  },

  // Update user role (admin/administrator only)
  updateUserRole: async (userId, role) => {
    const response = await apiClient.put(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  // Delete user (admin/administrator only)
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/api/admin/users/${userId}`);
    return response.data;
  },
};

// Admin Entities API functions
export const adminEntitiesAPI = {
  // Doctors
  getDoctors: async () => {
    const response = await apiClient.get('/api/admin-entities/doctors');
    return response.data;
  },
  getDoctor: async (id) => {
    const response = await apiClient.get(`/api/admin-entities/doctors/${id}`);
    return response.data;
  },
  createDoctor: async (doctorData) => {
    const response = await apiClient.post('/api/admin-entities/doctors', doctorData);
    return response.data;
  },
  updateDoctor: async (id, doctorData) => {
    const response = await apiClient.put(`/api/admin-entities/doctors/${id}`, doctorData);
    return response.data;
  },
  deleteDoctor: async (id) => {
    const response = await apiClient.delete(`/api/admin-entities/doctors/${id}`);
    return response.data;
  },

  // Labs
  getLabs: async () => {
    const response = await apiClient.get('/api/admin-entities/labs');
    return response.data;
  },
  createLab: async (labData) => {
    const response = await apiClient.post('/api/admin-entities/labs', labData);
    return response.data;
  },
  updateLab: async (id, labData) => {
    const response = await apiClient.put(`/api/admin-entities/labs/${id}`, labData);
    return response.data;
  },
  deleteLab: async (id) => {
    const response = await apiClient.delete(`/api/admin-entities/labs/${id}`);
    return response.data;
  },

  // Pharmacies
  getPharmacies: async () => {
    const response = await apiClient.get('/api/admin-entities/pharmacies');
    return response.data;
  },
  createPharmacy: async (pharmacyData) => {
    const response = await apiClient.post('/api/admin-entities/pharmacies', pharmacyData);
    return response.data;
  },
  updatePharmacy: async (id, pharmacyData) => {
    const response = await apiClient.put(`/api/admin-entities/pharmacies/${id}`, pharmacyData);
    return response.data;
  },
  deletePharmacy: async (id) => {
    const response = await apiClient.delete(`/api/admin-entities/pharmacies/${id}`);
    return response.data;
  },

  // Receptions
  getReceptions: async () => {
    const response = await apiClient.get('/api/admin-entities/receptions');
    return response.data;
  },
  createReception: async (receptionData) => {
    const response = await apiClient.post('/api/admin-entities/receptions', receptionData);
    return response.data;
  },
  updateReception: async (id, receptionData) => {
    const response = await apiClient.put(`/api/admin-entities/receptions/${id}`, receptionData);
    return response.data;
  },
  deleteReception: async (id) => {
    const response = await apiClient.delete(`/api/admin-entities/receptions/${id}`);
    return response.data;
  },

  // Services
  getServices: async () => {
    const response = await apiClient.get('/api/admin-entities/services');
    return response.data;
  },
  createService: async (serviceData) => {
    const response = await apiClient.post('/api/admin-entities/services', serviceData);
    return response.data;
  },
  updateService: async (id, serviceData) => {
    const response = await apiClient.put(`/api/admin-entities/services/${id}`, serviceData);
    return response.data;
  },
  deleteService: async (id) => {
    const response = await apiClient.delete(`/api/admin-entities/services/${id}`);
    return response.data;
  },
};

// Public API functions (no auth required)
export const publicAPI = {
  // Get all active services
  getServices: async () => {
    const response = await apiClient.get('/api/public/services');
    return response.data;
  },
  
  // Get all doctors (optionally filtered by serviceId)
  getDoctors: async (serviceId = null) => {
    const url = serviceId 
      ? `/api/doctor?serviceId=${serviceId}`
      : '/api/doctor';
    const response = await apiClient.get(url);
    return response.data;
  },
};

// Export the apiClient for other API calls if needed
export default apiClient;


