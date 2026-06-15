import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import StarField from '../components/StarField'

function MainLayout() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <StarField />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </div>
  )
}

export default MainLayout
