import { useEffect, useState } from 'react';
import { Database as DatabaseIcon, Users, Globe, Wrench, FlaskConical, Rocket } from 'lucide-react';
import api from '../lib/api';

// Database page interfaces matching backend service responses
interface PlayerRanking {
  id: number;
  username: string;
  factionName: string;
  completedResearchCount: number;
  planetCount: number;
  researchCategories: {
    MILITARY: number;
    ECONOMICS: number;
    SCIENCE: number;
    ENERGY: number;
  };
}

interface SystemsOverview {
  totalSystems: number;
  colonizedSystems: number;
  uncolonizedSystems: number;
  systemTypes: {
    type: string;
    count: number;
    isBinary: boolean;
    percentage: number;
  }[];
  binaryDistribution: {
    single: number;
    binary: number;
  };
}

interface PlanetsStatistics {
  totalPlanets: number;
  colonizedPlanets: number;
  uncolonizedPlanets: number;
  colonizationRate: number;
  planetClasses: {
    planetClass: string;
    totalCount: number;
    colonizedCount: number;
    uncolonizedCount: number;
    percentage: number;
  }[];
  celestialTypes: {
    type: string;
    count: number;
  }[];
}

interface BuildingInfo {
  id: number;
  name: string;
  description: string;
  category: string;
  allowedFieldTypes: string[];
  costs: {
    credits: number;
    durastahl: number;
    kristallinesSilizium: number;
    tibannaGas: number;
    energiemodule: number;
    kyberKristalle: number;
    bacta: number;
    beskar: number;
    energy: number;
  };
  production: {
    credits: number;
    durastahl: number;
    kristallinesSilizium: number;
    tibannaGas: number;
    energiemodule: number;
    kyberKristalle: number;
    bacta: number;
    beskar: number;
    energy: number;
  };
  buildTime: number;
  energyCostPerTick: number;
  storageBonus: number;
  timesBuilt: number;
}

interface BuildingsOverview {
  categories: {
    RESOURCE: BuildingInfo[];
    PRODUCTION: BuildingInfo[];
    DEFENSE: BuildingInfo[];
    RESEARCH: BuildingInfo[];
    STORAGE: BuildingInfo[];
    ORBITAL: BuildingInfo[];
  };
  buildingsWithStats: BuildingInfo[];
}

interface ResearchInfo {
  id: number;
  name: string;
  description: string;
  category: string;
  researchLevel: number;
  factionName: string;
  isUniversal: boolean;
  costs: {
    researchPoints: number;
    credits: number | null;
    durastahl: number | null;
    kristallinesSilizium: number | null;
    energy: number | null;
  };
  requirements: {
    labCount: number;
    prerequisite: { id: number; name: string } | null;
  };
  unlocks: {
    building: string | null;
    ship: string | null;
    bonusType: string | null;
    bonusValue: number;
  };
  dependents: { id: number; name: string }[];
  completedBy: number;
}

interface ResearchOverview {
  categories: {
    MILITARY: ResearchInfo[];
    ECONOMICS: ResearchInfo[];
    SCIENCE: ResearchInfo[];
    ENERGY: ResearchInfo[];
  };
  levels: {
    level0: ResearchInfo[];
    level1: ResearchInfo[];
    level2: ResearchInfo[];
    level3: ResearchInfo[];
  };
  researchWithStats: ResearchInfo[];
}

interface ShipsStatistics {
  totalShips: number;
  factionDistribution: Record<string, number>;
  legacyShips: {
    count: number;
    typeDistribution: {
      shipTypeName: string;
      shipClass: string;
      count: number;
    }[];
  };
  blueprintShips: {
    count: number;
    classDistribution: {
      blueprintName: string;
      shipClass: string;
      count: number;
      isPublic: boolean;
    }[];
  };
  shipClassSummary: Record<string, any>;
}

export default function Database() {
  const [playersData, setPlayersData] = useState<PlayerRanking[]>([]);
  const [systemsData, setSystemsData] = useState<SystemsOverview | null>(null);
  const [planetsData, setPlanetsData] = useState<PlanetsStatistics | null>(null);
  const [buildingsData, setBuildingsData] = useState<BuildingsOverview | null>(null);
  const [researchData, setResearchData] = useState<ResearchOverview | null>(null);
  const [shipsData, setShipsData] = useState<ShipsStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllDatabaseData();
  }, []);

  const loadAllDatabaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [players, systems, planets, buildings, research, ships] = await Promise.all([
        api.get('/database/players'),
        api.get('/database/systems'),
        api.get('/database/planets'),
        api.get('/database/buildings'),
        api.get('/database/research'),
        api.get('/database/ships')
      ]);

      setPlayersData(players.data);
      setSystemsData(systems.data);
      setPlanetsData(planets.data);
      setBuildingsData(buildings.data);
      setResearchData(research.data);
      setShipsData(ships.data);
    } catch (err: any) {
      console.error('Failed to load database data:', err);
      setError('Fehler beim Laden der Datenbank-Informationen');
    } finally {
      setLoading(false);
    }
  };

  const DatabaseCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon, children, className = "" }) => (
    <div className={`bg-gradient-to-br from-cyan-950/30 to-slate-900/50 border border-cyan-500/20 rounded-lg p-4 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4 border-b border-cyan-500/20 pb-3">
        <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
          {icon}
        </div>
        <h2 className="font-mono text-lg font-bold tracking-wider text-cyan-100">{title}</h2>
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
              <DatabaseIcon className="text-cyan-300" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">GALAKTISCHE DATENBANK</h1>
              <p className="text-cyan-400/70 font-mono text-sm">STRATEGISCHE INFORMATIONEN & STATISTIKEN</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="bg-gradient-to-br from-slate-950/40 to-cyan-950/20 border border-cyan-500/30 rounded p-8 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-cyan-200 font-mono tracking-wider">LADE DATENBANK-ARCHIVE...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
              <DatabaseIcon className="text-cyan-300" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">GALAKTISCHE DATENBANK</h1>
              <p className="text-cyan-400/70 font-mono text-sm">STRATEGISCHE INFORMATIONEN & STATISTIKEN</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-950/40 to-slate-900/50 border border-red-500/30 rounded-lg p-6">
          <div className="text-red-300 font-mono text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
            <DatabaseIcon className="text-cyan-300" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">GALAKTISCHE DATENBANK</h1>
            <p className="text-cyan-400/70 font-mono text-sm">STRATEGISCHE INFORMATIONEN & STATISTIKEN</p>
          </div>
        </div>
      </div>

      {/* Database Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Siedlerliste (Players Rankings) - Highest Priority */}
        <DatabaseCard
          title="SIEDLERLISTE"
          icon={<Users className="text-cyan-300" size={20} />}
          className="lg:col-span-2"
        >
          {/* Legend for research categories */}
          <div className="mb-4 p-2 bg-slate-900/40 border border-cyan-500/20 rounded text-xs font-mono">
            <div className="text-cyan-300/80 mb-2">FORSCHUNGSKATEGORIEN:</div>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <span className="text-red-400 font-semibold">M:</span>
                <span className="text-cyan-200">Militär</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-400 font-semibold">E:</span>
                <span className="text-cyan-200">Wirtschaft</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-blue-400 font-semibold">S:</span>
                <span className="text-cyan-200">Wissenschaft</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-yellow-400 font-semibold">N:</span>
                <span className="text-cyan-200">Energie</span>
              </span>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 text-xs font-mono tracking-wide text-cyan-300/80 border-b border-cyan-500/20 pb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">SIEDLER</div>
              <div className="col-span-2">FRAKTION</div>
              <div className="col-span-2">FORSCHUNG</div>
              <div className="col-span-2">PLANETEN</div>
              <div className="col-span-2">KATEGORIEN</div>
            </div>
            {playersData.slice(0, 20).map((player, index) => (
              <div key={player.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-cyan-500/10 hover:bg-cyan-950/20">
                <div className="col-span-1 font-mono text-cyan-200">{index + 1}</div>
                <div className="col-span-3 font-mono text-cyan-100">{player.username}</div>
                <div className={`col-span-2 font-mono text-sm ${
                  player.factionName.includes('Imperial') || player.factionName.includes('Empire')
                    ? 'text-red-400/80'
                    : 'text-orange-400/80'
                }`}>
                  {player.factionName}
                </div>
                <div className="col-span-2 font-mono text-emerald-400/80">{player.completedResearchCount}</div>
                <div className="col-span-2 font-mono text-cyan-200">{player.planetCount}</div>
                <div className="col-span-2 text-xs">
                  <div className="flex gap-1">
                    <span className="text-red-400">M:{player.researchCategories.MILITARY}</span>
                    <span className="text-green-400">E:{player.researchCategories.ECONOMICS}</span>
                    <span className="text-blue-400">S:{player.researchCategories.SCIENCE}</span>
                    <span className="text-yellow-400">N:{player.researchCategories.ENERGY}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DatabaseCard>

        {/* Systems & Planets Statistics */}
        <DatabaseCard
          title="STERNENSYSTEME"
          icon={<Globe className="text-cyan-300" size={20} />}
        >
          {systemsData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-mono text-cyan-300/80 text-xs">GESAMT SYSTEME</div>
                  <div className="font-mono text-cyan-100 text-lg">{systemsData.totalSystems}</div>
                </div>
                <div>
                  <div className="font-mono text-cyan-300/80 text-xs">KOLONISIERT</div>
                  <div className="font-mono text-emerald-400 text-lg">{systemsData.colonizedSystems}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-cyan-300/80 text-xs">BINÄR-VERTEILUNG</div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="font-mono text-cyan-200">Einzelsterne: {systemsData.binaryDistribution.single}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="font-mono text-cyan-200">Binärsysteme: {systemsData.binaryDistribution.binary}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                <div className="font-mono text-cyan-300/80 text-xs">TOP SYSTEMTYPEN</div>
                {systemsData.systemTypes.slice(0, 5).map(type => (
                  <div key={type.type} className="flex justify-between text-sm">
                    <span className={`font-mono ${type.isBinary ? 'text-purple-400/70' : 'text-cyan-400/70'}`}>
                      {type.type}
                    </span>
                    <span className="font-mono text-cyan-200">{type.count} ({type.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DatabaseCard>

        {/* Planets Statistics */}
        <DatabaseCard
          title="PLANETENTYPEN"
          icon={<Globe className="text-cyan-300" size={20} />}
        >
          {planetsData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-mono text-cyan-300/80 text-xs">GESAMT PLANETEN</div>
                  <div className="font-mono text-cyan-100 text-lg">{planetsData.totalPlanets}</div>
                </div>
                <div>
                  <div className="font-mono text-cyan-300/80 text-xs">KOLONISIERT</div>
                  <div className="font-mono text-emerald-400 text-lg">{planetsData.colonizedPlanets} ({planetsData.colonizationRate}%)</div>
                </div>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                <div className="font-mono text-cyan-300/80 text-xs">PLANETENKLASSEN</div>
                {planetsData.planetClasses.slice(0, 8).map(planetClass => (
                  <div key={planetClass.planetClass} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-mono text-cyan-400/80">{planetClass.planetClass}</span>
                      <span className="font-mono text-cyan-200">{planetClass.totalCount} ({planetClass.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div
                        className="bg-emerald-500 h-1 rounded-full"
                        style={{ width: `${(planetClass.colonizedCount / planetClass.totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DatabaseCard>

        {/* Buildings Overview */}
        <DatabaseCard
          title="GEBÄUDE-DATENBANK"
          icon={<Wrench className="text-cyan-300" size={20} />}
          className="lg:col-span-2"
        >
          {buildingsData && (
            <div className="space-y-4">
              {Object.entries(buildingsData.categories).map(([category, buildings]) => (
                <div key={category} className="space-y-2">
                  <div className="font-mono text-cyan-300/90 text-sm font-semibold border-b border-cyan-500/20 pb-1">
                    {category} ({buildings.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {buildings.slice(0, 6).map(building => (
                      <div key={building.id} className="bg-slate-900/40 rounded p-2 text-sm">
                        <div className="font-mono text-cyan-100 text-xs font-semibold">{building.name}</div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="font-mono text-cyan-300/70">
                            {building.costs.credits}c {building.buildTime}min
                          </span>
                          <span className="font-mono text-emerald-400/70">
                            {building.timesBuilt}x gebaut
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DatabaseCard>

        {/* Research Tree Overview */}
        <DatabaseCard
          title="FORSCHUNGSARCHIV"
          icon={<FlaskConical className="text-cyan-300" size={20} />}
          className="xl:col-span-3"
        >
          {researchData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(researchData.categories).map(([category, researches]) => (
                  <div key={category} className="text-center">
                    <div className="font-mono text-cyan-300/90 text-sm font-semibold">{category}</div>
                    <div className="font-mono text-cyan-100 text-2xl">{researches.length}</div>
                    <div className="text-xs font-mono text-cyan-400/70">Forschungen</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(researchData.levels).map(([level, researches]) => (
                  <div key={level} className="bg-slate-900/40 rounded p-3">
                    <div className="font-mono text-cyan-300/90 text-sm font-semibold mb-2">
                      {level.toUpperCase()} ({researches.length})
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {researches.slice(0, 3).map(research => (
                        <div key={research.id} className="text-xs">
                          <div className="font-mono text-cyan-100">{research.name}</div>
                          <div className="font-mono text-emerald-400/70">{research.completedBy}x erforscht</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DatabaseCard>

        {/* Ships Statistics */}
        <DatabaseCard
          title="FLOTTEN-ANALYSE"
          icon={<Rocket className="text-cyan-300" size={20} />}
        >
          {shipsData && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="font-mono text-cyan-300/80 text-xs">GESAMT SCHIFFE</div>
                <div className="font-mono text-cyan-100 text-2xl">{shipsData.totalShips}</div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-cyan-300/80 text-xs">FRAKTIONS-VERTEILUNG</div>
                {Object.entries(shipsData.factionDistribution).map(([faction, count]) => (
                  <div key={faction} className="flex justify-between text-sm">
                    <span className={`font-mono ${
                      faction.includes('Imperial') || faction.includes('Empire')
                        ? 'text-red-400/80'
                        : 'text-orange-400/80'
                    }`}>
                      {faction}
                    </span>
                    <span className="font-mono text-cyan-200">{count}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-mono text-cyan-300/80 text-xs">LEGACY SCHIFFE</div>
                  <div className="font-mono text-cyan-200">{shipsData.legacyShips.count}</div>
                </div>
                <div>
                  <div className="font-mono text-cyan-300/80 text-xs">BLUEPRINT SCHIFFE</div>
                  <div className="font-mono text-cyan-200">{shipsData.blueprintShips.count}</div>
                </div>
              </div>
            </div>
          )}
        </DatabaseCard>

      </div>
    </div>
  );
}