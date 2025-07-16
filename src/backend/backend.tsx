const API_BASE_URL = 'https://backendhighreference-production.up.railway.app/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const apiService = {
  async request<T>(endpoint: string, method: string, data?: any): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Gestion améliorée du token
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      // Gestion des réponses non autorisées
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/connexion';
        return { success: false, error: 'Session expirée' };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Erreur HTTP: ${response.status}`,
        };
      }

      const responseData = await response.json();
      return { success: true, data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
      };
    }
  },

  auth: {
    async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
      const response = await apiService.request<{
        data: {
          token: string;
          user: {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
          };
        };
        message: string;
        statusCode: number;
        success: boolean;
      }>('/auth/login', 'POST', { email, password });

      if (response.success && response.data?.data?.token) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return {
        success: response.success,
        data: {
          token: response.data?.data?.token,
          user: response.data?.data?.user
        },
        error: response.success ? undefined : response.error
      };
    },

    async register(userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }): Promise<ApiResponse> {
      return apiService.request('/auth/register', 'POST', userData);
    },
  },

  user: {
    async getProfile(): Promise<ApiResponse<{
      firstName: string;
      lastName: string;
      email: string;
      createdAt: string;
      bio?: string;
    }>> {
      return apiService.request('/users/me', 'GET');
    },

    async updateProfile(profileData: {
      firstName?: string;
      lastName?: string;
      bio?: string;
    }): Promise<ApiResponse> {
      return apiService.request('/users/me', 'PATCH', profileData);
    },
    
    async deleteProfile(): Promise<ApiResponse> {
      return apiService.request('/users/me', 'DELETE');
    },
  },
};