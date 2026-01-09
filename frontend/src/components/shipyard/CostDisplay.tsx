import { Coins, Wrench, Gem, Flame, Shield, Sparkles, Battery, Clock } from 'lucide-react';
import { ConstructionCosts } from '../../types/blueprint';

interface CostDisplayProps {
  costs: ConstructionCosts | null;
  planetResources?: {
    credits: number;
    durastahl: number;
    kristallinesSilizium: number;
    tibannaGas: number;
    kyberKristalle: number;
    beskar: number;
    energiemodule: number;
  };
}

export default function CostDisplay({ costs, planetResources }: CostDisplayProps) {
  const costItems = [
    { key: 'credits', label: 'Credits', icon: Coins, color: 'text-yellow-400', value: costs?.credits ?? 0 },
    { key: 'durastahl', label: 'Durastahl', icon: Wrench, color: 'text-gray-400', value: costs?.durastahl ?? 0 },
    { key: 'kristallinesSilizium', label: 'Krist. Silizium', icon: Gem, color: 'text-purple-400', value: costs?.kristallinesSilizium ?? 0 },
    { key: 'tibannaGas', label: 'Tibanna-Gas', icon: Flame, color: 'text-orange-400', value: costs?.tibannaGas ?? 0 },
    { key: 'kyberKristalle', label: 'Kyber-Kristalle', icon: Sparkles, color: 'text-cyan-400', value: costs?.kyberKristalle ?? 0 },
    { key: 'beskar', label: 'Beskar', icon: Shield, color: 'text-slate-300', value: costs?.beskar ?? 0 },
    { key: 'energiemodule', label: 'Energiemodule', icon: Battery, color: 'text-green-400', value: costs?.energiemodule ?? 0 },
  ];

  const canAfford = (key: string, value: number): boolean => {
    if (!planetResources) return true;
    const available = planetResources[key as keyof typeof planetResources] ?? 0;
    return available >= value;
  };

  const visibleCosts = costItems.filter((item) => item.value > 0);

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        Konstruktionskosten
      </h3>

      {visibleCosts.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Keine Module konfiguriert</p>
      ) : (
        <div className="space-y-2">
          {visibleCosts.map((item) => {
            const affordable = canAfford(item.key, item.value);
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-2 rounded ${
                  affordable ? 'bg-gray-800/50' : 'bg-red-900/20 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                <span className={`font-mono text-sm ${affordable ? item.color : 'text-red-400'}`}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            );
          })}

          {/* Bauzeit */}
          {costs && costs.buildTimeMinutes > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-gray-800/50 border-t border-gray-700 mt-3 pt-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Bauzeit</span>
              </div>
              <span className="font-mono text-sm text-blue-400">
                {costs.buildTimeMinutes >= 60
                  ? `${Math.floor(costs.buildTimeMinutes / 60)}h ${costs.buildTimeMinutes % 60}m`
                  : `${costs.buildTimeMinutes}m`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
