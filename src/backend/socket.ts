import { io, Socket } from 'socket.io-client';

//const SOCKET_URL = 'http://localhost:5000';
const SOCKET_URL = 'https://backend-truenumber.up.railway.app';

export const socket: Socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// Types pour les événements Socket.IO
export interface GameUpdateData {
  game: {
    _id: string;
    creator: any;
    opponent?: any;
    stake: number;
    timeLimit: number;
    status: 'waiting' | 'playing' | 'finished';
    creatorNumber?: number;
    opponentNumber?: number;
    winner?: string;
    startedAt?: string;
    finishedAt?: string;
  };
  finished: boolean;
  nextPlayer?: string | null;
  lastPlayedNumber?: number;
  lastPlayer?: string;
  timeout?: boolean;
}

export interface GameStartedData {
  game: any;
  currentPlayer: string;
  timeLimit: number;
}

export interface JoinedRoomData {
  room: string;
}

// Fonctions de connexion/déconnexion
export const connectSocket = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        socket.auth = { token };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    socket.disconnect();
};

// Fonctions pour les événements de jeu multijoueur
export const joinGameRoom = (gameId: string) => {
    socket.emit('joinGameRoom', { gameId });
};

export const leaveGameRoom = (gameId: string) => {
    socket.emit('leaveGameRoom', { gameId });
};

export const playTurn = (gameId: string) => {
    socket.emit('playTurn', { gameId });
};

// Écouteurs d'événements
export const onJoinedRoom = (callback: (data: JoinedRoomData) => void) => {
    socket.on('joinedRoom', callback);
};

export const onGameStarted = (callback: (data: GameStartedData) => void) => {
    socket.on('gameStarted', callback);
};

export const onGameUpdate = (callback: (data: GameUpdateData) => void) => {
    socket.on('gameUpdate', callback);
};

export const onError = (callback: (data: { message: string }) => void) => {
    socket.on('error', callback);
};

// Fonctions pour nettoyer les écouteurs
export const offJoinedRoom = () => {
    socket.off('joinedRoom');
};

export const offGameStarted = () => {
    socket.off('gameStarted');
};

export const offGameUpdate = () => {
    socket.off('gameUpdate');
};

export const offError = () => {
    socket.off('error');
};

// Fonction pour nettoyer tous les écouteurs
export const cleanupSocketListeners = () => {
    offJoinedRoom();
    offGameStarted();
    offGameUpdate();
    offError();
};

// Événements de connexion/déconnexion
socket.on('connect', () => {
    console.log('Socket connecté:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Socket déconnecté');
});

socket.on('connect_error', (error) => {
    console.error('Erreur de connexion Socket.IO:', error);
});