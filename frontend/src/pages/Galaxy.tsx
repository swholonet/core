import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import SunImage from '../components/SunImage';

interface System {
  id: number;
  name: string;
  systemType: string;
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
}

interface SectorField {
  x: number;
  y: number;
  system: System | null;
}

type ViewMode = 'galaxy' | 'sector';

export default function Galaxy() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Map<string, Sector>>(new Map());
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

    // Create 20x20 field grid - optimized to only store system data
    const fields: SectorField[] = [];
    const systemMap = new Map<string, System>();

    // Map systems to their field positions
    sector.systems.forEach((system: System) => {
      systemMap.set(`${system.fieldX},${system.fieldY}`, system);
    });

    // Generate field grid - only 400 objects instead of DOM nodes
    for (let y = 1; y <= FIELDS_PER_SECTOR; y++) {
      for (let x = 1; x <= FIELDS_PER_SECTOR; x++) {
        const system = systemMap.get(`${x},${y}`) || null;
        fields.push({ x, y, system });
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
    }
  };

  const handleBackToGalaxy = () => {
    setViewMode('galaxy');
    setSelectedSector(null);
    setSectorFields([]);
    setHoveredField(null);
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
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="text-blue-400" size={32} />
          <h1 className="text-3xl font-bold text-white">
            {viewMode === 'galaxy' ? 'Galaxiekarte' : `Sektor ${selectedSector?.x}|${selectedSector?.y}`}
          </h1>
          {viewMode === 'sector' && (
            <button
              onClick={handleBackToGalaxy}
              className="ml-auto flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
            >
              <ArrowLeft size={18} />
              Zurück zur Galaxie
            </button>
          )}
        </div>
        <p className="text-gray-400">
          {viewMode === 'galaxy' 
            ? `${GALAXY_SIZE}x${GALAXY_SIZE} Sektoren (${GALAXY_SIZE * GALAXY_SIZE} total), jeder Sektor hat ${FIELDS_PER_SECTOR}x${FIELDS_PER_SECTOR} Felder`
            : (() => {
                const startX = (selectedSector!.x - 1) * FIELDS_PER_SECTOR + 1;
                const endX = selectedSector!.x * FIELDS_PER_SECTOR;
                const startY = (selectedSector!.y - 1) * FIELDS_PER_SECTOR + 1;
                const endY = selectedSector!.y * FIELDS_PER_SECTOR;
                return `${FIELDS_PER_SECTOR}x${FIELDS_PER_SECTOR} Felder | Galaxie-Koordinaten: ${startX}-${endX} x ${startY}-${endY}`;
              })()
          }
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <button
          onClick={handleBackToGalaxy}
          className={`hover:text-white ${viewMode === 'galaxy' ? 'text-blue-400' : ''}`}
        >
          Galaxie
        </button>
        {viewMode === 'sector' && selectedSector && (
          <>
            <span>&gt;</span>
            <span className="text-blue-400">Sektor {selectedSector.x}|{selectedSector.y}</span>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-900 border border-gray-700"></div>
          <span className="text-sm text-gray-400">Leer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-900 border border-gray-700"></div>
          <span className="text-sm text-gray-400">Unbesiedelt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-700 border border-gray-700"></div>
          <span className="text-sm text-gray-400">Imperium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-700 border border-gray-700"></div>
          <span className="text-sm text-gray-400">Rebellen</span>
        </div>
      </div>

      {/* Hover Info - Fixed Height */}
      <div className="mb-4 bg-gray-800 rounded-lg p-3 border border-blue-500 min-h-[60px] flex items-center">
        {viewMode === 'galaxy' && hoveredSector ? (
          <>
            <span className="text-blue-400 font-semibold">Sektor {hoveredSector.x},{hoveredSector.y}</span>
            {(() => {
              const sector = sectors.get(`${hoveredSector.x},${hoveredSector.y}`);
              if (!sector || sector.systems.length === 0) {
                return <span className="text-gray-400 ml-3">Leer</span>;
              }
              const ownedSystems = sector.systems.filter(s => s.hasPlayerPlanets);
              if (ownedSystems.length === 0) {
                return <span className="text-blue-300 ml-3">{sector.systems.length} unbesiedelte(s) System(e)</span>;
              }
              return (
                <span className="text-green-300 ml-3">
                  {sector.systems.length} System(e) - {ownedSystems[0].factionName}
                </span>
              );
            })()}
          </>
        ) : viewMode === 'sector' && hoveredField && selectedSector ? (
          <>
            {(() => {
              // Calculate galaxy coordinates
              const galaxyX = (selectedSector.x - 1) * FIELDS_PER_SECTOR + hoveredField.x;
              const galaxyY = (selectedSector.y - 1) * FIELDS_PER_SECTOR + hoveredField.y;
              const field = sectorFields.find(f => f.x === hoveredField.x && f.y === hoveredField.y);
              
              return (
                <>
                  <span className="text-blue-400 font-semibold">Position {galaxyX}|{galaxyY}</span>
                  {field?.system ? (
                    <span className="text-green-300 ml-3">
                      {field.system.name} ({field.system.systemType}) - {field.system.planetCount} Planet(en)
                      {field.system.hasPlayerPlanets && ` - ${field.system.factionName}`}
                    </span>
                  ) : (
                    <span className="text-gray-400 ml-3">Leerer Raum</span>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <span className="text-gray-500 italic">Bewege die Maus über {viewMode === 'galaxy' ? 'einen Sektor' : 'ein Feld'} für Details</span>
        )}
      </div>
      {/* Galaxy View - Sector Grid (6x6) - STU Style */}
      {viewMode === 'galaxy' && (
        <div className="bg-space-light rounded-lg p-6 overflow-auto">
          <table className="border-collapse mx-auto">
            <thead>
              <tr>
                <th className="text-gray-400 text-sm p-2">x|y</th>
                {Array.from({ length: GALAXY_SIZE }, (_, i) => (
                  <th key={i} className="text-gray-400 text-sm p-2 w-32">
                    {(i + 1) * FIELDS_PER_SECTOR}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: GALAXY_SIZE }, (_, y) => (
                <tr key={y}>
                  <td className="text-gray-400 text-sm p-2 text-right">
                    {(y + 1) * FIELDS_PER_SECTOR}
                  </td>
                  {Array.from({ length: GALAXY_SIZE }, (_, x) => {
                    const sectorY = y + 1;  // Y = row (vertical)
                    const sectorX = x + 1;  // X = column (horizontal)
                    const sectorNum = y * GALAXY_SIZE + x + 1;
                    const sector = sectors.get(`${sectorX},${sectorY}`);
                    const isHovered = hoveredSector?.x === sectorX && hoveredSector?.y === sectorY;
                    const hasOwnPlanets = sector?.systems.some(s => s.hasOwnPlanets) || false;

                    return (
                      <td
                        key={x}
                        className={`border-2 border-gray-700 cursor-pointer transition-all ${
                          isHovered ? 'bg-blue-600 border-blue-400' : 'bg-space-dark hover:bg-gray-700'
                        }`}
                        onClick={() => handleSectorClick(sectorX, sectorY)}
                        onMouseEnter={() => setHoveredSector({ x: sectorX, y: sectorY })}
                        onMouseLeave={() => setHoveredSector(null)}
                      >
                        <div className="h-24 w-32 flex items-center justify-center relative">
                          <div className="text-center">
                            <div className="text-white font-semibold mb-1">Sektor {sectorNum}</div>
                            {sector && sector.systems.length > 0 && (
                              <div className="text-xs text-gray-400">
                                {sector.systems.length} System{sector.systems.length !== 1 ? 'e' : ''}
                              </div>
                            )}
                            {hasOwnPlanets && (
                              <div className="absolute top-1 right-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sector View - Field Grid (20x20) STU-Style Table */}
      {viewMode === 'sector' && selectedSector && (
        <div className="flex gap-4">
          <div className="bg-space-light rounded-lg p-4 overflow-auto flex-1">
            <table className="border-collapse mx-auto">
            <thead>
              <tr>
                <th className="text-gray-400 text-xs p-1">x|y</th>
                {Array.from({ length: FIELDS_PER_SECTOR }, (_, i) => {
                  const galaxyX = (selectedSector.x - 1) * FIELDS_PER_SECTOR + i + 1;
                  return (
                    <th key={i} className="text-gray-400 text-xs p-1 w-8">
                      {galaxyX}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: FIELDS_PER_SECTOR }, (_, y) => {
                const galaxyY = (selectedSector.y - 1) * FIELDS_PER_SECTOR + y + 1;
                return (
                  <tr key={y}>
                    <td className="text-gray-400 text-xs p-1 text-right">
                      {galaxyY}
                    </td>
                    {Array.from({ length: FIELDS_PER_SECTOR }, (_, x) => {
                      const field = sectorFields.find(f => f.x === x + 1 && f.y === y + 1);
                      const isHovered = hoveredField?.x === x + 1 && hoveredField?.y === y + 1;
                      const hasSystem = !!field?.system;
                      const hasOwnPlanets = field?.system?.hasOwnPlanets || false;

                      return (
                        <td
                          key={x}
                          className={`border border-gray-700 cursor-pointer transition-all relative ${
                            isHovered ? 'bg-blue-600' : 'bg-space-dark hover:bg-gray-700'
                          }`}
                          onClick={() => field && handleFieldClick(field)}
                          onMouseEnter={() => handleMouseEnter(x + 1, y + 1)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="h-8 w-8 flex items-center justify-center relative">
                            {hasSystem && field?.system && (
                              <>
                                {/* System type visualization */}
                                {field.system.systemType === 'BINARY_STAR' ? (
                                  <div className="flex gap-0.5">
                                    <SunImage
                                      systemType={field.system.systemType as 'SINGLE_STAR' | 'BINARY_STAR' | 'NEUTRON_STAR' | 'BLACK_HOLE'}
                                      size={10}
                                      className="rounded-full"
                                    />
                                    <SunImage
                                      systemType={field.system.systemType as 'SINGLE_STAR' | 'BINARY_STAR' | 'NEUTRON_STAR' | 'BLACK_HOLE'}
                                      visualSeed={2}
                                      size={10}
                                      className="rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <SunImage
                                    systemType={field.system.systemType as 'SINGLE_STAR' | 'BINARY_STAR' | 'NEUTRON_STAR' | 'BLACK_HOLE'}
                                    size={14}
                                    className="rounded-full shadow-lg"
                                  />
                                )}
                                {/* Own planets indicator */}
                                {hasOwnPlanets && (
                                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* STU-Style Navigation Panel - Right Side */}
        <div className="bg-space-light rounded-lg p-4 w-24 flex flex-col items-center justify-start gap-2">
          {/* Up Arrow */}
          <button
            onClick={() => selectedSector.y > 1 && handleSectorClick(selectedSector.x, selectedSector.y - 1)}
            disabled={selectedSector.y <= 1}
            className={`w-12 h-12 flex items-center justify-center text-2xl rounded transition ${
              selectedSector.y > 1 
                ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
            title={selectedSector.y > 1 ? `Sektor ${selectedSector.x}|${selectedSector.y - 1}` : ''}
          >
            ∧
          </button>

          {/* Left Arrow */}
          <button
            onClick={() => selectedSector.x > 1 && handleSectorClick(selectedSector.x - 1, selectedSector.y)}
            disabled={selectedSector.x <= 1}
            className={`w-12 h-12 flex items-center justify-center text-2xl rounded transition ${
              selectedSector.x > 1 
                ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
            title={selectedSector.x > 1 ? `Sektor ${selectedSector.x - 1}|${selectedSector.y}` : ''}
          >
            &lt;
          </button>

          {/* Current Sector Number */}
          <div className="w-12 h-12 flex items-center justify-center bg-gray-800 text-white font-bold text-lg rounded">
            {(selectedSector.y - 1) * GALAXY_SIZE + selectedSector.x}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => selectedSector.x < GALAXY_SIZE && handleSectorClick(selectedSector.x + 1, selectedSector.y)}
            disabled={selectedSector.x >= GALAXY_SIZE}
            className={`w-12 h-12 flex items-center justify-center text-2xl rounded transition ${
              selectedSector.x < GALAXY_SIZE 
                ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
            title={selectedSector.x < GALAXY_SIZE ? `Sektor ${selectedSector.x + 1}|${selectedSector.y}` : ''}
          >
            &gt;
          </button>

          {/* Down Arrow */}
          <button
            onClick={() => selectedSector.y < GALAXY_SIZE && handleSectorClick(selectedSector.x, selectedSector.y + 1)}
            disabled={selectedSector.y >= GALAXY_SIZE}
            className={`w-12 h-12 flex items-center justify-center text-2xl rounded transition ${
              selectedSector.y < GALAXY_SIZE 
                ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
            title={selectedSector.y < GALAXY_SIZE ? `Sektor ${selectedSector.x}|${selectedSector.y + 1}` : ''}
          >
            ∨
          </button>
        </div>
      </div>
      )}

      {/* Planet List Modal - Shows when clicking on a sector in galaxy view */}
      {/* Modal removed - navigation now goes directly from galaxy → sector → system → planet */}
    </div>
  );
}
