import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../backend/backend';
import Notification from '../../composants/notification';
import NavigationBar from '../../composants/NavigationBar';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    // Génération de particules flottantes
    const particleArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
    }));
    setParticles(particleArray);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-bounce"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>
      {/* Grille SVG en fond */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className={`relative z-10 p-2 sm:p-4 md:p-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <NavigationBar />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mt-12">
          <h1 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6 md:mb-8 animate-pulse">Connexion</h1>
        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base bg-white/30 text-gray-900 placeholder-gray-400"
              placeholder="votre@email.com"
              required
            />
          </div>
          <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base bg-white/30 text-gray-900 placeholder-gray-400"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold py-2 px-4 rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 text-sm md:text-base disabled:opacity-50"
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
          <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-200">
          Pas encore de compte?{' '}
            <a href="/inscription" className="font-medium text-yellow-400 hover:text-yellow-500">S'inscrire</a>
        </p>
        <div className="text-center mt-3 md:mt-4">
            <a href="/" className="text-sm text-yellow-400 hover:text-yellow-500">Retour à l'accueil</a>
          </div>
        </div>
      </div>
    </div>
  );
}