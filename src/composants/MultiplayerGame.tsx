import React from 'react';
import { useState, useEffect } from 'react';
import { apiService } from '../backend/backend';
import { socket, connectSocket, disconnectSocket } from '../backend/socket';
import Notification from './notification';
import GameCountdown from './GameCountdown';

export default function MultiplayerGame() {
    const [games, setGames] = useState<any[]>([]);
    const [currentGame, setCurrentGame] = useState<any>(null);
    const [number, setNumber] = useState<number | null>(null);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const [formData, setFormData] = useState({
        stake: 50,
        timeLimit: 60
    });

    // Initialisation Socket.IO
    useEffect(() => {
        connectSocket();
        loadWaitingGames();

        socket.on('game-created', (game: any) => {
            setGames(prev => [...prev, game]);
        });

        socket.on('player-joined', (game: any) => {
            setCurrentGame(game);
            setNotification({
                message: `Partie rejointe! Temps limite: ${game.timeLimit}s`,
                type: 'success'
            });
        });

        socket.on('turn-played', (gameId: string, playerId: string, playedNumber: number) => {
            if (currentGame?._id === gameId) {
                const isCreator = playerId === currentGame.creator._id;
                setCurrentGame(prev => ({
                    ...prev,
                    [isCreator ? 'creatorNumber' : 'opponentNumber']: playedNumber
                }));
            }
        });

        socket.on('game-ended', (gameId: string, winnerId: string) => {
            if (currentGame?._id === gameId) {
                const isWinner = winnerId === localStorage.getItem('userId');
                setNotification({
                    message: isWinner
                        ? `Vous avez gagné ${currentGame.stake} points!`
                        : `Vous avez perdu ${currentGame.stake} points...`,
                    type: isWinner ? 'success' : 'error'
                });
                setCurrentGame(prev => ({ ...prev, status: 'finished', winner: winnerId }));
            }
        });

        return () => {
            disconnectSocket();
            socket.off('game-created');
            socket.off('player-joined');
            socket.off('turn-played');
            socket.off('game-ended');
        };
    }, [currentGame]);

    const loadWaitingGames = async () => {
        const { success, data } = await apiService.game.listWaitingGames();
        if (success && data) {
            setGames(data.data || []);
        }
    };

    const createGame = async () => {
        const { success, data, error } = await apiService.game.createMultiplayerGame(
            formData.stake,
            formData.timeLimit
        );

        if (success && data) {
            socket.emit('join-game', data.data._id);
            setCurrentGame(data.data);
        } else {
            setNotification({
                message: error || 'Erreur lors de la création',
                type: 'error'
            });
        }
    };

    const joinGame = async (gameId: string) => {
        const { success, data, error } = await apiService.game.joinMultiplayerGame(gameId);

        if (success && data) {
            socket.emit('join-game', gameId);
            setCurrentGame(data.data);
        } else {
            setNotification({
                message: error || 'Erreur lors de la jointure',
                type: 'error'
            });
        }
    };

    const playTurn = async () => {
        if (!currentGame || number === null) return;

        const { success, error } = await apiService.game.playMultiplayerTurn(
            currentGame._id,
            number
        );

        if (success) {
            socket.emit('play-turn', currentGame._id, number);
        } else {
            setNotification({
                message: error || 'Erreur lors du tour',
                type: 'error'
            });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value)
        }));
    };

    if (currentGame) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Partie {currentGame._id.slice(-6)} - Mise: {currentGame.stake} points
                    </h2>
                </div>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow flex flex-col items-center">
                        <h3 className="font-semibold text-lg mb-2 text-indigo-700 flex items-center gap-2">👤 {currentGame.creator.firstName}</h3>
                        <p className="text-gray-600 font-mono text-xl">{currentGame.creatorNumber !== undefined ?
                            `Nombre: ${currentGame.creatorNumber}` : <span className="italic text-gray-400">En attente...</span>}</p>
                    </div>
                    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow flex flex-col items-center">
                        <h3 className="font-semibold text-lg mb-2 text-purple-700 flex items-center gap-2">{currentGame.opponent?.firstName ? `👥 ${currentGame.opponent.firstName}` : <span className="italic text-gray-400">En attente...</span>}</h3>
                        <p className="text-gray-600 font-mono text-xl">{currentGame.opponentNumber !== undefined ?
                            `Nombre: ${currentGame.opponentNumber}` : <span className="italic text-gray-400">En attente...</span>}</p>
                    </div>
                </div>

                {currentGame.status === 'playing' && (
                    <>
                        <GameCountdown
                            timeLimit={currentGame.timeLimit}
                            onTimeout={() => setNotification({
                                message: 'Temps écoulé!',
                                type: 'error'
                            })}
                        />

                        <div className="flex gap-4 justify-center mt-6">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={number || ''}
                                onChange={(e) => setNumber(parseInt(e.target.value))}
                                className="border p-3 rounded-xl text-lg w-32 shadow focus:ring-2 focus:ring-indigo-300 transition-all duration-300"
                                placeholder="0-100"
                            />
                            <button
                                onClick={playTurn}
                                className="px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Jouer
                            </button>
                        </div>
                    </>
                )}

                {currentGame.status === 'finished' && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl shadow text-center">
                        <h3 className="text-2xl font-bold text-green-700 animate-bounce">
                            {currentGame.winner === localStorage.getItem('userId') ?
                                '🎉 Vous avez gagné !' : '😢 Vous avez perdu...'}
                        </h3>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Mode Multijoueur</h2>
            </div>

            <div className="mb-10">
                <h3 className="font-semibold mb-2 text-lg text-indigo-700">Créer une partie</h3>
                <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Mise (points)</label>
                        <input
                            type="number"
                            name="stake"
                            min="10"
                            value={formData.stake}
                            onChange={handleFormChange}
                            className="border p-3 rounded-xl w-full shadow focus:ring-2 focus:ring-indigo-300 transition-all duration-300"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Temps limite (s)</label>
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
                <button
                    onClick={createGame}
                    className="px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    ➕ Créer une partie
                </button>
            </div>

            <div>
                <h3 className="font-semibold mb-2 text-lg text-purple-700">Parties en attente</h3>
                {games.length > 0 ? (
                    <div className="space-y-4">
                        {games.map(game => (
                            <div key={game._id} className="bg-white border border-gray-100 p-6 rounded-2xl shadow flex flex-col md:flex-row justify-between items-center transition-all duration-300 hover:shadow-xl">
                                <div className="mb-2 md:mb-0">
                                    <p className="font-semibold text-indigo-700">Créée par: {game.creator.firstName}</p>
                                    <p className="text-gray-600">Mise: {game.stake} points - Temps: {game.timeLimit}s</p>
                                </div>
                                <button
                                    onClick={() => joinGame(game._id)}
                                    className="px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl"
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