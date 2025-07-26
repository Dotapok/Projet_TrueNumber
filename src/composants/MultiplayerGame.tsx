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
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">
                    Partie {currentGame._id.slice(-6)} - Mise: {currentGame.stake} points
                </h2>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border p-4 rounded">
                        <h3 className="font-semibold">{currentGame.creator.firstName}</h3>
                        <p>{currentGame.creatorNumber !== undefined ?
                            `Nombre: ${currentGame.creatorNumber}` : 'En attente...'}</p>
                    </div>
                    <div className="border p-4 rounded">
                        <h3 className="font-semibold">
                            {currentGame.opponent?.firstName || 'En attente...'}
                        </h3>
                        <p>{currentGame.opponentNumber !== undefined ?
                            `Nombre: ${currentGame.opponentNumber}` : 'En attente...'}</p>
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

                        <div className="flex gap-4">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={number || ''}
                                onChange={(e) => setNumber(parseInt(e.target.value))}
                                className="border p-2 rounded"
                                placeholder="0-100"
                            />
                            <button
                                onClick={playTurn}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                Jouer
                            </button>
                        </div>
                    </>
                )}

                {currentGame.status === 'finished' && (
                    <div className="mt-4 p-4 bg-gray-100 rounded">
                        <h3 className="font-bold">
                            {currentGame.winner === localStorage.getItem('userId') ?
                                'Vous avez gagné!' : 'Vous avez perdu...'}
                        </h3>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Mode Multijoueur</h2>

            <div className="mb-6">
                <h3 className="font-semibold mb-2">Créer une partie</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-1">Mise (points)</label>
                        <input
                            type="number"
                            name="stake"
                            min="10"
                            value={formData.stake}
                            onChange={handleFormChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Temps limite (s)</label>
                        <input
                            type="number"
                            name="timeLimit"
                            min="10"
                            max="300"
                            value={formData.timeLimit}
                            onChange={handleFormChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
                <button
                    onClick={createGame}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Créer une partie
                </button>
            </div>

            <div>
                <h3 className="font-semibold mb-2">Parties en attente</h3>
                {games.length > 0 ? (
                    <div className="space-y-2">
                        {games.map(game => (
                            <div key={game._id} className="border p-4 rounded flex justify-between items-center">
                                <div>
                                    <p>Créée par: {game.creator.firstName}</p>
                                    <p>Mise: {game.stake} points - Temps: {game.timeLimit}s</p>
                                </div>
                                <button
                                    onClick={() => joinGame(game._id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Rejoindre
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Aucune partie en attente</p>
                )}
            </div>
        </div>
    );
}