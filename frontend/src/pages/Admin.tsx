import { useState, useEffect } from 'react';
import { Shield, Zap, Database, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useGameStore } from '../stores/gameStore';

export default function Admin() {
  const { player } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [tickLoading, setTickLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);
  const [planets, setPlanets] = useState<any[]>([]);
  const [resources, setResources] = useState({
    credits: 1000,
    durastahl: 1000,
    kristall: 1000,
    energy: 1000,
  });

  useEffect(() => {
    loadPlanets();
  }, []);

  const loadPlanets = async () => {
    try {
      const response = await api.get('/player/dashboard');
      setPlanets(response.data.planets || []);
      if (response.data.planets.length > 0) {
        setSelectedPlanetId(response.data.planets[0].id);
      }
    } catch (error) {
      console.error('Failed to load planets:', error);
    }
  };

  const triggerTick = async () => {
    setTickLoading(true);
    setMessage(null);
    try {
      const response = await api.post('/admin/trigger-tick');
      setMessage({ type: 'success', text: response.data.message });
      // Reload planets to show updated resources
      setTimeout(loadPlanets, 1000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Tick konnte nicht ausgelöst werden' 
      });
    } finally {
      setTickLoading(false);
    }
  };

  const addResources = async () => {
    if (!selectedPlanetId) {
      setMessage({ type: 'error', text: 'Bitte wähle einen Planeten aus' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await api.post('/admin/add-resources', {
        planetId: selectedPlanetId,
        ...resources,
      });
      setMessage({ type: 'success', text: response.data.message });
      // Reload planets to show updated resources
      setTimeout(loadPlanets, 500);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Ressourcen konnten nicht hinzugefügt werden' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!player?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Zugriff verweigert</h1>
          <p className="text-gray-400">Du hast keine Admin-Rechte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Imperial Command Admin Header */}
      <div className="bg-gradient-to-r from-red-950/40 to-slate-900/60 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-900/40 border border-red-500/40 rounded">
            <Shield className="text-red-300" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-100 font-mono tracking-wider">ADMIN-MENÜ</h1>
            <p className="text-red-400/70 text-sm font-mono">ENTWICKLER-TOOLS FÜR SCHNELLERE TESTS</p>
          </div>
        </div>
      </div>

      {/* Imperial Command Message Display */}
      {message && (
        <div className={`p-4 rounded border backdrop-blur-sm ${
          message.type === 'success'
            ? 'bg-gradient-to-r from-green-950/40 to-green-900/20 border-green-500/40 text-green-300'
            : 'bg-gradient-to-r from-red-950/40 to-red-900/20 border-red-500/40 text-red-300'
        }`}>
          <p className="font-mono">{message.text}</p>
        </div>
      )}

      {/* Imperial Command Tick System */}
      <div className="bg-gradient-to-r from-yellow-950/30 to-slate-900/40 border border-yellow-500/30 rounded p-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-yellow-500/20">
          <h2 className="text-xl font-bold text-yellow-100 flex items-center gap-2 font-mono tracking-wider">
            <Zap className="text-yellow-300" size={20} />
            TICK SYSTEM
          </h2>
        </div>
        <p className="text-yellow-200/70 text-sm mb-6 font-mono">
          LÖSE MANUELL EINEN TICK AUS. DIES VERARBEITET RESSOURCENPRODUKTION, FORSCHUNGSFORTSCHRITT UND ENERGIEBILANZ.
        </p>
        <button
          onClick={triggerTick}
          disabled={tickLoading}
          className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/30 border border-yellow-500/30 text-yellow-100 px-6 py-3 rounded hover:from-yellow-800/50 hover:to-yellow-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 font-mono"
        >
          {tickLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span className="tracking-wider">TICK WIRD AUSGEFÜHRT...</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span className="tracking-wider">TICK AUSLÖSEN</span>
            </>
          )}
        </button>
      </div>

      {/* Imperial Command Add Resources */}
      <div className="bg-gradient-to-r from-blue-950/30 to-slate-900/40 border border-blue-500/30 rounded p-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-blue-500/20">
          <h2 className="text-xl font-bold text-blue-100 flex items-center gap-2 font-mono tracking-wider">
            <Database className="text-blue-300" size={20} />
            RESSOURCEN HINZUFÜGEN
          </h2>
        </div>

        {/* Planet Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-blue-300 mb-3 font-mono tracking-wider">
            PLANET AUSWÄHLEN
          </label>
          <select
            value={selectedPlanetId || ''}
            onChange={(e) => setSelectedPlanetId(Number(e.target.value))}
            className="w-full bg-slate-800/60 border border-blue-500/30 rounded px-4 py-3 text-blue-100 focus:outline-none focus:border-blue-400 font-mono backdrop-blur-sm"
          >
            {planets.map((planet) => (
              <option key={planet.id} value={planet.id}>
                {planet.name} ({planet.coordinates})
              </option>
            ))}
          </select>
        </div>

        {/* Resource Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2 font-mono tracking-wider">
              CREDITS
            </label>
            <input
              type="number"
              value={resources.credits}
              onChange={(e) => setResources({ ...resources, credits: Number(e.target.value) })}
              className="w-full bg-slate-800/60 border border-blue-500/30 rounded px-4 py-3 text-blue-100 focus:outline-none focus:border-blue-400 font-mono backdrop-blur-sm"
              min="0"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2 font-mono tracking-wider">
              DURASTAHL
            </label>
            <input
              type="number"
              value={resources.durastahl}
              onChange={(e) => setResources({ ...resources, durastahl: Number(e.target.value) })}
              className="w-full bg-slate-800/60 border border-blue-500/30 rounded px-4 py-3 text-blue-100 focus:outline-none focus:border-blue-400 font-mono backdrop-blur-sm"
              min="0"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2 font-mono tracking-wider">
              KRISTALL
            </label>
            <input
              type="number"
              value={resources.kristall}
              onChange={(e) => setResources({ ...resources, kristall: Number(e.target.value) })}
              className="w-full bg-slate-800/60 border border-blue-500/30 rounded px-4 py-3 text-blue-100 focus:outline-none focus:border-blue-400 font-mono backdrop-blur-sm"
              min="0"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2 font-mono tracking-wider">
              ENERGIE
            </label>
            <input
              type="number"
              value={resources.energy}
              onChange={(e) => setResources({ ...resources, energy: Number(e.target.value) })}
              className="w-full bg-slate-800/60 border border-blue-500/30 rounded px-4 py-3 text-blue-100 focus:outline-none focus:border-blue-400 font-mono backdrop-blur-sm"
              min="0"
              step="100"
            />
          </div>
        </div>

        <button
          onClick={addResources}
          disabled={loading || !selectedPlanetId}
          className="bg-gradient-to-r from-blue-900/40 to-blue-800/30 border border-blue-500/30 text-blue-100 px-6 py-3 rounded hover:from-blue-800/50 hover:to-blue-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 font-mono"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span className="tracking-wider">WIRD HINZUGEFÜGT...</span>
            </>
          ) : (
            <>
              <Database size={18} />
              <span className="tracking-wider">RESSOURCEN HINZUFÜGEN</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
