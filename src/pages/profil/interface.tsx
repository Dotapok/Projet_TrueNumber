// interface.tsx
import { useEffect, useState } from 'react';
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('Début du fetchProfile');
      
      const token = localStorage.getItem('authToken');
      console.log('Token:', token);
      
      if (!token) {
        setNotification({
          message: 'Session expirée',
          type: 'error'
        });
        navigate('/connexion');
        return;
      }

      const savedUser = localStorage.getItem('user');
      console.log('User data from localStorage:', savedUser);
      
      if (savedUser) {
        try {
          // Sécuriser le parsing JSON
          if (typeof savedUser === 'string' && savedUser.trim() !== '') {
            const user = JSON.parse(savedUser);
            console.log('User parsed:', user);
            
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

      try {
        console.log('Appel API getProfile');
        const { success, data, error } = await apiService.user.getProfile();
        console.log('API Response:', { success, data, error });
        
        if (success && data) {
          console.log('Profile data from API:', data);
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
          console.error('API Error:', error);
          setNotification({
            message: error || 'Erreur lors du chargement du profil',
            type: 'error'
          });
        }
      } catch (err) {
        console.error('API Error:', err);
        setNotification({
          message: 'Erreur réseau lors du chargement du profil',
          type: 'error'
        });
      }
      console.log('Profile state:', profile);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erreur de chargement du profil</p>
          <button 
            onClick={() => window.location.reload()}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Réessayer
          </button>
          <button 
            onClick={handleLogout}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Game section - prend plus de place */}
        <div className="lg:w-2/3">
          <TrueNumberGame />
        </div>
        {/* Profil section - prend moins de place */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-indigo-600">Mon Profil</h1>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md border border-indigo-600 transition-colors"
              >
                Déconnexion
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-6">Informations</h2>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Prénom</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{profile.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Nom</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{profile.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Email</label>
                <p className="text-gray-800 py-2">{profile.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Téléphone</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={editData.phone}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{profile.phone}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Date d'inscription</label>
                <p className="text-gray-800 py-2">
                  {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}