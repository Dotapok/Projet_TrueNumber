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
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const [formData, setFormData] = useState({
        stake: 50,
        timeLimit: 60
    });
    const [userBalance, setUserBalance] = useState<number>(0);
    const userId = localStorage.getItem('userId');

    // Initialisation Socket.IO et chargement des données
    useEffect(() => {
        connectSocket();
        loadWaitingGames();
        loadUserBalance();

        // Écouteurs d'événements Socket.IO
        onJoinedRoom((data) => {
            console.log('Rejoint la room:', data.room);
        });

        onGameStarted((data: GameStartedData) => {
            console.log('Partie démarrée:', data);
            setCurrentGame(data.game);
            setGameStarted(true);
            setIsMyTurn(data.currentPlayer === userId);
            setTimeRemaining(data.timeLimit);

            // Retirer la partie de la liste des parties en attente
            setGames(prev => prev.filter(game => game._id !== data.game._id));

            setNotification({
                message: `Partie démarrée! ${data.currentPlayer === userId ? 'C\'est votre tour!' : 'En attente de l\'autre joueur...'}`,
                type: 'success'
            });
        });

        onGameUpdate((data: GameUpdateData) => {
            console.log('Mise à jour du jeu:', data);
            setCurrentGame(data.game);

            if (data.finished) {
                setGameStarted(false);
                setIsMyTurn(false);
                setTimeRemaining(null);

                const isWinner = data.game.winner === userId;
                const winnerName = isWinner ? 'Vous' :
                    (data.game.winner === data.game.creator._id ? data.game.creator.firstName : data.game.opponent?.firstName);

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

    const loadWaitingGames = async () => {
        const { success, data } = await apiService.game.listWaitingGames();
        if (success && data) {
            setGames(data.data || []);
        }
    };

    const loadUserBalance = async () => {
        const { success, data } = await apiService.user.getPointsBalance();
        if (success && data) {
            setUserBalance(data.data.points);
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

        const { success, data, error } = await apiService.game.createMultiplayerGame(
            formData.stake,
            formData.timeLimit
        );

        if (success && data) {
            setGames(prev => [...prev, data.data]);
            joinGameRoom(data.data._id);
            setShowCreateModal(false);
            setNotification({
                message: 'Partie créée! En attente d\'un adversaire...',
                type: 'success'
            });
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

        // Empêcher de rejoindre sa propre partie
        if (game.creator._id === userId) {
            setNotification({
                message: 'Vous ne pouvez pas rejoindre votre propre partie',
                type: 'error'
            });
            return;
        }

        // Vérifier le solde
        if (userBalance < game.stake) {
            setNotification({
                message: `Solde insuffisant pour rejoindre cette partie. Vous avez ${userBalance} points, la mise est de ${game.stake} points.`,
                type: 'error'
            });
            return;
        }

        const { success, data, error } = await apiService.game.joinMultiplayerGame(gameId);

        if (success && data) {
            joinGameRoom(gameId);
            setNotification({
                message: 'Partie rejointe! La partie va démarrer...',
                type: 'success'
            });
        } else {
            setNotification({
                message: error || 'Erreur lors de la jointure',
                type: 'error'
            });
        }
    };

    const handlePlayTurn = async () => {
        if (!currentGame || !isMyTurn) return;

        const { success, error } = await apiService.game.playMultiplayerTurn(currentGame._id);

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
                            disabled={formData.stake > userBalance}
                            className="flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Créer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Interface de jeu en cours
    if (currentGame && gameStarted) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Partie en cours - Mise: {currentGame.stake} points
                    </h2>
                    <p className="text-gray-600">Temps de réflexion: {currentGame.timeLimit} secondes</p>
                </div>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className={`bg-white border ${currentGame.creator._id === userId ? 'border-blue-300' : 'border-gray-100'} p-6 rounded-2xl shadow flex flex-col items-center`}>
                        <h3 className="font-semibold text-lg mb-2 text-indigo-700 flex items-center gap-2">
                            👤 {currentGame.creator.firstName}
                            {currentGame.creator._id === userId && ' (Vous)'}
                        </h3>
                        <p className="text-gray-600 font-mono text-xl">
                            {currentGame.creatorNumber !== undefined ?
                                `Nombre: ${currentGame.creatorNumber}` :
                                <span className="italic text-gray-400">En attente...</span>
                            }
                        </p>
                    </div>

                    <div className={`bg-white border ${currentGame.opponent?._id === userId ? 'border-blue-300' : 'border-gray-100'} p-6 rounded-2xl shadow flex flex-col items-center`}>
                        <h3 className="font-semibold text-lg mb-2 text-purple-700 flex items-center gap-2">
                            {currentGame.opponent?.firstName ?
                                `👥 ${currentGame.opponent.firstName}` :
                                <span className="italic text-gray-400">En attente...</span>
                            }
                            {currentGame.opponent?._id === userId && ' (Vous)'}
                        </h3>
                        <p className="text-gray-600 font-mono text-xl">
                            {currentGame.opponentNumber !== undefined ?
                                `Nombre: ${currentGame.opponentNumber}` :
                                <span className="italic text-gray-400">En attente...</span>
                            }
                        </p>
                    </div>
                </div>

                {isMyTurn && timeRemaining !== null && (
                    <>
                        <GameCountdown
                            timeLimit={timeRemaining}
                            onTimeout={handleTimeout}
                        />
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handlePlayTurn}
                                className="px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Générer mon nombre
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
                                    {game.creator._id === userId && (
                                        <p className="text-blue-500 text-sm mt-1">En attente d'un adversaire...</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => joinGame(game._id)}
                                    disabled={game.creator._id === userId}
                                    className={`px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl ${game.creator._id === userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Rejoindre
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