import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Navbar from './components/Navbar'
import StarField from './components/StarField'
import Home from './pages/Home'
import Identify from './pages/Identify'
import Login from './pages/Login'
import Register from './pages/Register'
import SkyMap from './pages/skyMap'

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
    <BrowserRouter>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <StarField />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/identify" element={<Identify />} />
             <Route path="/skymap" element={<SkyMap />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
