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
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h3>
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
        const historyData = Array.isArray(data.data?.games) ? data.data.games : 
                          Array.isArray(data.data) ? data.data : 
                          Array.isArray(data) ? data : [];
        setGameHistory(historyData.map(game => ({
          ...game,
          user: game.user ? {
            _id: game.user._id,
            firstName: game.user.firstName,
            lastName: game.user.lastName
          } : null
        })));
      }
    } catch (error) {
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
        const usersData = Array.isArray(data.data?.users) ? data.data.users : 
                        Array.isArray(data.data) ? data.data : 
                        Array.isArray(data) ? data : [];
        setUsers(usersData);
      }
    } catch (error) {
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
        const { success } = await apiService.admin.deleteUser(userId);
        if (success) {
          setNotification({
            message: 'Utilisateur supprimé avec succès',
            type: 'success'
          });
          loadUsers();
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
      const { success } = await apiService.admin.createUser(newUser);
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

      const { success } = await apiService.admin.updateUser(currentUser._id, userData);

      if (success) {
        setNotification({
          message: 'Utilisateur mis à jour avec succès',
          type: 'success'
        });
        setShowUserForm(false);
        loadUsers();
      }
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
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-600">Panneau d'administration</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-3 py-2 md:px-4 md:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm md:text-base"
              >
                {showCreateForm ? 'Annuler' : 'Créer utilisateur'}
              </button>
              <button
                onClick={() => {
                  setShowGameHistory(!showGameHistory);
                  if (!showGameHistory) loadGameHistory();
                }}
                className="px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm md:text-base"
              >
                {showGameHistory ? 'Masquer historique' : 'Historique parties'}
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 md:px-4 md:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm md:text-base"
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
            <div className="bg-gray-50 p-4 md:p-6 rounded-md mb-6 shadow-sm">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Nouvel utilisateur</h3>
              <form onSubmit={handleCreateUser} className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newUser.phone}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Rôle</label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm md:text-base"
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-1 md:gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="text-blue-600 hover:text-blue-900 text-xs md:text-sm"
                          >
                            Détails
                          </button>
                          <button
                            onClick={() => {
                              setCurrentUser({ ...user, password: '' });
                              setShowUserForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 text-xs md:text-sm"
                          >
                            Modifier
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => deleteUser(user._id)}
                              className="text-red-600 hover:text-red-900 text-xs md:text-sm"
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
          <div className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-indigo-600 mb-4">Historique des parties</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joueur
                    </th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Résultat
                    </th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gameHistory.map((game) => (
                    <tr key={game._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {game.user ? `${game.user.firstName} ${game.user.lastName}` : 'Utilisateur supprimé'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          game.result === 'win' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {game.result === 'win' ? 'Gagné' : 'Perdu'}
                        </span>
                      </td>
                      <td className={`px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm ${
                        game.pointsChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {game.pointsChange >= 0 ? '+' : ''}{game.pointsChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showUserDetails} onClose={() => setShowUserDetails(false)} title="Détails de l'utilisateur">
        {currentUser && (
          <div className="space-y-3 text-sm md:text-base">
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
              <span className={`px-2 py-1 rounded-full text-xs ${
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
          <form onSubmit={handleUpdateUser} className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={currentUser.firstName}
                onChange={handleUserChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="lastName"
                value={currentUser.lastName}
                onChange={handleUserChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={currentUser.email}
                onChange={handleUserChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={currentUser.phone}
                onChange={handleUserChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">Nouveau mot de passe</label>
              <input
                type="password"
                name="password"
                value={currentUser.password}
                onChange={handleUserChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                placeholder="Laissez vide pour ne pas modifier"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">Rôle</label>
              <select
                name="role"
                value={currentUser.role}
                onChange={handleUserChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm md:text-base"
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