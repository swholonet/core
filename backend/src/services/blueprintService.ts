import prisma from '../lib/prisma';
import { ShipClass } from '@prisma/client';

// Building names for shipyard functionality (supports both old and new names)
const SHIPYARD_BUILDING_NAMES = ['Orbitales Raumdock', 'Raumschiffwerft', 'Shipyard'];

import {
  BlueprintStats,
  BlueprintStatsInternal,
  ConstructionCosts,
  CreateBlueprintInput,
  UpdateBlueprintInput,
  ResearchValidationResult,
  MissingResearch,
  AvailableModule,
  BlueprintWithCalculations,
  BlueprintModuleWithType,
  ModuleBaseStats,
  ModuleBaseStatsPublic,
  ModuleBaseCosts,
  CombatRating,
  calculateCombatRating,
  COST_EXPONENT,
  STAT_MULTIPLIER,
  SHIP_CLASS_CONFIG,
} from '../types/blueprint.types';

export class BlueprintService {
  /**
   * Berechnet die INTERNEN Stats eines Moduls bei einem bestimmten Level
   * SERVER-SIDE ONLY - enthaelt geheime Kampfwerte
   */
  calculateModuleStatsInternal(
    moduleType: {
      baseHullPoints: number;
      baseDamage: number;
      baseShieldStrength: number;
      baseSensorRange: number;
      baseCargoCapacity: number;
      baseCrewCapacity: number;
      baseSpeed: number;
      hyperdriveRating: number | null;
      tibannaConsumption: number;
    },
    level: number
  ): ModuleBaseStats {
    const levelMultiplier = 1 + (level - 1) * (STAT_MULTIPLIER - 1);

    return {
      hullPoints: Math.floor(moduleType.baseHullPoints * levelMultiplier),
      damage: Math.floor(moduleType.baseDamage * levelMultiplier),
      shieldStrength: Math.floor(moduleType.baseShieldStrength * levelMultiplier),
      sensorRange: Math.floor(moduleType.baseSensorRange * levelMultiplier),
      cargoCapacity: Math.floor(moduleType.baseCargoCapacity * levelMultiplier),
      crewCapacity: Math.floor(moduleType.baseCrewCapacity * levelMultiplier),
      speed: Math.floor(moduleType.baseSpeed * levelMultiplier),
      hyperdriveRating: moduleType.hyperdriveRating
        ? Math.max(0.1, moduleType.hyperdriveRating - (level - 1) * 0.1) // Besser bei höherem Level
        : null,
      tibannaConsumption: Math.floor(moduleType.tibannaConsumption * levelMultiplier),
    };
  }

  /**
   * Berechnet die OEFFENTLICHEN Stats eines Moduls bei einem bestimmten Level
   * SAFE TO SEND TO CLIENT - keine Kampfwerte
   */
  calculateModuleStatsPublic(
    moduleType: {
      baseHullPoints: number;
      baseSensorRange: number;
      baseCargoCapacity: number;
      baseCrewCapacity: number;
      baseSpeed: number;
      hyperdriveRating: number | null;
    },
    level: number
  ): ModuleBaseStatsPublic {
    const levelMultiplier = 1 + (level - 1) * (STAT_MULTIPLIER - 1);

    return {
      hullPoints: Math.floor(moduleType.baseHullPoints * levelMultiplier),
      sensorRange: Math.floor(moduleType.baseSensorRange * levelMultiplier),
      cargoCapacity: Math.floor(moduleType.baseCargoCapacity * levelMultiplier),
      crewCapacity: Math.floor(moduleType.baseCrewCapacity * levelMultiplier),
      speed: Math.floor(moduleType.baseSpeed * levelMultiplier),
      hyperdriveRating: moduleType.hyperdriveRating
        ? Math.max(0.1, moduleType.hyperdriveRating - (level - 1) * 0.1)
        : null,
    };
  }

  /**
   * Berechnet Combat Rating fuer ein Modul (vage Anzeige, safe fuer Client)
   */
  calculateModuleCombatRating(
    moduleType: {
      baseDamage: number;
      baseShieldStrength: number;
    },
    level: number
  ): CombatRating {
    const levelMultiplier = 1 + (level - 1) * (STAT_MULTIPLIER - 1);
    const damage = Math.floor(moduleType.baseDamage * levelMultiplier);
    const shield = Math.floor(moduleType.baseShieldStrength * levelMultiplier);
    return calculateCombatRating(damage, shield);
  }

  /**
   * Berechnet die Kosten eines Moduls bei einem bestimmten Level (exponentielle Kurve)
   */
  calculateModuleCosts(
    moduleType: {
      baseCostCredits: number;
      baseCostDurastahl: number;
      baseCostKyberKristalle: number;
      baseCostTibannaGas: number;
      baseCostBeskar: number;
      baseCostKristallinesSilizium: number;
      baseCostEnergiemodule: number;
      baseBuildTime: number;
    },
    level: number
  ): ModuleBaseCosts {
    const costMultiplier = Math.pow(COST_EXPONENT, level - 1);

    return {
      credits: Math.floor(moduleType.baseCostCredits * costMultiplier),
      durastahl: Math.floor(moduleType.baseCostDurastahl * costMultiplier),
      kyberKristalle: Math.floor(moduleType.baseCostKyberKristalle * costMultiplier),
      tibannaGas: Math.floor(moduleType.baseCostTibannaGas * costMultiplier),
      beskar: Math.floor(moduleType.baseCostBeskar * costMultiplier),
      kristallinesSilizium: Math.floor(moduleType.baseCostKristallinesSilizium * costMultiplier),
      energiemodule: Math.floor(moduleType.baseCostEnergiemodule * costMultiplier),
      buildTime: Math.floor(moduleType.baseBuildTime * costMultiplier),
    };
  }

  /**
   * Berechnet die Gesamt-Stats eines Blueprints basierend auf allen Modulen
   * Gibt PUBLIC stats zurueck (ohne geheime Kampfwerte, aber mit combatRating)
   */
  calculateBlueprintStats(
    modules: Array<{
      level: number;
      moduleType: {
        baseHullPoints: number;
        baseDamage: number;
        baseShieldStrength: number;
        baseSensorRange: number;
        baseCargoCapacity: number;
        baseCrewCapacity: number;
        baseSpeed: number;
        hyperdriveRating: number | null;
        tibannaConsumption: number;
      };
    }>,
    shipClass: ShipClass
  ): BlueprintStats {
    const classConfig = SHIP_CLASS_CONFIG[shipClass];

    // Summiere alle Modul-Stats (intern mit Kampfwerten)
    let totalHullPoints = 0;
    let totalShieldStrength = 0; // SECRET - nur fuer combatRating
    let totalDamage = 0;         // SECRET - nur fuer combatRating
    let totalSpeed = 0;
    let totalSensorRange = 0;
    let totalCargoCapacity = 0;
    let totalCrewRequired = 0;

    let hasHyperdrive = false;
    let bestHyperdriveRating = 10.0; // Hoeher = schlechter

    for (const module of modules) {
      const stats = this.calculateModuleStatsInternal(module.moduleType, module.level);

      totalHullPoints += stats.hullPoints;
      totalShieldStrength += stats.shieldStrength;
      totalDamage += stats.damage;
      totalSpeed += stats.speed;
      totalSensorRange += stats.sensorRange;
      totalCargoCapacity += stats.cargoCapacity;
      totalCrewRequired += stats.crewCapacity;

      // Hyperdrive: nimm das beste Rating (niedrigste Zahl)
      if (stats.hyperdriveRating !== null) {
        hasHyperdrive = true;
        if (stats.hyperdriveRating < bestHyperdriveRating) {
          bestHyperdriveRating = stats.hyperdriveRating;
        }
      }
    }

    // Wende Schiffsklassen-Multiplikator an
    totalHullPoints = Math.floor(totalHullPoints * classConfig.baseHullMultiplier);

    // Berechne vages Combat Rating (statt exakte Werte)
    const combatRating = calculateCombatRating(totalDamage, totalShieldStrength);

    // Return PUBLIC stats (ohne damage/shieldStrength)
    return {
      hullPoints: totalHullPoints,
      speed: totalSpeed,
      sensorRange: totalSensorRange,
      cargoCapacity: totalCargoCapacity,
      crewRequired: totalCrewRequired,
      hyperdriveRating: hasHyperdrive ? bestHyperdriveRating : 0,
      combatRating,
    };
  }

  /**
   * Berechnet die INTERNEN Gesamt-Stats eines Blueprints (SERVER-SIDE ONLY)
   * Fuer Kampfberechnungen - enthaelt geheime Werte
   */
  calculateBlueprintStatsInternal(
    modules: Array<{
      level: number;
      moduleType: {
        baseHullPoints: number;
        baseDamage: number;
        baseShieldStrength: number;
        baseSensorRange: number;
        baseCargoCapacity: number;
        baseCrewCapacity: number;
        baseSpeed: number;
        hyperdriveRating: number | null;
        tibannaConsumption: number;
      };
    }>,
    shipClass: ShipClass
  ): BlueprintStatsInternal {
    const classConfig = SHIP_CLASS_CONFIG[shipClass];

    let totalStats: BlueprintStatsInternal = {
      hullPoints: 0,
      shieldStrength: 0,
      damage: 0,
      speed: 0,
      sensorRange: 0,
      cargoCapacity: 0,
      crewRequired: 0,
      hyperdriveRating: 1.0,
    };

    let hasHyperdrive = false;
    let bestHyperdriveRating = 10.0;

    for (const module of modules) {
      const stats = this.calculateModuleStatsInternal(module.moduleType, module.level);

      totalStats.hullPoints += stats.hullPoints;
      totalStats.shieldStrength += stats.shieldStrength;
      totalStats.damage += stats.damage;
      totalStats.speed += stats.speed;
      totalStats.sensorRange += stats.sensorRange;
      totalStats.cargoCapacity += stats.cargoCapacity;
      totalStats.crewRequired += stats.crewCapacity;

      if (stats.hyperdriveRating !== null) {
        hasHyperdrive = true;
        if (stats.hyperdriveRating < bestHyperdriveRating) {
          bestHyperdriveRating = stats.hyperdriveRating;
        }
      }
    }

    totalStats.hullPoints = Math.floor(totalStats.hullPoints * classConfig.baseHullMultiplier);
    totalStats.hyperdriveRating = hasHyperdrive ? bestHyperdriveRating : 0;

    return totalStats;
  }

  /**
   * Berechnet die Gesamt-Konstruktionskosten eines Blueprints
   */
  calculateConstructionCosts(
    modules: Array<{
      level: number;
      moduleType: {
        baseCostCredits: number;
        baseCostDurastahl: number;
        baseCostKyberKristalle: number;
        baseCostTibannaGas: number;
        baseCostBeskar: number;
        baseCostKristallinesSilizium: number;
        baseCostEnergiemodule: number;
        baseBuildTime: number;
      };
    }>,
    shipClass: ShipClass
  ): ConstructionCosts {
    const classConfig = SHIP_CLASS_CONFIG[shipClass];

    let totalCosts: ConstructionCosts = {
      credits: 0,
      durastahl: 0,
      kyberKristalle: 0,
      tibannaGas: 0,
      beskar: 0,
      kristallinesSilizium: 0,
      energiemodule: 0,
      buildTimeMinutes: 0,
    };

    for (const module of modules) {
      const costs = this.calculateModuleCosts(module.moduleType, module.level);

      totalCosts.credits += costs.credits;
      totalCosts.durastahl += costs.durastahl;
      totalCosts.kyberKristalle += costs.kyberKristalle;
      totalCosts.tibannaGas += costs.tibannaGas;
      totalCosts.beskar += costs.beskar;
      totalCosts.kristallinesSilizium += costs.kristallinesSilizium;
      totalCosts.energiemodule += costs.energiemodule;
      totalCosts.buildTimeMinutes += costs.buildTime;
    }

    // Wende Schiffsklassen-Kosten-Multiplikator an
    totalCosts.credits = Math.floor(totalCosts.credits * classConfig.baseCostMultiplier);
    totalCosts.durastahl = Math.floor(totalCosts.durastahl * classConfig.baseCostMultiplier);
    totalCosts.kyberKristalle = Math.floor(totalCosts.kyberKristalle * classConfig.baseCostMultiplier);
    totalCosts.tibannaGas = Math.floor(totalCosts.tibannaGas * classConfig.baseCostMultiplier);
    totalCosts.beskar = Math.floor(totalCosts.beskar * classConfig.baseCostMultiplier);
    totalCosts.kristallinesSilizium = Math.floor(totalCosts.kristallinesSilizium * classConfig.baseCostMultiplier);
    totalCosts.energiemodule = Math.floor(totalCosts.energiemodule * classConfig.baseCostMultiplier);
    totalCosts.buildTimeMinutes = Math.floor(totalCosts.buildTimeMinutes * classConfig.baseCostMultiplier);

    return totalCosts;
  }

  /**
   * Validiert ob der Spieler das nötige Research-Level für alle Module im Blueprint hat
   */
  async validateBlueprintResearch(
    playerId: number,
    modules: Array<{
      level: number;
      moduleTypeId: number;
      moduleType: {
        id: number;
        name: string;
        requiredResearchId: number | null;
        requiredResearchLevel: number;
        maxLevel: number;
      };
    }>
  ): Promise<ResearchValidationResult> {
    const missingResearch: MissingResearch[] = [];

    // Hole alle abgeschlossenen Forschungen des Spielers
    const playerResearch = await prisma.playerResearch.findMany({
      where: {
        playerId,
        completedAt: { not: null },
      },
      include: {
        researchType: true,
      },
    });

    const completedResearchMap = new Map<number, { level: number; name: string }>();
    for (const pr of playerResearch) {
      completedResearchMap.set(pr.researchTypeId, {
        level: pr.researchType.researchLevel,
        name: pr.researchType.name,
      });
    }

    for (const module of modules) {
      // Prüfe ob das Modul freigeschaltet ist
      if (module.moduleType.requiredResearchId) {
        const research = completedResearchMap.get(module.moduleType.requiredResearchId);

        if (!research) {
          // Forschung nicht abgeschlossen
          const requiredResearch = await prisma.researchType.findUnique({
            where: { id: module.moduleType.requiredResearchId },
          });

          missingResearch.push({
            moduleTypeId: module.moduleTypeId,
            moduleName: module.moduleType.name,
            requiredResearchId: module.moduleType.requiredResearchId,
            requiredResearchName: requiredResearch?.name || 'Unbekannt',
            requiredLevel: module.moduleType.requiredResearchLevel,
            playerLevel: 0,
          });
        } else if (research.level < module.moduleType.requiredResearchLevel) {
          // Forschungs-Level zu niedrig
          missingResearch.push({
            moduleTypeId: module.moduleTypeId,
            moduleName: module.moduleType.name,
            requiredResearchId: module.moduleType.requiredResearchId,
            requiredResearchName: research.name,
            requiredLevel: module.moduleType.requiredResearchLevel,
            playerLevel: research.level,
          });
        }
      }

      // Prüfe ob das gewählte Level nicht über dem maxLevel liegt
      if (module.level > module.moduleType.maxLevel) {
        // Dieser Fall sollte nicht vorkommen, aber wir prüfen es trotzdem
        missingResearch.push({
          moduleTypeId: module.moduleTypeId,
          moduleName: module.moduleType.name,
          requiredResearchId: 0,
          requiredResearchName: 'Max Level überschritten',
          requiredLevel: module.moduleType.maxLevel,
          playerLevel: module.level,
        });
      }
    }

    return {
      isValid: missingResearch.length === 0,
      missingResearch,
    };
  }

  /**
   * Holt alle verfügbaren Module für einen Spieler (basierend auf Research)
   */
  async getAvailableModules(playerId: number): Promise<AvailableModule[]> {
    // Hole alle Module
    const allModules = await prisma.moduleType.findMany({
      include: {
        requiredResearch: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Hole abgeschlossene Forschungen
    const playerResearch = await prisma.playerResearch.findMany({
      where: {
        playerId,
        completedAt: { not: null },
      },
      include: {
        researchType: true,
      },
    });

    const completedResearchIds = new Set(playerResearch.map((pr) => pr.researchTypeId));

    return allModules.map((module) => {
      const isUnlocked = !module.requiredResearchId || completedResearchIds.has(module.requiredResearchId);

      // Calculate combat rating from secret values (vage Anzeige)
      const combatRating = calculateCombatRating(module.baseDamage, module.baseShieldStrength);

      return {
        id: module.id,
        name: module.name,
        description: module.description,
        category: module.category,
        maxLevel: module.maxLevel,
        isUnlocked,
        unlockedLevel: isUnlocked ? module.maxLevel : 0,
        requiredResearchName: module.requiredResearch?.name,
        // PUBLIC stats only - NO damage, shieldStrength, tibannaConsumption
        baseStats: {
          hullPoints: module.baseHullPoints,
          sensorRange: module.baseSensorRange,
          cargoCapacity: module.baseCargoCapacity,
          crewCapacity: module.baseCrewCapacity,
          speed: module.baseSpeed,
          hyperdriveRating: module.hyperdriveRating,
        },
        baseCosts: {
          credits: module.baseCostCredits,
          durastahl: module.baseCostDurastahl,
          kyberKristalle: module.baseCostKyberKristalle,
          tibannaGas: module.baseCostTibannaGas,
          beskar: module.baseCostBeskar,
          kristallinesSilizium: module.baseCostKristallinesSilizium,
          energiemodule: module.baseCostEnergiemodule,
          buildTime: module.baseBuildTime,
        },
        // Vage Kampfstaerke-Anzeige (statt exakte Werte)
        combatRating,
      };
    });
  }

  /**
   * Erstellt einen neuen Blueprint
   */
  async createBlueprint(playerId: number, data: CreateBlueprintInput): Promise<BlueprintWithCalculations> {
    const classConfig = SHIP_CLASS_CONFIG[data.shipClass];

    // Validiere Slot-Anzahl
    if (data.modules.length > classConfig.maxSlots) {
      throw new Error(
        `Schiffsklasse ${data.shipClass} erlaubt maximal ${classConfig.maxSlots} Module, aber ${data.modules.length} wurden angegeben.`
      );
    }

    // Validiere Slot-Positionen
    const slotPositions = new Set(data.modules.map((m) => m.slotPosition));
    if (slotPositions.size !== data.modules.length) {
      throw new Error('Doppelte Slot-Positionen sind nicht erlaubt.');
    }

    for (const pos of slotPositions) {
      if (pos < 1 || pos > classConfig.maxSlots) {
        throw new Error(`Slot-Position ${pos} ist ungültig. Erlaubt: 1-${classConfig.maxSlots}`);
      }
    }

    // Hole alle benötigten ModuleTypes
    const moduleTypeIds = data.modules.map((m) => m.moduleTypeId);
    const moduleTypes = await prisma.moduleType.findMany({
      where: { id: { in: moduleTypeIds } },
    });

    if (moduleTypes.length !== moduleTypeIds.length) {
      throw new Error('Ein oder mehrere Module wurden nicht gefunden.');
    }

    const moduleTypeMap = new Map(moduleTypes.map((mt) => [mt.id, mt]));

    // Baue Module mit Types für Berechnungen
    const modulesWithTypes = data.modules.map((m) => ({
      level: m.level,
      moduleTypeId: m.moduleTypeId,
      moduleType: moduleTypeMap.get(m.moduleTypeId)!,
    }));

    // Validiere Research
    const researchValidation = await this.validateBlueprintResearch(playerId, modulesWithTypes);
    if (!researchValidation.isValid) {
      const missing = researchValidation.missingResearch
        .map((mr) => `${mr.moduleName}: benötigt ${mr.requiredResearchName}`)
        .join(', ');
      throw new Error(`Fehlende Forschung: ${missing}`);
    }

    // Berechne Stats und Kosten (internal fuer DB, public fuer Response)
    const statsPublic = this.calculateBlueprintStats(modulesWithTypes, data.shipClass);
    const statsInternal = this.calculateBlueprintStatsInternal(modulesWithTypes, data.shipClass);
    const costs = this.calculateConstructionCosts(modulesWithTypes, data.shipClass);

    // Erstelle Blueprint mit Modulen (speichere ALLE Stats intern)
    const blueprint = await prisma.shipBlueprint.create({
      data: {
        playerId,
        name: data.name,
        shipClass: data.shipClass,
        description: data.description,
        isPublic: data.isPublic ?? false,
        // Gecachte Stats (inkl. geheime fuer Kampfberechnungen)
        totalHullPoints: statsInternal.hullPoints,
        totalShieldStrength: statsInternal.shieldStrength,
        totalDamage: statsInternal.damage,
        totalSpeed: statsInternal.speed,
        totalSensorRange: statsInternal.sensorRange,
        totalCargoCapacity: statsInternal.cargoCapacity,
        totalCrewRequired: statsInternal.crewRequired,
        hyperdriveRating: statsInternal.hyperdriveRating,
        // Gecachte Kosten
        totalCostCredits: costs.credits,
        totalCostDurastahl: costs.durastahl,
        totalCostKyberKristalle: costs.kyberKristalle,
        totalCostTibannaGas: costs.tibannaGas,
        totalCostBeskar: costs.beskar,
        totalCostKristallinesSilizium: costs.kristallinesSilizium,
        totalCostEnergiemodule: costs.energiemodule,
        totalBuildTime: costs.buildTimeMinutes,
        // Module
        modules: {
          create: data.modules.map((m) => ({
            moduleTypeId: m.moduleTypeId,
            level: m.level,
            slotPosition: m.slotPosition,
          })),
        },
      },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
    });

    return this.formatBlueprintResponse(blueprint, statsPublic, costs, researchValidation);
  }

  /**
   * Aktualisiert einen bestehenden Blueprint
   */
  async updateBlueprint(
    playerId: number,
    blueprintId: number,
    data: UpdateBlueprintInput
  ): Promise<BlueprintWithCalculations> {
    // Prüfe Besitz
    const existing = await prisma.shipBlueprint.findFirst({
      where: { id: blueprintId, playerId },
    });

    if (!existing) {
      throw new Error('Blueprint nicht gefunden oder keine Berechtigung.');
    }

    // Wenn Module aktualisiert werden, führe alle Validierungen durch
    if (data.modules) {
      const classConfig = SHIP_CLASS_CONFIG[existing.shipClass];

      // Validierungen wie bei createBlueprint...
      if (data.modules.length > classConfig.maxSlots) {
        throw new Error(
          `Schiffsklasse ${existing.shipClass} erlaubt maximal ${classConfig.maxSlots} Module.`
        );
      }

      // Hole ModuleTypes
      const moduleTypeIds = data.modules.map((m) => m.moduleTypeId);
      const moduleTypes = await prisma.moduleType.findMany({
        where: { id: { in: moduleTypeIds } },
      });

      const moduleTypeMap = new Map(moduleTypes.map((mt) => [mt.id, mt]));
      const modulesWithTypes = data.modules.map((m) => ({
        level: m.level,
        moduleTypeId: m.moduleTypeId,
        moduleType: moduleTypeMap.get(m.moduleTypeId)!,
      }));

      // Research-Validierung
      const researchValidation = await this.validateBlueprintResearch(playerId, modulesWithTypes);
      if (!researchValidation.isValid) {
        const missing = researchValidation.missingResearch
          .map((mr) => `${mr.moduleName}: benötigt ${mr.requiredResearchName}`)
          .join(', ');
        throw new Error(`Fehlende Forschung: ${missing}`);
      }

      // Berechne neue Stats und Kosten (internal fuer DB, public fuer Response)
      const statsPublic = this.calculateBlueprintStats(modulesWithTypes, existing.shipClass);
      const statsInternal = this.calculateBlueprintStatsInternal(modulesWithTypes, existing.shipClass);
      const costs = this.calculateConstructionCosts(modulesWithTypes, existing.shipClass);

      // Loesche alte Module und erstelle neue
      await prisma.blueprintModule.deleteMany({
        where: { blueprintId },
      });

      const blueprint = await prisma.shipBlueprint.update({
        where: { id: blueprintId },
        data: {
          name: data.name ?? existing.name,
          description: data.description ?? existing.description,
          isPublic: data.isPublic ?? existing.isPublic,
          // Gecachte Stats (inkl. geheime fuer Kampfberechnungen)
          totalHullPoints: statsInternal.hullPoints,
          totalShieldStrength: statsInternal.shieldStrength,
          totalDamage: statsInternal.damage,
          totalSpeed: statsInternal.speed,
          totalSensorRange: statsInternal.sensorRange,
          totalCargoCapacity: statsInternal.cargoCapacity,
          totalCrewRequired: statsInternal.crewRequired,
          hyperdriveRating: statsInternal.hyperdriveRating,
          // Gecachte Kosten
          totalCostCredits: costs.credits,
          totalCostDurastahl: costs.durastahl,
          totalCostKyberKristalle: costs.kyberKristalle,
          totalCostTibannaGas: costs.tibannaGas,
          totalCostBeskar: costs.beskar,
          totalCostKristallinesSilizium: costs.kristallinesSilizium,
          totalCostEnergiemodule: costs.energiemodule,
          totalBuildTime: costs.buildTimeMinutes,
          // Neue Module
          modules: {
            create: data.modules.map((m) => ({
              moduleTypeId: m.moduleTypeId,
              level: m.level,
              slotPosition: m.slotPosition,
            })),
          },
        },
        include: {
          modules: {
            include: {
              moduleType: true,
            },
          },
        },
      });

      return this.formatBlueprintResponse(blueprint, statsPublic, costs, researchValidation);
    }

    // Nur Metadaten aktualisieren
    const blueprint = await prisma.shipBlueprint.update({
      where: { id: blueprintId },
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
      },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
    });

    return this.getBlueprintById(playerId, blueprintId);
  }

  /**
   * Holt einen Blueprint mit allen Berechnungen
   */
  async getBlueprintById(playerId: number, blueprintId: number): Promise<BlueprintWithCalculations> {
    const blueprint = await prisma.shipBlueprint.findFirst({
      where: {
        id: blueprintId,
        OR: [{ playerId }, { isPublic: true }],
      },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
    });

    if (!blueprint) {
      throw new Error('Blueprint nicht gefunden.');
    }

    const modulesWithTypes = blueprint.modules.map((m) => ({
      level: m.level,
      moduleTypeId: m.moduleTypeId,
      moduleType: m.moduleType,
    }));

    const stats = this.calculateBlueprintStats(modulesWithTypes, blueprint.shipClass);
    const costs = this.calculateConstructionCosts(modulesWithTypes, blueprint.shipClass);
    const researchValidation = await this.validateBlueprintResearch(playerId, modulesWithTypes);

    return this.formatBlueprintResponse(blueprint, stats, costs, researchValidation);
  }

  /**
   * Holt alle Blueprints eines Spielers
   */
  async getPlayerBlueprints(playerId: number): Promise<BlueprintWithCalculations[]> {
    const blueprints = await prisma.shipBlueprint.findMany({
      where: { playerId },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      blueprints.map(async (bp) => {
        const modulesWithTypes = bp.modules.map((m) => ({
          level: m.level,
          moduleTypeId: m.moduleTypeId,
          moduleType: m.moduleType,
        }));

        const stats = this.calculateBlueprintStats(modulesWithTypes, bp.shipClass);
        const costs = this.calculateConstructionCosts(modulesWithTypes, bp.shipClass);
        const researchValidation = await this.validateBlueprintResearch(playerId, modulesWithTypes);

        return this.formatBlueprintResponse(bp, stats, costs, researchValidation);
      })
    );
  }

  /**
   * Löscht einen Blueprint
   */
  async deleteBlueprint(playerId: number, blueprintId: number): Promise<void> {
    const blueprint = await prisma.shipBlueprint.findFirst({
      where: { id: blueprintId, playerId },
    });

    if (!blueprint) {
      throw new Error('Blueprint nicht gefunden oder keine Berechtigung.');
    }

    // Prüfe ob Schiffe auf diesem Blueprint basieren
    const shipCount = await prisma.ship.count({
      where: { blueprintId },
    });

    if (shipCount > 0) {
      throw new Error(
        `Dieser Blueprint kann nicht gelöscht werden, da ${shipCount} Schiffe darauf basieren.`
      );
    }

    await prisma.shipBlueprint.delete({
      where: { id: blueprintId },
    });
  }

  /**
   * Baut ein Schiff aus einem Blueprint
   */
  async buildShipFromBlueprint(
    playerId: number,
    blueprintId: number,
    planetId: number,
    quantity: number = 1
  ): Promise<{ message: string; queueEntry: any }> {
    // Hole Blueprint
    const blueprint = await prisma.shipBlueprint.findFirst({
      where: {
        id: blueprintId,
        OR: [{ playerId }, { isPublic: true }],
      },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
    });

    if (!blueprint) {
      throw new Error('Blueprint nicht gefunden.');
    }

    // Prüfe Planet-Besitz und Werft
    const planet = await prisma.planet.findFirst({
      where: {
        id: planetId,
        playerId,
      },
      include: {
        buildings: {
          where: {
            buildingType: { name: { in: SHIPYARD_BUILDING_NAMES } },
            isActive: true,
          },
        },
      },
    });

    if (!planet) {
      throw new Error('Planet nicht gefunden oder keine Berechtigung.');
    }

    if (planet.buildings.length === 0) {
      throw new Error('Planet hat kein aktives Orbitales Raumdock.');
    }

    // Berechne Gesamtkosten
    const totalCredits = blueprint.totalCostCredits * quantity;
    const totalDurastahl = blueprint.totalCostDurastahl * quantity;
    const totalKyberKristalle = blueprint.totalCostKyberKristalle * quantity;
    const totalTibannaGas = blueprint.totalCostTibannaGas * quantity;
    const totalBeskar = blueprint.totalCostBeskar * quantity;
    const totalKristallinesSilizium = blueprint.totalCostKristallinesSilizium * quantity;
    const totalEnergiemodule = blueprint.totalCostEnergiemodule * quantity;

    // Prüfe Ressourcen
    if (
      planet.credits < totalCredits ||
      planet.durastahl < totalDurastahl ||
      planet.kyberKristalle < totalKyberKristalle ||
      planet.tibannaGas < totalTibannaGas ||
      planet.beskar < totalBeskar ||
      planet.kristallinesSilizium < totalKristallinesSilizium ||
      planet.energiemodule < totalEnergiemodule
    ) {
      throw new Error('Nicht genug Ressourcen.');
    }

    // Ziehe Ressourcen ab
    await prisma.planet.update({
      where: { id: planetId },
      data: {
        credits: { decrement: totalCredits },
        durastahl: { decrement: totalDurastahl },
        kyberKristalle: { decrement: totalKyberKristalle },
        tibannaGas: { decrement: totalTibannaGas },
        beskar: { decrement: totalBeskar },
        kristallinesSilizium: { decrement: totalKristallinesSilizium },
        energiemodule: { decrement: totalEnergiemodule },
      },
    });

    // Erstelle Build-Queue Eintrag
    const queueEntry = await prisma.blueprintBuildQueue.create({
      data: {
        planetId,
        blueprintId,
        quantity,
      },
      include: {
        blueprint: true,
      },
    });

    return {
      message: `${quantity}x ${blueprint.name} werden gebaut (${blueprint.totalBuildTime * quantity} Minuten)`,
      queueEntry,
    };
  }

  /**
   * Formatiert die Blueprint-Antwort (PUBLIC - keine geheimen Kampfwerte)
   */
  private formatBlueprintResponse(
    blueprint: any,
    stats: BlueprintStats,
    costs: ConstructionCosts,
    researchValidation: ResearchValidationResult
  ): BlueprintWithCalculations {
    const modules: BlueprintModuleWithType[] = blueprint.modules.map((m: any) => ({
      id: m.id,
      moduleTypeId: m.moduleTypeId,
      level: m.level,
      slotPosition: m.slotPosition,
      moduleType: {
        id: m.moduleType.id,
        name: m.moduleType.name,
        description: m.moduleType.description,
        category: m.moduleType.category,
        maxLevel: m.moduleType.maxLevel,
        hyperdriveRating: m.moduleType.hyperdriveRating,
      },
      // PUBLIC stats only (keine damage/shieldStrength)
      calculatedStats: this.calculateModuleStatsPublic(m.moduleType, m.level),
      calculatedCosts: this.calculateModuleCosts(m.moduleType, m.level),
      // Vage Kampfstaerke-Anzeige
      combatRating: this.calculateModuleCombatRating(m.moduleType, m.level),
    }));

    return {
      id: blueprint.id,
      playerId: blueprint.playerId,
      name: blueprint.name,
      shipClass: blueprint.shipClass,
      description: blueprint.description,
      isPublic: blueprint.isPublic,
      createdAt: blueprint.createdAt,
      updatedAt: blueprint.updatedAt,
      modules,
      stats,
      costs,
      researchValidation,
    };
  }
}

export const blueprintService = new BlueprintService();
