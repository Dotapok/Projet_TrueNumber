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
  const [generatingNumber, setGeneratingNumber] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

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

  const animateNumberGeneration = () => {
    let count = 0;
    const interval = setInterval(() => {
      setGeneratingNumber(Math.floor(Math.random() * 100) + 1);
      count++;
      if (count > 20) {
        clearInterval(interval);
      }
    }, 100);
    return interval;
  };

  const playGame = async () => {
    try {
      setLoading(prev => ({ ...prev, game: true }));
      setShowResult(false);

      // Animation de génération
      const animationInterval = animateNumberGeneration();

      const { success, data, error } = await apiService.user.playGame();

      if (!success || !data) {
        clearInterval(animationInterval);
        setGeneratingNumber(null);
        throw new Error(error || 'Erreur lors du jeu');
      }

      const gameData: GameResult = data.data;

      // Arrêter l'animation et afficher le vrai nombre
      setTimeout(() => {
        clearInterval(animationInterval);
        setGeneratingNumber(gameData.number);
        setShowResult(true);
        updateGameState(gameData);
        showGameResultNotification(gameData);

        // Réinitialiser après 3 secondes
        setTimeout(() => {
          setGeneratingNumber(null);
          setShowResult(false);
        }, 3000);
      }, 2000);

    } catch (error) {
      handleApiError(error, 'Erreur lors du jeu');
      setGeneratingNumber(null);
      setShowResult(false);
    } finally {
      setTimeout(() => {
        setLoading(prev => ({ ...prev, game: false }));
      }, 2000);
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
        ? `🎉 Félicitations ! Vous avez gagné ${gameData.pointsChange} points avec le nombre ${gameData.number}`
        : `😔 Désolé, vous avez perdu ${Math.abs(gameData.pointsChange)} points avec le nombre ${gameData.number}`,
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
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mt-6 transition-all duration-300 hover:shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          TrueNumber
        </h2>
        <p className="text-gray-600">Testez votre chance avec les nombres magiques !</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${!isMultiplayer
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          onClick={() => setIsMultiplayer(false)}
        >
          🎯 Solo
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${isMultiplayer
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          onClick={() => setIsMultiplayer(true)}
        >
          👥 Multijoueur
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

          {/* Points Display */}
          <div className="bg-white rounded-xl p-3 mb-4 shadow border border-gray-100 max-w-xs mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-full">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-700 mb-0.5">Votre solde</h3>
                <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {points.toLocaleString()} pts
                </p>
              </div>
            </div>
          </div>

          {/* Number Generation Area */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-100 text-center">
            {generatingNumber !== null ? (
              <div className="py-8">
                <div className={`text-8xl font-bold mb-4 transition-all duration-300 ${showResult
                    ? 'text-green-500 animate-bounce'
                    : 'text-gray-400 animate-pulse'
                  }`}>
                  {generatingNumber}
                </div>
                {!showResult && (
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
                {showResult && (
                  <p className="text-green-600 font-semibold text-xl animate-pulse">
                    ✨ Votre nombre magique ! ✨
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8">
                <div className="text-6xl text-gray-300 mb-4">?</div>
                <p className="text-gray-500 text-lg">Cliquez pour générer votre nombre</p>
              </div>
            )}
          </div>

          {/* Play Button */}
          <div className="text-center mb-8">
            <button
              onClick={playGame}
              disabled={loading.game}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform ${loading.game
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
            >
              {loading.game ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Génération en cours...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>🎲</span>
                  <span>Générer mon nombre</span>
                  <span>✨</span>
                </div>
              )}
            </button>
          </div>

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
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
        <span>📊</span>
        <span>Historique des parties</span>
      </h3>
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${loading
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg'
          }`}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>🔄</span>
            <span>Rafraîchir</span>
          </div>
        )}
      </button>
    </div>

    {gameHistory.length > 0 ? (
      <div className="overflow-x-auto">
        <div className="hidden md:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">📅 Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">🎲 Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">🏆 Résultat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">💰 Points</th>
              </tr>
            </thead>
            <tbody>
              {gameHistory.map((game, index) => (
                <tr
                  key={game._id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-3 text-gray-600">{formatDate(game.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">
                      {game.number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ResultBadge result={game.result} />
                  </td>
                  <td className={`px-4 py-3 font-bold ${game.pointsChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {game.pointsChange > 0 ? '+' : ''}{game.pointsChange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {gameHistory.map((game, index) => (
            <div
              key={game._id}
              className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold text-lg">
                  {game.number}
                </span>
                <ResultBadge result={game.result} />
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>{formatDate(game.createdAt)}</span>
                <span className={`font-bold ${game.pointsChange > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {game.pointsChange > 0 ? '+' : ''}{game.pointsChange} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <div className="text-6xl text-gray-300 mb-4">🎯</div>
        <p className="text-gray-500 text-lg">Aucun historique disponible</p>
        <p className="text-gray-400">Commencez à jouer pour voir vos résultats !</p>
      </div>
    )}
  </div>
);

interface ResultBadgeProps {
  result: 'win' | 'lose';
}

const ResultBadge = ({ result }: ResultBadgeProps) => (
  <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1 ${result === 'win'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
    }`}>
    <span>{result === 'win' ? '🏆' : '💔'}</span>
    <span>{result === 'win' ? 'Gagné' : 'Perdu'}</span>
  </span>
);