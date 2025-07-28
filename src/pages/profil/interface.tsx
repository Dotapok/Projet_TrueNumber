import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../backend/backend';
import Notification from '../../composants/notification';
import TrueNumberGame from '../../composants/TrueNumberGame';

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: string;
  bio?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function Profil() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: ''
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Génération de particules flottantes
    const particleArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
    }));
    setParticles(particleArray);

    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setNotification({
          message: 'Session expirée',
          type: 'error'
        });
        navigate('/connexion');
        return;
      }

      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setProfile(user);
          setEditData({
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio || '',
            phone: user.phone || ''
          });
        }

        const { success, data } = await apiService.user.getProfile();
        if (success && data) {
          setProfile(data.data);
          setEditData({
            firstName: data.data.firstName,
            lastName: data.data.lastName,
            bio: data.data.bio || '',
            phone: data.data.phone || ''
          });
        }
      } catch (err) {
        setNotification({
          message: 'Erreur lors du chargement du profil',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/connexion');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Erreur de chargement du profil</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Réessayer
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/20 animate-bounce"
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

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Colonne jeu - prend plus de place sur grand écran */}
          <div className="lg:flex-1 order-2 lg:order-1">
            <TrueNumberGame />
          </div>

          {/* Colonne profil - plus compacte */}
          <div className="w-full lg:w-80 xl:w-96 order-1 lg:order-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                  Mon Profil
                </h1>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Déconnexion
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-medium text-white">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-sm text-purple-200">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-purple-200">Points</p>
                    <p className="text-white font-medium">{profile.points}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-200">Membre depuis</p>
                    <p className="text-white font-medium">
                      {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-medium text-purple-200 mb-3">Informations</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-purple-200">Téléphone</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="phone"
                          value={editData.phone}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1 text-sm bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 text-white"
                        />
                      ) : (
                        <p className="text-white">{profile.phone || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}