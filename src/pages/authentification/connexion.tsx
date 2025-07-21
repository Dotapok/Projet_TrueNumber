import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../backend/backend';
import Notification from '../../composants/notification';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiService.auth.login(email, password);

      if (response.success) {
        const userData = response.data?.data.user;
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          const redirectPath = userData.role === 'admin' ? '/admin' : '/profil';
          
          setNotification({
            message: 'Connexion réussie! Redirection...',
            type: 'success',
          });
          setTimeout(() => navigate(redirectPath), 2000);
        }
      } else {
        setNotification({
          message: response.error || 'Échec de la connexion',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setNotification({
        message: 'Erreur lors de la connexion',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold text-center text-indigo-600 mb-6 md:mb-8">Connexion</h1>
        
        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connexion en cours...</span>
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-600">
          Pas encore de compte?{' '}
          <a href="/inscription" className="font-medium text-indigo-600 hover:text-indigo-500">
            S'inscrire
          </a>
        </p>
        <div className="text-center mt-3 md:mt-4">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}