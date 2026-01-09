import { useState } from 'react';
import { ChevronDown, Check, Rocket } from 'lucide-react';
import {
  ShipClass,
  ShipClassConfig,
  SHIP_CLASS_NAMES,
  SHIP_CLASS_COLORS,
} from '../../types/blueprint';

interface HullSelectorProps {
  shipClasses: ShipClassConfig[];
  selectedClass: ShipClass | null;
  onSelect: (shipClass: ShipClass) => void;
}

export default function HullSelector({
  shipClasses,
  selectedClass,
  onSelect,
}: HullSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedConfig = shipClasses.find((sc) => sc.id === selectedClass);

  return (
    <div className="relative">
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">
        Schiffsklasse / Huelle
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 rounded-lg border transition-all duration-200
          flex items-center justify-between
          ${
            selectedClass
              ? `bg-gradient-to-r ${SHIP_CLASS_COLORS[selectedClass]} border-opacity-50`
              : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${selectedClass ? 'bg-white/10' : 'bg-gray-800'}
          `}
          >
            {selectedClass ? (
              <img
                src={`/assets/ships/hulls/${selectedClass.toLowerCase()}.png`}
                alt={selectedClass}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML =
                    '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>';
                }}
              />
            ) : (
              <Rocket className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold">
              {selectedClass ? SHIP_CLASS_NAMES[selectedClass] : 'Klasse waehlen...'}
            </p>
            {selectedConfig && (
              <p className="text-xs text-gray-400">
                {selectedConfig.maxSlots} Modul-Slots
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {shipClasses.map((config) => (
              <button
                key={config.id}
                onClick={() => {
                  onSelect(config.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 flex items-center gap-3 transition-colors
                  ${
                    selectedClass === config.id
                      ? 'bg-cyan-500/20'
                      : 'hover:bg-gray-800'
                  }
                `}
              >
                <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center">
                  <img
                    src={`/assets/ships/hulls/${config.id.toLowerCase()}.png`}
                    alt={config.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">
                    {SHIP_CLASS_NAMES[config.id]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {config.maxSlots} Slots | x{config.hullMultiplier} Huelle | x
                    {config.costMultiplier} Kosten
                  </p>
                </div>
                {selectedClass === config.id && (
                  <Check className="w-5 h-5 text-cyan-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
