import { Link } from 'react-router-dom'
import logo from '../assets/fullLogo.png'

function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div className="flex justify-center">
          <img src={logo} alt="Celestia" style={{ height: '200px', marginBottom: '-70px' }} />
        </div>

        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>
          Welcome back
        </h2>
        <p style={{ color: '#9999b3', fontSize: '0.9rem', textAlign: 'center', marginBottom: '32px' }}>
          Sign in to your account
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: '#9999b3', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ color: '#9999b3', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            style={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Sign In
          </button>
        </div>

        <p style={{ color: '#9999b3', fontSize: '0.85rem', textAlign: 'center', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6366f1' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
