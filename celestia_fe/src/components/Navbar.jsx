import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logo from '../assets/fullLogo.png'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { isLoggedIn, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const email = sessionStorage.getItem('userEmail') || ''
  const initials = email.slice(0, 2).toUpperCase()

  function handleLogout() {
    logout()
    setOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/identify', label: 'Identify' },
    { to: '/skymap', label: 'Sky Map' },
    { to: '/about', label: 'About Us' },
  ]

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
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8"
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

      {/* Link-uri centru — doar pe desktop */}
      <div className="hidden md:flex items-center gap-8" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} style={navLink}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#c4c4d8'}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Acțiuni desktop (sign in / avatar) */}
      {!isLoggedIn ? (
        <div className="hidden md:flex items-center gap-4">
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
        <div className="relative hidden md:block">
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

      {/* Buton hamburger — doar pe mobil */}
      <button
        className="md:hidden flex items-center justify-center"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '0.4rem',
        }}
      >
        {mobileOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Panou mobil derulant */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(10, 10, 26, 0.98)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem 1.5rem 1.5rem',
            gap: '0.25rem',
          }}
        >
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                ...navLink,
                fontSize: '1.05rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-center border"
                  style={{ borderColor: '#0d2857', color: '#fff', borderRadius: '999px', fontWeight: 500 }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-center"
                  style={{ backgroundColor: '#0d2857', color: '#fff', borderRadius: '999px', fontWeight: 500 }}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-center"
                  style={{ color: '#fff', borderRadius: '999px', fontWeight: 500, background: 'rgba(255,255,255,0.06)' }}
                >
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="py-3 text-center"
                  style={{ color: '#f87171', borderRadius: '999px', fontWeight: 500, background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
