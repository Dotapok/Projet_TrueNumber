import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../backend/backend';
import Notification from '../../composants/notification';

export default function Profil() {
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    bio?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setProfile({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            createdAt: user.createdAt,
            bio: user.bio
          });
          setEditData({
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio || ''
          });
          setLoading(false);
          return;
        } catch (e) {
          console.error('Error parsing saved user', e);
        }
      }

      const { success, data, error } = await apiService.user.getProfile();
      
      if (success) {
        setProfile(data);
        setEditData({
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio || ''
        });
      } else {
        setNotification({
          message: error || 'Erreur lors du chargement du profil',
          type: 'error',
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { success, data, error } = await apiService.user.updateProfile({
        firstName: editData.firstName,
        lastName: editData.lastName,
        bio: editData.bio
      });

      if (success) {
        setProfile(prev => ({
          ...prev!,
          firstName: editData.firstName,
          lastName: editData.lastName,
          bio: editData.bio
        }));
        
        // Mettre à jour le localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...user,
          firstName: editData.firstName,
          lastName: editData.lastName,
          bio: editData.bio
        }));

        setIsEditing(false);
        setNotification({
          message: 'Profil mis à jour avec succès',
          type: 'success'
        });
      } else {
        setNotification({
          message: error || 'Échec de la mise à jour',
          type: 'error'
        });
      }
    } catch (err) {
      setNotification({
        message: 'Erreur lors de la mise à jour',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      try {
        setLoading(true);
        const { success, error } = await apiService.request('/users/me', 'DELETE');
        
        if (success) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setNotification({
            message: 'Compte supprimé avec succès',
            type: 'success'
          });
          navigate('/connexion');
          return;
        } else {
          setNotification({
            message: error || 'Échec de la suppression du compte',
            type: 'error'
          });
        }
      } catch (err) {
        setNotification({
          message: 'Erreur lors de la suppression du compte',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
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
        <p className="text-red-500">Erreur de chargement du profil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <nav className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Mon Profil</h1>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
            >
              Déconnexion
            </button>
          </div>
        </nav>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Informations du profil</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Prénom</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-800">{profile.firstName}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Nom</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-800">{profile.lastName}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
              <p className="text-gray-800">{profile.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date d'inscription</h3>
              <p className="text-gray-800">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
            {isEditing ? (
              <textarea
                name="bio"
                value={editData.bio}
                onChange={handleEditChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            ) : (
              <p className="text-gray-800">
                {profile.bio || "Aucune bio renseignée"}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Modifier
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'Suppression...' : 'Supprimer le compte'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}