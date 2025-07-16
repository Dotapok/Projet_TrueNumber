// interface.tsx
import { Link } from 'react-router-dom';

export default function Interface() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <nav className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Mon Application</h1>
          <div className="flex space-x-4">
            <Link to="/connexion" className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md">Connexion</Link>
            <Link to="/inscription" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Inscription</Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Bienvenue sur notre plateforme</h2>
        <p className="text-gray-600 mb-8">
          Une solution moderne pour gérer votre profil en toute sécurité.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-indigo-700 mb-3">Authentification sécurisée</h3>
            <p className="text-gray-600">Utilisation de JWT pour une protection optimale de vos données.</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-indigo-700 mb-3">Gestion de profil</h3>
            <p className="text-gray-600">CRUD complet pour vos informations personnelles.</p>
          </div>
        </div>
      </main>
    </div>
  );
}