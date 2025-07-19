import { useState, useEffect } from 'react';
import { apiService } from '../backend/backend';
import Notification from './notification';

export default function TrueNumberGame() {
  const [loading, setLoading] = useState({
    game: false,
    history: false
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [points, setPoints] = useState(0);
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  const playGame = async () => {
    try {
      setLoading(prev => ({ ...prev, game: true }));
      const { success, data, error } = await apiService.user.playGame();

      if (success && data) {
        console.log("Réponse du jeu:", data);
        // Accédez à data.data qui contient les vraies données
        const gameData = data.data;
        
        setPoints(gameData.newBalance); // Utilisez gameData au lieu de data directement
        
        setGameHistory(prev => [{
          _id: gameData.gameId, // Ajout de l'ID
          number: gameData.number,
          result: gameData.result,
          pointsChange: gameData.pointsChange,
          date: new Date(gameData.createdAt).toLocaleString()
        }, ...prev]);

        setNotification({
          message: gameData.result === 'win' 
            ? `Félicitations ! Vous avez gagné avec le nombre ${gameData.number} points` 
            : `Désolé, vous avez perdu avec le nombre ${gameData.number} points`,
          type: gameData.result === 'win' ? 'success' : 'error'
        });
      } else {
        setNotification({
          message: error || 'Erreur lors du jeu',
          type: 'error'
        });
      }
    } catch (err) {
      setNotification({
        message: 'Erreur lors du jeu',
        type: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, game: false }));
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(prev => ({ ...prev, history: true }));
      const { success, data, error } = await apiService.user.getGameHistory();

      if (success && data) {
        console.log("Données reçues:", data);
        
        // Accédez correctement au tableau de jeux
        const games = data.data?.games || []; // Notez le data.data.games
        
        setGameHistory(games.map((item) => ({
          _id: item._id, // Ajout de l'ID si nécessaire
          number: item.number,
          result: item.result,
          pointsChange: item.pointsChange,
          date: new Date(item.createdAt).toLocaleString()
        })));
      } else {
        setNotification({
          message: error || 'Historique non disponible',
          type: 'info'
        });
        setGameHistory([]); 
      }
    } catch (err) {
      setNotification({
        message: 'Erreur lors du chargement de l\'historique',
        type: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const fetchProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          // Sécuriser le parsing JSON
          if (typeof savedUser === 'string' && savedUser.trim() !== '') {
            const user = JSON.parse(savedUser);
            setPoints(user.points);
          } else {
            console.warn('User data in localStorage is empty or invalid');
          }
        } catch (e) {
          console.error('Error parsing saved user', e);
          setNotification({
            message: 'Erreur lors du chargement des données utilisateur',
            type: 'error'
          });
        }
      }
    };

  useEffect(() => {
    fetchProfile();
    loadHistory();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">TrueNumber</h2>
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Votre solde: {points} points</h3>
      </div>

      <button
        onClick={playGame}
        disabled={loading.game}
        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading.game ? 'En cours...' : 'Générer un nombre'}
      </button>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Historique des parties</h3>
          <button
            onClick={loadHistory}
            disabled={loading.history}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            {loading.history ? 'Chargement...' : 'Rafraîchir'}
          </button>
        </div>

        {gameHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Résultat</th>
                  <th className="px-4 py-2 text-left">Points</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((game, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{game._id}</td>
                    <td className="px-4 py-2">{game.number}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game.result === 'win' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {game.result === 'win' ? 'Gagné' : 'Perdu'}
                      </span>
                    </td>
                    <td className={`px-4 py-2 ${
                      game.pointsChange > 0 ? 'text-green-600' : 'text-red-600'
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
    </div>
  );
}