import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function Interface() {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedNumber, setAnimatedNumber] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setIsVisible(true);

    // Animation du nombre d'exemple
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedNumber(prev => {
          if (prev >= 82) {
            clearInterval(interval);
            return 82;
          }
          return prev + Math.floor(Math.random() * 15) + 1;
        });
      }, 50);
    }, 1000);

    // Génération de particules flottantes
    const particleArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
    }));
    setParticles(particleArray);

    return () => clearTimeout(timer);
  }, []);

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

      {/* Effet de grille en arrière-plan */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      <div className={`relative z-10 p-2 sm:p-4 md:p-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Navigation moderne */}
        <nav className="max-w-sm sm:max-w-2xl md:max-w-6xl mx-auto mb-4 md:mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-2 sm:p-4 shadow-2xl">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div className="flex items-center group">
                <div className="relative">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    <span className="hover:animate-pulse cursor-pointer">True</span>
                    <span className="text-white hover:animate-pulse cursor-pointer">Number</span>
                  </h1>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-ping"></div>
                </div>
                <span className="ml-2 md:ml-3 px-2 md:px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold rounded-full shadow-lg animate-pulse">
                  🎲 Jeu de hasard
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-4 w-full sm:w-auto">
                <Link
                  to="/connexion"
                  className="group px-4 py-2 md:px-6 md:py-3 text-sm md:text-base text-white hover:text-yellow-400 rounded-xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-yellow-400/50 text-center transform hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    🔐 Connexion
                  </span>
                </Link>
                <Link
                  to="/inscription"
                  className="group relative px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-sm md:text-base text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 text-center transform hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center font-bold">
                    🚀 Jouer maintenant !
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Contenu principal */}
        <main className="max-w-sm sm:max-w-2xl md:max-w-6xl mx-auto">
          {/* Hero section avec effet glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-4 md:mb-8">
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 md:p-12 text-white text-center relative overflow-hidden">
              {/* Effet de vague animée */}
              <div className="absolute bottom-0 left-0 right-0 h-10 md:h-20 bg-gradient-to-t from-white/20 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400"></div>
              
              <div className="relative z-10">
                <h2 className="text-lg sm:text-2xl md:text-5xl font-bold mb-2 md:mb-6 animate-pulse">
                  Découvrez le jeu 
                  <span className="block text-yellow-400 text-xl sm:text-3xl md:text-6xl mt-1 md:mt-2">TrueNumber</span>
                </h2>
                <p className="text-base md:text-xl mb-4 md:mb-8 text-purple-100">
                  🎯 Tentez votre chance et gagnez des points dans ce jeu de hasard captivant !
                </p>
                <div className="flex items-center justify-center space-x-4 mb-8 text-sm md:text-base">
                  <span className="bg-green-400/20 text-green-300 px-3 py-1 rounded-full border border-green-400/30 flex items-center">
                    👤 Mode Solo
                  </span>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                  <span className="bg-orange-400/20 text-orange-300 px-3 py-1 rounded-full border border-orange-400/30 flex items-center">
                    👥 Mode Multijoueur
                  </span>
                </div>
                <Link
                  to="/inscription"
                  className="group inline-block px-4 py-2 md:px-8 md:py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold rounded-2xl hover:shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300 transform hover:scale-110 text-sm md:text-base"
                >
                  <span className="flex items-center justify-center">
                    ⚡ Commencer à jouer
                    <span className="ml-1 md:ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Contenu des règles avec design moderne */}
            {/* Contenu des règles avec design moderne */}
            <div className="p-6 md:p-10">
              {/* Section modes de jeu */}
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center">
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 p-3 rounded-2xl mr-4">🎮</span>
                  Modes de jeu disponibles
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mode Solo */}
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-300/30 transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 p-3 rounded-2xl mr-4 text-2xl">👤</span>
                      <h4 className="text-2xl font-bold text-white">Mode Solo</h4>
                    </div>
                    <p className="text-green-100 mb-4">Jouez à votre rythme contre la chance !</p>
                    <ul className="space-y-2 text-green-200">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                        Partie instantanée, aucune attente
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                        Suivez vos statistiques personnelles
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                        Parfait pour s'entraîner
                      </li>
                    </ul>
                  </div>

                  {/* Mode Multijoueur */}
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-300/30 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-red-400 to-pink-400 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      🔥 POPULAIRE
                    </div>
                    <div className="flex items-center mb-4">
                      <span className="bg-gradient-to-r from-orange-400 to-red-400 p-3 rounded-2xl mr-4 text-2xl">👥</span>
                      <h4 className="text-2xl font-bold text-white">Mode Multijoueur</h4>
                    </div>
                    <p className="text-orange-100 mb-4">Défiez d'autres joueurs en temps réel !</p>
                    <ul className="space-y-2 text-orange-200">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                        Jusqu'à 8 joueurs par partie
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                        Classement en temps réel
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Règles du jeu */}
                <div className="xl:col-span-2">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-300/30 h-full">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 p-3 rounded-2xl mr-4 text-2xl">🎲</span>
                      Comment jouer ?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { icon: '🎯', text: 'Générez un nombre aléatoire entre 0 et 100', color: 'from-blue-400 to-cyan-400' },
                        { icon: '🏆', text: 'Si le nombre > 70 : vous gagnez 50 points !', color: 'from-green-400 to-emerald-400' },
                        { icon: '💸', text: 'Si le nombre ≤ 70 : vous perdez 35 points', color: 'from-red-400 to-pink-400' },
                        { icon: '📊', text: 'Suivez votre progression dans l\'historique', color: 'from-yellow-400 to-orange-400' }
                      ].map((rule, index) => (
                        <div key={index} className={`bg-gradient-to-r ${rule.color} p-4 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer`}>
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{rule.icon}</span>
                            <p className="font-medium">{rule.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exemple de partie avec animation */}
                <div className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-300/30">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 p-3 rounded-2xl mr-4">⚡</span>
                    Exemple Live
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-purple-200">Nombre généré :</span>
                        <div className="relative">
                          <span className="text-3xl font-bold text-yellow-400 animate-pulse">
                            {animatedNumber}
                          </span>
                          {animatedNumber === 82 && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                          )}
                        </div>
                      </div>
                      {animatedNumber === 82 && (
                        <div className="space-y-3" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-200">Résultat :</span>
                            <span className="font-bold text-green-400 flex items-center">
                              🎉 Gagné ! +50 points
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-200">Nouveau solde :</span>
                            <span className="font-bold text-yellow-400">💎 150 points</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section statistiques */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-indigo-300/30 mb-8">
                <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 p-3 rounded-2xl mr-4">📈</span>
                  Statistiques du jeu
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-green-400">30%</div>
                    <div className="text-purple-200">Chance de gagner</div>
                  </div>
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-yellow-400">+15</div>
                    <div className="text-purple-200">Points moyens/partie</div>
                  </div>
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-2xl font-bold text-orange-400">1,247</div>
                    <div className="text-purple-200">Joueurs en ligne</div>
                  </div>
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="text-2xl font-bold text-pink-400">Instant</div>
                    <div className="text-purple-200">Résultat immédiat</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer moderne */}
        <footer className="max-w-6xl mx-auto mt-8 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <p className="text-purple-200 flex items-center justify-center space-x-2">
              <span>🎲</span>
              <span>TrueNumber - Un jeu de hasard passionnant</span>
              <span>©</span>
              <span>{new Date().getFullYear()}</span>
              <span>🚀</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}