import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { KeyRound, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenError('Kein Reset-Token gefunden. Bitte verwende den Link aus der E-Mail.');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (!token) {
      setError('Ungültiger Reset-Token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setSuccess(response.data.message);

      // Redirect to login after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed. Please try again.');
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

        {/* Password Reset Terminal Interface */}
        <div className="relative z-10 w-full max-w-md">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-cyan-950/80 to-cyan-900/60 border border-cyan-500/30 rounded-t-lg px-4 py-3 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            </div>
            <span className="font-mono text-xs text-cyan-400/60 tracking-[0.2em] uppercase">
              Security Update v2.1
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
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-xs text-cyan-400/80 font-mono tracking-wider uppercase">
                  Neuen Sicherheitscode festlegen
                </span>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mb-6" />
            </div>

            {/* Token Error */}
            {tokenError && (
              <div className="mb-6 bg-red-950/30 border border-red-500/40 text-red-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  UNGÜLTIGER LINK
                </p>
                <p>{tokenError}</p>
                <div className="mt-3">
                  <Link
                    to="/forgot-password"
                    className="text-red-400 hover:text-red-300 underline text-xs"
                  >
                    Neuen Reset-Link anfordern
                  </Link>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !tokenError && (
              <div className="mb-6 bg-red-950/30 border border-red-500/40 text-red-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-1">FEHLER</p>
                <p>{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-950/30 border border-green-500/40 text-green-300 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  SICHERHEITSCODE AKTUALISIERT
                </p>
                <p className="text-green-200 mb-2">
                  {success}
                </p>
                <p className="text-green-300/80 text-xs">
                  Du wirst automatisch zur Anmeldung weitergeleitet...
                </p>
              </div>
            )}

            {/* Instructions */}
            {!success && !tokenError && (
              <div className="mb-6 bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 p-4 rounded-lg font-mono text-sm">
                <p className="font-bold mb-2 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  SICHERHEITSPROTOKOLL
                </p>
                <p className="text-cyan-300/90 text-xs leading-relaxed">
                  Erstelle einen neuen, sicheren Sicherheitscode. Verwende mindestens 6 Zeichen
                  und kombiniere Buchstaben, Zahlen und Symbole für maximale Sicherheit.
                </p>
              </div>
            )}

            {/* Reset Form */}
            {!tokenError && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyan-400/90 font-mono text-sm mb-2 tracking-wider font-medium">
                      NEUER SICHERHEITSCODE
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-slate-900/60 border border-cyan-500/30 text-cyan-200 placeholder-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 rounded-md font-mono text-sm backdrop-blur-sm transition-colors"
                      placeholder="Mindestens 6 Zeichen"
                      disabled={isLoading || !!success}
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-400/90 font-mono text-sm mb-2 tracking-wider font-medium">
                      CODE BESTÄTIGEN
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-900/60 border border-cyan-500/30 text-cyan-200 placeholder-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 rounded-md font-mono text-sm backdrop-blur-sm transition-colors"
                      placeholder="Code wiederholen"
                      disabled={isLoading || !!success}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-2 text-xs text-red-400 font-mono">
                        Passwörter stimmen nicht überein
                      </p>
                    )}
                  </div>
                </div>

                {!success && (
                  <button
                    type="submit"
                    disabled={isLoading || newPassword !== confirmPassword}
                    className="w-full relative px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-900 font-mono font-bold text-sm tracking-wider uppercase rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40"
                  >
                    <span className="flex items-center justify-center gap-3">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                          Code wird aktualisiert...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Sicherheitscode aktualisieren
                        </>
                      )}
                    </span>
                  </button>
                )}
              </form>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent my-6" />

            {/* Navigation Links */}
            <div className="text-center">
              {success ? (
                <Link
                  to="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-mono tracking-wider flex items-center justify-center gap-2 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Jetzt anmelden
                </Link>
              ) : (
                <>
                  <p className="text-cyan-500/70 text-sm font-mono mb-3">
                    Doch kein Reset nötig?
                  </p>
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-mono tracking-wider flex items-center justify-center gap-2 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Zurück zur Anmeldung
                  </Link>
                </>
              )}
            </div>

            {/* Terminal Status */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent mt-6 mb-4" />
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyan-500/60">
                DATUM: {new Date().toLocaleDateString('de-DE')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
                <span className="text-cyan-500/60">SICHERHEIT: AKTIV</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}