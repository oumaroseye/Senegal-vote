import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  // Priorité : token complet > tempToken
  const token = localStorage.getItem('token');
  const tempToken = localStorage.getItem('tempToken');
  const activeToken = token || tempToken;
  
  if (activeToken && activeToken !== 'undefined' && activeToken !== 'null') {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne supprimer que si on n'est pas en train de vérifier l'OTP
      const url = error.config?.url || '';
      if (!url.includes('/auth/verify-otp') && !url.includes('/auth/resend-otp') && !url.includes('/auth/send-otp')) {
        localStorage.removeItem('token');
        localStorage.removeItem('tempToken');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  verifierIdentite: (data) => api.post('/auth/verify', data),
  envoyerOTP: (email) => api.post('/auth/send-otp', { email }),
  verifierOTP: (code) => api.post('/auth/verify-otp', { code }),
  renvoyerOTP: () => api.post('/auth/resend-otp'),
};

// ==================== VOTE ====================
export const voteAPI = {
  getCandidats: () => api.get('/vote/candidats'),
  selectionnerCandidat: (candidat_id) => api.post('/vote/select', { candidat_id }),
  confirmerVote: (candidat_id, otp_code) => api.post('/vote/confirm', { candidat_id, otp_code }),
};

// ==================== PUBLIC ====================
export const publicAPI = {
  getCandidats: () => api.get('/public/candidats'),
  getResultats: () => api.get('/public/resultats'),
  getStats: () => api.get('/public/stats'),
  getElectionStatus: () => api.get('/public/election-status'),
};

// ==================== ADMIN ====================
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  getDashboard: () => api.get('/admin/dashboard'),
  getResultats: () => api.get('/admin/resultats'),
  getVoteLocations: () => api.get('/admin/vote-locations'),
  getElecteurs: (params) => api.get('/admin/electeurs', { params }),
  ajouterElecteur: (data) => api.post('/admin/electeurs', data),
  supprimerElecteur: (id) => api.delete(`/admin/electeurs/${id}`),
  ajouterCandidat: (data) => api.post('/admin/candidats', data),
  getElections: () => api.get('/admin/elections'),
  creerElection: (data) => api.post('/admin/elections', data),
  creerPresidentCentre: (data) => api.post('/admin/presidents', data),
};

export default api;
