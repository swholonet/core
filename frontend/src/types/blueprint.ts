// =====================================================
// Blueprint System Types - Frontend
// =====================================================

export type ModuleCategory =
  | 'HYPERDRIVE'
  | 'SUBLIGHT_ENGINE'
  | 'WEAPONS'
  | 'SHIELDS'
  | 'SENSORS'
  | 'CARGO'
  | 'LIFE_SUPPORT'
  | 'HULL'
  | 'TRACTOR_BEAM'
  | 'SPECIAL';

export type ShipClass =
  | 'FIGHTER'
  | 'BOMBER'
  | 'CORVETTE'
  | 'FRIGATE'
  | 'CRUISER'
  | 'CAPITAL'
  | 'TRANSPORT';

// Modul-Typ Definition
export interface ModuleType {
  id: number;
  name: string;
  description: string;
  category: ModuleCategory;
  maxLevel: number;
  isUnlocked: boolean;
  unlockedLevel: number;
  requiredResearchName?: string;
  baseStats: ModuleBaseStats;
  baseCosts: ModuleBaseCosts;
}

export interface ModuleBaseStats {
  hullPoints: number;
  damage: number;
  shieldStrength: number;
  sensorRange: number;
  cargoCapacity: number;
  crewCapacity: number;
  speed: number;
  hyperdriveRating: number | null;
  tibannaConsumption: number;
}

export interface ModuleBaseCosts {
  credits: number;
  durastahl: number;
  kyberKristalle: number;
  tibannaGas: number;
  beskar: number;
  kristallinesSilizium: number;
  energiemodule: number;
  buildTime: number;
}

// Blueprint Stats
export interface BlueprintStats {
  hullPoints: number;
  shieldStrength: number;
  damage: number;
  speed: number;
  sensorRange: number;
  cargoCapacity: number;
  crewRequired: number;
  hyperdriveRating: number;
}

// Konstruktionskosten
export interface ConstructionCosts {
  credits: number;
  durastahl: number;
  kyberKristalle: number;
  tibannaGas: number;
  beskar: number;
  kristallinesSilizium: number;
  energiemodule: number;
  buildTimeMinutes: number;
}

// Modul im Blueprint
export interface BlueprintModule {
  id?: number;
  moduleTypeId: number;
  level: number;
  slotPosition: number;
  moduleType?: ModuleType;
  calculatedStats?: ModuleBaseStats;
  calculatedCosts?: ModuleBaseCosts;
}

// Blueprint
export interface Blueprint {
  id: number;
  playerId: number;
  name: string;
  shipClass: ShipClass;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  modules: BlueprintModule[];
  stats: BlueprintStats;
  costs: ConstructionCosts;
  researchValidation: ResearchValidationResult;
}

// Research Validierung
export interface ResearchValidationResult {
  isValid: boolean;
  missingResearch: MissingResearch[];
}

export interface MissingResearch {
  moduleTypeId: number;
  moduleName: string;
  requiredResearchId: number;
  requiredResearchName: string;
  requiredLevel: number;
  playerLevel: number;
}

// Schiffsklassen-Konfiguration
export interface ShipClassConfig {
  id: ShipClass;
  name: string;
  maxSlots: number;
  hullMultiplier: number;
  costMultiplier: number;
}

// Input fuer neuen Blueprint
export interface CreateBlueprintInput {
  name: string;
  shipClass: ShipClass;
  description?: string;
  isPublic?: boolean;
  modules: BlueprintModuleInput[];
}

export interface BlueprintModuleInput {
  moduleTypeId: number;
  level: number;
  slotPosition: number;
}

// Calculate Response
export interface CalculateResponse {
  stats: BlueprintStats;
  costs: ConstructionCosts;
  researchValidation: ResearchValidationResult;
}

// Schiffsklassen-Namen (Deutsch)
export const SHIP_CLASS_NAMES: Record<ShipClass, string> = {
  FIGHTER: 'Jaeger',
  BOMBER: 'Bomber',
  CORVETTE: 'Korvette',
  FRIGATE: 'Fregatte',
  CRUISER: 'Kreuzer',
  CAPITAL: 'Grosskapitaelschiff',
  TRANSPORT: 'Transporter',
};

// Schiffsklassen-Farben
export const SHIP_CLASS_COLORS: Record<ShipClass, string> = {
  FIGHTER: 'from-cyan-500/20 to-cyan-900/20 border-cyan-500/50',
  BOMBER: 'from-orange-500/20 to-orange-900/20 border-orange-500/50',
  CORVETTE: 'from-blue-500/20 to-blue-900/20 border-blue-500/50',
  FRIGATE: 'from-purple-500/20 to-purple-900/20 border-purple-500/50',
  CRUISER: 'from-yellow-500/20 to-yellow-900/20 border-yellow-500/50',
  CAPITAL: 'from-red-500/20 to-red-900/20 border-red-500/50',
  TRANSPORT: 'from-green-500/20 to-green-900/20 border-green-500/50',
};

// Modul-Kategorie-Namen (Deutsch)
export const MODULE_CATEGORY_NAMES: Record<ModuleCategory, string> = {
  HYPERDRIVE: 'Hyperantrieb',
  SUBLIGHT_ENGINE: 'Sublicht-Antrieb',
  WEAPONS: 'Waffen',
  SHIELDS: 'Schilde',
  SENSORS: 'Sensoren',
  CARGO: 'Frachtraum',
  LIFE_SUPPORT: 'Lebenserhaltung',
  HULL: 'Panzerung',
  TRACTOR_BEAM: 'Traktorstrahl',
  SPECIAL: 'Spezial',
};

// Modul-Kategorie-Farben
export const MODULE_CATEGORY_COLORS: Record<ModuleCategory, string> = {
  HYPERDRIVE: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  SUBLIGHT_ENGINE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  WEAPONS: 'text-red-400 bg-red-500/10 border-red-500/30',
  SHIELDS: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  SENSORS: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  CARGO: 'text-green-400 bg-green-500/10 border-green-500/30',
  LIFE_SUPPORT: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  HULL: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  TRACTOR_BEAM: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  SPECIAL: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

// Modul-Kategorie-Icons (als String fuer Lucide)
export const MODULE_CATEGORY_ICONS: Record<ModuleCategory, string> = {
  HYPERDRIVE: 'Zap',
  SUBLIGHT_ENGINE: 'Gauge',
  WEAPONS: 'Crosshair',
  SHIELDS: 'Shield',
  SENSORS: 'Radar',
  CARGO: 'Package',
  LIFE_SUPPORT: 'Heart',
  HULL: 'HardDrive',
  TRACTOR_BEAM: 'Magnet',
  SPECIAL: 'Sparkles',
};
