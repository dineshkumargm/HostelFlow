
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Auth token management
export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

// API request helper with JWT token
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

// Auth API calls
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData: { email: string; password: string; name: string; room_number: string }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  getProfile: () => apiRequest('/auth/profile'),
};

// Services API calls
export const servicesAPI = {
  getAll: () => apiRequest('/services'),
  
  book: (bookingData: {
    service_id: string;
    date: string;
    time_slot: string;
    special_instructions?: string;
  }) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),

  getUnavailableSlots: (serviceId: string, date: string) =>
    apiRequest(`/bookings/availability?service_id=${serviceId}&date=${date}`)
};

export const studentAPI = {
  getNotifications: () => apiRequest('/student/notifications'),
  markNotificationRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
};

// Bookings API calls
export const bookingsAPI = {
  getMyBookings: () => apiRequest('/bookings/my'),

  cancel: (bookingId: string) => apiRequest(`/bookings/${bookingId}/cancel`, {
    method: 'PUT',
  }),
  
  reschedule: (bookingId: string, newDateTime: { date: string; time_slot: string }) =>
    apiRequest(`/bookings/${bookingId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(newDateTime),
    }),
  
  rate: (bookingId: string, rating: { rating: number; comment?: string }) =>
    apiRequest(`/bookings/${bookingId}/rate`, {
      method: 'POST',
      body: JSON.stringify(rating),
    }),
  delete: (bookingId: string) =>
    apiRequest(`/bookings/${bookingId}/delete`, {
      method: 'DELETE',
    }),

  getAssignedBookings: () => apiRequest('/bookings/assigned'),

  updateBookingStatus: (bookingId: string, status: string) =>
    apiRequest(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Admin API calls
export const adminAPI = {
  getAllBookings: () => apiRequest('/admin/bookings'),
  getAllUsers: () => apiRequest('/admin/users'),
  getServiceProviders: () => apiRequest('/admin/service-providers'),
  
  createServiceProvider: (providerData: {
    name: string;
    email: string;
    phone: string;
    services: number[];
    specialization: string;
  }) => apiRequest('/admin/service-providers/create', {
    method: 'POST',
    body: JSON.stringify(providerData),
  }),
  
  updateServiceProvider: (providerId: string, providerData: any) =>
    apiRequest(`/admin/service-providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify(providerData),
    }),
  
  deleteServiceProvider: (providerId: string) =>
    apiRequest(`/admin/service-providers/${providerId}/delete`, {
      method: 'DELETE',
    }),
};

export const serviceProviderAPI = {
  getProfile: () => apiRequest('/service-provider/profile'),
  
  getAssignedBookings: () => apiRequest('/service-provider/bookings'),
  
  updateBookingStatus: (bookingId: string, status: 'in_progress' | 'completed') =>
    apiRequest(`/service-provider/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  getNotifications: () => apiRequest('/service-provider/notifications'),
  
  markNotificationRead: (notificationId: string) =>
    apiRequest(`/service-provider/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
  
  sendCompletionNotification: (bookingId: string, message: string) =>
    apiRequest(`/service-provider/bookings/${bookingId}/notify-completion`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// Notifications API calls  
export const notificationsAPI = {
  getUserNotifications: () => apiRequest('/notifications/user'),
  
  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
  
  sendBookingNotification: (bookingId: string) =>
    apiRequest(`/notifications/booking/${bookingId}`, {
      method: 'POST',
    }),
};

// Stats API calls
export const statsAPI = {
  getDashboard: () => apiRequest('/stats/dashboard'),
  getServiceProviderStats: () => apiRequest('/stats/service-provider'),
};
