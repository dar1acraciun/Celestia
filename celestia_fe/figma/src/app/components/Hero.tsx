import { Link } from 'react-router';
import { StarField } from './StarField';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <StarField />

      <div className="absolute top-6 right-6 z-10 flex gap-3">
        <Link
          to="/login"
          className="px-6 py-2.5 rounded-xl transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)]"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e8e8f0',
            fontWeight: 500,
            fontSize: '0.9375rem',
          }}
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(79,142,247,0.3)]"
          style={{
            background: '#4f8ef7',
            color: '#e8e8f0',
            fontWeight: 600,
            fontSize: '0.9375rem',
          }}
        >
          Get Started
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1
          className="mb-6 tracking-tight"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#e8e8f0',
          }}
        >
          Discover the Sky
        </h1>

        <p
          className="mb-12 max-w-2xl mx-auto"
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: '#9999b3',
            lineHeight: 1.6,
          }}
        >
          Learn and identify constellations with AI
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(79,142,247,0.3)]"
            style={{
              background: '#4f8ef7',
              color: '#e8e8f0',
              fontWeight: 600,
              fontSize: '1.0625rem',
            }}
          >
            Start Learning
          </button>

          <button
            className="px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:bg-[rgba(255,255,255,0.08)]"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              color: '#e8e8f0',
              fontWeight: 600,
              fontSize: '1.0625rem',
            }}
          >
            Try Identifying
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent z-[5]" />
    </section>
  );
}
