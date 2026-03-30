import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { StarField } from './StarField';

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <StarField />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles size={32} color="#4f8ef7" fill="#4f8ef7" />
            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#e8e8f0',
              }}
            >
              Celestia
            </h1>
          </Link>
          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: '#e8e8f0',
              marginBottom: '0.75rem',
            }}
          >
            Welcome Back
          </h2>
          <p
            style={{
              color: '#9999b3',
              fontSize: '1rem',
            }}
          >
            Sign in to continue your journey through the stars
          </p>
        </div>

        <div
          className="p-8 rounded-2xl backdrop-blur-md"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block mb-2"
                style={{
                  color: '#e8e8f0',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  color="#9999b3"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all duration-200 focus:outline-2 focus:outline-offset-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e8f0',
                    fontSize: '1rem',
                    outlineColor: '#4f8ef7',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-2"
                style={{
                  color: '#e8e8f0',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  color="#9999b3"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl outline-none transition-all duration-200 focus:outline-2 focus:outline-offset-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e8f0',
                    fontSize: '1rem',
                    outlineColor: '#4f8ef7',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9999b3" />
                  ) : (
                    <Eye size={20} color="#9999b3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#4f8ef7]"
                />
                <span
                  style={{
                    color: '#9999b3',
                    fontSize: '0.875rem',
                  }}
                >
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="hover:opacity-70 transition-opacity"
                style={{
                  color: '#4f8ef7',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(79,142,247,0.3)]"
              style={{
                background: '#4f8ef7',
                color: '#e8e8f0',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Sign In
            </button>

            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div
                  className="w-full"
                  style={{
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-4"
                  style={{
                    background: 'rgba(13, 15, 26, 0.9)',
                    color: '#9999b3',
                    fontSize: '0.875rem',
                  }}
                >
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="py-3 rounded-xl transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)]"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e8e8f0',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                }}
              >
                Google
              </button>
              <button
                type="button"
                className="py-3 rounded-xl transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)]"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e8e8f0',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                }}
              >
                GitHub
              </button>
            </div>
          </form>
        </div>

        <p
          className="text-center mt-6"
          style={{
            color: '#9999b3',
            fontSize: '0.9375rem',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            className="hover:opacity-70 transition-opacity"
            style={{
              color: '#4f8ef7',
              fontWeight: 600,
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
