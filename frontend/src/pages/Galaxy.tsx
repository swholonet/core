import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import LazySectorGrid from '../components/LazySectorGrid';

interface System {
  id: number;
  name: string;
  systemType: string; // Updated to accept all SystemType enum values
  fieldX: number;
  fieldY: number;
  planetCount: number;
  hasPlayerPlanets: boolean;
  hasOwnPlanets: boolean;
  factionName?: string;
}

interface Sector {
  x: number;
  y: number;
  systems: System[];
  sectorFields?: Array<{
    fieldX: number;
    fieldY: number;
    isHyperlane: boolean;
    laneName: string;
    laneColor: string;
    laneType: string;
  }>;
}

interface SectorField {
  x: number;
  y: number;
  system: System | null;
  hyperlane?: {
    isHyperlane: boolean;
    laneName: string;
    laneColor: string;
    laneType: 'MAJOR' | 'MINOR' | 'TRADE';
  } | null;
}

type ViewMode = 'galaxy' | 'sector';


export default function Galaxy() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectors, setSectors] = useState<Map<string, Sector>>(new Map<string, Sector>());
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [sectorFields, setSectorFields] = useState<SectorField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSector, setHoveredSector] = useState<{x: number, y: number} | null>(null);
  const [hoveredField, setHoveredField] = useState<{x: number, y: number} | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy');

  const GALAXY_SIZE = 6; // 6x6 sectors (STU-style: 36 sectors total)
  const FIELDS_PER_SECTOR = 20; // Each sector has 20x20 fields (total 120x120 galaxy)

  useEffect(() => {
    loadGalaxy();
  }, []);

  // Initialize from URL parameters after sectors are loaded
  useEffect(() => {
    if (sectors.size === 0) return; // Wait for sectors to load

    const sectorParam = searchParams.get('sector');
    if (sectorParam) {
      const [x, y] = sectorParam.split(',').map(Number);
      if (x && y && x >= 1 && x <= GALAXY_SIZE && y >= 1 && y <= GALAXY_SIZE) {
        const sector = sectors.get(`${x},${y}`);
        if (sector) {
          setSelectedSector(sector);
          loadSectorFields(x, y);
          setViewMode('sector');
        }
      }
    }
  }, [sectors, searchParams]);

  const loadGalaxy = async () => {
    try {
      const response = await api.get('/galaxy');
      const sectorMap = new Map<string, Sector>();
      
      response.data.sectors.forEach((sector: Sector) => {
        const key = `${sector.x},${sector.y}`;
        sectorMap.set(key, sector);
      });
      
      setSectors(sectorMap);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to load galaxy:', err);
      setIsLoading(false);
    }
  };

  const loadSectorFields = async (sectorX: number, sectorY: number) => {
    const sector = sectors.get(`${sectorX},${sectorY}`);
    if (!sector) return;

    // Create 20x20 field grid - optimized to only store system and hyperlane data
    const fields: SectorField[] = [];
    const systemMap = new Map<string, System>();
    const hyperlaneMap = new Map<string, any>();

    // Map systems to their field positions
    sector.systems.forEach((system: System) => {
      systemMap.set(`${system.fieldX},${system.fieldY}`, system);
    });

    // Map hyperlanes to their field positions
    sector.sectorFields?.forEach((hyperlaneField) => {
      if (hyperlaneField.isHyperlane) {
        hyperlaneMap.set(`${hyperlaneField.fieldX},${hyperlaneField.fieldY}`, {
          isHyperlane: hyperlaneField.isHyperlane,
          laneName: hyperlaneField.laneName,
          laneColor: hyperlaneField.laneColor,
          laneType: hyperlaneField.laneType as 'MAJOR' | 'MINOR' | 'TRADE'
        });
      }
    });

    // Generate field grid - only 400 objects instead of DOM nodes
    for (let y = 1; y <= FIELDS_PER_SECTOR; y++) {
      for (let x = 1; x <= FIELDS_PER_SECTOR; x++) {
        const system = systemMap.get(`${x},${y}`) || null;
        const hyperlane = hyperlaneMap.get(`${x},${y}`) || null;
        fields.push({ x, y, system, hyperlane });
      }
    }

    setSectorFields(fields);
  };

  const getSectorKey = (x: number, y: number) => `${x},${y}`;

  const handleSectorClick = (sectorX: number, sectorY: number) => {
    const sector = sectors.get(getSectorKey(sectorX, sectorY));
    if (sector) {
      setSelectedSector(sector);
      loadSectorFields(sectorX, sectorY);
      setViewMode('sector');
      // Update URL parameter
      setSearchParams({ sector: `${sectorX},${sectorY}` });
    }
  };

  const handleBackToGalaxy = () => {
    setViewMode('galaxy');
    setSelectedSector(null);
    setSectorFields([]);
    setHoveredField(null);
    // Clear URL parameter
    setSearchParams({});
  };

  const handleFieldClick = useCallback((field: SectorField) => {
    if (field.system) {
      console.log('Navigating to system:', field.system.id, field.system);
      navigate(`/system/${field.system.id}`);
    } else {
      console.log('No system on this field');
    }
  }, [navigate]);

  const handleMouseEnter = useCallback((x: number, y: number) => {
    setHoveredField({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredField(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Lade Galaxiekarte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse 800px 400px at 40% 30%, rgba(0, 100, 200, 0.03), transparent),
          radial-gradient(ellipse 600px 300px at 80% 70%, rgba(100, 0, 150, 0.02), transparent),
          radial-gradient(ellipse at center, #000205 0%, #000810 50%, #000205 100%)
        `
      }}
    >
      {/* Starfield Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 85%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 10% 90%, rgba(255,255,255,0.6) 0%, transparent 100%)
          `
        }}
      />

      <div className="container mx-auto p-4 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur border border-slate-600/40 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-mono">
            <button
              onClick={handleBackToGalaxy}
              className={`px-3 py-1.5 rounded-md border transition-all duration-200 ${
                viewMode === 'galaxy'
                  ? 'text-cyan-400 border-cyan-600/50 bg-cyan-900/20 shadow-md'
                  : 'text-slate-400 border-transparent hover:text-cyan-400 hover:border-slate-600/50 hover:bg-slate-700/50'
              }`}
            >
              [GALAXIE]
            </button>
            {viewMode === 'sector' && selectedSector && (
              <>
                <span className="text-cyan-500/60 mx-1">&gt;</span>
                <span className="text-cyan-400 px-3 py-1.5 rounded-md border border-cyan-600/50 bg-cyan-900/20 shadow-md">
                  [SEKTOR {selectedSector.x}|{selectedSector.y}]
                </span>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Command Legend */}
        <div className="mb-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 backdrop-blur border border-slate-600/40 rounded-lg p-4 shadow-lg">
          <div className="flex gap-6 flex-wrap font-mono text-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-black/80 border border-slate-700/70 rounded shadow-sm"></div>
              <span className="text-slate-300">LEER</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-900/50 border border-cyan-600/60 rounded shadow-sm shadow-cyan-500/20"></div>
              <span className="text-slate-300">UNBESIEDELT</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-900/70 border border-red-600/70 rounded shadow-sm shadow-red-500/20"></div>
              <span className="text-slate-300">IMPERIUM</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-900/70 border border-orange-600/70 rounded shadow-sm shadow-orange-500/20"></div>
              <span className="text-slate-300">REBELLEN</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500/80 border border-yellow-400/80 rounded shadow-sm shadow-yellow-500/30"></div>
              <span className="text-slate-300">EIGEN</span>
            </div>
          </div>
        </div>

      {/* Table Views */}
      <>
          {/* Enhanced Galaxy View - Sophisticated Sector Cards (6x6) */}
          {viewMode === 'galaxy' && (
            <div
              className="relative rounded-xl p-4 border border-slate-700/50 shadow-2xl"
              style={{
                background: `
                  radial-gradient(ellipse 1200px 800px at 50% 50%, rgba(0, 150, 255, 0.02) 0%, transparent 60%),
                  radial-gradient(ellipse at center, #000810 0%, #000205 50%, #000408 100%)
                `
              }}
            >
              {/* Coordinate Headers */}
              <div className="flex items-center justify-center mb-6">
                <div className="grid grid-cols-7 gap-3 mx-auto">
                  <div className="text-cyan-400/60 text-sm p-2 font-mono text-center">x|y</div>
                  {Array.from({ length: GALAXY_SIZE }, (_, i) => (
                    <div key={i} className="text-cyan-400/60 text-sm p-2 w-24 font-mono text-center">
                      {(i + 1) * FIELDS_PER_SECTOR}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Grid - Responsive */}
              <div className="grid grid-cols-7 gap-2 mx-auto max-w-max">
                {Array.from({ length: GALAXY_SIZE }, (_, y) => [
                  // Y-axis label
                  <div key={`y-${y}`} className="text-cyan-400/60 text-sm p-2 text-right font-mono self-center">
                    {(y + 1) * FIELDS_PER_SECTOR}
                  </div>,
                  // Sector cards for this row
                  ...Array.from({ length: GALAXY_SIZE }, (_, x) => {
                    const sectorY = y + 1;
                    const sectorX = x + 1;
                    const sectorNum = y * GALAXY_SIZE + x + 1;
                    const sector = sectors.get(`${sectorX},${sectorY}`);
                    const isHovered = hoveredSector?.x === sectorX && hoveredSector?.y === sectorY;
                    const hasOwnPlanets = sector?.systems.some(s => s.hasOwnPlanets) || false;
                    const hasPlayerPlanets = sector?.systems.some(s => s.hasPlayerPlanets) || false;
                    const systemCount = sector?.systems.length || 0;

                    return (
                      <div
                        key={`sector-${x}-${y}`}
                        className={`
                          relative h-16 w-24 rounded-lg cursor-pointer transition-all duration-300 group
                          ${isHovered
                            ? 'bg-gradient-to-br from-slate-700/90 to-slate-600/80 border-cyan-400/60 shadow-xl shadow-cyan-500/20 scale-105'
                            : 'bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-slate-600/40 hover:border-cyan-500/40 hover:shadow-lg hover:scale-102'
                          }
                          border backdrop-blur-sm
                        `}
                        style={{
                          boxShadow: isHovered
                            ? '0 8px 32px rgba(0, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        }}
                        onClick={() => handleSectorClick(sectorX, sectorY)}
                        onMouseEnter={() => setHoveredSector({ x: sectorX, y: sectorY })}
                        onMouseLeave={() => setHoveredSector(null)}
                      >
                        {/* Sector Content */}
                        <div className="h-full flex flex-col items-center justify-center relative p-2">
                          {/* Sector Number */}
                          <div className="text-cyan-400 font-semibold font-mono text-xs mb-1 tracking-wide">
                            SEKTOR {sectorNum}
                          </div>

                          {/* System Count */}
                          <div className="text-slate-400 font-mono text-xs">
                            {systemCount} SYSTEME
                          </div>

                          {/* Status Indicators */}
                          <div className="absolute top-1 right-1 flex gap-1">
                            {hasOwnPlanets && (
                              <div
                                className="w-2 h-2 bg-yellow-400 rounded-full shadow-sm animate-pulse"
                                style={{ boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)' }}
                                title="Eigene Planeten"
                              />
                            )}
                            {hasPlayerPlanets && !hasOwnPlanets && (
                              <div
                                className="w-2 h-2 bg-red-400 rounded-full shadow-sm"
                                style={{ boxShadow: '0 0 6px rgba(255, 0, 0, 0.5)' }}
                                title="Andere Spieler"
                              />
                            )}
                          </div>

                          {/* Hover Effect Overlay */}
                          <div className={`
                            absolute inset-0 rounded-lg transition-opacity duration-300 pointer-events-none
                            ${isHovered ? 'opacity-100' : 'opacity-0'}
                            bg-gradient-to-br from-cyan-500/10 to-transparent
                          `} />
                        </div>
                      </div>
                    );
                  })
                ]).flat()}
              </div>
            </div>
          )}

          {/* Enhanced Sector View - Cinematic Field Grid (20x20) */}
          {viewMode === 'sector' && selectedSector && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div
                className="relative rounded-xl p-3 flex-1 border border-cyan-900/40 shadow-2xl"
                style={{
                  background: `
                    radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.6) 0%, transparent 100%),
                    radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.4) 0%, transparent 100%),
                    radial-gradient(1px 1px at 75% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
                    radial-gradient(1px 1px at 25% 85%, rgba(255,255,255,0.5) 0%, transparent 100%),
                    radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.3) 0%, transparent 100%),
                    radial-gradient(ellipse 1200px 800px at 50% 50%, rgba(0, 150, 255, 0.02) 0%, transparent 60%),
                    radial-gradient(ellipse at center, #000810 0%, #000205 50%, #000408 100%)
                  `
                }}
              >
                {/* Enhanced Galactic Dust and Nebula Overlay */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none rounded-xl"
                  style={{
                    backgroundImage: `
                      radial-gradient(ellipse 200px 100px at 20% 20%, rgba(0, 150, 255, 0.1) 0%, transparent 70%),
                      radial-gradient(ellipse 150px 200px at 80% 30%, rgba(150, 0, 255, 0.08) 0%, transparent 70%),
                      radial-gradient(ellipse 300px 150px at 40% 80%, rgba(255, 100, 0, 0.06) 0%, transparent 70%),
                      radial-gradient(ellipse 100px 300px at 70% 70%, rgba(0, 255, 150, 0.05) 0%, transparent 70%)
                    `
                  }}
                />

                <LazySectorGrid
                  fields={sectorFields}
                  fieldsPerSector={FIELDS_PER_SECTOR}
                  hoveredField={hoveredField}
                  onFieldClick={handleFieldClick}
                  onFieldMouseEnter={handleMouseEnter}
                  onFieldMouseLeave={handleMouseLeave}
                />
              </div>

              {/* Enhanced Navigation Control Panel */}
              <div
                className="rounded-xl p-4 w-full sm:w-28 flex sm:flex-col flex-row items-center justify-center sm:justify-start gap-3 border border-cyan-900/40 backdrop-blur shadow-2xl order-last sm:order-none"
                style={{
                  background: `
                    linear-gradient(180deg, rgba(0,20,40,0.9) 0%, rgba(0,10,20,0.95) 50%, rgba(0,5,15,0.9) 100%),
                    radial-gradient(ellipse at center, rgba(0, 150, 255, 0.05) 0%, transparent 70%)
                  `,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(0, 255, 255, 0.1)'
                }}
              >
                {/* Navigation Title */}
                <div className="text-cyan-400/60 font-mono text-xs tracking-wider text-center mb-1">
                  NAV
                </div>

                {/* Up Arrow */}
                <button
                  onClick={() => selectedSector.y > 1 && handleSectorClick(selectedSector.x, selectedSector.y - 1)}
                  disabled={selectedSector.y <= 1}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded-lg border transition-all duration-200 font-mono ${
                    selectedSector.y > 1
                      ? 'bg-gradient-to-b from-cyan-900/40 to-cyan-800/30 hover:from-cyan-700/50 hover:to-cyan-600/40 text-cyan-300 border-cyan-600/60 cursor-pointer hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105'
                      : 'bg-gradient-to-b from-black/40 to-black/60 text-cyan-900/40 border-cyan-900/20 cursor-not-allowed'
                  }`}
                  title={selectedSector.y > 1 ? `Sektor ${selectedSector.x}|${selectedSector.y - 1}` : ''}
                  style={selectedSector.y > 1 ? { boxShadow: '0 4px 16px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' } : {}}
                >
                  ∧
                </button>

                {/* Left Arrow */}
                <button
                  onClick={() => selectedSector.x > 1 && handleSectorClick(selectedSector.x - 1, selectedSector.y)}
                  disabled={selectedSector.x <= 1}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded-lg border transition-all duration-200 font-mono ${
                    selectedSector.x > 1
                      ? 'bg-gradient-to-b from-cyan-900/40 to-cyan-800/30 hover:from-cyan-700/50 hover:to-cyan-600/40 text-cyan-300 border-cyan-600/60 cursor-pointer hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105'
                      : 'bg-gradient-to-b from-black/40 to-black/60 text-cyan-900/40 border-cyan-900/20 cursor-not-allowed'
                  }`}
                  title={selectedSector.x > 1 ? `Sektor ${selectedSector.x - 1}|${selectedSector.y}` : ''}
                  style={selectedSector.x > 1 ? { boxShadow: '0 4px 16px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' } : {}}
                >
                  ‹
                </button>

                {/* Current Sector Indicator */}
                <div
                  className="w-14 h-14 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800/80 to-slate-900/90 text-cyan-400 font-bold rounded-lg border border-cyan-400/60 font-mono shadow-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="text-xs text-cyan-400/80">S</div>
                  <div className="text-lg">{(selectedSector.y - 1) * GALAXY_SIZE + selectedSector.x}</div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => selectedSector.x < GALAXY_SIZE && handleSectorClick(selectedSector.x + 1, selectedSector.y)}
                  disabled={selectedSector.x >= GALAXY_SIZE}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded-lg border transition-all duration-200 font-mono ${
                    selectedSector.x < GALAXY_SIZE
                      ? 'bg-gradient-to-b from-cyan-900/40 to-cyan-800/30 hover:from-cyan-700/50 hover:to-cyan-600/40 text-cyan-300 border-cyan-600/60 cursor-pointer hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105'
                      : 'bg-gradient-to-b from-black/40 to-black/60 text-cyan-900/40 border-cyan-900/20 cursor-not-allowed'
                  }`}
                  title={selectedSector.x < GALAXY_SIZE ? `Sektor ${selectedSector.x + 1}|${selectedSector.y}` : ''}
                  style={selectedSector.x < GALAXY_SIZE ? { boxShadow: '0 4px 16px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' } : {}}
                >
                  ›
                </button>

                {/* Down Arrow */}
                <button
                  onClick={() => selectedSector.y < GALAXY_SIZE && handleSectorClick(selectedSector.x, selectedSector.y + 1)}
                  disabled={selectedSector.y >= GALAXY_SIZE}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded-lg border transition-all duration-200 font-mono ${
                    selectedSector.y < GALAXY_SIZE
                      ? 'bg-gradient-to-b from-cyan-900/40 to-cyan-800/30 hover:from-cyan-700/50 hover:to-cyan-600/40 text-cyan-300 border-cyan-600/60 cursor-pointer hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105'
                      : 'bg-gradient-to-b from-black/40 to-black/60 text-cyan-900/40 border-cyan-900/20 cursor-not-allowed'
                  }`}
                  title={selectedSector.y < GALAXY_SIZE ? `Sektor ${selectedSector.x}|${selectedSector.y + 1}` : ''}
                  style={selectedSector.y < GALAXY_SIZE ? { boxShadow: '0 4px 16px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' } : {}}
                >
                  ∨
                </button>
              </div>
            </div>
          )}

        {/* Planet List Modal - Shows when clicking on a sector in galaxy view */}
        {/* Modal removed - navigation now goes directly from galaxy → sector → system → planet */}
        </>
      </div>
    </div>
  );
}
