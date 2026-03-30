import { Link } from 'react-router-dom'
import logo from '../assets/fullLogo.png'

function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8"
      style={{
        backdropFilter: 'blur(4px)',
        height: '72px',
      }}
    >

      <div className="flex items-center gap-8">
        <Link
          to="/learn"
          style={{ color: '#9999b3', fontSize: '0.95rem', fontWeight: 500 }}
          className="hover:text-white transition-colors duration-200"
        >
          Learn
        </Link>
        <Link
          to="/identify"
          style={{ color: '#9999b3', fontSize: '0.95rem', fontWeight: 500 }}
          className="hover:text-white transition-colors duration-200"
        >
          Identify
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
