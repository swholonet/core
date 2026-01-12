import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Users, Star } from 'lucide-react';
import api from '../lib/api';
import PlanetImage, { getPlanetTypeLabel } from '../components/PlanetImage';
import SunImage from '../components/SunImage';

interface Planet {
  id: string;
  name: string;
  planetType: string;
  visualSeed?: number;
  orbitRadius: number;
  orbitAngle: number;
  fieldX: number;
  fieldY: number;
  player?: {
    id: string;
    username: string;
    faction: {
      id: string;
      name: string;
    };
  };
}

interface System {
  id: string;
  name: string;
  systemType: 'SINGLE_STAR' | 'BINARY_STAR' | 'NEUTRON_STAR' | 'BLACK_HOLE';
  fieldX: number;
  fieldY: number;
  gridSize: number;
  sector: {
    x: number;
    y: number;
  };
  planets: Planet[];
}

export default function SystemView() {
  const { systemId } = useParams<{ systemId: string }>();
  const navigate = useNavigate();
  const [system, setSystem] = useState<System | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    loadSystemData();
  }, [systemId]);

  const loadSystemData = async () => {
    if (!systemId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/galaxy/system/${systemId}`);
      setSystem(response.data);
    } catch (err: any) {
      console.error('Failed to load system:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden des Systems');
    } finally {
      setIsLoading(false);
    }
  };

  const getSystemTypeLabel = (type: System['systemType']) => {
    switch (type) {
      case 'SINGLE_STAR': return 'Einzelstern';
      case 'BINARY_STAR': return 'Doppelsternsystem';
      case 'NEUTRON_STAR': return 'Neutronenstern';
      case 'BLACK_HOLE': return 'Schwarzes Loch';
      default: return type;
    }
  };


  const convertPlanetToGridPosition = (planet: Planet) => {
    if (!system) return { x: 0, y: 0 };
    // Convert orbital position (radius/angle) to grid coordinates
    const center = Math.floor(system.gridSize / 2);
    const angleRad = (planet.orbitAngle * Math.PI) / 180;
    const x = Math.round(center + planet.orbitRadius * Math.cos(angleRad));
    const y = Math.round(center + planet.orbitRadius * Math.sin(angleRad));
    return { x: Math.max(1, Math.min(system.gridSize, x)), y: Math.max(1, Math.min(system.gridSize, y)) };
  };

  const getCellContent = (x: number, y: number) => {
    if (!system) return { type: 'empty' };
    const center = Math.floor(system.gridSize / 2);
    
    // Check if this is the star position (center of grid)
    if (x === center && y === center) {
      return { type: 'star', data: system };
    }

    // For binary stars, also show second star offset
    if (system?.systemType === 'BINARY_STAR' && x === center + 1 && y === center) {
      return { type: 'star2', data: system };
    }

    // Check for planets
    const planet = system?.planets.find(p => {
      const pos = convertPlanetToGridPosition(p);
      return pos.x === x && pos.y === y;
    });

    if (planet) {
      return { type: 'planet', data: planet };
    }

    return { type: 'empty', data: null };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Lade System...</p>
        </div>
      </div>
    );
  }

  if (error || !system) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-red-400">{error || 'System nicht gefunden'}</p>
        <button
          onClick={() => navigate('/galaxy')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Zurück zur Galaxie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Imperial Command System Header */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/galaxy')}
            className="flex items-center gap-2 text-cyan-400/70 hover:text-cyan-300 transition-all font-mono"
          >
            <div className="p-1 bg-cyan-900/40 border border-cyan-500/40 rounded">
              <ArrowLeft size={16} />
            </div>
            <span className="tracking-wider">GALAXIE</span>
          </button>
          <div className="flex items-center gap-4 flex-1">
            <div className="p-2 bg-yellow-900/40 border border-yellow-500/40 rounded">
              <Star className="text-yellow-300" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">{system.name.toUpperCase()}</h1>
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="text-cyan-400/70">TYP: {getSystemTypeLabel(system.systemType).toUpperCase()}</span>
                <span className="text-cyan-400/70">KOORDINATEN: {system.sector.x * 20 + system.fieldX}|{system.sector.y * 20 + system.fieldY}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Imperial Command Grid View */}
        <div className="flex-1 bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-6 backdrop-blur-sm">
          <div className="overflow-auto">
            <table className="border-collapse" style={{ minWidth: '800px' }}>
              {/* Column headers */}
              <thead>
                <tr>
                  <th className="w-6 h-6"></th>
                  {Array.from({ length: system.gridSize }, (_, i) => i + 1).map(x => (
                    <th key={x} className="w-6 h-6 text-xs text-gray-400 font-normal">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: system.gridSize }, (_, y) => {
                  const row = y + 1;
                  return (
                    <tr key={row}>
                      {/* Row header */}
                      <td className="w-6 h-6 text-xs text-gray-400 text-right pr-1">{row}</td>
                      {/* Grid cells */}
                      {Array.from({ length: system.gridSize }, (_, x) => {
                        const col = x + 1;
                        const cell = getCellContent(col, row);
                        const isHovered = hoveredCell?.x === col && hoveredCell?.y === row;

                        return (
                          <td
                            key={col}
                            className="border border-gray-800 relative group cursor-pointer"
                            style={{ width: '24px', height: '24px', padding: 0 }}
                            onMouseEnter={() => setHoveredCell({ x: col, y: row })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => cell.type === 'planet' && cell.data && navigate(`/planet/${cell.data.id}`)}
                          >
                            {/* Star */}
                            {cell.type === 'star' && (
                              <div className="w-full h-full flex items-center justify-center">
                                <SunImage
                                  systemType={system.systemType}
                                  size={24}
                                  alt={system.name}
                                  className="rounded-full shadow-lg shadow-yellow-400/50"
                                />
                              </div>
                            )}
                            {cell.type === 'star2' && (
                              <div className="w-full h-full flex items-center justify-center">
                                <SunImage
                                  systemType={system.systemType}
                                  visualSeed={2}
                                  size={20}
                                  alt={`${system.name} (Begleitstern)`}
                                  className="rounded-full shadow-lg shadow-orange-400/50"
                                />
                              </div>
                            )}

                            {/* Planet */}
                            {cell.type === 'planet' && cell.data && 'planetType' in cell.data && (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlanetImage 
                                  planetType={cell.data.planetType}
                                  visualSeed={cell.data.visualSeed || 1}
                                  alt={cell.data.name || 'Planet'}
                                  size={20}
                                  className="rounded-full transition-transform hover:scale-150"
                                />
                              </div>
                            )}

                            {/* Asteroid */}
                            {cell.type === 'asteroid' && (
                              <div className="w-full h-full bg-gray-600" style={{ 
                                clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                              }} />
                            )}

                            {/* Hover highlight */}
                            {isHovered && cell.type !== 'empty' && (
                              <div className="absolute inset-0 border-2 border-white pointer-events-none" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Imperial Command Info Panel */}
        <div className="w-80 space-y-6">
          {/* System Info */}
          <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-4 backdrop-blur-sm">
            <div className="mb-3 pb-2 border-b border-cyan-500/20">
              <h3 className="text-cyan-100 font-semibold font-mono tracking-wider">{system.name.toUpperCase()}</h3>
            </div>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-cyan-400/70">TYP:</span>
                <span className="text-cyan-100">{getSystemTypeLabel(system.systemType).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400/70">KOORDINATEN:</span>
                <span className="text-cyan-100">{system.sector.x * 20 + system.fieldX}|{system.sector.y * 20 + system.fieldY}</span>
              </div>
            </div>
          </div>

          {/* Hovered Cell Info */}
          {hoveredCell && (() => {
            const cell = getCellContent(hoveredCell.x, hoveredCell.y);
            if (cell.type === 'planet') {
              const planet = cell.data as Planet;
              return (
                <div className="bg-space-light rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">{planet.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{getPlanetTypeLabel(planet.planetType)}</p>
                  <p className="text-xs text-gray-500 mb-2">Position: {hoveredCell.x}|{hoveredCell.y}</p>
                  {planet.player ? (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-gray-300">{planet.player.username}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{planet.player.faction.name}</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-green-400">Unbesiedelt</p>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Imperial Command Planet List */}
          <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-4 backdrop-blur-sm">
            <div className="mb-4 pb-2 border-b border-cyan-500/20">
              <h2 className="text-lg font-semibold text-cyan-100 flex items-center gap-2 font-mono tracking-wider">
                <MapPin className="text-cyan-400" size={18} />
                PLANETEN ({system.planets.length})
              </h2>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {system.planets.map(planet => {
                const pos = convertPlanetToGridPosition(planet);
                return (
                  <div
                    key={planet.id}
                    className="bg-slate-950/30 border border-slate-700/40 rounded p-3 hover:border-cyan-500/40 hover:bg-slate-950/40 cursor-pointer transition-all text-sm"
                    onClick={() => navigate(`/planet/${planet.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-cyan-100 font-mono">{planet.name}</h3>
                      <span className="text-xs text-cyan-400/60 font-mono">{pos.x}|{pos.y}</span>
                    </div>
                    <p className="text-xs text-cyan-400/70 font-mono">{getPlanetTypeLabel(planet.planetType).toUpperCase()}</p>
                    {planet.player && (
                      <p className="text-xs text-blue-400 mt-2 font-mono">{planet.player.username.toUpperCase()}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
