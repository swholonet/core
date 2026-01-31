import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Battery, AlertTriangle, Navigation } from 'lucide-react';
import api from '../lib/api';
import { useGameStore } from '../stores/gameStore';
import '../styles/stu-sensor-view.css';

interface ShipData {
  ship: {
    id: number;
    name: string | null;
    status: string;
    currentSystemId: number | null;
    position: {
      galaxyX: number | null;
      galaxyY: number | null;
      systemX: number | null;
      systemY: number | null;
    };
    destination: {
      x: number | null;
      y: number | null;
    };
    energy: {
      weapons: number;
      drive: number;
      maxWeapons: number;
      maxDrive: number;
    };
    health: number;
    crew: number;
    range: number;
  };
  shipStats: {
    hullPoints: number;
    deflectorShieldStrength: number;
    weaponDamage: number;
    subLightSpeed: number;
    hyperdriveRating: number;
    sensorRange: number;
    cargoCapacity: number;
    crewCapacity: number;
    maxEnergyWeapons: number;
    maxEnergyDrive: number;
    source: 'blueprint' | 'shipType' | 'hardcoded';
  };
  sensorView: {
    range: number;
    center: { x: number; y: number };
    ships: Array<{
      id: number;
      currentGalaxyX: number;
      currentGalaxyY: number;
    }>;
    systems: Array<{
      id: number;
      name: string;
      systemType: string;
      galaxyX: number;
      galaxyY: number;
    }>;
    planets: Array<{
      id: number;
      name: string;
      orbitRadius: number;
      orbitAngle: number;
      owner: string | null;
      faction: string | null;
    }>;
    systemGridSize: number;
  };
}

export default function Ship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useGameStore();
  const [shipData, setShipData] = useState<ShipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [charging, setCharging] = useState(false);
  const [viewMode, setViewMode] = useState<'galaxy' | 'system'>('galaxy');
  const [isMoving, setIsMoving] = useState(false);
  const [zoomTransition, setZoomTransition] = useState<'in' | 'out' | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const loadShipData = useCallback(async () => {
    try {
      const response = await api.get(`/ship/${id}`);
      setShipData(response.data);
      
      // Set initial view mode based on ship location
      if (response.data.ship.currentSystemId) {
        setViewMode('system');
      } else {
        setViewMode('galaxy');
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des Schiffs');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadShipData();
  }, [loadShipData]);

  // Listen for real-time ship updates
  useEffect(() => {
    if (!socket || !id) return;

    const handleShipMoved = (data: any) => {
      if (data.shipId === parseInt(id)) {
        loadShipData();
      }
    };

    const handleShipArrived = (data: any) => {
      if (data.shipId === parseInt(id)) {
        loadShipData();
      }
    };

    const handleShipStranded = (data: any) => {
      if (data.shipId === parseInt(id)) {
        loadShipData();
      }
    };

    socket.on('ship:moved', handleShipMoved);
    socket.on('ship:arrived', handleShipArrived);
    socket.on('ship:stranded', handleShipStranded);

    return () => {
      socket.off('ship:moved', handleShipMoved);
      socket.off('ship:arrived', handleShipArrived);
      socket.off('ship:stranded', handleShipStranded);
    };
  }, [socket, id, loadShipData]);

  const chargeEnergy = async (type: 'weapons' | 'drive', amount: number) => {
    if (!shipData) return;
    setCharging(true);

    try {
      await api.post(`/ship/${id}/charge`, { type, amount });
      await loadShipData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Aufladen');
    } finally {
      setCharging(false);
    }
  };

  const setDestination = async (targetX: number, targetY: number) => {
    if (!shipData) return;

    // Get current ship position based on view mode
    const currentX = viewMode === 'galaxy' ? ship.position.galaxyX : ship.position.systemX;
    const currentY = viewMode === 'galaxy' ? ship.position.galaxyY : ship.position.systemY;

    if (currentX === null || currentY === null) return;

    // STU-Style: Only allow orthogonal movement (no diagonal)
    const deltaX = Math.abs(targetX - currentX);
    const deltaY = Math.abs(targetY - currentY);

    if (deltaX > 0 && deltaY > 0) {
      alert('Nur orthogonale Bewegung erlaubt (hoch, runter, links, rechts)');
      return;
    }

    // Calculate energy cost
    const energyCost = viewMode === 'galaxy'
      ? deltaX + deltaY // 1 energy per field in hyperspace
      : (deltaX + deltaY) * 0.5; // 0.5 energy per field in system

    // Check if ship has enough energy
    if (energyCost > ship.energy.drive) {
      alert(`Nicht genug Antriebsenergie! Benötigt: ${energyCost}, Verfügbar: ${ship.energy.drive}`);
      return;
    }

    // Show confirmation for longer movements
    if (energyCost > 1) {
      const confirmed = confirm(
        `Bewegung bestätigen:\n` +
        `Von: ${currentX}|${currentY}\n` +
        `Nach: ${targetX}|${targetY}\n` +
        `Energiekosten: ${energyCost}\n` +
        `Verbleibende Energie: ${ship.energy.drive - energyCost}`
      );
      if (!confirmed) return;
    }

    try {
      setIsMoving(true);

      // Use universal move endpoint that auto-detects layer
      await api.post(`/ship/${id}/move`, { targetX, targetY });
      await loadShipData();

      // Show movement effect for 300ms
      setTimeout(() => setIsMoving(false), 300);
    } catch (err: any) {
      setIsMoving(false);
      alert(err.response?.data?.error || 'Fehler beim Flug');
    }
  };

  const enterSystem = async () => {
    try {
      setZoomTransition('in');
      const response = await api.post(`/ship/${id}/enter-system`);
      alert(response.data.message);
      
      // Wait for zoom animation
      setTimeout(async () => {
        await loadShipData();
        setViewMode('system');
        setZoomTransition(null);
      }, 800);
    } catch (err: any) {
      setZoomTransition(null);
      alert(err.response?.data?.error || 'Fehler beim System-Eintritt');
    }
  };

  const leaveSystem = async () => {
    try {
      setZoomTransition('out');
      const response = await api.post(`/ship/${id}/leave-system`);
      alert(response.data.message);
      
      // Wait for zoom animation
      setTimeout(async () => {
        await loadShipData();
        setViewMode('galaxy');
        setZoomTransition(null);
      }, 800);
    } catch (err: any) {
      setZoomTransition(null);
      alert(err.response?.data?.error || 'Fehler beim System-Verlassen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-white text-xl">Lade Schiffsdaten...</div>
      </div>
    );
  }

  if (error || !shipData) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
        <p className="text-red-200">{error || 'Schiff nicht gefunden'}</p>
        <button
          onClick={() => navigate('/fleet')}
          className="text-rebel hover:underline mt-2 inline-block"
        >
          ← Zurück zu Schiffe
        </button>
      </div>
    );
  }

  const { ship, shipStats, sensorView } = shipData;

  // Determine if ship is in a system or in hyperspace
  const isInSystem = ship.currentSystemId !== null;

  // Helper function to validate if a target is reachable with orthogonal movement
  const isValidMovementTarget = (targetX: number, targetY: number) => {
    const currentX = viewMode === 'galaxy' ? ship.position.galaxyX : ship.position.systemX;
    const currentY = viewMode === 'galaxy' ? ship.position.galaxyY : ship.position.systemY;

    if (currentX === null || currentY === null) return false;

    // Can't move to current position
    if (targetX === currentX && targetY === currentY) return false;

    // Must be orthogonal movement only (no diagonal)
    const deltaX = Math.abs(targetX - currentX);
    const deltaY = Math.abs(targetY - currentY);
    if (deltaX > 0 && deltaY > 0) return false;

    // Calculate energy cost
    const energyCost = viewMode === 'galaxy'
      ? deltaX + deltaY
      : (deltaX + deltaY) * 0.5;

    // Must have sufficient energy
    return energyCost <= ship.energy.drive;
  };

  // Helper function to get energy cost for movement
  const getMovementCost = (targetX: number, targetY: number) => {
    const currentX = viewMode === 'galaxy' ? ship.position.galaxyX : ship.position.systemX;
    const currentY = viewMode === 'galaxy' ? ship.position.galaxyY : ship.position.systemY;

    if (currentX === null || currentY === null) return 0;

    const deltaX = Math.abs(targetX - currentX);
    const deltaY = Math.abs(targetY - currentY);

    return viewMode === 'galaxy'
      ? deltaX + deltaY
      : (deltaX + deltaY) * 0.5;
  };
  
  // Check if ship is at a system position (in galaxy mode)
  const systemAtShipPosition = sensorView.systems.find(
    s => s.galaxyX === ship.position.galaxyX && s.galaxyY === ship.position.galaxyY
  );

  // Build sensor grid based on mode
  const sensorGrid: Array<Array<any>> = [];
  const gridSize = sensorView.range * 2 + 1;
  
  for (let y = 0; y < gridSize; y++) {
    sensorGrid[y] = [];
    for (let x = 0; x < gridSize; x++) {
      if (viewMode === 'galaxy') {
        // Galaxy mode: show galaxy coordinates
        const actualX = sensorView.center.x - sensorView.range + x;
        const actualY = sensorView.center.y - sensorView.range + y;
        
        sensorGrid[y][x] = {
          x: actualX,
          y: actualY,
          mode: 'galaxy',
          ships: sensorView.ships.filter(s => s.currentGalaxyX === actualX && s.currentGalaxyY === actualY),
          system: sensorView.systems.find(sys => sys.galaxyX === actualX && sys.galaxyY === actualY),
          planets: [],
        };
      } else {
        // System mode: show system-internal coordinates
        const actualX = (ship.position.systemX || 0) - sensorView.range + x;
        const actualY = (ship.position.systemY || 0) - sensorView.range + y;
        
        // Calculate planet positions (orbit-based)
        // System center is at gridSize/2
        const systemCenter = Math.floor(sensorView.systemGridSize / 2);
        const planetsAtPosition = sensorView.planets.filter(p => {
          // Convert orbit to cartesian coordinates
          const angleRad = (p.orbitAngle * Math.PI) / 180;
          const planetX = Math.round(systemCenter + p.orbitRadius * Math.cos(angleRad));
          const planetY = Math.round(systemCenter + p.orbitRadius * Math.sin(angleRad));
          return planetX === actualX && planetY === actualY;
        });
        
        sensorGrid[y][x] = {
          x: actualX,
          y: actualY,
          mode: 'system',
          ships: [],
          system: null,
          planets: planetsAtPosition,
        };
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/fleet')}
          className="text-gray-400 hover:text-white inline-flex items-center gap-2 mb-2"
        >
          <ArrowLeft size={20} />
          Zurück zu Schiffe
        </button>
        <h1 className="text-3xl font-bold text-white">
          {ship.name || `Schiff ${ship.id}`}
        </h1>
        <div className="flex items-center gap-4 text-gray-400">
          <span>Status: {ship.status === 'DOCKED' ? 'Angedockt' : ship.status === 'IN_FLIGHT' ? 'Im Flug' : 'Gestrandet'}</span>
          {shipStats.source === 'blueprint' && (
            <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-sm border border-green-500/20">
              BLUEPRINT
            </span>
          )}
          {shipStats.source === 'shipType' && (
            <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-sm border border-yellow-500/20">
              LEGACY
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Sensor View with Dual-Layer Visualization */}
        <div className="bg-space-light p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Sensoren (Reichweite: {sensorView.range})</h2>
            
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('galaxy')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'galaxy' 
                    ? 'bg-holo text-white shadow-holo' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Hyperraum
              </button>
              <button
                onClick={() => setViewMode('system')}
                disabled={!isInSystem}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'system' 
                    ? 'bg-holo text-white shadow-holo' 
                    : isInSystem
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                System
              </button>
            </div>
          </div>
          
          {/* Map Container with Layer-Specific Styling */}
          <div 
            ref={mapRef}
            className={`relative overflow-hidden rounded-lg border-2 border-holo/30 ${
              viewMode === 'galaxy' ? 'hyperspace-map' : 'system-map'
            } ${
              zoomTransition === 'in' ? 'map-zoom-in' : zoomTransition === 'out' ? 'map-zoom-out' : ''
            }`}
            style={{ minHeight: '400px' }}
          >
            {/* Hyperspace Stars Background */}
            {viewMode === 'galaxy' && (
              <div className="hyperspace-stars" />
            )}
            
            {/* System Sun */}
            {viewMode === 'system' && (
              <div 
                className="system-sun"
                style={{
                  width: '120px',
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
            )}
            
            {/* Movement Streaks Effect */}
            <div className={`hyperspace-streaks ${isMoving && viewMode === 'galaxy' ? 'active' : ''}`} />
            
            {/* Sensor Grid */}
            <div className="relative z-10 p-4 overflow-auto">
              {/* Sensor boundary overlay with radar sweep */}
              <div className="sensor-boundary" />
              {/* Sensor grid lines overlay */}
              <div className="sensor-grid-overlay" />
              <table className="border-collapse mx-auto stu-sensor-grid">
                <tbody>
                  {sensorGrid.map((row, y) => (
                    <tr key={y}>
                      {row.map((cell, x) => {
                        const isCenterGalaxy = viewMode === 'galaxy' && cell.x === sensorView.center.x && cell.y === sensorView.center.y;
                        const isCenterSystem = viewMode === 'system' && cell.x === ship.position.systemX && cell.y === ship.position.systemY;
                        const isCenter = isCenterGalaxy || isCenterSystem;
                        const hasShips = cell.ships.length > 0;
                        const hasSystem = !!cell.system;
                        const hasPlanets = cell.planets && cell.planets.length > 0;

                        // STU-Style movement validation
                        const isValidTarget = !isCenter && ship.status === 'DOCKED' && isValidMovementTarget(cell.x, cell.y);
                        const movementCost = getMovementCost(cell.x, cell.y);
                        const isInvalidDiagonal = !isCenter && cell.x !== (viewMode === 'galaxy' ? ship.position.galaxyX : ship.position.systemX)
                          && cell.y !== (viewMode === 'galaxy' ? ship.position.galaxyY : ship.position.systemY);

                        return (
                          <td
                            key={x}
                            onClick={() => !isCenter && ship.status === 'DOCKED' && setDestination(cell.x, cell.y)}
                            className={`w-12 h-12 border relative text-center transition-all ${
                              isCenter
                                ? 'bg-holo/30 border-holo ring-2 ring-holo shadow-holo cursor-default ship-position-marker'
                                : ship.status !== 'DOCKED'
                                  ? 'bg-red-900/20 border-red-800/30 cursor-not-allowed'
                                  : isValidTarget
                                    ? 'bg-green-800/20 border-green-600/40 hover:bg-green-700/40 hover:shadow-lg hover:shadow-green-500/30 cursor-pointer sensor-field-valid'
                                    : isInvalidDiagonal
                                      ? 'bg-red-800/20 border-red-600/30 hover:bg-red-700/30 cursor-not-allowed sensor-field-invalid'
                                      : hasSystem && viewMode === 'galaxy'
                                        ? 'bg-blue-800/40 border-blue-600/50 hover:bg-blue-700/60 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer'
                                        : hasPlanets && viewMode === 'system'
                                          ? 'bg-green-800/40 border-green-600/50 hover:bg-green-700/60 hover:shadow-lg hover:shadow-green-500/30 cursor-pointer'
                                          : 'bg-black/20 border-gray-700/30 hover:bg-gray-800/40 hover:border-holo/50 cursor-pointer'
                            }`}
                            title={
                              `${cell.x}|${cell.y}` +
                              `${hasSystem ? ` - ${cell.system.name}` : ''}` +
                              `${hasPlanets ? ` - ${cell.planets[0].name}` : ''}` +
                              `${!isCenter && ship.status === 'DOCKED' ? ` - Energiekosten: ${movementCost}` : ''}` +
                              `${isValidTarget ? ' - Gültiges Ziel ✓' : ''}` +
                              `${isInvalidDiagonal ? ' - Nur orthogonale Bewegung!' : ''}`
                            }
                          >
                            <div className="flex items-center justify-center h-full">
                              {hasShips && !isCenter && (
                                <span className="sensor-contact-ship font-bold text-sm">{cell.ships.length}</span>
                              )}
                              {isCenter && (
                                <span className="text-holo font-bold text-2xl drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">●</span>
                              )}
                              {hasSystem && viewMode === 'galaxy' && !isCenter && (
                                <span className="sensor-contact-system text-xl">★</span>
                              )}
                              {hasPlanets && viewMode === 'system' && !isCenter && (
                                <span className="sensor-contact-planet text-xl">◉</span>
                              )}
                              {/* Energy cost preview for valid targets */}
                              {isValidTarget && movementCost > 0 && (
                                <span className="energy-cost-preview">{movementCost}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-400 space-y-1 font-mono">
            <p className="font-semibold text-holo mb-1 tracking-wider">
              {viewMode === 'galaxy' ? '[ HYPERRAUM-MODUS ]' : '[ SYSTEM-MODUS ]'}
            </p>
            {viewMode === 'galaxy' ? (
              <>
                <p className="text-holo/80">Galaxy-Position: <span className="text-white">{ship.position.galaxyX || '?'}|{ship.position.galaxyY || '?'}</span></p>
                {ship.destination.x && (
                  <p className="text-blue-400">→ Ziel: <span className="text-white">{ship.destination.x}|{ship.destination.y}</span></p>
                )}
                <p className="text-gray-500 italic mt-2">▶ Klicke auf ein Feld zum Hyperraum-Sprung (1 Energie/Feld)</p>
              </>
            ) : (
              <>
                <p className="text-holo/80">System-Position: <span className="text-white">{ship.position.systemX || '?'}|{ship.position.systemY || '?'}</span></p>
                <p className="text-gray-500 italic mt-2">▶ Klicke auf ein Feld um zu fliegen (0.5 Energie/Feld)</p>
              </>
            )}
            
            {/* System Enter/Leave Buttons */}
            <div className="mt-3 pt-3 border-t border-holo/20">
              {!isInSystem && ship.status === 'DOCKED' && systemAtShipPosition && (
                <button
                  onClick={enterSystem}
                  className="w-full bg-holo/20 hover:bg-holo/30 text-holo border border-holo px-3 py-2 rounded text-sm font-semibold transition-all hover:shadow-holo"
                >
                  ▶ SYSTEM BETRETEN: {systemAtShipPosition.name}
                </button>
              )}
              {isInSystem && (
                <button
                  onClick={leaveSystem}
                  className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600 px-3 py-2 rounded text-sm font-semibold transition-all hover:shadow-[0_0_10px_rgba(255,140,0,0.4)]"
                >
                  ▶ SYSTEM VERLASSEN (Hyperraum)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Ship Control Panel */}
        <div className="space-y-4">
          {/* Energy Status */}
          <div className="bg-space-light p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Energiesysteme</h3>
            
            {/* Drive Energy */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300 text-sm flex items-center gap-1">
                  <Battery size={16} />
                  Antriebsenergie
                </span>
                <span className="text-white text-sm">{ship.energy.drive} / {ship.energy.maxDrive}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(ship.energy.drive / ship.energy.maxDrive) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Reichweite: {ship.range} Felder (1 Energie = 1 Feld)</p>
              
              {ship.status === 'DOCKED' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => chargeEnergy('drive', 100)}
                    disabled={charging}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => chargeEnergy('drive', ship.energy.maxDrive)}
                    disabled={charging}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>
              )}
            </div>

            {/* Weapons Energy */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-300 text-sm flex items-center gap-1">
                  <Zap size={16} />
                  Waffenenergie
                </span>
                <span className="text-white text-sm">{ship.energy.weapons} / {ship.energy.maxWeapons}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${(ship.energy.weapons / ship.energy.maxWeapons) * 100}%` }}
                />
              </div>
              
              {ship.status === 'DOCKED' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => chargeEnergy('weapons', 50)}
                    disabled={charging}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    +50
                  </button>
                  <button
                    onClick={() => chargeEnergy('weapons', ship.energy.maxWeapons)}
                    disabled={charging}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ship Stats */}
          <div className="bg-space-light p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Schiffsdaten</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Angriff</p>
                <p className="text-white">{shipStats.weaponDamage}</p>
              </div>
              <div>
                <p className="text-gray-400">Schilde</p>
                <p className="text-white">{shipStats.deflectorShieldStrength}</p>
              </div>
              <div>
                <p className="text-gray-400">Hülle</p>
                <p className="text-white">{shipStats.hullPoints}</p>
              </div>
              <div>
                <p className="text-gray-400">Besatzung</p>
                <p className="text-white">{ship.crew}/{shipStats.crewCapacity}</p>
              </div>
              <div>
                <p className="text-gray-400">Geschwindigkeit</p>
                <p className="text-white">{shipStats.subLightSpeed}</p>
              </div>
              <div>
                <p className="text-gray-400">Sensoren</p>
                <p className="text-white">{shipStats.sensorRange} Felder</p>
              </div>
              <div>
                <p className="text-gray-400">Hyperantrieb</p>
                <p className="text-white">Klasse {shipStats.hyperdriveRating}</p>
              </div>
              <div>
                <p className="text-gray-400">Frachtraum</p>
                <p className="text-white">{shipStats.cargoCapacity}</p>
              </div>
            </div>
          </div>

          {/* Status Warnings */}
          {ship.status === 'STRANDED' && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={20} />
                <span className="font-semibold">Schiff gestrandet!</span>
              </div>
              <p className="text-red-300 text-sm mt-2">
                Keine Antriebsenergie mehr verfügbar. Schiff kann nicht weiterfliegen.
              </p>
            </div>
          )}

          {ship.status === 'IN_FLIGHT' && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Navigation size={20} />
                <span className="font-semibold">Im Flug</span>
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Ziel: {ship.destination.x}|{ship.destination.y}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
