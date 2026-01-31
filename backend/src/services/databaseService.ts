import prisma from '../lib/prisma';
import logger from '../lib/logger';

export const databaseService = {
  /**
   * Siedlerliste - Top Spieler sortiert nach Forschungsfortschritt (abgeschlossene Forschungen)
   * Returns list of players with completed research count, username, and faction
   */
  async getPlayersRanking() {
    try {
      // Get players with their completed research count
      const playersWithResearch = await prisma.player.findMany({
        include: {
          user: {
            select: { username: true }
          },
          faction: {
            select: { name: true }
          },
          research: {
            where: {
              completedAt: { not: null }
            },
            select: {
              id: true,
              researchType: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          planets: {
            select: { id: true }
          }
        }
      });

      // Transform and sort by research progress
      const rankingData = playersWithResearch
        .map(player => ({
          id: player.id,
          username: player.user.username,
          factionName: player.faction.name,
          completedResearchCount: player.research.length,
          planetCount: player.planets.length,
          researchCategories: {
            MILITARY: player.research.filter(r => r.researchType.category === 'MILITARY').length,
            ECONOMICS: player.research.filter(r => r.researchType.category === 'ECONOMICS').length,
            SCIENCE: player.research.filter(r => r.researchType.category === 'SCIENCE').length,
            ENERGY: player.research.filter(r => r.researchType.category === 'ENERGY').length
          }
        }))
        .sort((a, b) => b.completedResearchCount - a.completedResearchCount)
        .slice(0, 50); // Top 50 players

      logger.info('Database: Generated players ranking', rankingData.length, 'players');
      return rankingData;
    } catch (error) {
      logger.error('Database service - getPlayersRanking error:', error);
      throw error;
    }
  },

  /**
   * Sternensysteme Übersicht - All SystemTypes with distribution statistics
   */
  async getSystemsOverview() {
    try {
      // Get system type distribution
      const systemTypeStats = await prisma.system.groupBy({
        by: ['systemType'],
        _count: {
          id: true
        }
      });

      // Get binary vs single star statistics
      const binaryStats = await prisma.system.groupBy({
        by: ['isBinary'],
        _count: {
          id: true
        }
      });

      // Total systems count
      const totalSystems = await prisma.system.count();

      // Colonized systems (systems with at least one colonized planet)
      const colonizedSystemsCount = await prisma.system.count({
        where: {
          planets: {
            some: {
              playerId: { not: null }
            }
          }
        }
      });

      const systemsData = {
        totalSystems,
        colonizedSystems: colonizedSystemsCount,
        uncolonizedSystems: totalSystems - colonizedSystemsCount,
        systemTypes: systemTypeStats.map(stat => ({
          type: stat.systemType,
          count: stat._count.id,
          isBinary: stat.systemType.startsWith('BIN_'),
          percentage: Math.round((stat._count.id / totalSystems) * 100)
        })).sort((a, b) => b.count - a.count),
        binaryDistribution: {
          single: binaryStats.find(s => !s.isBinary)?._count.id || 0,
          binary: binaryStats.find(s => s.isBinary)?._count.id || 0
        }
      };

      logger.info('Database: Generated systems overview', totalSystems, 'systems');
      return systemsData;
    } catch (error) {
      logger.error('Database service - getSystemsOverview error:', error);
      throw error;
    }
  },

  /**
   * Planetentypen Statistiken - PlanetClass distribution and colonization stats
   */
  async getPlanetsStatistics() {
    try {
      // Planet class distribution
      const planetClassStats = await prisma.planet.groupBy({
        by: ['planetClass', 'celestialType'],
        _count: {
          id: true
        }
      });

      // Get colonized planets by planet class
      const colonizedPlanetsByClass = await prisma.planet.groupBy({
        by: ['planetClass'],
        where: {
          celestialType: 'PLANET',
          playerId: { not: null }
        },
        _count: {
          id: true
        }
      });

      const totalPlanets = await prisma.planet.count({
        where: { celestialType: 'PLANET' }
      });

      const colonizedPlanets = await prisma.planet.count({
        where: {
          celestialType: 'PLANET',
          playerId: { not: null }
        }
      });

      const planetsData = {
        totalPlanets,
        colonizedPlanets,
        uncolonizedPlanets: totalPlanets - colonizedPlanets,
        colonizationRate: Math.round((colonizedPlanets / totalPlanets) * 100),
        planetClasses: planetClassStats
          .filter(stat => stat.celestialType === 'PLANET')
          .map(stat => {
            const colonizedCount = colonizedPlanetsByClass
              .find(c => c.planetClass === stat.planetClass)
              ?._count.id || 0;

            return {
              planetClass: stat.planetClass,
              totalCount: stat._count.id,
              colonizedCount: colonizedCount,
              uncolonizedCount: stat._count.id - colonizedCount,
              percentage: Math.round((stat._count.id / totalPlanets) * 100)
            };
          })
          .sort((a, b) => b.totalCount - a.totalCount),
        celestialTypes: planetClassStats
          .filter(stat => stat.celestialType !== 'PLANET')
          .map(stat => ({
            type: stat.celestialType,
            count: stat._count.id
          }))
      };

      logger.info('Database: Generated planets statistics', totalPlanets, 'planets');
      return planetsData;
    } catch (error) {
      logger.error('Database service - getPlanetsStatistics error:', error);
      throw error;
    }
  },

  /**
   * Gebäude-Übersicht - All BuildingTypes with costs, production, and usage stats
   */
  async getBuildingsOverview() {
    try {
      const buildingTypes = await prisma.buildingType.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      // Get building usage statistics
      const buildingUsageStats = await prisma.building.groupBy({
        by: ['buildingTypeId'],
        _count: {
          id: true
        },
        where: {
          completedAt: { not: null }
        }
      });

      // Transform all building types with stats first
      const buildingsWithStats = buildingTypes.map(buildingType => {
          const usageCount = buildingUsageStats
            .find(stat => stat.buildingTypeId === buildingType.id)?._count.id || 0;

          return {
            id: buildingType.id,
            name: buildingType.name,
            description: buildingType.description,
            category: buildingType.category,
            allowedFieldTypes: buildingType.allowedFieldTypes.split(',').map(t => t.trim()),
            costs: {
              credits: buildingType.buildCostCredits,
              durastahl: buildingType.buildCostDurastahl,
              kristallinesSilizium: buildingType.buildCostKristallinesSilizium,
              tibannaGas: buildingType.buildCostTibannaGas,
              energiemodule: buildingType.buildCostEnergiemodule,
              kyberKristalle: buildingType.buildCostKyberKristalle,
              bacta: buildingType.buildCostBacta,
              beskar: buildingType.buildCostBeskar,
              energy: buildingType.energyCostToBuild
            },
            production: {
              credits: buildingType.creditProduction,
              durastahl: buildingType.durastahlProduction,
              kristallinesSilizium: buildingType.kristallinesSiliziumProduction,
              tibannaGas: buildingType.tibannaGasProduction,
              energiemodule: buildingType.energiemoduleProduction,
              kyberKristalle: buildingType.kyberKristalleProduction,
              bacta: buildingType.bactaProduction,
              beskar: buildingType.beskarProduction,
              energy: buildingType.energyProduction
            },
            buildTime: buildingType.buildTime,
            energyCostPerTick: buildingType.energyCostPerTick,
            storageBonus: buildingType.storageBonus,
            timesBuilt: usageCount
          };
        });

      const buildingsData = {
        categories: {
          RESOURCE: buildingsWithStats.filter(bt => bt.category === 'RESOURCE'),
          PRODUCTION: buildingsWithStats.filter(bt => bt.category === 'PRODUCTION'),
          DEFENSE: buildingsWithStats.filter(bt => bt.category === 'DEFENSE'),
          RESEARCH: buildingsWithStats.filter(bt => bt.category === 'RESEARCH'),
          STORAGE: buildingsWithStats.filter(bt => bt.category === 'STORAGE'),
          ORBITAL: buildingsWithStats.filter(bt => bt.category === 'ORBITAL')
        },
        buildingsWithStats: buildingsWithStats
      };

      logger.info('Database: Generated buildings overview', buildingTypes.length, 'building types');
      return buildingsData;
    } catch (error) {
      logger.error('Database service - getBuildingsOverview error:', error);
      throw error;
    }
  },

  /**
   * Forschungs-Übersicht - Complete research tree with prerequisites and unlocks
   */
  async getResearchOverview() {
    try {
      const researchTypes = await prisma.researchType.findMany({
        include: {
          faction: {
            select: { name: true }
          },
          prerequisite: {
            select: { id: true, name: true }
          },
          dependents: {
            select: { id: true, name: true }
          }
        },
        orderBy: [
          { category: 'asc' },
          { researchLevel: 'asc' },
          { name: 'asc' }
        ]
      });

      // Get research completion statistics
      const researchCompletionStats = await prisma.playerResearch.groupBy({
        by: ['researchTypeId'],
        _count: {
          id: true
        },
        where: {
          completedAt: { not: null }
        }
      });

      const researchData = {
        categories: {
          MILITARY: researchTypes.filter(rt => rt.category === 'MILITARY'),
          ECONOMICS: researchTypes.filter(rt => rt.category === 'ECONOMICS'),
          SCIENCE: researchTypes.filter(rt => rt.category === 'SCIENCE'),
          ENERGY: researchTypes.filter(rt => rt.category === 'ENERGY')
        },
        levels: {
          level0: researchTypes.filter(rt => rt.researchLevel === 0),
          level1: researchTypes.filter(rt => rt.researchLevel === 1),
          level2: researchTypes.filter(rt => rt.researchLevel === 2),
          level3: researchTypes.filter(rt => rt.researchLevel === 3)
        },
        researchWithStats: researchTypes.map(researchType => {
          const completionCount = researchCompletionStats
            .find(stat => stat.researchTypeId === researchType.id)?._count.id || 0;

          return {
            id: researchType.id,
            name: researchType.name,
            description: researchType.description,
            category: researchType.category,
            researchLevel: researchType.researchLevel,
            factionName: researchType.faction?.name || 'Universal',
            isUniversal: !researchType.factionId,
            costs: {
              researchPoints: researchType.researchPointCost,
              credits: researchType.requiredCreditsTotal,
              durastahl: researchType.requiredDurastahlTotal,
              kristallinesSilizium: researchType.requiredKristallinesSiliziumTotal,
              energy: researchType.requiredEnergyTotal
            },
            requirements: {
              labCount: researchType.requiredLabCount,
              prerequisite: researchType.prerequisite
            },
            unlocks: {
              building: researchType.unlocksBuilding,
              ship: researchType.unlocksShip,
              bonusType: researchType.bonusType,
              bonusValue: researchType.bonusValue
            },
            dependents: researchType.dependents,
            completedBy: completionCount
          };
        })
      };

      logger.info('Database: Generated research overview', researchTypes.length, 'research types');
      return researchData;
    } catch (error) {
      logger.error('Database service - getResearchOverview error:', error);
      throw error;
    }
  },

  /**
   * Schiffs-Statistiken - Ship statistics without revealing player ownership
   */
  async getShipsStatistics() {
    try {
      // Legacy ship statistics (ShipType-based) - removed after migration
      const legacyShipStats: Array<{ shipTypeId: number; _count: { id: number } }> = [];

      // Blueprint ship statistics (Blueprint-based)
      const blueprintShipStats = await prisma.ship.groupBy({
        by: ['blueprintId'],
        _count: {
          id: true
        },
        where: {
          blueprintId: { not: null }
        }
      });

      // Get ship types for legacy ships - removed after migration
      const shipTypes: Array<{ id: number; name: string; shipClass: string }> = [];

      // Get public blueprints for blueprint ships
      const publicBlueprints = await prisma.shipBlueprint.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          name: true,
          shipClass: true,
          totalHullPoints: true,
          totalDamage: true,
          totalSpeed: true
        }
      });

      // Faction distribution (anonymized)
      const factionStats = await prisma.ship.findMany({
        include: {
          player: {
            include: {
              faction: {
                select: { name: true }
              }
            }
          }
        }
      });

      const factionDistribution = factionStats.reduce((acc, ship) => {
        const factionName = ship.player.faction.name;
        acc[factionName] = (acc[factionName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalShips = await prisma.ship.count();

      const shipsData = {
        totalShips,
        factionDistribution,
        legacyShips: {
          count: 0, // No legacy ships after migration
          typeDistribution: []
        },
        blueprintShips: {
          count: blueprintShipStats.reduce((sum, stat) => sum + stat._count.id, 0),
          classDistribution: blueprintShipStats.map(stat => {
            const blueprint = publicBlueprints.find(bp => bp.id === stat.blueprintId);
            return {
              blueprintName: blueprint?.name || 'Private Blueprint',
              shipClass: blueprint?.shipClass || 'Unknown',
              count: stat._count.id,
              isPublic: !!blueprint
            };
          }).sort((a, b) => b.count - a.count)
        },
        shipClassSummary: {} // TODO: Aggregate by ship class across both legacy and blueprint ships
      };

      logger.info('Database: Generated ships statistics', totalShips, 'ships');
      return shipsData;
    } catch (error) {
      logger.error('Database service - getShipsStatistics error:', error);
      throw error;
    }
  }
};

export default databaseService;