import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message);
      setEmail(''); // Clear email field after success
    } catch (err: any) {
      setError(err.response?.data?.error || 'Anfrage fehlgeschlagen. Bitte versuche es erneut.');
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
            backgroundImage: `linear-gradient(0deg, transparent 49%, rgba(255, 102, 0, 0.1) 50%, transparent 51%),
                             linear-gradient(90deg, transparent 49%, rgba(255, 102, 0, 0.1) 50%, transparent 51%)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Password Reset Terminal Interface */}
        <div className="relative z-10 w-full max-w-md">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-500/30 rounded-t-lg px-4 py-3 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            </div>
            <span className="font-mono text-xs text-amber-400/60 tracking-[0.2em] uppercase">
              Security Reset v2.1
            </span>
          </div>

          {/* Terminal Body */}
          <div className="relative bg-gradient-to-br from-amber-950/40 via-slate-950/50 to-amber-950/30 border border-amber-500/20 rounded-b-lg p-8 backdrop-blur-sm">
            {/* Branding */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <h1 className="text-3xl font-bold font-mono tracking-[0.1em] text-amber-300 relative">
                  STAR WARS
                  <div className="text-base text-amber-500/80 font-normal tracking-[0.3em] mt-1">
                    UNIVERSE
                  </div>
                </h1>
                {/* Subtle glow effect */}
                <div className="absolute -inset-6 bg-amber-400/10 blur-2xl rounded-full -z-10" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/50 border border-amber-500/30 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs text-amber-400/80 font-mono tracking-wider uppercase">
                  Sicherheitscode zurücksetzen
                </span>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mb-6" />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-950/30 border border-red-500/40 text-red-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-1">FEHLER</p>
                <p>{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-950/30 border border-green-500/40 text-green-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ANFRAGE ERFOLGREICH
                </p>
                <p className="text-green-200 mb-2">
                  {success}
                </p>
                <p className="text-green-300/80 text-xs">
                  📧 Überprüfe dein E-Mail-Postfach und folge den Anweisungen zum Zurücksetzen.
                </p>
              </div>
            )}

            {/* Instructions */}
            {!success && (
              <div className="mb-6 bg-amber-950/20 border border-amber-500/30 text-amber-200 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-2 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  SICHERHEITSPROTOKOLL
                </p>
                <p className="text-amber-300/90 text-xs leading-relaxed">
                  Gib deine E-Mail-Adresse ein, um einen sicheren Link zum Zurücksetzen deines
                  Sicherheitscodes zu erhalten. Der Link ist 24 Stunden gültig und kann nur einmal verwendet werden.
                </p>
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-amber-400/90 font-mono text-sm mb-2 tracking-wider font-medium">
                  KOMMUNIKATIONS-ID
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-900/60 border border-amber-500/30 text-amber-200 placeholder-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 rounded-md font-mono text-sm backdrop-blur-sm transition-colors"
                  placeholder="commander@imperium.net"
                  disabled={isLoading || !!success}
                />
                {email && (
                  <p className="mt-2 text-xs text-amber-400/70 font-mono">
                    Reset-Link wird an diese Adresse gesendet
                  </p>
                )}
              </div>

              {!success && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-mono font-bold text-sm tracking-wider uppercase rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40"
                >
                  <span className="flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        Anfrage wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Reset-Link anfordern
                      </>
                    )}
                  </span>
                </button>
              )}
            </form>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-6" />

            {/* Navigation Links */}
            <div className="text-center">
              <p className="text-amber-500/70 text-sm font-mono mb-3">
                Doch wieder eingefallen?
              </p>
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 font-mono tracking-wider flex items-center justify-center gap-2 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Zurück zur Anmeldung
              </Link>
            </div>

            {/* Terminal Status */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent mt-6 mb-4" />
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-amber-500/60">
                DATUM: {new Date().toLocaleDateString('de-DE')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
                <span className="text-amber-500/60">SICHERHEIT: AKTIV</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}