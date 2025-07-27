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

  useEffect(() => {
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
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          if (typeof savedUser === 'string' && savedUser.trim() !== '') {
            const user = JSON.parse(savedUser);
            setProfile({
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              role: user.role,
              points: user.points,
              createdAt: user.createdAt,
              bio: user.bio,
            });
            setEditData({
              firstName: user.firstName,
              lastName: user.lastName,
              bio: user.bio || '',
              phone: user.phone || ''
            });
          }
        } catch (e) {
          console.error('Error parsing saved user', e);
          setNotification({
            message: 'Erreur lors du chargement des données utilisateur',
            type: 'error'
          });
        }
      }
      try {
        const { success, data, error } = await apiService.user.getProfile();
        if (success && data) {
          setProfile({
            _id: data.data._id,
            firstName: data.data.firstName,
            lastName: data.data.lastName,
            email: data.data.email,
            phone: data.data.phone,
            role: data.data.role,
            points: data.data.points,
            createdAt: data.data.createdAt,
            bio: data.data.bio,
          });
          setEditData({
            firstName: data.data.firstName,
            lastName: data.data.lastName,
            bio: data.data.bio || '',
            phone: data.data.phone || ''
          });
        } else {
          setNotification({
            message: error || 'Erreur lors du chargement du profil',
            type: 'error'
          });
        }
      } catch (err) {
        setNotification({
          message: 'Erreur réseau lors du chargement du profil',
          type: 'error'
        });
      }
      setLoading(false);
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
        <div className="text-center">
          <p className="text-red-400">Erreur de chargement du profil</p>
          <button 
            onClick={() => window.location.reload()}
            className="ml-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
          >
            Réessayer
          </button>
          <button 
            onClick={handleLogout}
            className="ml-4 px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-2xl hover:shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300"
          >
            Déconnexion
          </button>
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
        {/* SUPPRIMER <NavigationBar /> */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="w-full lg:w-2/3 order-2 lg:order-1">
            <TrueNumberGame />
          </div>
          <div className="w-full lg:w-1/3 order-1 lg:order-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-4 md:mb-0">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 space-y-2 sm:space-y-0">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">Mon Profil</h1>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white rounded-2xl hover:shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300 text-sm md:text-base"
                >
                  Déconnexion
                </button>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Informations</h2>
              <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6">
                <div>
                  <label className="text-xs md:text-sm font-medium text-purple-200 mb-1 block">Prénom</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={editData.firstName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base bg-white/30 text-gray-900 placeholder-gray-400"
                    />
                  ) : (
                    <p className="text-white py-1 md:py-2 text-sm md:text-base">{profile.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-purple-200 mb-1 block">Nom</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={editData.lastName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base bg-white/30 text-gray-900 placeholder-gray-400"
                    />
                  ) : (
                    <p className="text-white py-1 md:py-2 text-sm md:text-base">{profile.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-purple-200 mb-1 block">Email</label>
                  <p className="text-white py-1 md:py-2 text-sm md:text-base">{profile.email}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-purple-200 mb-1 block">Téléphone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleEditChange}
                      className="w-full px-3 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base bg-white/30 text-gray-900 placeholder-gray-400"
                    />
                  ) : (
                    <p className="text-white py-1 md:py-2 text-sm md:text-base">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-purple-200 mb-1 block">Date d'inscription</label>
                  <p className="text-white py-1 md:py-2 text-sm md:text-base">
                    {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}