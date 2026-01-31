import { useState } from 'react';
import {
  Award,
  TrendingUp,
  Swords,
  Gauge,
  Package,
  Radar,
  Info,
  ChevronDown,
  ChevronUp,
  HardDrive,
} from 'lucide-react';
import {
  BlueprintStats,
  ShipClass,
  CombatRating,
  COMBAT_RATING_LABELS,
} from '../../types/blueprint';

interface PerformanceRatingProps {
  stats: BlueprintStats | null;
  shipClass: ShipClass;
  isCalculating?: boolean;
}

interface PerformanceCategory {
  name: string;
  icon: any;
  color: string;
  score: number;
  maxScore: number;
  description: string;
  breakdown: Array<{ label: string; value: string | number; max?: number }>;
}

// Combat rating to numeric score (0-100)
const combatRatingToScore = (rating: CombatRating): number => {
  switch (rating) {
    case 'SEHR_HOCH': return 100;
    case 'HOCH': return 75;
    case 'MITTEL': return 50;
    case 'NIEDRIG': return 25;
    default: return 0;
  }
};

// Ship class base expectations for scoring (PUBLIC stats only)
const SHIP_CLASS_EXPECTATIONS = {
  FIGHTER: {
    combatRating: 'MITTEL' as CombatRating,
    speed: 100, hull: 50, sensors: 60, cargo: 20, crew: 30,
    role: 'Schnelle Angriffe und Abfangen'
  },
  BOMBER: {
    combatRating: 'HOCH' as CombatRating,
    speed: 70, hull: 80, sensors: 50, cargo: 40, crew: 50,
    role: 'Schwerer Angriff gegen grosse Ziele'
  },
  CORVETTE: {
    combatRating: 'MITTEL' as CombatRating,
    speed: 80, hull: 100, sensors: 80, cargo: 60, crew: 80,
    role: 'Vielseitiger Eskortschutz'
  },
  FRIGATE: {
    combatRating: 'HOCH' as CombatRating,
    speed: 60, hull: 140, sensors: 100, cargo: 100, crew: 120,
    role: 'Mittlere Kampfunterstuetzung'
  },
  CRUISER: {
    combatRating: 'HOCH' as CombatRating,
    speed: 50, hull: 200, sensors: 120, cargo: 150, crew: 180,
    role: 'Schwere Kampffuehrung'
  },
  CAPITAL: {
    combatRating: 'SEHR_HOCH' as CombatRating,
    speed: 30, hull: 300, sensors: 150, cargo: 200, crew: 300,
    role: 'Flottenkommando und -kontrolle'
  },
  TRANSPORT: {
    combatRating: 'NIEDRIG' as CombatRating,
    speed: 60, hull: 120, sensors: 80, cargo: 300, crew: 100,
    role: 'Gueter- und Personentransport'
  },
};

export default function PerformanceRating({ stats, shipClass, isCalculating }: PerformanceRatingProps) {
  const [expanded, setExpanded] = useState(false);

  if (!stats || isCalculating) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Leistungsbewertung
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const expectations = SHIP_CLASS_EXPECTATIONS[shipClass];

  // Calculate category scores (0-100%)
  const calculateCategoryScore = (current: number, expected: number, cap: number = expected * 1.5): number => {
    if (expected === 0) return 0;
    const score = Math.min((current / expected) * 100, (cap / expected) * 100);
    return Math.max(0, Math.min(100, score));
  };

  // Combat score based on rating comparison
  const currentCombatScore = combatRatingToScore(stats.combatRating);
  const expectedCombatScore = combatRatingToScore(expectations.combatRating);
  const combatScore = Math.min(100, (currentCombatScore / expectedCombatScore) * 100);

  const categories: PerformanceCategory[] = [
    {
      name: 'Kampfstaerke',
      icon: Swords,
      color: 'text-red-400',
      score: combatScore,
      maxScore: 100,
      description: 'Offensive und defensive Kampffaehigkeit',
      breakdown: [
        { label: 'Kampfbewertung', value: COMBAT_RATING_LABELS[stats.combatRating] },
        { label: 'Erwartet', value: COMBAT_RATING_LABELS[expectations.combatRating] },
      ],
    },
    {
      name: 'Panzerung',
      icon: HardDrive,
      color: 'text-gray-400',
      score: calculateCategoryScore(stats.hullPoints, expectations.hull),
      maxScore: 100,
      description: 'Strukturelle Integritaet und Ueberlebensfaehigkeit',
      breakdown: [
        { label: 'Huellenpunkte', value: stats.hullPoints, max: expectations.hull },
      ],
    },
    {
      name: 'Mobilitaet',
      icon: Gauge,
      color: 'text-cyan-400',
      score: calculateCategoryScore(stats.speed, expectations.speed),
      maxScore: 100,
      description: 'Geschwindigkeit und Manoevrierfaehigkeit',
      breakdown: [
        { label: 'Sublight-Geschw.', value: stats.speed, max: expectations.speed },
      ],
    },
    {
      name: 'Aufklaerung',
      icon: Radar,
      color: 'text-yellow-400',
      score: calculateCategoryScore(stats.sensorRange, expectations.sensors),
      maxScore: 100,
      description: 'Sensorfaehigkeiten und Erkennung',
      breakdown: [
        { label: 'Sensorreichweite', value: stats.sensorRange, max: expectations.sensors },
      ],
    },
    {
      name: 'Logistik',
      icon: Package,
      color: 'text-green-400',
      score: Math.round((
        calculateCategoryScore(stats.cargoCapacity, expectations.cargo) * 0.7 +
        calculateCategoryScore(expectations.crew - stats.crewRequired, 0, expectations.crew) * 0.3
      )),
      maxScore: 100,
      description: 'Frachtraum und Besatzungseffizienz',
      breakdown: [
        { label: 'Frachtraum', value: stats.cargoCapacity, max: expectations.cargo },
        { label: 'Crew-Effizienz', value: Math.max(0, expectations.crew - stats.crewRequired), max: expectations.crew },
      ],
    },
  ];

  // Calculate overall performance score
  const overallScore = Math.round(categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length);

  // Performance rating tiers
  const getPerformanceRating = (score: number) => {
    if (score >= 90) return { label: 'EXZELLENT', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (score >= 80) return { label: 'SEHR GUT', color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
    if (score >= 70) return { label: 'GUT', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (score >= 60) return { label: 'AKZEPTABEL', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (score >= 40) return { label: 'SCHWACH', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    return { label: 'MANGELHAFT', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const rating = getPerformanceRating(overallScore);

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono flex items-center gap-2">
            <Award className="w-4 h-4" />
            Leistungsbewertung
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Overall Score */}
        <div className="mt-3 flex items-center gap-4">
          <div className="relative">
            {/* Circular Progress */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-gray-700"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${rating.color.replace('text-', 'stroke-')} transition-all duration-500`}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${overallScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-bold text-lg font-mono ${rating.color}`}>
                {overallScore}
              </span>
            </div>
          </div>

          <div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-mono ${rating.bg} ${rating.color} border border-current/30`}>
              {rating.label}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Rolle: {expectations.role}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Fuer {shipClass} optimiert
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {expanded && (
        <div className="p-4 space-y-3">
          {categories.map((category) => {
            const categoryRating = getPerformanceRating(category.score);

            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className={`w-4 h-4 ${category.color}`} />
                    <span className="text-sm text-white font-medium">{category.name}</span>
                    <div className="relative group">
                      <Info className="w-3 h-3 text-gray-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black border border-gray-600 text-xs text-white p-2 rounded whitespace-nowrap z-10">
                        {category.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-mono ${categoryRating.color}`}>
                      {Math.round(category.score)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${category.color.replace('text-', 'bg-')}`}
                    style={{ width: `${category.score}%` }}
                  />
                </div>

                {/* Detailed Stats */}
                <div className="ml-6 space-y-1">
                  {category.breakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{item.label}:</span>
                      <span className="text-gray-300 font-mono">
                        {typeof item.value === 'number'
                          ? `${item.value.toLocaleString()}${item.max ? ` / ${item.max.toLocaleString()}` : ''}`
                          : item.value
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Performance Tips */}
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Optimierungsvorschlaege:</span>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              {categories
                .filter(cat => cat.score < 70)
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                    <span>
                      {cat.name} verbessern ({Math.round(cat.score)}% - Ziel: 80%+)
                    </span>
                  </div>
                ))}
              {categories.every(cat => cat.score >= 70) && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  <span>Ausgewogenes Design - alle Bereiche ueber 70%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
