import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import StarField from './components/StarField'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Identify from './pages/Identify'

function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <StarField />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/identify" element={<Identify />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
