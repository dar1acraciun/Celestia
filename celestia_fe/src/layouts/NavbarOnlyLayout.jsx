import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import StarField from '../components/StarField'

function NavbarOnlyLayout() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <StarField />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <Outlet />
      </div>
    </div>
  )
}

export default NavbarOnlyLayout
