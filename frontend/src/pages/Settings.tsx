import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import api from '../lib/api';

interface InviteCode {
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

interface InviteStats {
  total: number;
  used: number;
  available: number;
  codes: InviteCode[];
}

export default function Settings() {
  const { user, isConnected } = useGameStore();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const fetchInviteCodes = async () => {
    try {
      const response = await api.get('/player/invite-codes');
      setInviteStats(response.data);
    } catch (err) {
      console.error('Failed to fetch invite codes:', err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    const timeout = setTimeout(() => setCopiedCode(null), 2000);
    return () => clearTimeout(timeout);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.patch('/auth/update-username', { username });
      setMessage('Username updated successfully! Please re-login for changes to take effect.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await api.patch('/auth/update-password', { 
        currentPassword, 
        newPassword 
      });
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Imperial Command Settings Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">EINSTELLUNGEN</h1>
          <div className="text-cyan-400/70 font-mono text-sm mt-2">SYSTEM-KONFIGURATION</div>
        </div>
      </div>

      {/* Imperial Command Connection Status */}
      <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-6 mb-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-100 font-mono tracking-wider">VERBINDUNGSSTATUS</h2>
        </div>
        <div className={`flex items-center gap-4 px-4 py-3 rounded border backdrop-blur-sm ${
          isConnected
            ? 'bg-green-950/30 border-green-500/40'
            : 'bg-red-950/30 border-red-500/40'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <div>
            <p className={`font-semibold font-mono tracking-wider ${
              isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              {isConnected ? 'VERBUNDEN' : 'GETRENNT'}
            </p>
            <p className="text-sm text-cyan-400/60 font-mono">
              {isConnected
                ? 'ECHTZEIT-UPDATES AKTIV'
                : 'VERBINDUNG VERLOREN. VERSUCHE ERNEUT ZU VERBINDEN...'}
            </p>
          </div>
        </div>
      </div>

      {/* Imperial Command Account Information */}
      <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-6 mb-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-100 font-mono tracking-wider">ACCOUNT-INFORMATIONEN</h2>
        </div>
        <div className="space-y-3 font-mono">
          <div className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-700/30 rounded">
            <span className="text-cyan-400/70 tracking-wider">E-MAIL:</span>
            <span className="text-cyan-100">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-700/30 rounded">
            <span className="text-cyan-400/70 tracking-wider">FRAKTION:</span>
            <span className="text-cyan-100">{user?.player?.faction?.name}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-700/30 rounded">
            <span className="text-cyan-400/70 tracking-wider">SPIELER-ID:</span>
            <span className="text-cyan-100">#{user?.player?.id}</span>
          </div>
        </div>
      </div>

      {/* Imperial Command Messages */}
      {message && (
        <div className="bg-gradient-to-r from-green-950/40 to-green-900/20 border border-green-500/40 rounded p-4 mb-6 backdrop-blur-sm">
          <p className="text-green-300 font-mono">{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-950/40 to-red-900/20 border border-red-500/40 rounded p-4 mb-6 backdrop-blur-sm">
          <p className="text-red-300 font-mono">{error}</p>
        </div>
      )}

      {/* Imperial Command Username Update */}
      <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-6 mb-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-100 font-mono tracking-wider">BENUTZERNAME ÄNDERN</h2>
        </div>
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3 font-mono tracking-wider">
              NEUER BENUTZERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
              placeholder="Neuen Benutzernamen eingeben"
              minLength={3}
              maxLength={20}
              required
            />
            <p className="text-sm text-cyan-400/60 mt-2 font-mono">
              AKTUELL: {user?.username}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || username === user?.username}
            className="w-full bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 py-3 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed font-mono tracking-wider"
          >
            {loading ? 'AKTUALISIERE...' : 'BENUTZERNAME AKTUALISIEREN'}
          </button>
        </form>
      </div>

      {/* Imperial Command Password Update */}
      <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-6 mb-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-100 font-mono tracking-wider">PASSWORT ÄNDERN</h2>
        </div>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3 font-mono tracking-wider">
              AKTUELLES PASSWORT
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
              placeholder="Aktuelles Passwort eingeben"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3 font-mono tracking-wider">
              NEUES PASSWORT
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
              placeholder="Neues Passwort eingeben"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3 font-mono tracking-wider">
              NEUES PASSWORT BESTÄTIGEN
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-cyan-500/30 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono backdrop-blur-sm"
              placeholder="Neues Passwort bestätigen"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 py-3 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed font-mono tracking-wider"
          >
            {loading ? 'AKTUALISIERE...' : 'PASSWORT AKTUALISIEREN'}
          </button>
        </form>
      </div>

      {/* Imperial Command Invite Codes */}
      <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-100 font-mono tracking-wider">INVITE-CODES</h2>
        </div>

        {inviteStats && (
          <>
            {/* Imperial Command Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-950/30 border border-slate-700/40 rounded p-4">
                <div className="text-2xl font-bold text-cyan-300 font-mono">{inviteStats.total}</div>
                <div className="text-cyan-400/70 text-sm font-mono tracking-wider">GESAMT</div>
              </div>
              <div className="bg-green-950/20 border border-green-500/30 rounded p-4">
                <div className="text-2xl font-bold text-green-400 font-mono">{inviteStats.available}</div>
                <div className="text-green-400/70 text-sm font-mono tracking-wider">VERFÜGBAR</div>
              </div>
              <div className="bg-slate-950/30 border border-slate-700/40 rounded p-4">
                <div className="text-2xl font-bold text-slate-400 font-mono">{inviteStats.used}</div>
                <div className="text-slate-400/70 text-sm font-mono tracking-wider">VERWENDET</div>
              </div>
            </div>

            {/* Imperial Command Info Panel */}
            <div className="bg-gradient-to-r from-blue-950/30 to-blue-900/20 border border-blue-500/40 rounded p-4 mb-6 backdrop-blur-sm">
              <p className="text-blue-200 font-mono">
                <span className="font-bold tracking-wider">💡 SYSTEM-INFO:</span> Jeder neue Spieler erhält 2 Invite-Codes.
                Teile sie mit Verbündeten, um das Imperium zu erweitern!
              </p>
            </div>

            {/* Imperial Command Codes List */}
            {inviteStats.codes.length > 0 ? (
              <div className="space-y-3">
                {inviteStats.codes.map((code) => (
                  <div
                    key={code.code}
                    className="bg-slate-950/20 border border-slate-700/30 rounded p-4 hover:border-cyan-500/30 hover:bg-slate-950/30 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-lg font-mono bg-slate-900/60 border border-slate-700/40 text-cyan-100 px-3 py-2 rounded tracking-wider">
                            {code.code}
                          </code>
                          {code.isUsed ? (
                            <span className="text-xs bg-slate-800/60 border border-slate-600/40 text-slate-400 px-3 py-1 rounded font-mono tracking-wider">
                              VERWENDET
                            </span>
                          ) : (
                            <span className="text-xs bg-green-950/40 border border-green-500/40 text-green-400 px-3 py-1 rounded font-mono tracking-wider">
                              VERFÜGBAR
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-cyan-400/60 font-mono">
                          ERSTELLT: {new Date(code.createdAt).toLocaleDateString('de-DE').toUpperCase()}
                          {code.usedAt && (
                            <> • VERWENDET: {new Date(code.usedAt).toLocaleDateString('de-DE').toUpperCase()}</>
                          )}
                        </div>
                      </div>
                      {!code.isUsed && (
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="ml-4 px-4 py-2 bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all font-mono tracking-wider"
                        >
                          {copiedCode === code.code ? '✓ KOPIERT!' : 'KOPIEREN'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-cyan-400/60">
                <p className="font-mono tracking-wider">KEINE INVITE-CODES VORHANDEN</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
