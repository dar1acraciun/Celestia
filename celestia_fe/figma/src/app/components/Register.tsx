import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { StarField } from './StarField';

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
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
            Start Your Journey
          </h2>
          <p
            style={{
              color: '#9999b3',
              fontSize: '1rem',
            }}
          >
            Create an account to explore the cosmos
          </p>
        </div>

        <div
          className="p-8 rounded-2xl backdrop-blur-md"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block mb-2"
                style={{
                  color: '#e8e8f0',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={20}
                  color="#9999b3"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2"
                style={{
                  color: '#e8e8f0',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  color="#9999b3"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#9999b3" />
                  ) : (
                    <Eye size={20} color="#9999b3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 rounded accent-[#4f8ef7] mt-0.5"
                required
              />
              <label
                htmlFor="terms"
                className="cursor-pointer"
                style={{
                  color: '#9999b3',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                I agree to the{' '}
                <a
                  href="#"
                  className="hover:opacity-70 transition-opacity"
                  style={{
                    color: '#4f8ef7',
                    fontWeight: 600,
                  }}
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#"
                  className="hover:opacity-70 transition-opacity"
                  style={{
                    color: '#4f8ef7',
                    fontWeight: 600,
                  }}
                >
                  Privacy Policy
                </a>
              </label>
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
              Create Account
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
          Already have an account?{' '}
          <Link
            to="/login"
            className="hover:opacity-70 transition-opacity"
            style={{
              color: '#4f8ef7',
              fontWeight: 600,
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
