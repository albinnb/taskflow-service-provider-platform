import axiosClient from './axiosClient';

// --- AUTH API ---
export const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  logout: () => axiosClient.post('/auth/logout'),
  getMe: () => axiosClient.get('/auth/me'),
  getProviderProfile: () => axiosClient.get('/auth/provider'), // Added this back for context to load provider data
};

// --- CORE DATA & CRUD API ---
export const coreApi = {
  // --- Search & Discovery ---
  searchServices: (params) => axiosClient.get('/services', { params }),
  getServiceDetails: (id) => axiosClient.get(`/services/${id}`),
  getProviders: (params) => axiosClient.get('/providers', { params }), // Needed for Admin Dashboard
  getProviderDetails: (id) => axiosClient.get(`/providers/${id}`),
  getCategories: () => axiosClient.get('/categories'), // Needed for Filters & Service Form
  getProviderAvailability: (id, { date, serviceId }) =>
    axiosClient.get(`/providers/${id}/availability`, {
      params: { date, serviceId },
    }), // Needed for Booking Modal

  // --- Provider Availability (self-service) ---
  getMyAvailability: () => axiosClient.get('/availability/me'),
  updateMyAvailability: (data) => axiosClient.put('/availability', data),

  // --- Payment (Razorpay) ---
  createPaymentOrder: (data) => axiosClient.post('/payments/create-order', data),
  verifyPayment: (data) => axiosClient.post('/payments/verify', data),

  // --- Service CRUD (Provider/Admin) ---
  createService: (data) => axiosClient.post('/services', data),
  updateService: (id, data) => axiosClient.put(`/services/${id}`, data),
  deleteService: (id) => axiosClient.delete(`/services/${id}`),
  uploadImage: (formData) => axiosClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // --- Booking Management ---
  // --- Payment (Razorpay) ---
  createPaymentOrder: (data) => axiosClient.post('/payments/create-order', data),
  verifyPayment: (data) => axiosClient.post('/payments/verify', data),

  // --- Service CRUD (Provider/Admin) ---
  createService: (data) => axiosClient.post('/services', data),
  updateService: (id, data) => axiosClient.put(`/services/${id}`, data),
  deleteService: (id) => axiosClient.delete(`/services/${id}`),

  // --- Booking Management ---
  createBooking: (data) => axiosClient.post('/bookings', data),
  getBookings: (params) => axiosClient.get('/bookings', { params }),
  getBookingById: (id) => axiosClient.get(`/bookings/${id}`),
  updateBookingStatus: (id, data) => axiosClient.put(`/bookings/${id}`, data),
  deleteBooking: (id) => axiosClient.delete(`/bookings/${id}`),

  // --- Review Management ---
  getProviderReviews: (providerId) => axiosClient.get(`/reviews/provider/${providerId}`),
  createReview: (data) => axiosClient.post('/reviews', data),

  // --- Admin/User Management ---
  getUsers: (params) => axiosClient.get('/users', { params }),
  updateUser: (id, data) => axiosClient.put(`/users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),

  // Provider Profile update (Onboarding completion/update)
  updateProviderProfile: (id, data) => axiosClient.put(`/providers/${id}`, data),
  getProviderAnalytics: (id) => axiosClient.get(`/providers/${id}/analytics`), // <-- NEW ANALYTICS API

  // NEW FUNCTION: Update the logged-in user's profile (Name, Email, Phone)
  updateUserProfile: (data) => axiosClient.put('/users/profile', data),

  // NEW FUNCTION: Update the logged-in user's address for profile completion
  updateUserProfileAddress: (data) => axiosClient.put('/users/profile/address', data),

  // --- Admin: Service Approval ---
  getPendingServices: () => axiosClient.get('/services/admin/pending'),
  updateServiceStatus: (id, status) => axiosClient.put(`/services/admin/${id}/status`, { status }),

  // --- Dispute Resolution ---
  createDispute: (data) => axiosClient.post('/disputes', data),
  getDisputes: () => axiosClient.get('/disputes'),
  resolveDispute: (id, data) => axiosClient.put(`/disputes/${id}`, data),
};