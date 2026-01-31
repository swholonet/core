import { useState } from 'react';
import {
  X,
  Zap,
  Gauge,
  Crosshair,
  Shield,
  Radar,
  Package,
  Heart,
  HardDrive,
  Magnet,
  Sparkles,
  Clock,
  Swords,
} from 'lucide-react';
import {
  ModuleType,
  ModuleCategory,
  MODULE_CATEGORY_NAMES,
  MODULE_CATEGORY_COLORS,
  COMBAT_RATING_LABELS,
  COMBAT_RATING_COLORS,
} from '../../types/blueprint';

// Icon-Mapping
const CategoryIcon = ({ category }: { category: ModuleCategory }) => {
  const iconClass = 'w-4 h-4';
  switch (category) {
    case 'HYPERDRIVE':
      return <Zap className={iconClass} />;
    case 'SUBLIGHT_ENGINE':
      return <Gauge className={iconClass} />;
    case 'WEAPONS':
      return <Crosshair className={iconClass} />;
    case 'SHIELDS':
      return <Shield className={iconClass} />;
    case 'SENSORS':
      return <Radar className={iconClass} />;
    case 'CARGO':
      return <Package className={iconClass} />;
    case 'LIFE_SUPPORT':
      return <Heart className={iconClass} />;
    case 'HULL':
      return <HardDrive className={iconClass} />;
    case 'TRACTOR_BEAM':
      return <Magnet className={iconClass} />;
    case 'SPECIAL':
      return <Sparkles className={iconClass} />;
    default:
      return <Package className={iconClass} />;
  }
};

// Combat Rating numeric value for sorting (higher = better)
const combatRatingValue = (rating: string): number => {
  switch (rating) {
    case 'SEHR_HOCH': return 4;
    case 'HOCH': return 3;
    case 'MITTEL': return 2;
    case 'NIEDRIG': return 1;
    default: return 0;
  }
};

interface ModuleComparisonProps {
  category: ModuleCategory;
  availableModules: ModuleType[];
  currentModule?: ModuleType;
  currentLevel?: number;
  onClose: () => void;
  onSelectModule: (moduleType: ModuleType, level: number) => void;
}

export default function ModuleComparison({
  category,
  availableModules,
  currentModule,
  currentLevel = 1,
  onClose,
  onSelectModule,
}: ModuleComparisonProps) {
  const [compareLevel, setCompareLevel] = useState(currentLevel);

  // Filter modules by category and sort by combat rating + other stats
  const categoryModules = availableModules
    .filter((m) => m.category === category)
    .sort((a, b) => {
      // Sort by combat rating first, then by other stats
      const aCombat = combatRatingValue(a.combatRating);
      const bCombat = combatRatingValue(b.combatRating);
      if (aCombat !== bCombat) return bCombat - aCombat;

      // Then by combined public stats
      const aStats = (a.baseStats.hullPoints || 0) + (a.baseStats.speed || 0) + (a.baseStats.sensorRange || 0);
      const bStats = (b.baseStats.hullPoints || 0) + (b.baseStats.speed || 0) + (b.baseStats.sensorRange || 0);
      return bStats - aStats;
    });

  // Calculate stats at specific level (PUBLIC stats only)
  const calculateStatsAtLevel = (module: ModuleType, level: number) => {
    const multiplier = Math.pow(1.2, level - 1); // Same as backend logic
    return {
      hullPoints: Math.floor((module.baseStats.hullPoints || 0) * multiplier),
      speed: Math.floor((module.baseStats.speed || 0) * multiplier),
      sensorRange: Math.floor((module.baseStats.sensorRange || 0) * multiplier),
      cargoCapacity: Math.floor((module.baseStats.cargoCapacity || 0) * multiplier),
      hyperdriveRating: module.baseStats.hyperdriveRating || 0, // Usually fixed
      crewRequired: Math.floor((module.baseStats.crewCapacity || 0) * multiplier),
    };
  };

  // Calculate costs at specific level
  const calculateCostAtLevel = (module: ModuleType, level: number) => {
    const multiplier = Math.pow(1.5, level - 1); // Same as backend logic
    return {
      credits: Math.floor((module.baseCosts.credits || 0) * multiplier),
      durastahl: Math.floor((module.baseCosts.durastahl || 0) * multiplier),
      kristallinesSilizium: Math.floor((module.baseCosts.kristallinesSilizium || 0) * multiplier),
      tibannaGas: Math.floor((module.baseCosts.tibannaGas || 0) * multiplier),
      kyberKristalle: Math.floor((module.baseCosts.kyberKristalle || 0) * multiplier),
      beskar: Math.floor((module.baseCosts.beskar || 0) * multiplier),
      energiemodule: Math.floor((module.baseCosts.energiemodule || 0) * multiplier),
      buildTime: Math.floor((module.baseCosts.buildTime || 0) * multiplier),
    };
  };

  // Efficiency rating (public stats per cost)
  const calculateEfficiency = (module: ModuleType, level: number) => {
    const stats = calculateStatsAtLevel(module, level);
    const costs = calculateCostAtLevel(module, level);

    // Use public stats + combat rating value
    const combatValue = combatRatingValue(module.combatRating) * 20; // Weight combat rating
    const totalStats = combatValue + stats.hullPoints + stats.speed + stats.sensorRange + stats.cargoCapacity;
    const totalCost = Math.max(1, costs.credits + costs.durastahl + costs.kristallinesSilizium + costs.tibannaGas + costs.kyberKristalle + costs.beskar + costs.energiemodule);

    return Math.round((totalStats / totalCost) * 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${MODULE_CATEGORY_COLORS[category]}`}>
                <CategoryIcon category={category} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-mono tracking-wide">
                  MODUL-VERGLEICH
                </h3>
                <p className="text-sm text-gray-400">
                  {MODULE_CATEGORY_NAMES[category]} - {categoryModules.length} verfuegbare Module
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Level Selector */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-400 font-mono">VERGLEICHS-LEVEL:</span>
            <input
              type="range"
              min={1}
              max={10}
              value={compareLevel}
              onChange={(e) => setCompareLevel(parseInt(e.target.value))}
              className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-cyan-500
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-cyan-400 font-mono font-bold min-w-[2rem]">
              {compareLevel}
            </span>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryModules.map((module) => {
              const stats = calculateStatsAtLevel(module, compareLevel);
              const costs = calculateCostAtLevel(module, compareLevel);
              const efficiency = calculateEfficiency(module, compareLevel);
              const isCurrent = currentModule?.id === module.id;
              const maxLevel = module.isUnlocked ? module.unlockedLevel : 1;

              return (
                <div
                  key={module.id}
                  className={`relative rounded-lg border transition-all duration-200 ${
                    isCurrent
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : module.isUnlocked
                      ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
                      : 'border-gray-700 bg-gray-900/30 opacity-60'
                  }`}
                >
                  {/* Current Module Badge */}
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs px-2 py-1 rounded-full font-mono">
                      AKTUELL
                    </div>
                  )}

                  {/* Module Header */}
                  <div className="p-4 border-b border-gray-700/50">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${MODULE_CATEGORY_COLORS[category]}`}>
                        <CategoryIcon category={category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm truncate">
                          {module.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {module.isUnlocked ? `Max Level ${maxLevel}` : 'Gesperrt'}
                        </p>
                        {!module.isUnlocked && (
                          <p className="text-xs text-red-400 mt-1">
                            Benoetigt: {module.requiredResearchName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Combat Rating + Efficiency */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${COMBAT_RATING_COLORS[module.combatRating]}`}>
                        <Swords className="w-3 h-3" />
                        {COMBAT_RATING_LABELS[module.combatRating]}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Effizienz:</span>
                        <div className={`w-2 h-2 rounded-full ${
                          efficiency >= 50 ? 'bg-green-500' :
                          efficiency >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs font-mono text-white">
                          {efficiency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Preview (PUBLIC only) */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {stats.hullPoints > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Huelle:</span>
                          <span className="text-gray-300 font-mono">{stats.hullPoints}</span>
                        </div>
                      )}
                      {stats.speed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Speed:</span>
                          <span className="text-cyan-400 font-mono">{stats.speed}</span>
                        </div>
                      )}
                      {stats.sensorRange > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Sensoren:</span>
                          <span className="text-yellow-400 font-mono">{stats.sensorRange}</span>
                        </div>
                      )}
                      {stats.cargoCapacity > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Fracht:</span>
                          <span className="text-green-400 font-mono">{stats.cargoCapacity}</span>
                        </div>
                      )}
                      {stats.hyperdriveRating > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Hyperdrive:</span>
                          <span className="text-blue-400 font-mono">Kl. {stats.hyperdriveRating}</span>
                        </div>
                      )}
                      {stats.crewRequired > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Crew:</span>
                          <span className="text-pink-400 font-mono">{stats.crewRequired}</span>
                        </div>
                      )}
                    </div>

                    {/* Cost Summary */}
                    <div className="border-t border-gray-700/50 pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Kosten (Level {compareLevel}):</span>
                        {costs.buildTime > 0 && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Clock className="w-3 h-3" />
                            {costs.buildTime}m
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {costs.credits > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Credits:</span>
                            <span className="text-yellow-400 font-mono">
                              {costs.credits.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {(costs.durastahl > 0 || costs.kristallinesSilizium > 0) && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Materialien:</span>
                            <span className="text-gray-300 font-mono text-xs">
                              {[
                                costs.durastahl > 0 ? `${costs.durastahl}D` : null,
                                costs.kristallinesSilizium > 0 ? `${costs.kristallinesSilizium}K` : null,
                                costs.tibannaGas > 0 ? `${costs.tibannaGas}T` : null,
                                costs.kyberKristalle > 0 ? `${costs.kyberKristalle}Ky` : null,
                                costs.beskar > 0 ? `${costs.beskar}B` : null,
                                costs.energiemodule > 0 ? `${costs.energiemodule}E` : null,
                              ].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        if (module.isUnlocked) {
                          onSelectModule(module, Math.min(compareLevel, maxLevel));
                          onClose();
                        }
                      }}
                      disabled={!module.isUnlocked}
                      className={`w-full py-2 px-3 rounded text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-400'
                          : module.isUnlocked
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isCurrent ? 'AUSGEWAEHLT' : module.isUnlocked ? 'AUSWAEHLEN' : 'GESPERRT'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {categoryModules.length === 0 && (
            <div className="text-center py-12">
              <CategoryIcon category={category} />
              <p className="text-gray-400 mt-4">
                Keine Module in der Kategorie {MODULE_CATEGORY_NAMES[category]} verfuegbar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
