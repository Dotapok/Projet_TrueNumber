"use client"

import { Routes, Route } from "react-router-dom"

// pages publiques
import Acceuil from "./pages/public/acceuil"

// pages authentification
import Connexion from "./pages/authentification/connexion"
import Inscription from "./pages/authentification/inscription"
import Profil from "./pages/authentification/interface"

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Acceuil />} />

      {/* Routes gestion profil et authentification */}
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/profil" element={<Profil />} />
    </Routes>
  )
}

export default App
