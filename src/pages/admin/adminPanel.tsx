import { useEffect, useState } from 'react';
import { apiService } from '../../backend/backend';
import Notification from '../../composants/notification';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: string;
}

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
}

interface GameResult {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  number: number;
  result: 'win' | 'lose';
  pointsChange: number;
  newBalance: number;
  createdAt: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [newUser, setNewUser] = useState<UserForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User & { password: string } | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [showGameHistory, setShowGameHistory] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadGameHistory = async () => {
    try {
      setLoading(true);
      const { success, data } = await apiService.admin.getAllGames();
      
      if (success && data) {
        console.log(data);
        const historyData = data.data?.games || data.data || data || [];
        const safeHistory = Array.isArray(historyData) 
          ? historyData.map(game => ({
              ...game,
              user: game.user ? {
                _id: game.user._id,
                firstName: game.user.firstName,
                lastName: game.user.lastName
              } : null
            }))
          : [];
        setGameHistory(safeHistory);
      } else {
        setGameHistory([]);
      }
    } catch (error) {
      console.error("Error loading game history:", error);
      setGameHistory([]);
      setNotification({
        message: 'Erreur lors du chargement de l\'historique des parties',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { success, data } = await apiService.admin.getAllUsers();
      
      if (success && data) {
        const usersData = data.data?.users || data.data || data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        setUsers([]); 
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]); 
      setNotification({
        message: 'Erreur lors du chargement des utilisateurs',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/connexion');
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        setLoading(true);
        const { success, error } = await apiService.admin.deleteUser(userId);
        if (success) {
          setNotification({
            message: 'Utilisateur supprimé avec succès',
            type: 'success'
          });
          loadUsers();
        } else {
          setNotification({
            message: error || 'Échec de la suppression',
            type: 'error'
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { success, error } = await apiService.admin.createUser(newUser);
      if (success) {
        setNotification({
          message: 'Utilisateur créé avec succès',
          type: 'success'
        });
        setShowCreateForm(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'user'
        });
        loadUsers();
      } else {
        setNotification({
          message: error || 'Échec de la création',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (currentUser) {
      setCurrentUser(prev => ({ ...prev!, [name]: value }));
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      
      const userData = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone,
        role: currentUser.role,
        ...(currentUser.password && { password: currentUser.password })
      };

      const { success, error } = await apiService.admin.updateUser(
        currentUser._id,
        userData
      );

      if (success) {
        setNotification({
          message: 'Utilisateur mis à jour avec succès',
          type: 'success'
        });
        setShowUserForm(false);
        loadUsers();
      } else {
        setNotification({
          message: error || 'Échec de la mise à jour',
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      setNotification({
        message: 'Erreur lors de la mise à jour',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user: User) => {
    setCurrentUser({ ...user, password: '' });
    setShowUserDetails(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">Panneau d'administration</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                {showCreateForm ? 'Annuler' : 'Créer un utilisateur'}
              </button>
              <button
                onClick={() => {
                  setShowGameHistory(!showGameHistory);
                  if (!showGameHistory) loadGameHistory();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {showGameHistory ? 'Masquer historique' : 'Voir historique des parties'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
          
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          {showCreateForm && (
            <div className="bg-gray-50 p-6 rounded-md mb-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Nouvel utilisateur</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newUser.phone}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rôle</label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.points}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewDetails(user)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => {
                            setCurrentUser({ ...user, password: '' });
                            setShowUserForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Modifier
                        </button>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => deleteUser(user._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showGameHistory && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-indigo-600 mb-4">Historique des parties</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Résultat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nouveau solde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gameHistory.map(game => (
                  <tr key={game._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {game.user ? `${game.user._id}` : 'Utilisateur supprimé'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game.result === 'win' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {game.result === 'win' ? 'Gagné' : 'Perdu'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      game.pointsChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {game.pointsChange >= 0 ? '+' : ''}{game.pointsChange}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.newBalance}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(game.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showUserDetails} onClose={() => setShowUserDetails(false)} title="Détails de l'utilisateur">
        {currentUser && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Nom complet:</span>
              <span>{currentUser.firstName} {currentUser.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Téléphone:</span>
              <span>{currentUser.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Rôle:</span>
              <span className={`px-2 py-1 rounded-full text-sm ${
                currentUser.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Points:</span>
              <span>{currentUser.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Créé le:</span>
              <span>{new Date(currentUser.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showUserForm} onClose={() => setShowUserForm(false)} title="Modifier utilisateur">
        {currentUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={currentUser.firstName}
                onChange={handleUserChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="lastName"
                value={currentUser.lastName}
                onChange={handleUserChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={currentUser.email}
                onChange={handleUserChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={currentUser.phone}
                onChange={handleUserChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe (laissez vide pour ne pas modifier)</label>
              <input
                type="password"
                name="password"
                value={currentUser.password}
                onChange={handleUserChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rôle</label>
              <select
                name="role"
                value={currentUser.role}
                onChange={handleUserChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}