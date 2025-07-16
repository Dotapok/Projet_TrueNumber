// acceuil.tsx
export default function Profil() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <nav className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Mon Profil</h1>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md">Déconnexion</button>
            </div>
          </div>
        </nav>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center mb-4 overflow-hidden">
                <span className="text-4xl text-indigo-600">👤</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Jean Dupont</h2>
              <p className="text-gray-500">jean.dupont@email.com</p>
            </div>
            
            <div className="space-y-4">
              <button className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Modifier le profil
              </button>
              <button className="w-full py-2 px-4 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50">
                Changer la photo
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Informations du profil</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Prénom</h3>
                <p className="text-gray-800">Jean</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Nom</h3>
                <p className="text-gray-800">Dupont</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-gray-800">jean.dupont@email.com</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date d'inscription</h3>
                <p className="text-gray-800">15/07/2023</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
              <p className="text-gray-800">
                Développeur passionné par les nouvelles technologies et les défis techniques. 
                J'aime créer des applications performantes et sécurisées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}