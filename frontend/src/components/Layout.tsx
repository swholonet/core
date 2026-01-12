import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Rocket, Globe, FlaskConical, Users, LogOut, Settings, Shield, Map, Menu, X, Radio } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const { user, player, logout } = useGameStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000408] via-[#000812] to-[#000204]">
      {/* Imperial Command Navigation */}
      <nav className="border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-slate-900/40 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-base md:text-xl font-bold text-cyan-100 font-mono tracking-wider">STAR WARS UNIVERSE</h1>
                <p className="text-xs text-cyan-400/70 hidden sm:block font-mono">
                  [CMDR] {user?.username} • {user?.player?.faction?.name}
                </p>
              </div>
              <div className="hidden lg:flex space-x-1">
                <Link to="/" className="flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono">
                  <Rocket size={16} />
                  Übersicht
                </Link>
                <Link to="/planets" className="flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono">
                  <Globe size={16} />
                  Planeten
                </Link>
                <Link to="/fleet" className="flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono">
                  <Users size={16} />
                  Schiffe
                </Link>
                <Link to="/holonet" className="flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono">
                  <Radio size={16} />
                  HoloNet
                </Link>
                <Link to="/research" className="flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono">
                  <FlaskConical size={16} />
                  Forschung
                </Link>
                <Link to="/galaxy" className="flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono">
                  <Map size={16} />
                  Galaxie
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {player?.isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono"
                  title="Admin-Menü"
                >
                  <Shield size={16} />
                </Link>
              )}
              <Link
                to="/settings"
                className="hidden md:flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono"
              >
                <Settings size={16} />
              </Link>

              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-cyan-200/70 hover:text-cyan-100 px-3 py-2 rounded border border-transparent hover:border-cyan-500/30 transition-all font-mono"
              >
                <LogOut size={16} />
                Abmelden
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-cyan-200 hover:text-cyan-100 p-2 rounded border border-transparent hover:border-cyan-500/30 transition-all"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Imperial Command Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border-l border-cyan-500/30 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col p-6">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-cyan-500/20">
                <span className="text-cyan-100 font-bold text-lg font-mono tracking-wider">NAVIGATION</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-cyan-200 hover:text-cyan-100 p-2 rounded border border-transparent hover:border-cyan-500/30 transition-all">
                  <X size={20} />
                </button>
              </div>

              <Link to="/" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <Rocket size={18} />
                Übersicht
              </Link>
              <Link to="/planets" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <Globe size={18} />
                Planeten
              </Link>
              <Link to="/fleet" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <Users size={18} />
                Schiffe
              </Link>
              <Link to="/holonet" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <Radio size={18} />
                HoloNet
              </Link>
              <Link to="/research" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <FlaskConical size={18} />
                Forschung
              </Link>
              <Link to="/galaxy" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <Map size={18} />
                Galaxie
              </Link>
              <Link to="/settings" className="flex items-center gap-3 text-cyan-200/70 hover:text-cyan-100 py-3 px-4 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all font-mono mb-1" onClick={() => setMobileMenuOpen(false)}>
                <Settings size={18} />
                Einstellungen
              </Link>

              {player?.isAdmin && (
                <Link to="/admin" className="flex items-center gap-3 text-cyan-100 py-3 px-4 rounded border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-950/40 transition-all font-mono mt-4 mb-2" onClick={() => setMobileMenuOpen(false)}>
                  <Shield size={18} />
                  Admin
                </Link>
              )}

              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all mt-6 font-mono text-cyan-100"
              >
                <LogOut size={18} />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
