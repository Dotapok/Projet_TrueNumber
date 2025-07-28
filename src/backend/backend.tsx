const API_BASE_URL = 'https://backend-truenumber.up.railway.app/api';
//const API_BASE_URL = 'http://localhost:5000/api';

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

interface MultiplayerGame {
  _id: string;
  creator: User;
  opponent?: User;
  stake: number;
  timeLimit: number;
  status: 'waiting' | 'playing' | 'finished';
  creatorNumber?: number;
  opponentNumber?: number;
  winner?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

interface GameStatus {
  game: MultiplayerGame;
  currentPlayer: string | null;
  timeRemaining: number | null;
  isMyTurn: boolean;
  gameState: {
    creatorPlayed: boolean;
    opponentPlayed: boolean;
    finished: boolean;
  };
}

interface PlayTurnResponse {
  number: number;
  game: MultiplayerGame;
  finished: boolean;
  nextPlayer: string | null;
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

        if (loginData && loginData.user && loginData.user._id) {
          localStorage.setItem('userId', loginData.user._id);
          console.log('[DEBUG] userId stocké dans localStorage =', loginData.user._id);
        }
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

    async getPointsBalance(): Promise<ApiResponse<{ points: number }>> {
      return apiService.request('/game/balance', 'GET');
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

  game: {
    async createMultiplayerGame(stake: number, timeLimit: number): Promise<ApiResponse<MultiplayerGame>> {
      return apiService.request('/game/multiplayer', 'POST', { stake, timeLimit });
    },

    async listWaitingGames(): Promise<ApiResponse<MultiplayerGame[]>> {
      return apiService.request('/game/multiplayer/waiting', 'GET');
    },

    async joinMultiplayerGame(gameId: string): Promise<ApiResponse<MultiplayerGame>> {
      return apiService.request(`/game/multiplayer/join/${gameId}`, 'POST');
    },

    // CORRIGÉ : Le nombre est généré automatiquement côté serveur
    async playMultiplayerTurn(gameId: string): Promise<ApiResponse<PlayTurnResponse>> {
      return apiService.request(`/game/multiplayer/play/${gameId}`, 'POST');
    },

    // NOUVEAU : Obtenir l'état d'une partie
    async getGameStatus(gameId: string): Promise<ApiResponse<GameStatus>> {
      return apiService.request(`/game/multiplayer/status/${gameId}`, 'GET');
    },

    // NOUVEAU : Historique des parties multijoueur
    async getMultiplayerHistory(page?: number, limit?: number): Promise<ApiResponse<{
      games: GameResult[];
      pagination: {
        total: number;
        page: number;
        pages: number;
        limit: number;
      };
    }>> {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const endpoint = `/game/multiplayer/history${queryString ? `?${queryString}` : ''}`;
      
      return apiService.request(endpoint, 'GET');
    },
  },
};