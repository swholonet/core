import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, MapPin, Battery, Zap, FileCode } from 'lucide-react';
import api from '../lib/api';

interface Ship {
  id: number;
  name: string | null;
  status: string;
  energyWeapons: number;
  energyDrive: number;
  currentGalaxyX: number | null;
  currentGalaxyY: number | null;

  // Blueprint-based effective stats
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
  };

  // Display information
  displayInfo: {
    name: string;
    shipClass: string;
    source: 'blueprint' | 'shipType' | 'hardcoded' | 'fallback';
  };

  // Legacy compatibility (may be null for blueprint-only ships)
  shipType?: {
    name: string;
    maxEnergyWeapons: number;
    maxEnergyDrive: number;
  } | null;

  planet: {
    id: number;
    name: string;
  } | null;
}

export default function Fleet() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShips();
  }, []);

  const loadShips = async () => {
    try {
      const response = await api.get('/player/ships');
      setShips(response.data.ships || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load ships:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-400">Lade Schiffe...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Imperial Command Fleet Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
                <Rocket className="text-cyan-300" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">FLOTTE</h1>
                <div className="flex items-center gap-4 text-sm font-mono">
                  <span className="text-cyan-400/70">SCHIFFE: {ships.length}</span>
                  <span className="text-cyan-400/70">STATUS: {ships.filter(s => s.status === 'DOCKED').length} ANGEDOCKT</span>
                </div>
              </div>
            </div>
            <Link
              to="/blueprints"
              className="bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 px-4 py-2 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all flex items-center gap-2 font-mono text-sm"
            >
              <FileCode size={16} />
              BLUEPRINTS
            </Link>
          </div>
        </div>
      </div>

      {ships.length === 0 ? (
        <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 p-6 rounded backdrop-blur-sm">
          <p className="text-cyan-400/70 font-mono">KEINE SCHIFFE VORHANDEN. BAUE SCHIFFE IN DER RAUMSCHIFFWERFT!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ships.map((ship) => (
            <Link
              key={ship.id}
              to={`/ship/${ship.id}`}
              className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 p-5 rounded hover:border-cyan-400/50 hover:from-slate-950/50 hover:to-cyan-950/30 transition-all backdrop-blur-sm group"
            >
              {/* Ship Header */}
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-cyan-500/20">
                <div>
                  <h3 className="text-cyan-100 font-mono font-semibold tracking-wide">
                    {ship.name || `${ship.displayInfo.name} ${ship.id}`}
                  </h3>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <p className="text-cyan-400/60">{ship.displayInfo.name}</p>
                    <span className="text-cyan-500/40">•</span>
                    <p className="text-cyan-400/40">{ship.displayInfo.shipClass}</p>
                    {ship.displayInfo.source === 'blueprint' && (
                      <span className="bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded text-xs border border-green-500/20">
                        BLUEPRINT
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded border ${
                  ship.status === 'DOCKED'
                    ? 'bg-green-900/40 border-green-500/40 text-green-400' :
                  ship.status === 'IN_FLIGHT'
                    ? 'bg-blue-900/40 border-blue-500/40 text-blue-400' :
                    'bg-red-900/40 border-red-500/40 text-red-400'
                }`}>
                  <Rocket size={16} />
                </div>
              </div>

              {/* Ship Status Details */}
              <div className="space-y-3 text-sm font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400/70">STATUS</span>
                  <span className="text-cyan-100 tracking-wider">
                    {ship.status === 'DOCKED' ? 'ANGEDOCKT' :
                     ship.status === 'IN_FLIGHT' ? 'IM FLUG' :
                     'GESTRANDET'}
                  </span>
                </div>

                {ship.planet && (
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400/70 flex items-center gap-2">
                      <MapPin size={12} />
                      POSITION
                    </span>
                    <span className="text-cyan-100">{ship.planet.name}</span>
                  </div>
                )}

                {ship.currentGalaxyX && ship.currentGalaxyY && (
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400/70">KOORDINATEN</span>
                    <span className="text-cyan-100">{ship.currentGalaxyX}|{ship.currentGalaxyY}</span>
                  </div>
                )}

                {/* Energy Systems */}
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-blue-300 flex items-center gap-2 font-mono">
                        <Battery size={12} />
                        ANTRIEB
                      </span>
                      <span className="text-blue-100 font-mono">{ship.energyDrive}/{ship.shipStats.maxEnergyDrive}</span>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(ship.energyDrive / ship.shipStats.maxEnergyDrive) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-yellow-300 flex items-center gap-2 font-mono">
                        <Zap size={12} />
                        WAFFEN
                      </span>
                      <span className="text-yellow-100 font-mono">{ship.energyWeapons}/{ship.shipStats.maxEnergyWeapons}</span>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-full h-1.5">
                      <div
                        className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(ship.energyWeapons / ship.shipStats.maxEnergyWeapons) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
