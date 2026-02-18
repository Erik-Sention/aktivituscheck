'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Felaktigt lösenord');
      }
    } catch (err) {
      setError('Anslutningsfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white">
      {/* Left side - Hero image */}
      <div className="relative hidden lg:block lg:w-[61.8%] shrink-0">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=2070"
          alt="Health and Lifestyle"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 to-transparent"></div>

        <div className="absolute bottom-12 left-12 max-w-md text-white">
          <h2 className="text-4xl font-bold leading-tight drop-shadow-lg">
            Optimera din hälsa med precision.
          </h2>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-[38.2%]">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-12 flex flex-col items-center text-center">
            <img
              src="/body-illustration.png"
              alt="Aktivitus"
              className="h-12 w-auto"
            />
            <img
              src="/Aktivitus-Blue.png"
              alt="Aktivitus"
              className="mt-4 h-8"
            />
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#9ca3af] uppercase">
              Hälsokontroll
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2 ml-1"
              >
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-[#111827] transition-all focus:border-[#0072bc] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0072bc]/10"
                placeholder="••••••••"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className={`group relative w-full overflow-hidden rounded-lg py-4 font-bold text-white transition-all active:scale-[0.98] ${
                loading || !password
                  ? 'bg-[#9ca3af] cursor-not-allowed'
                  : 'bg-[#0072bc] hover:bg-[#005fa0]'
              }`}
            >
              <span className="relative z-10 text-sm tracking-wide uppercase">
                {loading ? 'Loggar in...' : 'Logga in'}
              </span>
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
