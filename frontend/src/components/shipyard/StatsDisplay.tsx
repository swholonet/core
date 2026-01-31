import {
  Gauge,
  Radar,
  Package,
  Users,
  HardDrive,
  Zap,
  Swords,
} from 'lucide-react';
import {
  BlueprintStats,
  COMBAT_RATING_LABELS,
  COMBAT_RATING_COLORS,
} from '../../types/blueprint';

interface StatsDisplayProps {
  stats: BlueprintStats | null;
  isCalculating?: boolean;
}

export default function StatsDisplay({ stats, isCalculating }: StatsDisplayProps) {
  const statItems = [
    {
      label: 'Huellenpunkte',
      value: stats?.hullPoints ?? 0,
      icon: HardDrive,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
    },
    {
      label: 'Geschwindigkeit',
      value: stats?.speed ?? 0,
      icon: Gauge,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Sensorreichweite',
      value: stats?.sensorRange ?? 0,
      icon: Radar,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Frachtraum',
      value: stats?.cargoCapacity ?? 0,
      icon: Package,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Crew benoetigt',
      value: stats?.crewRequired ?? 0,
      icon: Users,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Hyperdrive-Klasse',
      value: stats?.hyperdriveRating ?? 0,
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      format: (v: number) => (v > 0 ? `Klasse ${v.toFixed(1)}` : 'Kein Antrieb'),
    },
  ];

  // Combat Rating als separates Element (keine exakten Werte)
  const combatRating = stats?.combatRating ?? 'NIEDRIG';
  const combatLabel = COMBAT_RATING_LABELS[combatRating];
  const combatColor = COMBAT_RATING_COLORS[combatRating];

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        Schiffs-Statistiken
      </h3>

      {isCalculating ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Combat Rating - Vage Anzeige */}
          <div className={`${combatColor} rounded-lg p-4 border border-gray-800 mb-3`}>
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6" />
              <div>
                <span className="text-xs text-gray-400 block">Kampfstaerke</span>
                <p className="text-lg font-bold font-mono">{combatLabel}</p>
              </div>
            </div>
          </div>

          {/* Other Stats */}
          <div className="grid grid-cols-2 gap-2">
            {statItems.map((item) => (
              <div
                key={item.label}
                className={`${item.bgColor} rounded-lg p-3 border border-gray-800`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <p className={`text-lg font-bold font-mono ${item.color}`}>
                  {item.format ? item.format(item.value) : item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
