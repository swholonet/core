import { useState, useEffect } from 'react';
import { Shield, Zap, Database, Loader2, Rocket, MapPin } from 'lucide-react';
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

  // Ship spawning state
  const [shipSpawning, setShipSpawning] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [shipTypes, setShipTypes] = useState<any[]>([]);
  const [allPlanets, setAllPlanets] = useState<any[]>([]);
  const [allSystems, setAllSystems] = useState<any[]>([]);
  const [spawnData, setSpawnData] = useState({
    playerId: null as number | null,
    blueprintId: null as number | null,
    name: '',
    locationMode: 'planet' as 'planet' | 'system' | 'galaxy',
    planetId: null as number | null,
    systemId: null as number | null,
    systemX: 15,
    systemY: 15,
    galaxyX: 60,
    galaxyY: 60,
  });

  useEffect(() => {
    loadPlanets();
    loadSpawnData();
  }, []);

  const loadSpawnData = async () => {
    try {
      const [playersRes, blueprintsRes, planetsRes, systemsRes] = await Promise.all([
        api.get('/admin/players'),
        api.get('/admin/blueprints'),
        api.get('/admin/planets'),
        api.get('/admin/systems')
      ]);

      setPlayers(playersRes.data.players || []);
      setShipTypes(blueprintsRes.data.blueprints || []); // Rename later for backward compatibility
      setAllPlanets(planetsRes.data.planets || []);
      setAllSystems(systemsRes.data.systems || []);

      // Set defaults
      if (playersRes.data.players.length > 0) {
        setSpawnData(prev => ({ ...prev, playerId: playersRes.data.players[0].id }));
      }
      if (blueprintsRes.data.blueprints.length > 0) {
        setSpawnData(prev => ({ ...prev, blueprintId: blueprintsRes.data.blueprints[0].id }));
      }
      if (planetsRes.data.planets.length > 0) {
        setSpawnData(prev => ({ ...prev, planetId: planetsRes.data.planets[0].id }));
      }
      if (systemsRes.data.systems.length > 0) {
        setSpawnData(prev => ({ ...prev, systemId: systemsRes.data.systems[0].id }));
      }
    } catch (error) {
      console.error('Failed to load spawn data:', error);
    }
  };

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

  const spawnShip = async () => {
    if (!spawnData.playerId || !spawnData.blueprintId) {
      setMessage({ type: 'error', text: 'Spieler und Blueprint müssen ausgewählt sein' });
      return;
    }

    setShipSpawning(true);
    setMessage(null);

    try {
      const requestData: any = {
        playerId: spawnData.playerId,
        blueprintId: spawnData.blueprintId,
        name: spawnData.name || undefined,
      };

      // Set position based on location mode
      if (spawnData.locationMode === 'planet' && spawnData.planetId) {
        requestData.planetId = spawnData.planetId;
      } else if (spawnData.locationMode === 'system' && spawnData.systemId) {
        requestData.systemId = spawnData.systemId;
        requestData.systemX = spawnData.systemX;
        requestData.systemY = spawnData.systemY;
      } else if (spawnData.locationMode === 'galaxy') {
        requestData.galaxyX = spawnData.galaxyX;
        requestData.galaxyY = spawnData.galaxyY;
      } else {
        setMessage({ type: 'error', text: 'Gültige Position erforderlich' });
        return;
      }

      const response = await api.post('/admin/spawn-ship', requestData);
      setMessage({ type: 'success', text: response.data.message });

      // Reset form
      setSpawnData(prev => ({
        ...prev,
        name: '',
      }));

    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Schiff konnte nicht gespawnt werden'
      });
    } finally {
      setShipSpawning(false);
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

      {/* Imperial Command Ship Spawning */}
      <div className="bg-gradient-to-r from-purple-950/30 to-slate-900/40 border border-purple-500/30 rounded p-6 backdrop-blur-sm">
        <div className="mb-4 pb-3 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-purple-100 flex items-center gap-2 font-mono tracking-wider">
            <Rocket className="text-purple-300" size={20} />
            SCHIFF SPAWNEN
          </h2>
        </div>

        <p className="text-purple-200/70 text-sm mb-6 font-mono">
          SPAWNE EIN SCHIFF FÜR EINEN SPIELER AN EINER BELIEBIGEN POSITION IN DER GALAXIE.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player and Ship Selection */}
          <div className="space-y-4">
            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wider">
                SPIELER AUSWÄHLEN
              </label>
              <select
                value={spawnData.playerId || ''}
                onChange={(e) => setSpawnData(prev => ({ ...prev, playerId: Number(e.target.value) }))}
                className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.username} ({player.factionName})
                  </option>
                ))}
              </select>
            </div>

            {/* Blueprint Selection */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wider">
                BLUEPRINT AUSWÄHLEN
              </label>
              <select
                value={spawnData.blueprintId || ''}
                onChange={(e) => setSpawnData(prev => ({ ...prev, blueprintId: Number(e.target.value) }))}
                className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
              >
                {shipTypes.map((blueprint) => (
                  <option key={blueprint.id} value={blueprint.id}>
                    {blueprint.name} ({blueprint.shipClass}) - {blueprint.createdBy}
                  </option>
                ))}
              </select>
              {shipTypes.length > 0 && spawnData.blueprintId && (
                <div className="mt-3 p-3 bg-slate-900/60 border border-purple-500/20 rounded text-sm font-mono">
                  <p className="text-purple-300 mb-2">BLUEPRINT STATS:</p>
                  {(() => {
                    const selectedBlueprint = shipTypes.find(bp => bp.id === spawnData.blueprintId);
                    if (!selectedBlueprint) return null;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-cyan-400">Hull:</span> {selectedBlueprint.stats.hullPoints}</div>
                        <div><span className="text-cyan-400">Damage:</span> {selectedBlueprint.stats.damage}</div>
                        <div><span className="text-cyan-400">Shields:</span> {selectedBlueprint.stats.shieldStrength}</div>
                        <div><span className="text-cyan-400">Speed:</span> {selectedBlueprint.stats.speed}</div>
                        <div><span className="text-cyan-400">Sensors:</span> {selectedBlueprint.stats.sensorRange}</div>
                        <div><span className="text-cyan-400">Crew:</span> {selectedBlueprint.stats.crewRequired}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Ship Name */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wider">
                SCHIFFSNAME (OPTIONAL)
              </label>
              <input
                type="text"
                value={spawnData.name}
                onChange={(e) => setSpawnData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Leer lassen für automatischen Namen"
                className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm placeholder-purple-300/50"
              />
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-4">
            {/* Location Mode */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wider">
                POSITIONSTYP
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSpawnData(prev => ({ ...prev, locationMode: 'planet' }))}
                  className={`px-3 py-2 rounded text-sm font-mono transition-all ${
                    spawnData.locationMode === 'planet'
                      ? 'bg-purple-600/30 text-purple-100 border border-purple-500'
                      : 'bg-slate-800/40 text-purple-400 border border-purple-600/30 hover:bg-purple-700/20'
                  }`}
                >
                  PLANET
                </button>
                <button
                  onClick={() => setSpawnData(prev => ({ ...prev, locationMode: 'system' }))}
                  className={`px-3 py-2 rounded text-sm font-mono transition-all ${
                    spawnData.locationMode === 'system'
                      ? 'bg-purple-600/30 text-purple-100 border border-purple-500'
                      : 'bg-slate-800/40 text-purple-400 border border-purple-600/30 hover:bg-purple-700/20'
                  }`}
                >
                  SYSTEM
                </button>
                <button
                  onClick={() => setSpawnData(prev => ({ ...prev, locationMode: 'galaxy' }))}
                  className={`px-3 py-2 rounded text-sm font-mono transition-all ${
                    spawnData.locationMode === 'galaxy'
                      ? 'bg-purple-600/30 text-purple-100 border border-purple-500'
                      : 'bg-slate-800/40 text-purple-400 border border-purple-600/30 hover:bg-purple-700/20'
                  }`}
                >
                  GALAXY
                </button>
              </div>
            </div>

            {/* Planet Selection */}
            {spawnData.locationMode === 'planet' && (
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wider">
                  <MapPin className="inline mr-1" size={14} />
                  PLANET AUSWÄHLEN
                </label>
                <select
                  value={spawnData.planetId || ''}
                  onChange={(e) => setSpawnData(prev => ({ ...prev, planetId: Number(e.target.value) }))}
                  className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
                >
                  {allPlanets.map((planet) => (
                    <option key={planet.id} value={planet.id}>
                      {planet.name} ({planet.coordinates}) - {planet.owner}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* System Selection */}
            {spawnData.locationMode === 'system' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wider">
                    <MapPin className="inline mr-1" size={14} />
                    SYSTEM AUSWÄHLEN
                  </label>
                  <select
                    value={spawnData.systemId || ''}
                    onChange={(e) => setSpawnData(prev => ({ ...prev, systemId: Number(e.target.value) }))}
                    className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
                  >
                    {allSystems.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.name} ({system.coordinates})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2 font-mono tracking-wider">
                      SYSTEM X
                    </label>
                    <input
                      type="number"
                      value={spawnData.systemX}
                      onChange={(e) => setSpawnData(prev => ({ ...prev, systemX: Number(e.target.value) }))}
                      min="0"
                      max="39"
                      className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2 font-mono tracking-wider">
                      SYSTEM Y
                    </label>
                    <input
                      type="number"
                      value={spawnData.systemY}
                      onChange={(e) => setSpawnData(prev => ({ ...prev, systemY: Number(e.target.value) }))}
                      min="0"
                      max="39"
                      className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Galaxy Coordinates */}
            {spawnData.locationMode === 'galaxy' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2 font-mono tracking-wider">
                    <MapPin className="inline mr-1" size={14} />
                    GALAXY X
                  </label>
                  <input
                    type="number"
                    value={spawnData.galaxyX}
                    onChange={(e) => setSpawnData(prev => ({ ...prev, galaxyX: Number(e.target.value) }))}
                    min="1"
                    max="120"
                    className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2 font-mono tracking-wider">
                    GALAXY Y
                  </label>
                  <input
                    type="number"
                    value={spawnData.galaxyY}
                    onChange={(e) => setSpawnData(prev => ({ ...prev, galaxyY: Number(e.target.value) }))}
                    min="1"
                    max="120"
                    className="w-full bg-slate-800/60 border border-purple-500/30 rounded px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 font-mono backdrop-blur-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={spawnShip}
            disabled={shipSpawning || !spawnData.playerId || !spawnData.blueprintId}
            className="bg-gradient-to-r from-purple-900/40 to-purple-800/30 border border-purple-500/30 text-purple-100 px-6 py-3 rounded hover:from-purple-800/50 hover:to-purple-700/40 transition-all disabled:from-slate-800/30 disabled:to-slate-700/20 disabled:border-slate-600/20 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 font-mono"
          >
            {shipSpawning ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span className="tracking-wider">SCHIFF WIRD GESPAWNT...</span>
              </>
            ) : (
              <>
                <Rocket size={18} />
                <span className="tracking-wider">SCHIFF SPAWNEN</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
