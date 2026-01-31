import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { Shield, Users, KeyRound } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const login = useGameStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Deep Space Background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#000408] via-[#000812] to-[#000204]" />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 49%, rgba(0, 255, 255, 0.1) 50%, transparent 51%),
                             linear-gradient(90deg, transparent 49%, rgba(0, 255, 255, 0.1) 50%, transparent 51%)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Authentication Terminal Interface */}
        <div className="relative z-10 w-full max-w-md">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-cyan-950/80 to-cyan-900/60 border border-cyan-500/30 rounded-t-lg px-4 py-3 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            </div>
            <span className="font-mono text-xs text-cyan-400/60 tracking-[0.2em] uppercase">
              Auth Terminal v1.2
            </span>
          </div>

          {/* Terminal Body */}
          <div className="relative bg-gradient-to-br from-cyan-950/40 via-slate-950/50 to-cyan-950/30 border border-cyan-500/20 rounded-b-lg p-8 backdrop-blur-sm">
            {/* Branding */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <h1 className="text-3xl font-bold font-mono tracking-[0.1em] text-cyan-300 relative">
                  STAR WARS
                  <div className="text-base text-cyan-500/80 font-normal tracking-[0.3em] mt-1">
                    UNIVERSE
                  </div>
                </h1>
                {/* Subtle glow effect */}
                <div className="absolute -inset-6 bg-cyan-400/10 blur-2xl rounded-full -z-10" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs text-cyan-400/80 font-mono tracking-wider uppercase">
                  Authentifizierung erforderlich
                </span>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mb-6" />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-950/30 border border-red-500/40 text-red-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-1">FEHLER</p>
                <p>{error}</p>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-cyan-400/90 font-mono text-sm mb-2 tracking-wider font-medium">
                    BENUTZER-ID
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-900/60 border border-cyan-500/30 text-cyan-200 placeholder-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 rounded-md font-mono text-sm backdrop-blur-sm transition-colors"
                    placeholder="commander@imperium.net"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-cyan-400/90 font-mono text-sm mb-2 tracking-wider font-medium">
                    SICHERHEITSCODE
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-900/60 border border-cyan-500/30 text-cyan-200 placeholder-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 rounded-md font-mono text-sm backdrop-blur-sm transition-colors"
                    placeholder="••••••••••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-900 font-mono font-bold text-sm tracking-wider uppercase rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40"
              >
                <span className="flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Authentifizierung läuft...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Terminal Zugang
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent my-6" />

            {/* Navigation Links */}
            <div className="text-center space-y-4">
              <div>
                <p className="text-cyan-500/70 text-sm font-mono mb-3">
                  Kein Zugang vorhanden?
                </p>
                <Link
                  to="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-mono tracking-wider flex items-center justify-center gap-2 transition-colors group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Neuen Account erstellen
                </Link>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              <div>
                <p className="text-amber-500/70 text-sm font-mono mb-3">
                  Sicherheitscode vergessen?
                </p>
                <Link
                  to="/forgot-password"
                  className="text-amber-400 hover:text-amber-300 font-mono tracking-wider flex items-center justify-center gap-2 transition-colors group"
                >
                  <KeyRound className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Code zurücksetzen
                </Link>
              </div>
            </div>

            {/* Terminal Status */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent mt-6 mb-4" />
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyan-500/60">
                DATUM: {new Date().toLocaleDateString('de-DE')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50" />
                <span className="text-cyan-500/60">VERBINDUNG: AKTIV</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
