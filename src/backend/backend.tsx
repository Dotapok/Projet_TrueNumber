const API_BASE_URL = 'https://backendhighreference-production.up.railway.app/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: string;
  bio?: string;
}

interface GameResult {
  number: number;
  result: 'win' | 'lose';
  pointsChange: number;
  newBalance: number;
  createdAt: string;
}

interface GameResultComplet {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  number: number;
  result: 'win' | 'lose';
  pointsChange: number;
  newBalance: number;
  createdAt: string;
}

export const apiService = {
  async request<T>(endpoint: string, method: string, data?: any): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      const token = localStorage.getItem('authToken');
      if (token && endpoint !== '/auth/login') {  
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      // Pour le login, ne pas gérer les erreurs 401 spécialement
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
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
    async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
      const response = await apiService.request<{
        token: string;
        user: User;
      }>('/auth/login', 'POST', { email, password });

      if (response.success && response.data) {
        console.log('Response structure:', response);
        console.log('Response data:', response.data);
        
        // Accéder aux données correctement dans la structure de réponse
        const loginData = response.data.data;
        console.log('Login data:', loginData);
        
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }

      return response;
    },

    async register(userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone: string;
    }): Promise<ApiResponse<{ user: User }>> {
      return apiService.request('/auth/register', 'POST', userData);
    },
  },

  user: {
    async getProfile(): Promise<ApiResponse<User>> {
      return apiService.request('/users/me', 'GET');
    },

    async updateProfile(profileData: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      phone?: string;
    }): Promise<ApiResponse<User>> {
      return apiService.request('/users/me', 'PATCH', profileData);
    },

    // Game endpoints
    async playGame(): Promise<ApiResponse<GameResult>> {
      return apiService.request('/game/play', 'POST');
    },

    async getGameHistory(): Promise<ApiResponse<GameResult[]>> {
      return apiService.request('/game/history', 'GET');
    },
  },

  admin: {
    async getAllUsers(): Promise<ApiResponse<User[]>> {
      return apiService.request('/admin/users', 'GET');
    },

    async getAllGames(): Promise<ApiResponse<GameResultComplet[]>> {
      return apiService.request('/admin/games', 'GET');
    },

    async createUser(userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone: string;
      role: 'user' | 'admin';
    }): Promise<ApiResponse<User>> {
      return apiService.request('/admin/users', 'POST', userData);
    },

    async updateUser(userId: string, userData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: 'user' | 'admin';
      points?: number;
    }): Promise<ApiResponse<User>> {
      return apiService.request(`/admin/users/${userId}`, 'PATCH', userData);
    },

    async deleteUser(userId: string): Promise<ApiResponse> {
      return apiService.request(`/admin/users/${userId}`, 'DELETE');
    },
  },
};