#!/usr/bin/env tsx
import { PrismaClient, ModuleCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface ModuleTypeData {
  name: string;
  description: string;
  category: ModuleCategory;
  maxLevel: number;

  // Base stats (level 1 values)
  baseHullPoints: number;
  baseDamage: number;
  baseShieldStrength: number;
  baseSensorRange: number;
  baseCargoCapacity: number;
  baseCrewCapacity: number;
  baseSpeed: number;
  hyperdriveRating?: number | null;
  tibannaConsumption: number;

  // Base costs (level 1 values) - exponential scaling applies
  baseCostCredits: number;
  baseCostDurastahl: number;
  baseCostKyberKristalle: number;
  baseCostTibannaGas: number;
  baseCostBeskar: number;
  baseCostKristallinesSilizium: number;
  baseCostEnergiemodule: number;
  baseBuildTime: number; // minutes

  // Research requirements (optional)
  requiredResearchName?: string;
  requiredResearchLevel?: number;
}

async function seedModuleTypes() {
  console.log('🔧 Seeding Module Types...');

  // Delete existing module types to start fresh
  await prisma.moduleType.deleteMany();

  // Define all module types with STU-style progression
  const moduleTypes: ModuleTypeData[] = [

    // ========================================
    // HYPERDRIVE MODULES (Hyperspace Travel)
    // ========================================
    {
      name: 'Standard-Hyperantrieb',
      description: 'Grundlegender Hyperraumantrieb für interstellare Reisen',
      category: 'HYPERDRIVE',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 0,
      hyperdriveRating: 3.0, // Class 3 hyperdrive
      tibannaConsumption: 5,
      baseCostCredits: 5000,
      baseCostDurastahl: 200,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 100,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 150,
      baseCostEnergiemodule: 50,
      baseBuildTime: 60, // 1 hour
    },
    {
      name: 'Militär-Hyperantrieb',
      description: 'Verbesserter Hyperantrieb für militärische Schiffe',
      category: 'HYPERDRIVE',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: 2.0, // Class 2 hyperdrive
      tibannaConsumption: 8,
      baseCostCredits: 12000,
      baseCostDurastahl: 400,
      baseCostKyberKristalle: 50,
      baseCostTibannaGas: 200,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 300,
      baseCostEnergiemodule: 100,
      baseBuildTime: 120, // 2 hours
      requiredResearchName: 'Hyperantrieb-Technologie',
      requiredResearchLevel: 1,
    },
    {
      name: 'Elite-Hyperantrieb',
      description: 'Hochmoderner Hyperantrieb der Imperialischen Marine',
      category: 'HYPERDRIVE',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 3,
      baseSpeed: 0,
      hyperdriveRating: 1.0, // Class 1 hyperdrive
      tibannaConsumption: 12,
      baseCostCredits: 25000,
      baseCostDurastahl: 800,
      baseCostKyberKristalle: 150,
      baseCostTibannaGas: 400,
      baseCostBeskar: 50,
      baseCostKristallinesSilizium: 600,
      baseCostEnergiemodule: 200,
      baseBuildTime: 240, // 4 hours
      requiredResearchName: 'Erweiterte Antriebstechnik',
      requiredResearchLevel: 2,
    },

    // ========================================
    // SUBLIGHT ENGINE MODULES (System Travel)
    // ========================================
    {
      name: 'Ion-Triebwerk',
      description: 'Standard Sublicht-Antrieb für System-Navigation',
      category: 'SUBLIGHT_ENGINE',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 3, // Base speed increase
      hyperdriveRating: null,
      tibannaConsumption: 3,
      baseCostCredits: 2000,
      baseCostDurastahl: 150,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 50,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 100,
      baseCostEnergiemodule: 30,
      baseBuildTime: 30,
    },
    {
      name: 'Turbo-Triebwerk',
      description: 'Verbesserter Sublicht-Antrieb für erhöhte Geschwindigkeit',
      category: 'SUBLIGHT_ENGINE',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 5, // Better speed increase
      hyperdriveRating: null,
      tibannaConsumption: 5,
      baseCostCredits: 4000,
      baseCostDurastahl: 250,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 80,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 150,
      baseCostEnergiemodule: 50,
      baseBuildTime: 45,
      requiredResearchName: 'Antriebstechnik',
      requiredResearchLevel: 1,
    },

    // ========================================
    // WEAPONS MODULES (Combat)
    // ========================================
    {
      name: 'Leichter Turbolaser',
      description: 'Standard Energiewaffe für kleinere Schiffe',
      category: 'WEAPONS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 15, // Base damage
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 8,
      baseCostCredits: 3000,
      baseCostDurastahl: 180,
      baseCostKyberKristalle: 20,
      baseCostTibannaGas: 50,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 120,
      baseCostEnergiemodule: 40,
      baseBuildTime: 45,
    },
    {
      name: 'Schwerer Turbolaser',
      description: 'Mächtige Energiewaffe für Großkampfschiffe',
      category: 'WEAPONS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 25, // Higher damage
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 15,
      baseCostCredits: 8000,
      baseCostDurastahl: 400,
      baseCostKyberKristalle: 80,
      baseCostTibannaGas: 120,
      baseCostBeskar: 20,
      baseCostKristallinesSilizium: 250,
      baseCostEnergiemodule: 100,
      baseBuildTime: 90,
      requiredResearchName: 'Waffentechnik',
      requiredResearchLevel: 1,
    },
    {
      name: 'Ionenkanone',
      description: 'Spezialisierte Waffe zur Deaktivierung feindlicher Systeme',
      category: 'WEAPONS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 10, // Lower direct damage, disables systems
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 10,
      baseCostCredits: 5000,
      baseCostDurastahl: 220,
      baseCostKyberKristalle: 40,
      baseCostTibannaGas: 80,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 180,
      baseCostEnergiemodule: 60,
      baseBuildTime: 60,
      requiredResearchName: 'Ionentechnologie',
      requiredResearchLevel: 1,
    },
    {
      name: 'Protonenraketen-System',
      description: 'Raketenwerfer für Flächenschaden und schwere Treffer',
      category: 'WEAPONS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 30, // High burst damage
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 20, // High ammo consumption
      baseCostCredits: 12000,
      baseCostDurastahl: 500,
      baseCostKyberKristalle: 100,
      baseCostTibannaGas: 200,
      baseCostBeskar: 50,
      baseCostKristallinesSilizium: 300,
      baseCostEnergiemodule: 150,
      baseBuildTime: 120,
      requiredResearchName: 'Raketentechnik',
      requiredResearchLevel: 2,
    },

    // ========================================
    // SHIELDS MODULES (Defense)
    // ========================================
    {
      name: 'Standard-Deflektorschild',
      description: 'Grundlegender Energieschild zum Schutz vor Beschuss',
      category: 'SHIELDS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 20, // Base shield strength
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 5,
      baseCostCredits: 3500,
      baseCostDurastahl: 200,
      baseCostKyberKristalle: 30,
      baseCostTibannaGas: 60,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 150,
      baseCostEnergiemodule: 80,
      baseBuildTime: 50,
    },
    {
      name: 'Verstärkter Deflektorschild',
      description: 'Verbesserter Schild mit höherer Energiekapazität',
      category: 'SHIELDS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 35, // Higher shield strength
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 8,
      baseCostCredits: 7000,
      baseCostDurastahl: 350,
      baseCostKyberKristalle: 70,
      baseCostTibannaGas: 120,
      baseCostBeskar: 10,
      baseCostKristallinesSilizium: 280,
      baseCostEnergiemodule: 150,
      baseBuildTime: 80,
      requiredResearchName: 'Schildtechnik',
      requiredResearchLevel: 1,
    },
    {
      name: 'Militär-Deflektorschild',
      description: 'Hochleistungsschild für Kampfschiffe',
      category: 'SHIELDS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 50, // Military-grade protection
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 3,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 12,
      baseCostCredits: 15000,
      baseCostDurastahl: 600,
      baseCostKyberKristalle: 150,
      baseCostTibannaGas: 250,
      baseCostBeskar: 30,
      baseCostKristallinesSilizium: 450,
      baseCostEnergiemodule: 300,
      baseBuildTime: 150,
      requiredResearchName: 'Erweiterte Schildtechnik',
      requiredResearchLevel: 2,
    },

    // ========================================
    // SENSORS MODULES (Detection & Targeting)
    // ========================================
    {
      name: 'Standard-Scanner',
      description: 'Grundlegendes Sensorsystem für Navigation und Zielerfassung',
      category: 'SENSORS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 2, // Base sensor range
      baseCargoCapacity: 0,
      baseCrewCapacity: 1,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 2,
      baseCostCredits: 1500,
      baseCostDurastahl: 80,
      baseCostKyberKristalle: 10,
      baseCostTibannaGas: 20,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 120,
      baseCostEnergiemodule: 40,
      baseBuildTime: 25,
    },
    {
      name: 'Militär-Scanner',
      description: 'Verbessertes Sensorsystem für erweiterte Reichweite',
      category: 'SENSORS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 4, // Extended range
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 4,
      baseCostCredits: 4000,
      baseCostDurastahl: 180,
      baseCostKyberKristalle: 30,
      baseCostTibannaGas: 50,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 250,
      baseCostEnergiemodule: 100,
      baseBuildTime: 50,
      requiredResearchName: 'Sensortechnik',
      requiredResearchLevel: 1,
    },
    {
      name: 'Elite-Aufklärer',
      description: 'Hochpräzise Sensoren für strategische Aufklärung',
      category: 'SENSORS',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 6, // Long-range detection
      baseCargoCapacity: 0,
      baseCrewCapacity: 3,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 6,
      baseCostCredits: 9000,
      baseCostDurastahl: 350,
      baseCostKyberKristalle: 80,
      baseCostTibannaGas: 120,
      baseCostBeskar: 20,
      baseCostKristallinesSilizium: 500,
      baseCostEnergiemodule: 200,
      baseBuildTime: 90,
      requiredResearchName: 'Erweiterte Sensortechnik',
      requiredResearchLevel: 2,
    },

    // ========================================
    // CARGO MODULES (Storage)
    // ========================================
    {
      name: 'Standard-Frachtraum',
      description: 'Grundlegender Lagerraum für Güter und Ressourcen',
      category: 'CARGO',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 50, // Base cargo space
      baseCrewCapacity: 0,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 0,
      baseCostCredits: 2000,
      baseCostDurastahl: 300,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 0,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 0,
      baseCostEnergiemodule: 0,
      baseBuildTime: 40,
    },
    {
      name: 'Verstärkter Frachtraum',
      description: 'Erweiterter Lagerraum mit verbesserter Effizienz',
      category: 'CARGO',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 100, // Double capacity
      baseCrewCapacity: 1,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 0,
      baseCostCredits: 5000,
      baseCostDurastahl: 600,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 0,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 50,
      baseCostEnergiemodule: 0,
      baseBuildTime: 80,
      requiredResearchName: 'Lagertechnik',
      requiredResearchLevel: 1,
    },

    // ========================================
    // LIFE_SUPPORT MODULES (Crew Systems)
    // ========================================
    {
      name: 'Standard-Lebenserhaltung',
      description: 'Grundlegende Atmosphärenregulierung und Crew-Unterstützung',
      category: 'LIFE_SUPPORT',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 5, // Base crew support
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 3,
      baseCostCredits: 2500,
      baseCostDurastahl: 150,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 30,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 100,
      baseCostEnergiemodule: 50,
      baseBuildTime: 60,
    },
    {
      name: 'Erweiterte Lebenserhaltung',
      description: 'Verbessertes System für größere Besatzungen',
      category: 'LIFE_SUPPORT',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 10, // Support more crew
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 5,
      baseCostCredits: 6000,
      baseCostDurastahl: 300,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 80,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 200,
      baseCostEnergiemodule: 120,
      baseBuildTime: 120,
      requiredResearchName: 'Lebenserhaltungssysteme',
      requiredResearchLevel: 1,
    },

    // ========================================
    // HULL MODULES (Structural Integrity)
    // ========================================
    {
      name: 'Durastahl-Panzerung',
      description: 'Standard-Rumpfpanzerung aus Durastahl',
      category: 'HULL',
      maxLevel: 10,
      baseHullPoints: 25, // Base hull strength
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 0,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 0,
      baseCostCredits: 3000,
      baseCostDurastahl: 500,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 0,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 0,
      baseCostEnergiemodule: 0,
      baseBuildTime: 70,
    },
    {
      name: 'Verstärkte Panzerung',
      description: 'Verbesserte Rumpfpanzerung mit erhöhtem Schutz',
      category: 'HULL',
      maxLevel: 10,
      baseHullPoints: 40, // Better protection
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 0,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 0,
      baseCostCredits: 6000,
      baseCostDurastahl: 800,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 0,
      baseCostBeskar: 20,
      baseCostKristallinesSilizium: 50,
      baseCostEnergiemodule: 0,
      baseBuildTime: 120,
      requiredResearchName: 'Panzerungstechnik',
      requiredResearchLevel: 1,
    },
    {
      name: 'Beskar-Legierung',
      description: 'Elite-Panzerung aus dem legendären Beskar-Metall',
      category: 'HULL',
      maxLevel: 10,
      baseHullPoints: 60, // Premium protection
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 0,
      baseCargoCapacity: 0,
      baseCrewCapacity: 0,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 0,
      baseCostCredits: 15000,
      baseCostDurastahl: 500,
      baseCostKyberKristalle: 0,
      baseCostTibannaGas: 0,
      baseCostBeskar: 200, // Requires rare Beskar
      baseCostKristallinesSilizium: 100,
      baseCostEnergiemodule: 0,
      baseBuildTime: 200,
      requiredResearchName: 'Erweiterte Metallurgie',
      requiredResearchLevel: 3,
    },

    // ========================================
    // TRACTOR_BEAM MODULES (Utility)
    // ========================================
    {
      name: 'Standard-Traktorstrahl',
      description: 'Gravitationsprojektor zum Erfassen von Objekten',
      category: 'TRACTOR_BEAM',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 1, // Can detect/grab at close range
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 10,
      baseCostCredits: 8000,
      baseCostDurastahl: 300,
      baseCostKyberKristalle: 50,
      baseCostTibannaGas: 100,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 400,
      baseCostEnergiemodule: 200,
      baseBuildTime: 100,
      requiredResearchName: 'Gravitationstechnik',
      requiredResearchLevel: 2,
    },

    // ========================================
    // SPECIAL MODULES (Unique Abilities)
    // ========================================
    {
      name: 'Tarnvorrichtung',
      description: 'Experimentelle Technologie zur optischen Tarnung',
      category: 'SPECIAL',
      maxLevel: 5, // Limited levels due to experimental nature
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: -2, // Reduces own sensor signature
      baseCargoCapacity: 0,
      baseCrewCapacity: 3,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 20, // Very high energy cost
      baseCostCredits: 50000,
      baseCostDurastahl: 1000,
      baseCostKyberKristalle: 500, // Requires rare crystals
      baseCostTibannaGas: 300,
      baseCostBeskar: 100,
      baseCostKristallinesSilizium: 800,
      baseCostEnergiemodule: 500,
      baseBuildTime: 500, // Very long build time
      requiredResearchName: 'Tarnfeldtechnik',
      requiredResearchLevel: 3,
    },
    {
      name: 'Comm-Array',
      description: 'Erweiterte Kommunikationsanlage für Flottenkoordination',
      category: 'SPECIAL',
      maxLevel: 10,
      baseHullPoints: 0,
      baseDamage: 0,
      baseShieldStrength: 0,
      baseSensorRange: 3, // Helps with coordination
      baseCargoCapacity: 0,
      baseCrewCapacity: 2,
      baseSpeed: 0,
      hyperdriveRating: null,
      tibannaConsumption: 5,
      baseCostCredits: 10000,
      baseCostDurastahl: 200,
      baseCostKyberKristalle: 100,
      baseCostTibannaGas: 50,
      baseCostBeskar: 0,
      baseCostKristallinesSilizium: 600,
      baseCostEnergiemodule: 300,
      baseBuildTime: 150,
      requiredResearchName: 'Kommunikationstechnik',
      requiredResearchLevel: 2,
    },
  ];

  // First, let's check if research types exist and get their IDs
  const researchTypes = await prisma.researchType.findMany({
    select: { id: true, name: true }
  });

  const researchMap = new Map(researchTypes.map(r => [r.name, r.id]));

  console.log(`Found ${researchTypes.length} research types in database`);

  // Create module types
  for (const moduleData of moduleTypes) {
    const { requiredResearchName, requiredResearchLevel, ...moduleTypeData } = moduleData;

    let requiredResearchId: number | undefined = undefined;
    let finalRequiredResearchLevel = 1;

    if (requiredResearchName) {
      requiredResearchId = researchMap.get(requiredResearchName);
      if (requiredResearchId && requiredResearchLevel) {
        finalRequiredResearchLevel = requiredResearchLevel;
      }

      // If research not found, module will be available without research requirement
      if (!requiredResearchId) {
        console.log(`⚠️  Research '${requiredResearchName}' not found for module '${moduleData.name}' - making it available without research`);
      }
    }

    await prisma.moduleType.create({
      data: {
        ...moduleTypeData,
        requiredResearchId,
        requiredResearchLevel: finalRequiredResearchLevel,
      },
    });

    console.log(`  ✓ Created: ${moduleData.name} (${moduleData.category})`);
  }

  console.log(`\n✅ Created ${moduleTypes.length} module types with STU-style progression!\n`);
}

async function main() {
  try {
    await seedModuleTypes();
  } catch (error) {
    console.error('❌ Error seeding module types:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();