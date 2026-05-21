import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/fullLogo.png'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { isLoggedIn, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const email = sessionStorage.getItem('userEmail') || ''
  const initials = email.slice(0, 2).toUpperCase()

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  const navLink = {
    color: '#c4c4d8',
    fontSize: '0.95rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 0.2s',
    letterSpacing: '0.01em',
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8"
      style={{
        backdropFilter: 'blur(4px)',
        height: '72px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo stânga */}
      <Link
        to="/"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '1.4rem',
          fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
          letterSpacing: '0.02em',
        }}
      >
        Celestia
      </Link>

      {/* Link-uri centru */}
      <div className="flex items-center gap-8" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Link to="/" style={navLink}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#c4c4d8'}
        >
          Home
        </Link>
        <Link to="/identify" style={navLink}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#c4c4d8'}
        >
          Identify
        </Link>
        <Link to="/skymap" style={navLink}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#c4c4d8'}
        >
          Sky Map
        </Link>
        <Link to="/about" style={navLink}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#c4c4d8'}
        >
          About Us
        </Link>
      </div>

      {!isLoggedIn ? (
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 border"
            style={{
              borderColor: '#0d2857',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 500,
              borderRadius: '999px',
            }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2"
            style={{
              backgroundColor: '#0d2857',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 500,
              borderRadius: '999px',
            }}
          >
            Get Started
          </Link>
        </div>
      ) : (
        <div className="relative">
          <div
            onClick={() => setOpen(o => !o)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#0d2857',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {initials}
          </div>

          {open && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '52px',
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '160px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                style={{
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Profil
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  color: '#f87171',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
