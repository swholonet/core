import { ModuleCategory, ShipClass } from '@prisma/client';

// =====================================================
// Blueprint System Types
// =====================================================

// Visibility levels for game data
export type VisibilityLevel = 'PUBLIC' | 'UNLOCKABLE' | 'SECRET';

// Combat rating for vague strength indication (shown to players instead of exact values)
export type CombatRating = 'NIEDRIG' | 'MITTEL' | 'HOCH' | 'SEHR_HOCH';

// Calculate combat rating from actual values (server-side only)
export function calculateCombatRating(damage: number, shieldStrength: number): CombatRating {
  const combinedPower = damage + shieldStrength;
  if (combinedPower <= 20) return 'NIEDRIG';
  if (combinedPower <= 50) return 'MITTEL';
  if (combinedPower <= 100) return 'HOCH';
  return 'SEHR_HOCH';
}

// Stats eines Schiffs/Blueprints (PUBLIC - sent to client)
export interface BlueprintStats {
  hullPoints: number;
  speed: number;               // subLightSpeed
  sensorRange: number;
  cargoCapacity: number;
  crewRequired: number;
  hyperdriveRating: number;    // 1.0 = Standard, 0.5 = schneller
  // Combat stats are SECRET - only sent as rating
  combatRating: CombatRating;
}

// Internal stats (SERVER-SIDE ONLY - never exposed to client)
export interface BlueprintStatsInternal extends Omit<BlueprintStats, 'combatRating'> {
  shieldStrength: number;      // deflectorShieldStrength - SECRET
  damage: number;              // weaponDamage - SECRET
}

// Kosten für Konstruktion
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

// Modul mit Level im Blueprint
export interface BlueprintModuleInput {
  moduleTypeId: number;
  level: number;
  slotPosition: number;
}

// Input für neuen Blueprint
export interface CreateBlueprintInput {
  name: string;
  shipClass: ShipClass;
  description?: string;
  isPublic?: boolean;
  modules: BlueprintModuleInput[];
}

// Input für Blueprint-Update
export interface UpdateBlueprintInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
  modules?: BlueprintModuleInput[];
}

// Validierungs-Ergebnis für Research
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

// Verfügbares Modul (mit Freischaltungs-Status) - PUBLIC VERSION
export interface AvailableModule {
  id: number;
  name: string;
  description: string;
  category: ModuleCategory;
  maxLevel: number;
  isUnlocked: boolean;
  unlockedLevel: number;  // Max Level das der Spieler nutzen kann
  requiredResearchName?: string;
  requiredPlayerLevel?: number;
  baseStats: ModuleBaseStatsPublic;  // PUBLIC stats only
  baseCosts: ModuleBaseCosts;
  // Vage Kampfstaerke-Anzeige (ersetzt exakte Werte)
  combatRating: CombatRating;
}

// PUBLIC module stats (sent to client)
export interface ModuleBaseStatsPublic {
  hullPoints: number;
  sensorRange: number;
  cargoCapacity: number;
  crewCapacity: number;
  speed: number;
  hyperdriveRating: number | null;
  // NO: damage, shieldStrength, tibannaConsumption - these are SECRET
}

// INTERNAL module stats (server-side only) - includes secret combat values
export interface ModuleBaseStats {
  hullPoints: number;
  damage: number;              // SECRET
  shieldStrength: number;      // SECRET
  sensorRange: number;
  cargoCapacity: number;
  crewCapacity: number;
  speed: number;
  hyperdriveRating: number | null;
  tibannaConsumption: number;  // SECRET
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

// Blueprint mit berechneten Stats und Kosten
export interface BlueprintWithCalculations {
  id: number;
  playerId: number;
  name: string;
  shipClass: ShipClass;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  modules: BlueprintModuleWithType[];
  stats: BlueprintStats;
  costs: ConstructionCosts;
  researchValidation: ResearchValidationResult;
}

export interface BlueprintModuleWithType {
  id: number;
  moduleTypeId: number;
  level: number;
  slotPosition: number;
  moduleType: {
    id: number;
    name: string;
    description: string;
    category: ModuleCategory;
    maxLevel: number;
    hyperdriveRating: number | null;
  };
  // Berechnete Stats für dieses Modul bei diesem Level (PUBLIC only)
  calculatedStats: ModuleBaseStatsPublic;
  calculatedCosts: ModuleBaseCosts;
  // Kampfstaerke-Indikator fuer dieses Modul
  combatRating: CombatRating;
}

// Internal version with full stats (server-side only)
export interface BlueprintModuleWithTypeInternal extends Omit<BlueprintModuleWithType, 'calculatedStats' | 'combatRating'> {
  calculatedStats: ModuleBaseStats;
}

// Konstanten für Berechnungen
export const COST_EXPONENT = 1.5;  // Kosten-Skalierung pro Level
export const STAT_MULTIPLIER = 1.2; // Stats-Skalierung pro Level (linear + kleiner Bonus)

// Schiffsklassen-Multiplikatoren (größere Schiffe = mehr Slots, höhere Basis-Stats)
export const SHIP_CLASS_CONFIG: Record<ShipClass, ShipClassConfig> = {
  FIGHTER: {
    maxSlots: 4,
    baseHullMultiplier: 1.0,
    baseCostMultiplier: 1.0,
  },
  BOMBER: {
    maxSlots: 5,
    baseHullMultiplier: 1.2,
    baseCostMultiplier: 1.3,
  },
  CORVETTE: {
    maxSlots: 6,
    baseHullMultiplier: 2.0,
    baseCostMultiplier: 2.5,
  },
  FRIGATE: {
    maxSlots: 7,
    baseHullMultiplier: 3.0,
    baseCostMultiplier: 4.0,
  },
  CRUISER: {
    maxSlots: 8,
    baseHullMultiplier: 5.0,
    baseCostMultiplier: 7.0,
  },
  CAPITAL: {
    maxSlots: 10,
    baseHullMultiplier: 10.0,
    baseCostMultiplier: 15.0,
  },
  TRANSPORT: {
    maxSlots: 5,
    baseHullMultiplier: 1.5,
    baseCostMultiplier: 1.5,
  },
};

export interface ShipClassConfig {
  maxSlots: number;
  baseHullMultiplier: number;
  baseCostMultiplier: number;
}
