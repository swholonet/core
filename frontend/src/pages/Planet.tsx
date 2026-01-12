import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Zap, Trash2, Rocket, Coins, Wrench, Gem, TrendingUp, Factory, Clock, X } from 'lucide-react';
import api from '../lib/api';
import BuildMenu from '../components/BuildMenu';
import OrbitalDockAction from '../components/OrbitalDockAction';
import { useGameStore } from '../stores/gameStore';
import logger from '../lib/logger';

// Building names for shipyard functionality (supports both old and new names)
const SHIPYARD_BUILDING_NAMES = ['Orbitales Raumdock', 'Raumschiffwerft', 'Shipyard'];

interface Building {
  id: number;
  level: number;
  isActive: boolean;
  completedAt: string | null;
  constructionStartedAt: string;
  buildingType: {
    id: number;
    name: string;
    description: string;
    category: string;
    energyCostPerTick: number;
    energyCostToBuild: number;
    buildTime: number;
  };
}

interface PlanetField {
  id: number;
  x: number;
  y: number;
  fieldType: string;
  buildingId: number | null;
  building: Building | null;
}

interface Planet {
  id: number;
  name: string;
  planetType: string;
  sizeX: number;
  sizeY: number;
  credits: number;
  durastahl: number;
  kristallinesSilizium: number;
  tibannaGas: number;
  energiemodule: number;
  kyberKristalle: number;
  bacta: number;
  beskar: number;
  energyStorage: number;
  energyStorageCapacity: number;
  storageCapacity: number;
  orbitRadius: number;
  orbitAngle: number;
  production?: {
    credits: number;
    durastahl: number;
    kristallinesSilizium: number;
    tibannaGas: number;
    energiemodule: number;
    kyberKristalle: number;
    bacta: number;
    beskar: number;
  };
  system: {
    id: number;
    name: string;
    systemType: string;
    fieldX: number;
    fieldY: number;
    sector: {
      x: number;
      y: number;
    };
  };
  player: {
    user: {
      username: string;
    };
    faction: {
      name: string;
    };
  } | null;
  fields: PlanetField[];
  buildings: Building[];
}

const fieldTypeColors: Record<string, string> = {
  // Orbit layer
  SPACE: 'bg-black hover:bg-gray-900',
  // Surface layer
  LAND: 'bg-green-800 hover:bg-green-700',
  WATER: 'bg-blue-600 hover:bg-blue-500',
  MOUNTAIN: 'bg-gray-600 hover:bg-gray-500',
  // Underground layer
  ROCK: 'bg-stone-800 hover:bg-stone-700',
  CRYSTAL: 'bg-purple-800 hover:bg-purple-700',
  METAL: 'bg-slate-700 hover:bg-slate-600',
};

const buildingColors: Record<string, string> = {
  // English names
  'Command Center': 'bg-yellow-500',
  'Solar Plant': 'bg-orange-500',
  'Metal Mine': 'bg-gray-400',
  'Crystal Harvester': 'bg-purple-500',
  'Warehouse': 'bg-blue-500',
  'Trade Hub': 'bg-green-500',
  'Shipyard': 'bg-indigo-600',
  'Research Lab': 'bg-cyan-500',
  'Defense Grid': 'bg-red-600',
  'Refinery': 'bg-amber-600',
  'Hangar': 'bg-slate-600',
  // German names
  'Kommandozentrale': 'bg-yellow-500',
  'Solarkraftwerk': 'bg-orange-500',
  'Durastahl-Mine': 'bg-gray-400',
  'Kristallraffinerie': 'bg-purple-500',
  'Lagerhaus': 'bg-blue-500',
  'Handelszentrum': 'bg-green-500',
  'Raumschiffwerft': 'bg-indigo-600',
  'Orbitales Raumdock': 'bg-indigo-600',
  'Forschungslabor': 'bg-cyan-500',
  'Verteidigungsgitter': 'bg-red-600',
  'Verarbeitungsanlage': 'bg-amber-600',
};

type LayerTab = 'orbit' | 'surface' | 'underground';

export default function Planet() {
  const { id } = useParams();
  const { socket } = useGameStore();
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [selectedField, setSelectedField] = useState<PlanetField | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [demolishing, setDemolishing] = useState(false);
  const [, setTick] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [newPlanetName, setNewPlanetName] = useState('');
  const [activeTab, setActiveTab] = useState<LayerTab>('surface');
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const loadPlanet = useCallback(async () => {
    try {
      const response = await api.get(`/planet/${id}`);
      setPlanet(response.data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load planet');
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlanet();
  }, [loadPlanet]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket || !id) return;

    const handleBuildingCompleted = (data: any) => {
      logger.socket('Building completed event:', data);
      if (data.planetId === parseInt(id)) {
        logger.info('Reloading planet after building completion');
        loadPlanet();
      }
    };

    const handleResourcesUpdated = (data: any) => {
      logger.socket('Resources updated event:', data);
      if (data.planetId === parseInt(id)) {
        setPlanet(prev => prev ? {
          ...prev,
          credits: data.credits,
          durastahl: data.durastahl,
          kristallinesSilizium: data.kristallinesSilizium,
          tibannaGas: data.tibannaGas,
          energiemodule: data.energiemodule,
          kyberKristalle: data.kyberKristalle,
          bacta: data.bacta,
          beskar: data.beskar,
        } : null);
      }
    };

    socket.on('building:completed', handleBuildingCompleted);
    socket.on('resources:updated', handleResourcesUpdated);

    return () => {
      socket.off('building:completed', handleBuildingCompleted);
      socket.off('resources:updated', handleResourcesUpdated);
    };
  }, [socket, id, loadPlanet]);

  const demolishBuilding = async (buildingId: number) => {
    if (!confirm('Gebäude abreißen? Du erhältst 50% der Baukosten zurück.')) {
      return;
    }

    setDemolishing(true);
    try {
      const response = await api.delete(`/planet/${id}/building/${buildingId}`);
      alert(`Gebäude abgerissen! Rückerstattung: ${response.data.refund.credits} Credits, ${response.data.refund.durastahl} Durastahl, ${response.data.refund.kristallinesSilizium} Kristallines Silizium`);
      setSelectedField(null);
      setShowBottomSheet(false);
      await loadPlanet();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to demolish building');
    } finally {
      setDemolishing(false);
    }
  };

  const renamePlanet = async () => {
    if (!newPlanetName.trim() || newPlanetName === planet?.name) {
      setEditingName(false);
      return;
    }

    try {
      await api.patch(`/planet/${id}/rename`, { name: newPlanetName });
      await loadPlanet();
      setEditingName(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Umbenennen des Planeten');
      setEditingName(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-white text-xl">Lade Planet...</div>
      </div>
    );
  }

  if (error || !planet) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
        <p className="text-red-200">{error || 'Planet nicht gefunden'}</p>
        <Link to="/" className="text-rebel hover:underline mt-2 inline-block">
          ← Zurück zum Dashboard
        </Link>
      </div>
    );
  }

  // Create 2D grid from flat fields array
  const grid: PlanetField[][] = [];
  for (let y = 0; y < planet.sizeY; y++) {
    grid[y] = [];
    for (let x = 0; x < planet.sizeX; x++) {
      const field = planet.fields.find(f => f.x === x && f.y === y);
      if (field) {
        grid[y][x] = field;
      }
    }
  }

  // Get layers for tab navigation
  const orbitFields = grid.slice(0, 2);
  const surfaceFields = grid.slice(2, 8);
  const undergroundFields = grid.slice(8, 10);

  const handleFieldClick = (field: PlanetField) => {
    setSelectedField(field);
    // Mobile: open bottom sheet
    if (window.innerWidth < 768) {
      setShowBottomSheet(true);
    }
  };

  const closeBottomSheet = () => {
    setShowBottomSheet(false);
    setShowBuildMenu(false);
  };

  const renderGrid = (fields: PlanetField[][], layerName: string, layerColor: string) => {
    return (
      <div className="inline-block border rounded-sm" style={{ borderColor: layerColor }}>
        <div className="text-sm px-2 py-1 font-semibold" style={{ color: layerColor, backgroundColor: `${layerColor}20` }}>
          {layerName}
        </div>
        {fields.map((row, y) => (
          <div key={y} className="flex">
            {row.map((field, x) => (
              <button
                key={`${x}-${y}`}
                onClick={() => handleFieldClick(field)}
                className={`
                  w-[44px] h-[44px] md:w-[50px] md:h-[50px] border border-gray-800/30 relative
                  transition-all duration-200 touch-manipulation
                  ${selectedField?.id === field.id ? 'ring-2 ring-yellow-400 scale-105' : ''}
                  ${field.building 
                    ? buildingColors[field.building.buildingType.name] || 'bg-gray-500'
                    : fieldTypeColors[field.fieldType]
                  }
                `}
                title={field.building 
                  ? `${field.building.buildingType.name} (Lvl ${field.building.level})`
                  : field.fieldType
                }
              >
                {field.building && field.building.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-sm font-bold bg-black/60 rounded-sm px-1.5">
                      {field.building.level}
                    </div>
                  </div>
                )}
                {!field.building?.isActive && field.building && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderBuildingDetails = () => {
    if (!selectedField) return null;

    if (!selectedField.building) {
      return (
        <div className="space-y-4">
          <div className="text-xs md:text-sm">
            <p className="text-gray-400">Geländetyp</p>
            <p className="text-white">{selectedField.fieldType}</p>
          </div>
          <button
            onClick={() => setShowBuildMenu(true)}
            className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2"
          >
            <Factory size={18} />
            Gebäude errichten
          </button>
        </div>
      );
    }

    const building = selectedField.building;
    const startTime = new Date(building.constructionStartedAt).getTime();
    const totalBuildTime = building.buildingType.buildTime * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalBuildTime - elapsed);
    const progress = Math.min(100, (elapsed / totalBuildTime) * 100);
    const remainingMinutes = Math.ceil(remaining / 60000);
    const remainingSeconds = Math.ceil(remaining / 1000);

    return (
      <div className="space-y-3">
        <div className="text-xs md:text-sm">
          <p className="text-gray-400">Gebäude</p>
          <p className="text-white font-semibold text-base md:text-lg">{building.buildingType.name}</p>
          <p className="text-gray-400 mt-1 text-xs">{building.buildingType.description}</p>
        </div>

        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-400">Level</span>
          <span className="text-white font-semibold">{building.level}</span>
        </div>

        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-400">Status</span>
          <span className={`font-semibold ${building.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
            {building.isActive ? 'Aktiv' : 'Im Bau'}
          </span>
        </div>

        {!building.isActive && !building.completedAt && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded p-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yellow-400">Fortschritt</span>
              <span className="text-yellow-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-yellow-400">
              {remainingMinutes > 0 
                ? `Noch ${remainingMinutes} Min ${remainingSeconds % 60} Sek`
                : `Noch ${remainingSeconds} Sek`
              }
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => demolishBuilding(building.id)}
            disabled={demolishing}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-3 py-2 rounded transition flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 size={16} />
            Abreißen
          </button>
        </div>

        {building.buildingType.energyCostPerTick > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Zap size={14} className="text-yellow-500" />
                Energieverbrauch
              </span>
              <span className="text-red-400">-{building.buildingType.energyCostPerTick}/Tick</span>
            </div>
          </div>
        )}

        {/* Orbital Dock Action */}
        {SHIPYARD_BUILDING_NAMES.includes(building.buildingType.name) && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <OrbitalDockAction
              planetId={planet!.id}
              buildingName={building.buildingType.name}
              isActive={building.isActive}
              onClose={() => {
                setSelectedField(null);
                setShowBottomSheet(false);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderPlanetDashboard = () => (
    <div className="space-y-4 transition-all duration-300">
      <div className="mb-4 pb-3 border-b border-cyan-500/20">
        <h3 className="text-cyan-100 font-semibold font-mono tracking-wider flex items-center gap-2">
          <TrendingUp size={20} />
          PLANETEN-DASHBOARD
        </h3>
      </div>

      {/* Imperial Command Resource Production Overview */}
      <div className="bg-slate-950/20 border border-slate-700/30 rounded p-3">
        <h4 className="text-cyan-300 font-semibold mb-3 text-sm font-mono tracking-wider">PRODUKTION PRO RUNDE</h4>
        <div className="space-y-2">
          {planet.production && planet.production.credits > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-200 flex items-center gap-2 font-mono">
                <Coins size={14} className="text-yellow-400" />
                CREDITS
              </span>
              <span className="text-green-400 font-mono font-bold">+{planet.production.credits}</span>
            </div>
          )}
          {planet.production && planet.production.durastahl > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-200 flex items-center gap-2 font-mono">
                <Wrench size={14} className="text-gray-400" />
                DURASTAHL
              </span>
              <span className="text-green-400 font-mono font-bold">+{planet.production.durastahl}</span>
            </div>
          )}
          {planet.production && planet.production.kristallinesSilizium > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-200 flex items-center gap-2 font-mono">
                <Gem size={14} className="text-purple-400" />
                K. SILIZIUM
              </span>
              <span className="text-green-400 font-mono font-bold">+{planet.production.kristallinesSilizium}</span>
            </div>
          )}
        </div>
      </div>

      {/* Imperial Command Build Queue */}
      <div className="bg-slate-950/20 border border-slate-700/30 rounded p-3">
        <h4 className="text-cyan-300 font-semibold mb-3 text-sm flex items-center gap-2 font-mono tracking-wider">
          <Clock size={14} />
          BAU-QUEUE
        </h4>
        {planet.buildings.filter(b => !b.isActive).length > 0 ? (
          <div className="space-y-2">
            {planet.buildings
              .filter(b => !b.isActive)
              .map(building => {
                const startTime = new Date(building.constructionStartedAt).getTime();
                const totalBuildTime = building.buildingType.buildTime * 60 * 1000;
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, totalBuildTime - elapsed);
                const progress = Math.min(100, (elapsed / totalBuildTime) * 100);
                const remainingMinutes = Math.ceil(remaining / 60000);

                return (
                  <div key={building.id} className="bg-slate-950/40 border border-slate-600/40 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-cyan-100 text-sm font-medium font-mono">{building.buildingType.name}</span>
                      <span className="text-yellow-400 text-xs font-mono tracking-wider">{remainingMinutes} MIN</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                      <div
                        className="bg-yellow-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-cyan-400/60 text-sm font-mono tracking-wider">KEINE GEBÄUDE IM BAU</p>
        )}
      </div>

      {/* Imperial Command Building Statistics */}
      <div className="bg-slate-950/20 border border-slate-700/30 rounded p-3">
        <h4 className="text-cyan-300 font-semibold mb-3 text-sm font-mono tracking-wider">GEBÄUDE-STATISTIK</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950/40 border border-slate-600/30 p-2 rounded">
            <p className="text-cyan-100 font-bold text-lg font-mono">{planet.buildings.length}</p>
            <p className="text-cyan-400/70 text-xs font-mono tracking-wider">GESAMT</p>
          </div>
          <div className="bg-green-950/20 border border-green-500/30 p-2 rounded">
            <p className="text-green-400 font-bold text-lg font-mono">{planet.buildings.filter(b => b.isActive).length}</p>
            <p className="text-green-400/70 text-xs font-mono tracking-wider">AKTIV</p>
          </div>
          <div className="bg-yellow-950/20 border border-yellow-500/30 p-2 rounded">
            <p className="text-yellow-400 font-bold text-lg font-mono">{planet.buildings.filter(b => !b.isActive).length}</p>
            <p className="text-yellow-400/70 text-xs font-mono tracking-wider">IM BAU</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-20 md:pb-0">
      {/* Imperial Command Planet Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <Link to="/" className="flex items-center gap-3 text-cyan-400/70 hover:text-cyan-300 transition-all font-mono">
              <div className="p-1 bg-cyan-900/40 border border-cyan-500/40 rounded">
                <ArrowLeft size={16} />
              </div>
              <span className="hidden sm:inline tracking-wider">ZURÜCK ZUM DASHBOARD</span>
              <span className="sm:hidden tracking-wider">ZURÜCK</span>
            </Link>

            {planet.buildings.some(b => SHIPYARD_BUILDING_NAMES.includes(b.buildingType.name) && b.isActive) && (
              <Link
                to={`/planet/${planet.id}/blueprints`}
                className="bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 px-4 py-2 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all flex items-center gap-2 font-mono text-sm"
              >
                <Rocket size={16} />
                <span className="hidden sm:inline tracking-wider">ORBITALES RAUMDOCK</span>
                <span className="sm:hidden tracking-wider">RAUMDOCK</span>
              </Link>
            )}
          </div>

          {/* Planet Name - Imperial Command Style */}
          <div className="mt-4">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPlanetName}
                  onChange={(e) => setNewPlanetName(e.target.value)}
                  onBlur={renamePlanet}
                  onKeyDown={(e) => e.key === 'Enter' && renamePlanet()}
                  className="bg-slate-800/60 border border-cyan-500/30 rounded px-4 py-3 text-cyan-100 text-xl md:text-2xl font-bold font-mono tracking-wider focus:outline-none focus:border-cyan-400 backdrop-blur-sm"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <h1
                  className="text-xl md:text-2xl font-bold text-cyan-100 font-mono tracking-wider cursor-pointer hover:text-cyan-200 transition"
                  onClick={() => {
                    setNewPlanetName(planet.name);
                    setEditingName(true);
                  }}
                  title="KLICKEN ZUM UMBENENNEN"
                >
                  {planet.name?.toUpperCase()}
                </h1>
                <div className="flex items-center gap-4 text-sm font-mono">
                  <span className="text-cyan-400/70">TYP: {planet.planetType}</span>
                  <span className="text-cyan-400/70">SYSTEM: {planet.system.name}</span>
                  <span className="text-cyan-400/70">KOORDINATEN: {planet.system.sector.x}|{planet.system.sector.y}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Imperial Command Storage Terminal */}
      <div className="hidden md:block mb-6 bg-gradient-to-r from-slate-950/30 to-cyan-950/20 border border-cyan-500/20 rounded p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-cyan-100 font-mono text-sm tracking-wider">
            LAGER: <span className="font-bold">{(planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar).toLocaleString()}/{planet.storageCapacity.toLocaleString()}</span>
          </div>
          <div className={`text-sm font-bold font-mono ${
            ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 0.9
              ? 'text-green-400'
              : ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 1
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {Math.round(((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) * 100)}%
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 0.9
                ? 'bg-green-500'
                : ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 1
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${planet.storageCapacity > 0 ? Math.max(0, Math.min(((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) * 100, 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Imperial Command Energy Terminal */}
      <div className="hidden md:block mb-6 bg-gradient-to-r from-blue-950/30 to-cyan-950/20 border border-cyan-500/20 rounded p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-cyan-100 font-mono text-sm tracking-wider">
            ENERGIE: <span className="font-bold">{planet.energyStorage}/{planet.energyStorageCapacity}</span>
            {planet.production && (planet.production as any).energyProduction && (planet.production as any).energyConsumption && (
              <span className="text-cyan-400/60 ml-3">
                ({((planet.production as any).energyProduction - (planet.production as any).energyConsumption) >= 0 ? '+' : ''}{(planet.production as any).energyProduction - (planet.production as any).energyConsumption}/RUNDE)
              </span>
            )}
          </div>
          <div className={`text-sm font-bold font-mono ${
            (planet.production as any).energyProduction && (planet.production as any).energyConsumption
              ? ((planet.production as any).energyProduction - (planet.production as any).energyConsumption) >= 0 ? 'text-green-400' : 'text-red-400'
              : 'text-cyan-400/60'
          }`}>
            {(planet.production as any).energyProduction && (planet.production as any).energyConsumption
              ? `${((planet.production as any).energyProduction - (planet.production as any).energyConsumption) >= 0 ? '+' : ''}${(planet.production as any).energyProduction - (planet.production as any).energyConsumption}`
              : '-'
            }
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${planet.energyStorageCapacity > 0 ? Math.max(0, Math.min((planet.energyStorage / planet.energyStorageCapacity) * 100, 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-6">
        {/* Left: Imperial Command Planet Grid */}
        <div className="col-span-8">
          <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 p-6 rounded backdrop-blur-sm">
            <div className="mb-4 pb-3 border-b border-cyan-500/20">
              <h3 className="text-cyan-100 font-mono font-semibold tracking-wider">PLANET GRID</h3>
            </div>
            {/* Centered Grid with fixed aspect ratio */}
            <div className="flex justify-center">
              <div className="space-y-1">
                {renderGrid(orbitFields, 'ORBIT', '#3b82f6')}
                {renderGrid(surfaceFields, 'OBERFLÄCHE', '#10b981')}
                {renderGrid(undergroundFields, 'UNTERGRUND', '#8b5cf6')}
              </div>
            </div>
          </div>

          {/* Imperial Command Resources Terminal */}
          <div className="mt-6 bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 p-4 rounded backdrop-blur-sm">
            <div className="mb-4 pb-3 border-b border-cyan-500/20">
              <h3 className="text-cyan-100 font-mono font-semibold tracking-wider">RESSOURCEN</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-yellow-950/20 border border-yellow-500/20 rounded">
                <span className="text-yellow-200 flex items-center gap-2 font-mono text-sm">
                  <Coins size={16} className="text-yellow-400" />
                  CREDITS
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-100 font-mono font-bold">{planet.credits.toLocaleString()}</span>
                  {planet.production && planet.production.credits > 0 && (
                    <span className="text-green-400 text-xs font-mono">+{planet.production.credits}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-500/20 rounded">
                <span className="text-slate-200 flex items-center gap-2 font-mono text-sm">
                  <Wrench size={16} className="text-slate-400" />
                  DURASTAHL
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-mono font-bold">{planet.durastahl.toLocaleString()}</span>
                  {planet.production && planet.production.durastahl > 0 && (
                    <span className="text-green-400 text-xs font-mono">+{planet.production.durastahl}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-500/20 rounded">
                <span className="text-purple-200 flex items-center gap-2 font-mono text-sm">
                  <Gem size={16} className="text-purple-400" />
                  K. SILIZIUM
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-purple-100 font-mono font-bold">{planet.kristallinesSilizium.toLocaleString()}</span>
                  {planet.production && planet.production.kristallinesSilizium > 0 && (
                    <span className="text-green-400 text-xs font-mono">+{planet.production.kristallinesSilizium}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-2">
                  <span className="text-blue-400">☁️</span>
                  Tibanna Gas
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{planet.tibannaGas.toLocaleString()}</span>
                  {planet.production && planet.production.tibannaGas > 0 && (
                    <span className="text-green-400 text-sm">+{planet.production.tibannaGas}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Imperial Command Dashboard Panel */}
        <div className="col-span-4">
          <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-4 backdrop-blur-sm sticky top-4">
            <div className="transition-all duration-300 ease-in-out">
              {selectedField ? renderBuildingDetails() : renderPlanetDashboard()}
            </div>
          </div>
        </div>
      </div>

      {/* Imperial Command Mobile Layout */}
      <div className="md:hidden">
        {/* Imperial Command Mobile Tab Navigation */}
        <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded-t backdrop-blur-sm overflow-hidden">
          <div className="flex border-b border-cyan-500/20">
            <button
              onClick={() => setActiveTab('orbit')}
              className={`flex-1 px-4 py-3 text-sm font-medium font-mono tracking-wider transition-colors ${
                activeTab === 'orbit'
                  ? 'bg-gradient-to-r from-blue-900/60 to-blue-800/40 border-b-2 border-blue-400 text-blue-100'
                  : 'bg-slate-950/20 text-cyan-400/70 hover:text-cyan-200 hover:bg-slate-900/30'
              }`}
            >
              ORBIT
            </button>
            <button
              onClick={() => setActiveTab('surface')}
              className={`flex-1 px-4 py-3 text-sm font-medium font-mono tracking-wider transition-colors ${
                activeTab === 'surface'
                  ? 'bg-gradient-to-r from-green-900/60 to-green-800/40 border-b-2 border-green-400 text-green-100'
                  : 'bg-slate-950/20 text-cyan-400/70 hover:text-cyan-200 hover:bg-slate-900/30'
              }`}
            >
              OBERFLÄCHE
            </button>
            <button
              onClick={() => setActiveTab('underground')}
              className={`flex-1 px-4 py-3 text-sm font-medium font-mono tracking-wider transition-colors ${
                activeTab === 'underground'
                  ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 border-b-2 border-purple-400 text-purple-100'
                  : 'bg-slate-950/20 text-cyan-400/70 hover:text-cyan-200 hover:bg-slate-900/30'
              }`}
            >
              UNTERGRUND
            </button>
          </div>
        </div>

        {/* Imperial Command Mobile Grid Display */}
        <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 border-t-0 p-4 rounded-b backdrop-blur-sm">
          <div className="flex justify-center overflow-x-auto">
            {activeTab === 'orbit' && renderGrid(orbitFields, 'ORBIT', '#3b82f6')}
            {activeTab === 'surface' && renderGrid(surfaceFields, 'OBERFLÄCHE', '#10b981')}
            {activeTab === 'underground' && renderGrid(undergroundFields, 'UNTERGRUND', '#8b5cf6')}
          </div>
        </div>

        {/* Imperial Command Mobile Storage Terminal */}
        <div className="mt-4 bg-gradient-to-r from-slate-950/30 to-cyan-950/20 border border-cyan-500/20 rounded p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-cyan-100 text-sm font-mono tracking-wider">
              LAGER: <span className="font-bold">{(planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar).toLocaleString()}/{planet.storageCapacity.toLocaleString()}</span>
            </div>
            <div className={`text-sm font-bold font-mono ${
              ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 0.9
                ? 'text-green-400'
                : ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 1
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {Math.round(((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) * 100)}%
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 0.9
                  ? 'bg-green-500'
                  : ((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) < 1
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${planet.storageCapacity > 0 ? Math.max(0, Math.min(((planet.credits + planet.durastahl + planet.kristallinesSilizium + planet.tibannaGas + planet.energiemodule + planet.kyberKristalle + planet.bacta + planet.beskar) / planet.storageCapacity) * 100, 100)) : 0}%` }}
            />
          </div>
        </div>

        {/* Imperial Command Mobile Resource Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-yellow-950/20 to-slate-950/40 border border-yellow-500/20 rounded p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={18} className="text-yellow-400" />
              <span className="text-yellow-200 text-xs font-medium font-mono tracking-wider">CREDITS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-100 font-mono font-bold text-lg">{planet.credits.toLocaleString()}</span>
              {planet.production && planet.production.credits > 0 && (
                <span className="text-green-400 text-xs font-semibold font-mono">+{planet.production.credits}</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950/20 to-slate-900/40 border border-slate-500/20 rounded p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={18} className="text-slate-400" />
              <span className="text-slate-200 text-xs font-medium font-mono tracking-wider">DURASTAHL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-100 font-mono font-bold text-lg">{planet.durastahl.toLocaleString()}</span>
              {planet.production && planet.production.durastahl > 0 && (
                <span className="text-green-400 text-xs font-semibold font-mono">+{planet.production.durastahl}</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-950/20 to-slate-950/40 border border-purple-500/20 rounded p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Gem size={18} className="text-purple-400" />
              <span className="text-purple-200 text-xs font-medium font-mono tracking-wider">KRISTALL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-100 font-mono font-bold text-lg">{planet.kristallinesSilizium.toLocaleString()}</span>
              {planet.production && planet.production.kristallinesSilizium > 0 && (
                <span className="text-green-400 text-xs font-semibold font-mono">+{planet.production.kristallinesSilizium}</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-950/20 to-slate-950/40 border border-blue-500/20 rounded p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-blue-400" />
              <span className="text-blue-200 text-xs font-medium font-mono tracking-wider">ENERGIE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-100 font-mono font-bold text-lg">{planet.energyStorage}/{planet.energyStorageCapacity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Imperial Command Mobile Bottom Sheet */}
      {showBottomSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={closeBottomSheet}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Imperial Command Sheet */}
          <div
            className="relative w-full bg-gradient-to-br from-slate-950/95 to-cyan-950/80 border-t border-cyan-500/30 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-12 h-1.5 bg-cyan-500/40 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-cyan-500/20">
                <h3 className="text-cyan-100 font-semibold text-lg font-mono tracking-wider">
                  {selectedField?.building ? 'GEBÄUDE-DETAILS' : 'FELD-DETAILS'}
                </h3>
                <button
                  onClick={closeBottomSheet}
                  className="text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-900/20 p-2 rounded border border-transparent hover:border-cyan-500/30 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {renderBuildingDetails()}
            </div>
          </div>
        </div>
      )}

      {/* Build Menu Modal */}
      {showBuildMenu && selectedField && (
        <BuildMenu
          planetId={planet.id}
          fieldId={selectedField.id}
          existingBuildings={planet.buildings}
          planetResources={{
            credits: planet.credits,
            durastahl: planet.durastahl,
            kristallinesSilizium: planet.kristallinesSilizium,
            tibannaGas: planet.tibannaGas,
            energiemodule: planet.energiemodule,
            kyberKristalle: planet.kyberKristalle,
            bacta: planet.bacta,
            beskar: planet.beskar,
            energyStorage: planet.energyStorage,
          }}
          onClose={() => {
            setShowBuildMenu(false);
            if (window.innerWidth < 768) {
              setShowBottomSheet(false);
            }
          }}
          onBuildStarted={() => {
            setShowBuildMenu(false);
            if (window.innerWidth < 768) {
              setShowBottomSheet(false);
            }
            loadPlanet();
          }}
        />
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
