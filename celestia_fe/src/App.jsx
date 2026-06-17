import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import NavbarOnlyLayout from './layouts/NavbarOnlyLayout'
import Home from './pages/Home'
import Identify from './pages/Identify'
import Login from './pages/Login'
import Register from './pages/Register'
import SkyMap from './pages/SkyMap'
import Profile from './pages/Profile'
import HistoryDetail from './pages/HistoryDetail'
import ConstellationDetail from './pages/ConstellationDetail'
import AboutUs from './pages/AboutUs'

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      offset: 100,
    })
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/identify" element={<Identify />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history/:id" element={<HistoryDetail />} />
            <Route path="/constellation/:name" element={<ConstellationDetail />} />
            <Route path="/about" element={<AboutUs />} />
          </Route>
          <Route element={<NavbarOnlyLayout />}>
            <Route path="/skymap" element={<SkyMap />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
