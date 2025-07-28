import React from 'react';
import { useState, useEffect } from 'react';
import { apiService } from '../backend/backend';
import {
    socket,
    connectSocket,
    disconnectSocket,
    joinGameRoom,
    leaveGameRoom,
    playTurn,
    onJoinedRoom,
    onGameStarted,
    onGameUpdate,
    onError,
    cleanupSocketListeners,
    GameUpdateData,
    GameStartedData
} from '../backend/socket';
import Notification from './notification';
import GameCountdown from './GameCountdown';

export default function MultiplayerGame() {
    const [games, setGames] = useState<any[]>([]);
    const [currentGame, setCurrentGame] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [lastCheckTime, setLastCheckTime] = useState(0);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const [formData, setFormData] = useState({
        stake: 50,
        timeLimit: 60
    });
    const [userBalance, setUserBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingGame, setIsCreatingGame] = useState(false); // Ajout pour bouton Créer
    const [joiningGameId, setJoiningGameId] = useState<string | null>(null); // Ajout pour bouton Rejoindre
    const [isGenerating, setIsGenerating] = useState(false); // Pour l'animation de génération
    const [showCountdownBanner, setShowCountdownBanner] = useState(false); // Bannière de compte à rebours
    const [countdownValue, setCountdownValue] = useState(3); // Valeur du compte à rebours
    const [showGameOverModal, setShowGameOverModal] = useState(false); // Modal de fin de partie
    const [gameResult, setGameResult] = useState<any>(null); // Résultat de la partie
    const userId = localStorage.getItem('userId');

    // Initialisation Socket.IO et chargement des données
    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true);
            connectSocket();
            await Promise.all([loadWaitingGames(), loadUserBalance()]);
            setIsLoading(false);
        };
        
        initializeData();

        // Écouteurs d'événements Socket.IO
        onJoinedRoom((data) => {
            console.log('Rejoint la room:', data.room);
        });

        onGameStarted((data: GameStartedData) => {
            console.log('[DEBUG] onGameStarted appelé, data =', data);
            const completeGame = {
                ...data.game,
                creator: typeof data.game.creator === 'string' ? {
                    _id: data.game.creator,
                    firstName: data.game.creator === userId ? 'Vous' : 'Joueur 1'
                } : {
                    ...data.game.creator,
                    firstName: data.game.creator?._id === userId ? 'Vous' : (data.game.creator?.firstName || 'Joueur 1')
                },
                opponent: typeof data.game.opponent === 'string' ? {
                    _id: data.game.opponent,
                    firstName: data.game.opponent === userId ? 'Vous' : 'Joueur 2'
                } : data.game.opponent
                    ? {
                        ...data.game.opponent,
                        firstName: data.game.opponent?._id === userId ? 'Vous' : (data.game.opponent?.firstName || 'Joueur 2')
                    }
                    : undefined
            };
            setCurrentGame(completeGame);
            const isMyTurn = String(completeGame.creator._id) === String(userId);
            console.log('[DEBUG] Comparaison tour : creator._id =', completeGame.creator._id, 'userId =', userId, 'isMyTurn =', isMyTurn);
            setIsMyTurn(isMyTurn);
            setTimeRemaining(data.timeLimit);
            setGames(prev => prev.filter(game => game._id !== data.game._id));
            
            // Afficher la bannière de compte à rebours
            setShowCountdownBanner(true);
            setCountdownValue(3);
            
            // Démarrer le compte à rebours
            const countdownInterval = setInterval(() => {
                setCountdownValue(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setShowCountdownBanner(false);
                        setGameStarted(true);
                        setNotification({
                            message: `Partie démarrée! ${isMyTurn ? 'C\'est votre tour!' : 'En attente de l\'autre joueur...'}`,
                            type: 'success'
                        });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            setTimeout(() => {
                console.log('[DEBUG] Après onGameStarted: currentGame =', completeGame, 'gameStarted =', true, 'isMyTurn =', isMyTurn);
            }, 0);
        });

        onGameUpdate((data: GameUpdateData) => {
            console.log('[DEBUG] onGameUpdate appelé, data =', data);
            // Correction: enrichit creator et opponent pour l'affichage
            const updatedGame = {
                ...data.game,
                creator: typeof data.game.creator === 'string' ? {
                    _id: data.game.creator,
                    firstName: data.game.creator === userId ? 'Vous' : 'Joueur 1'
                } : {
                    ...data.game.creator,
                    firstName: data.game.creator?._id === userId ? 'Vous' : (data.game.creator?.firstName || 'Joueur 1')
                },
                opponent: typeof data.game.opponent === 'string' ? {
                    _id: data.game.opponent,
                    firstName: data.game.opponent === userId ? 'Vous' : 'Joueur 2'
                } : data.game.opponent
                    ? {
                        ...data.game.opponent,
                        firstName: data.game.opponent?._id === userId ? 'Vous' : (data.game.opponent?.firstName || 'Joueur 2')
                    }
                    : undefined
            };
            setCurrentGame(updatedGame);
            // Correction logique de tour : utilise nextPlayer si présent, sinon currentPlayer
            let isMyTurn = false;
            if (typeof data.nextPlayer === 'string') {
                isMyTurn = data.nextPlayer === userId;
            } else if (typeof data.currentPlayer === 'string') {
                isMyTurn = data.currentPlayer === userId;
            } else if (updatedGame.creator && updatedGame.creator._id === userId) {
                // fallback: créateur commence
                isMyTurn = updatedGame.creator._id === userId && !updatedGame.creatorNumber;
            }
            setIsMyTurn(isMyTurn);
            // Log état après update
            setTimeout(() => {
                console.log('[DEBUG] Après onGameUpdate: currentGame =', updatedGame, 'gameStarted =', gameStarted, 'isMyTurn =', isMyTurn);
            }, 0);

            // Forcer la bascule sur l'interface de jeu dès que la partie est en 'playing' et qu'il y a deux joueurs
            if (updatedGame.status === 'playing' && updatedGame.opponent) {
                setGameStarted(true);
                setIsMyTurn(updatedGame.creator._id === userId);
                setTimeRemaining(updatedGame.timeLimit);
                setNotification({
                    message: `Partie démarrée! ${updatedGame.creator._id === userId ? 'C\'est votre tour!' : 'En attente de l\'autre joueur...'}`,
                    type: 'success'
                });
                setGames(prev => prev.filter(game => game._id !== updatedGame._id));
                setTimeout(() => {
                    console.log('[DEBUG] Bascule interface de jeu: currentGame =', updatedGame, 'gameStarted =', true, 'isMyTurn =', updatedGame.creator._id === userId);
                }, 0);
                return;
            }

            if (data.finished) {
                setGameStarted(false);
                setIsMyTurn(false);
                setTimeRemaining(null);

                const isWinner = data.game.winner === userId;
                const winnerName = isWinner ? 'Vous' :
                    (data.game.winner === data.game.creator._id ? data.game.creator.firstName : data.game.opponent?.firstName);

                // Afficher le modal de fin de partie après 3 secondes
                setTimeout(() => {
                    setGameResult({
                        winner: winnerName,
                        stake: data.game.stake,
                        creatorNumber: data.game.creatorNumber,
                        opponentNumber: data.game.opponentNumber,
                        isWinner
                    });
                    setShowGameOverModal(true);
                }, 3000);

                setNotification({
                    message: `${winnerName} gagne la partie et reçoit ${data.game.stake} points !`,
                    type: isWinner ? 'success' : 'error'
                });

                // Recharger le solde utilisateur
                loadUserBalance();
            } else {
                setIsMyTurn(data.nextPlayer === userId);
                if (data.timeout) {
                    setNotification({
                        message: 'Temps écoulé! Le joueur a perdu automatiquement.',
                        type: 'error'
                    });
                }
            }
            // Notification du nombre généré en temps réel avec délai
            if (data.lastPlayedNumber !== undefined && data.lastPlayer) {
                const isMe = String(data.lastPlayer) === String(userId);
                setTimeout(() => {
                    setNotification({
                        message: isMe
                            ? `Vous avez généré le nombre ${data.lastPlayedNumber}`
                            : `L'adversaire a généré le nombre ${data.lastPlayedNumber}`,
                        type: isMe ? 'success' : 'info'
                    });
                }, 1000); // Délai de 1s pour la notification
            }
        });

        onError((data) => {
            setNotification({
                message: data.message,
                type: 'error'
            });
        });

        return () => {
            cleanupSocketListeners();
            disconnectSocket();
        };
    }, [userId]);

    // Polling pour vérifier l'état de la partie quand on est en attente
    useEffect(() => {
        if (currentGame && !gameStarted && currentGame.opponent) {
            const interval = setInterval(checkAndStartGame, 10000); // 10 secondes
            return () => clearInterval(interval);
        }
    }, [currentGame, gameStarted]);

    const loadWaitingGames = async () => {
        try {
            const { success, data } = await apiService.game.listWaitingGames();
            if (success && data) {
                // Gérer les différentes structures de réponse possibles
                let games = [];
                if (Array.isArray(data)) {
                    games = data;
                } else if (data.data) {
                    games = data.data;
                } else {
                    games = [];
                }
                setGames(games);
            } else {
                setGames([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des parties:', error);
            setGames([]);
        }
    };

    const loadUserBalance = async () => {
        try {
            const { success, data } = await apiService.user.getPointsBalance();
            console.log(data);
            if (success && data) {
                // Gérer les différentes structures de réponse possibles
                let points = 0;
                if (Array.isArray(data)) {
                    points = data[0]?.data?.points || data[0]?.points || 0;
                } else if (data.data) {
                    points = data.data.points || 0;
                } else {
                    points = data.points || 0;
                }
                setUserBalance(points);
            } else {
                setUserBalance(0);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du solde:', error);
            setUserBalance(0);
        }
    };

    const createGame = async () => {
        if (formData.stake > userBalance) {
            setNotification({
                message: `Solde insuffisant pour créer cette partie. Vous avez ${userBalance} points.`,
                type: 'error'
            });
            return;
        }
        setIsCreatingGame(true);
        const { success, data, error } = await apiService.game.createMultiplayerGame(
            formData.stake,
            formData.timeLimit
        );
        setIsCreatingGame(false);

        if (success && data) {
            // Gérer les différentes structures de réponse possibles
            let gameData;
            if (Array.isArray(data)) {
                gameData = data[0];
            } else if (data.data) {
                gameData = data.data;
            } else {
                gameData = data;
            }
            
            // Mettre à jour la liste des parties
            setGames(prev => [...prev, gameData]);
            // Définir la partie courante et rejoindre la room
            setCurrentGame(gameData);
            joinGameRoom(gameData._id);
            setShowCreateModal(false);
            setNotification({
                message: 'Partie créée! En attente d\'un adversaire...',
                type: 'success'
            });
            
            // Vérifier périodiquement si un joueur a rejoint
            const checkInterval = setInterval(() => {
                if (gameData.opponent && gameData.status === 'playing') {
                    clearInterval(checkInterval);
                    console.log('Joueur rejoint, démarrage automatique');
                    setGameStarted(true);
                    setIsMyTurn(true); // Le créateur commence toujours
                    setTimeRemaining(gameData.timeLimit);
                    
                    setNotification({
                        message: 'Partie démarrée! C\'est votre tour!',
                        type: 'success'
                    });
                }
            }, 2000);
            
            // Arrêter la vérification après 30 secondes
            setTimeout(() => {
                clearInterval(checkInterval);
            }, 30000);
        } else {
            setNotification({
                message: error || 'Erreur lors de la création',
                type: 'error'
            });
        }
    };

    const joinGame = async (gameId: string) => {
        const game = games.find(g => g._id === gameId);
        if (!game) return;

        // Vérifier le solde
        if (userBalance < game.stake) {
            setNotification({
                message: `Solde insuffisant pour rejoindre cette partie. Vous avez ${userBalance} points, la mise est de ${game.stake} points.`,
                type: 'error'
            });
            return;
        }
        setJoiningGameId(gameId);
        const { success, data, error } = await apiService.game.joinMultiplayerGame(gameId);
        setJoiningGameId(null);

        if (success && data) {
            console.log(data);
            // Gérer les différentes structures de réponse possibles
            let gameData;
            if (Array.isArray(data)) {
                gameData = data[0];
            } else if (data.data) {
                gameData = data.data;
            } else {
                gameData = data;
            }
            
            console.log('Données de jeu après jointure:', gameData);
            console.log('Opponent:', gameData.opponent, 'Status:', gameData.status);
            
            // Rejoindre la room et attendre l'événement gameStarted
            joinGameRoom(gameId);
            setCurrentGame(gameData);
            
            // Vérifier si la partie a maintenant deux joueurs et peut démarrer
            if (gameData.opponent && gameData.status === 'playing') {
                console.log('Démarrage automatique après jointure');
                setGameStarted(true);
                setIsMyTurn(gameData.creator._id === userId);
                setTimeRemaining(gameData.timeLimit);
                
                setNotification({
                    message: `Partie démarrée! ${gameData.creator._id === userId ? 'C\'est votre tour!' : 'En attente de l\'autre joueur...'}`,
                    type: 'success'
                });
                
                // Retirer la partie de la liste des parties en attente
                setGames(prev => prev.filter(game => game._id !== gameData._id));
            } else {
                console.log('Partie rejointe mais pas encore prête à démarrer');
                setNotification({
                    message: 'Partie rejointe! La partie va démarrer...',
                    type: 'success'
                });
                
                // Forcer la vérification du statut après un délai
                setTimeout(() => {
                    console.log('Vérification différée du statut...');
                    checkAndStartGame();
                }, 1000);
            }
        } else {
            setNotification({
                message: error || 'Erreur lors de la jointure',
                type: 'error'
            });
        }
    };

    const handlePlayTurn = async () => {
        if (!currentGame || !isMyTurn) return;
        setIsGenerating(true);
        
        // Délai de 3 secondes pour l'animation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { success, error } = await apiService.game.playMultiplayerTurn(currentGame._id);
        setIsGenerating(false);
        if (success) {
            playTurn(currentGame._id);
            setIsMyTurn(false);
            setNotification({
                message: 'Nombre généré! En attente de l\'autre joueur...',
                type: 'info'
            });
        } else {
            setNotification({
                message: error || 'Erreur lors du tour',
                type: 'error'
            });
        }
    };

    const handleTimeout = () => {
        setNotification({
            message: 'Temps écoulé! Vous avez perdu automatiquement.',
            type: 'error'
        });
        setIsMyTurn(false);
        setTimeRemaining(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value)
        }));
    };

    const leaveGame = () => {
        if (currentGame) {
            leaveGameRoom(currentGame._id);
        }
        setCurrentGame(null);
        setGameStarted(false);
        setIsMyTurn(false);
        setTimeRemaining(null);
        loadWaitingGames();
    };

    // Fonction pour vérifier et forcer le démarrage de la partie
    const checkAndStartGame = async () => {
        const now = Date.now();
        if (now - lastCheckTime < 10000) return; 
        setLastCheckTime(now);

        try {
            // Étape 1: Récupération des données brutes
            const { success, data: rawData } = await apiService.game.getGameStatus(currentGame._id);

            // Étape 2: Normalisation des données
            const responseData = normalizeApiResponse(rawData);
            console.log('Données normalisées:', responseData);

            // Étape 3: Vérification et mise à jour de l'état
            if (success && responseData?.success) {
                const gameData = responseData.data?.game || responseData.data;

                if (gameData?.status === 'playing' && gameData.opponent) {
                    console.log('Démarrage de la partie - conditions remplies');

                    // Parse currentPlayer si nécessaire
                    const currentPlayer = typeof gameData.currentPlayer === 'string'
                        ? tryParseJson(gameData.currentPlayer)
                        : gameData.currentPlayer;

                    setGameStarted(true);
                    setIsMyTurn(
                        responseData.data?.isMyTurn ??
                        (currentPlayer?._id === userId || gameData.creator._id === userId)
                    );
                    setTimeRemaining(gameData.timeLimit);

                    // Mise à jour complète du jeu
                    setCurrentGame(prev => ({
                        ...prev,
                        ...gameData,
                        creator: tryParseJson(gameData.creator),
                        opponent: tryParseJson(gameData.opponent)
                    }));

                    setNotification({
                        message: `Partie démarrée! ${gameData.creator._id === userId ? 'C\'est votre tour!' : 'En attente de l\'autre joueur...'}`,
                        type: 'success'
                    });
                } else {
                    console.log('Conditions non remplies:', {
                        status: gameData?.status,
                        hasOpponent: !!gameData?.opponent
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            // En cas d'erreur, attendre 10s avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    };

    // Fonctions utilitaires à ajouter dans le même fichier
    function normalizeApiResponse(response: any) {
        if (!response) return response;

        // Si la réponse contient data.data, utilisez cette structure
        if (response?.data?.data) {
            return {
                ...response,
                data: {
                    ...response.data.data,
                    currentPlayer: tryParseJson(response.data.data.currentPlayer),
                    game: response.data.data.game ? {
                        ...response.data.data.game,
                        creator: tryParseJson(response.data.data.game.creator),
                        opponent: tryParseJson(response.data.data.game.opponent)
                    } : undefined
                }
            };
        }
        return response;
    }

    function tryParseJson(jsonString: any) {
        if (typeof jsonString !== 'string') return jsonString;
        try {
            // Gère les ObjectId MongoDB dans les strings JSON
            const normalizedString = jsonString.replace(/ObjectId\('[^']+'\)/g, (match: string) => {
                return `"${match.split("'")[1]}"`;
            });
            return JSON.parse(normalizedString);
        } catch (e) {
            console.warn('Échec du parsing JSON:', e);
            return jsonString;
        }
    }

    const closeGameOverModal = () => {
        setShowGameOverModal(false);
        setGameResult(null);
        setCurrentGame(null);
        setGameStarted(false);
        setIsMyTurn(false);
        setTimeRemaining(null);
        loadWaitingGames();
    };

    // Interface d'attente (quand on a créé une partie mais qu'elle n'a pas encore commencé)
    if (currentGame && !gameStarted && currentGame.creator && !showCountdownBanner) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {currentGame.creator?._id === userId ? 'Partie créée' : 'Partie rejointe'} - Mise: {currentGame.stake} points
                    </h2>
                    <p className="text-gray-600">
                        {currentGame.creator?._id === userId
                            ? 'En attente d\'un adversaire...'
                            : 'La partie va bientôt commencer...'}
                    </p>
                </div>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-blue-300 p-6 rounded-2xl shadow flex flex-col items-center">
                        <h3 className="font-semibold text-lg mb-2 text-indigo-700 flex items-center gap-2">
                            👤 {currentGame.creator?._id === userId ? 'Vous' : (currentGame.creator?.firstName || 'Joueur 1')}
                        </h3>
                        <p className="text-gray-600 italic">Prêt</p>
                    </div>

                    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow flex flex-col items-center">
                        <h3 className="font-semibold text-lg mb-2 text-purple-700 flex items-center gap-2">
                            👥 {currentGame.opponent
                                ? (currentGame.opponent._id === userId ? 'Vous' : (currentGame.opponent.firstName || 'Joueur 2'))
                                : <span className="italic text-gray-400">Adversaire</span>}
                        </h3>
                        <p className="text-gray-600 italic">
                            {currentGame.opponent ? 'Prêt' : 'En attente...'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={leaveGame}
                        className="px-6 py-2 rounded-xl font-bold transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        {currentGame.creator?._id === userId ? 'Annuler la partie' : 'Quitter'}
                    </button>
                </div>
            </div>
        );
    }

    // Bannière de compte à rebours
    if (showCountdownBanner) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        La partie va commencer !
                    </h2>
                    <div className="text-6xl font-bold text-indigo-600 mb-4 animate-pulse">
                        {countdownValue}
                    </div>
                    <p className="text-gray-600">Préparez-vous...</p>
                </div>
            </div>
        );
    }

    // Modal de fin de partie
    if (showGameOverModal && gameResult) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                    <h3 className="text-2xl font-bold mb-6 text-indigo-700">
                        {gameResult.isWinner ? '🎉 Victoire !' : '😔 Défaite'}
                    </h3>
                    
                    <div className="mb-6">
                        <p className="text-lg font-semibold mb-2">
                            {gameResult.winner} gagne avec {gameResult.stake} points !
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">Joueur 1</p>
                                <p className="text-xl font-bold">{gameResult.creatorNumber}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">Joueur 2</p>
                                <p className="text-xl font-bold">{gameResult.opponentNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={closeGameOverModal}
                            className="flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                        >
                            Retour à l'accueil
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Interface de jeu en cours
    if (currentGame && gameStarted && currentGame.creator) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Partie en cours - Mise: {currentGame.stake} points
                    </h2>
                    <p className="text-gray-600">Temps de réflexion: {currentGame.timeLimit} secondes</p>
                    <p className="text-lg font-semibold mt-2">
                        {isMyTurn
                            ? "C'est votre tour !"
                            : "En attente de l'autre joueur..."}
                    </p>
                </div>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className={`bg-white border ${currentGame.creator?._id === userId ? 'border-blue-300' : 'border-gray-100'} p-6 rounded-2xl shadow flex flex-col items-center`}>
                        <h3 className="font-semibold text-lg mb-2 text-indigo-700 flex items-center gap-2">
                            👤 {currentGame.creator?._id === userId ? 'Vous' : (currentGame.creator?.firstName || 'Joueur 1')}
                        </h3>
                        <p className="text-gray-600 font-mono text-xl">
                            {currentGame.creatorNumber !== undefined ?
                                `Nombre: ${currentGame.creatorNumber}` :
                                <span className="italic text-gray-400">En attente...</span>
                            }
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {isMyTurn && currentGame.creator?._id === userId ? "En train de jouer..." : "En attente..."}
                        </p>
                    </div>

                    <div className={`bg-white border ${currentGame.opponent?._id === userId ? 'border-blue-300' : 'border-gray-100'} p-6 rounded-2xl shadow flex flex-col items-center`}>
                        <h3 className="font-semibold text-lg mb-2 text-purple-700 flex items-center gap-2">
                            👥 {currentGame.opponent
                                ? (currentGame.opponent._id === userId ? 'Vous' : (currentGame.opponent.firstName || 'Joueur 2'))
                                : <span className="italic text-gray-400">En attente...</span>}
                        </h3>
                        <p className="text-gray-600 font-mono text-xl">
                            {currentGame.opponentNumber !== undefined ?
                                `Nombre: ${currentGame.opponentNumber}` :
                                <span className="italic text-gray-400">En attente...</span>
                            }
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {isMyTurn && currentGame.opponent?._id === userId ? "En train de jouer..." : "En attente..."}
                        </p>
                    </div>
                </div>

                {isMyTurn && timeRemaining !== null && (
                    <>
                        <GameCountdown
                            timeLimit={timeRemaining}
                            onTimeout={handleTimeout}
                            key={isMyTurn ? 'my-turn' : 'not-my-turn'}
                        />
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handlePlayTurn}
                                className="px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Génération...' : 'Générer mon nombre'}
                            </button>
                        </div>
                    </>
                )}

                <div className="flex justify-center mt-6">
                    <button
                        onClick={leaveGame}
                        className="px-6 py-2 rounded-xl font-bold transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Quitter la partie
                    </button>
                </div>
            </div>
        );
    }

    // Modal de création de partie
    if (showCreateModal) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                    <h3 className="text-2xl font-bold text-center mb-6 text-indigo-700">
                        Créer une nouvelle partie
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-gray-700 font-medium">Mise (points)</label>
                            <input
                                type="number"
                                name="stake"
                                min="10"
                                max={userBalance}
                                value={formData.stake}
                                onChange={handleFormChange}
                                className="border p-3 rounded-xl w-full shadow focus:ring-2 focus:ring-indigo-300 transition-all duration-300"
                            />
                            <p className="text-sm text-gray-500 mt-1">Solde disponible: {userBalance} points</p>
                        </div>

                        <div>
                            <label className="block mb-2 text-gray-700 font-medium">Temps de réflexion (secondes)</label>
                            <input
                                type="number"
                                name="timeLimit"
                                min="10"
                                max="300"
                                value={formData.timeLimit}
                                onChange={handleFormChange}
                                className="border p-3 rounded-xl w-full shadow focus:ring-2 focus:ring-purple-300 transition-all duration-300"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={createGame}
                            disabled={formData.stake > userBalance || isCreatingGame}
                            className="flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingGame ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Interface de chargement
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Mode Multijoueur
                    </h2>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    // Interface principale (liste des parties)
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Mode Multijoueur
                </h2>
                <p className="text-gray-600">Solde disponible: {userBalance} points</p>
            </div>

            <div className="mb-10">
                <h3 className="font-semibold mb-4 text-lg text-indigo-700">Créer une partie</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    ➕ Créer une nouvelle partie
                </button>
            </div>

            <div>
                <h3 className="font-semibold mb-4 text-lg text-purple-700">Parties en attente</h3>
                {games.length > 0 ? (
                    <div className="space-y-4">
                        {games.map(game => (
                            <div
                                key={game._id}
                                className={`bg-white border ${game.creator._id === userId ? 'border-blue-300' : 'border-gray-100'} p-6 rounded-2xl shadow flex flex-col md:flex-row justify-between items-center transition-all duration-300 hover:shadow-xl`}
                            >
                                <div className="mb-2 md:mb-0">
                                    <p className="font-semibold text-indigo-700">
                                        Créée par: {game.creator.firstName}
                                        {game.creator._id === userId && ' (Votre partie)'}
                                    </p>
                                    <p className="text-gray-600">Mise: {game.stake} points - Temps: {game.timeLimit}s</p>
                                </div>
                                <button
                                    onClick={() => joinGame(game._id)}
                                    disabled={String(game.creator._id) === String(userId) || joiningGameId === game._id}
                                    className={`
                                        px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform
                                        bg-gradient-to-r from-blue-500 to-blue-700 text-white
                                        hover:from-blue-600 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl
                                        ${String(game.creator._id) === String(userId) || joiningGameId === game._id
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                        }
                                    `}
                                >
                                    {joiningGameId === game._id ? 'Connexion...' : 'Rejoindre'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Aucune partie en attente</p>
                )}
            </div>
        </div>
    );
}