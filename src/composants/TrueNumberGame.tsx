import { useState, useEffect } from 'react';
import { apiService } from '../backend/backend';
import Notification from './notification';
import MultiplayerGame from './MultiplayerGame';

interface GameHistoryItem {
  _id: string;
  number: number;
  result: 'win' | 'lose';
  pointsChange: number;
  createdAt: string;
}

interface GameResult {
  gameId: string;
  number: number;
  result: 'win' | 'lose';
  pointsChange: number;
  newBalance: number;
  createdAt: string;
}

export default function TrueNumberGame() {
  const [loading, setLoading] = useState({
    game: false,
    history: false,
    profile: false
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const handleApiError = (error: unknown, defaultMessage: string) => {
    const message = error instanceof Error ? error.message : defaultMessage;
    setNotification({ message, type: 'error' });
    console.error(error);
  };

  const fetchUserPoints = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const savedUser = localStorage.getItem('user');

      if (savedUser) {
        const user = JSON.parse(savedUser);
        setPoints(user.points);
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement du profil');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const playGame = async () => {
    try {
      setLoading(prev => ({ ...prev, game: true }));
      const { success, data, error } = await apiService.user.playGame();

      if (!success || !data) {
        throw new Error(error || 'Erreur lors du jeu');
      }

      const gameData: GameResult = data.data;
      updateGameState(gameData);
      showGameResultNotification(gameData);
    } catch (error) {
      handleApiError(error, 'Erreur lors du jeu');
    } finally {
      setLoading(prev => ({ ...prev, game: false }));
    }
  };

  const updateGameState = (gameData: GameResult) => {
    setPoints(gameData.newBalance);
    addGameToHistory(gameData);
  };

  const addGameToHistory = (gameData: GameResult) => {
    setGameHistory(prev => [{
      _id: gameData.gameId,
      number: gameData.number,
      result: gameData.result,
      pointsChange: gameData.pointsChange,
      createdAt: gameData.createdAt
    }, ...prev]);
  };

  const showGameResultNotification = (gameData: GameResult) => {
    setNotification({
      message: gameData.result === 'win'
        ? `Félicitations ! Vous avez gagné ${gameData.pointsChange} points avec le nombre ${gameData.number}`
        : `Désolé, vous avez perdu ${Math.abs(gameData.pointsChange)} points avec le nombre ${gameData.number}`,
      type: gameData.result === 'win' ? 'success' : 'error'
    });
  };

  const loadGameHistory = async () => {
    try {
      setLoading(prev => ({ ...prev, history: true }));
      const { success, data, error } = await apiService.user.getGameHistory();

      if (!success || !data) {
        throw new Error(error || 'Historique non disponible');
      }

      const games = data.data?.games || [];
      setGameHistory(games.map(formatHistoryItem));
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement de l\'historique');
      setGameHistory([]);
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const formatHistoryItem = (item: any): GameHistoryItem => ({
    _id: item._id,
    number: item.number,
    result: item.result,
    pointsChange: item.pointsChange,
    createdAt: item.createdAt
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchUserPoints(), loadGameHistory()]);
    };

    initializeData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">TrueNumber</h2>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${!isMultiplayer ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setIsMultiplayer(false)}
        >
          Solo
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${isMultiplayer ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setIsMultiplayer(true)}
        >
          Multijoueur
        </button>
      </div>

      {isMultiplayer ? (
        <MultiplayerGame />
      ) : (
        <>
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Votre solde: {points} points
            </h3>
          </div>

          <button
            onClick={playGame}
            disabled={loading.game}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading.game ? 'En cours...' : 'Générer un nombre'}
          </button>

          <GameHistorySection
            gameHistory={gameHistory}
            loading={loading.history}
            onRefresh={loadGameHistory}
            formatDate={formatDate}
          />
        </>
      )}
    </div>
  );
}

interface GameHistorySectionProps {
  gameHistory: GameHistoryItem[];
  loading: boolean;
  onRefresh: () => void;
  formatDate: (dateString: string) => string;
}

const GameHistorySection = ({
  gameHistory,
  loading,
  onRefresh,
  formatDate
}: GameHistorySectionProps) => (
  <div className="mt-8">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-700">
        Historique des parties
      </h3>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Chargement...' : 'Rafraîchir'}
      </button>
    </div>

    {gameHistory.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Résultat</th>
              <th className="px-4 py-2 text-left">Points</th>
            </tr>
          </thead>
          <tbody>
            {gameHistory.map((game) => (
              <tr key={game._id} className="border-b">
                <td className="px-4 py-2">{formatDate(game.createdAt)}</td>
                <td className="px-4 py-2">{game.number}</td>
                <td className="px-4 py-2">
                  <ResultBadge result={game.result} />
                </td>
                <td className={`px-4 py-2 ${game.pointsChange > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {game.pointsChange > 0 ? '+' : ''}{game.pointsChange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500">Aucun historique disponible</p>
    )}
  </div>
);

interface ResultBadgeProps {
  result: 'win' | 'lose';
}

const ResultBadge = ({ result }: ResultBadgeProps) => (
  <span className={`px-2 py-1 rounded-full text-xs ${result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
    {result === 'win' ? 'Gagné' : 'Perdu'}
  </span>
);