"use client"

import { Routes, Route } from "react-router-dom"

// pages publiques
import Interface from "./pages/public/acceuil"

// pages authentification
import Connexion from "./pages/authentification/connexion"
import Inscription from "./pages/authentification/inscription"
import Profil from "./pages/profil/interface"
import AdminPanel from "./pages/admin/adminPanel"

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Interface />} />

      {/* Routes gestion profil et authentification */}
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/profil" element={<Profil />} />

      {/* Route administration */}
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}

export default App
