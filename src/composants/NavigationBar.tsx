import React from 'react';
import { Link } from 'react-router-dom';

export default function NavigationBar() {
  return (
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
  );
} 