import { Link } from 'react-router-dom';

export default function Interface() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <nav className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">
              <span className="text-purple-600">True</span>Number
            </h1>
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
              Jeu de hasard
            </span>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Link 
              to="/connexion" 
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-all text-center"
            >
              Connexion
            </Link>
            <Link 
              to="/inscription" 
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:opacity-90 transition-all shadow-md text-center"
            >
              Jouer maintenant !
            </Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Découvrez le jeu TrueNumber</h2>
          <p className="text-base md:text-lg mb-6">Tentez votre chance et gagnez des points !</p>
          <Link 
            to="/inscription" 
            className="inline-block px-4 py-2 md:px-6 md:py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-all shadow-lg"
          >
            Commencer à jouer
          </Link>
        </div>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-purple-700 mb-3 flex items-center">
                <span className="bg-purple-100 p-2 rounded-full mr-3">🎲</span>
                Comment jouer ?
              </h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm md:text-base">
                <li>Générez un nombre aléatoire entre 0 et 100</li>
                <li>Si le nombre est supérieur à 70 : vous gagnez 50 points !</li>
                <li>Si le nombre est 70 ou moins : vous perdez 35 points</li>
                <li>Suivez votre progression dans votre historique</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 md:p-6 rounded-lg border border-purple-100">
              <h3 className="text-lg md:text-xl font-semibold text-purple-700 mb-3">Exemple de partie</h3>
              <div className="space-y-3 text-sm md:text-base">
                <div className="flex justify-between">
                  <span>Nombre généré :</span>
                  <span className="font-bold">82</span>
                </div>
                <div className="flex justify-between">
                  <span>Résultat :</span>
                  <span className="font-bold text-green-600">Gagné ! +50 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Nouveau solde :</span>
                  <span className="font-bold">150 points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto mt-6 text-center text-gray-500 text-xs md:text-sm">
        <p>TrueNumber - Un jeu de hasard passionnant © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}