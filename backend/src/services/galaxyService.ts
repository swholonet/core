import prisma from '../lib/prisma';
import { PlanetClass, SystemType } from '@prisma/client';
import {
  isPositionSafeForPlanet,
  calculateStarAreaSize,
  getStarExclusionZone
} from '../utils/starAreaCalculation';
import { PerlinNoise } from '../utils/perlinNoise';
import { SeededRNG } from '../utils/seededRNG';

export class GalaxyService {
  // STU-Style Galaxy: 36 Sektoren (6x6), jeder Sektor hat 20x20 Felder
  // Gesamte Galaxie: 120x120 Felder

  /**
   * Generate a weighted random STU system type
   * Uses all systemtypes with realistic distribution:
   * - 50% häufig: 1049-1060 (mittlere Sterne)
   * - 35% sehr viele: 1001-1048 (Binärsysteme)
   * - 10% sehr wenig: 1061-1066 (mittlere Sterne)
   * - 4% vereinzelt: 1067-1070
   * - 1% sehr selten: 1071-1075 (jeweils nur 1-2 Systeme in ganzer Galaxie)
   * Note: 1041-1048 are now treated as binary systems (frontend asset mapping)
   */
  private static getRandomSystemType(): SystemType {
    const rand = Math.random();
    
    // 50% häufig: 1049-1060 (mittlere Sterne)
    if (rand < 0.50) {
      const commonTypes: SystemType[] = [
        SystemType.SYS_1049, SystemType.SYS_1050, SystemType.SYS_1051, SystemType.SYS_1052,
        SystemType.SYS_1053, SystemType.SYS_1054, SystemType.SYS_1055, SystemType.SYS_1056,
        SystemType.SYS_1057, SystemType.SYS_1058, SystemType.SYS_1059, SystemType.SYS_1060
      ];
      return commonTypes[Math.floor(Math.random() * commonTypes.length)];
    }
    
    // 35% sehr viele: 1001-1048 (Binärsysteme) - Note: 1041-1048 are SYS_* in schema but rendered as binaries
    if (rand < 0.85) {
      const binaryTypes: SystemType[] = [
        SystemType.BIN_1001, SystemType.BIN_1002, SystemType.BIN_1003, SystemType.BIN_1004,
        SystemType.BIN_1005, SystemType.BIN_1006, SystemType.BIN_1007, SystemType.BIN_1008,
        SystemType.BIN_1009, SystemType.BIN_1010, SystemType.BIN_1011, SystemType.BIN_1012,
        SystemType.BIN_1013, SystemType.BIN_1014, SystemType.BIN_1015, SystemType.BIN_1016,
        SystemType.BIN_1017, SystemType.BIN_1018, SystemType.BIN_1019, SystemType.BIN_1020,
        SystemType.BIN_1021, SystemType.BIN_1022, SystemType.BIN_1023, SystemType.BIN_1024,
        SystemType.BIN_1025, SystemType.BIN_1026, SystemType.BIN_1027, SystemType.BIN_1028,
        SystemType.BIN_1029, SystemType.BIN_1030, SystemType.BIN_1031, SystemType.BIN_1032,
        SystemType.BIN_1033, SystemType.BIN_1034, SystemType.BIN_1035, SystemType.BIN_1036,
        SystemType.BIN_1037, SystemType.BIN_1038, SystemType.BIN_1039, SystemType.BIN_1040
      ];
      return binaryTypes[Math.floor(Math.random() * binaryTypes.length)];
    }
    
    // 10% sehr wenig: 1041-1048, 1061-1066
    if (rand < 0.95) {
      const uncommonTypes: SystemType[] = [
        SystemType.SYS_1041, SystemType.SYS_1042, SystemType.SYS_1043, SystemType.SYS_1044,
        SystemType.SYS_1045, SystemType.SYS_1046, SystemType.SYS_1047, SystemType.SYS_1048,
        SystemType.SYS_1061, SystemType.SYS_1062, SystemType.SYS_1063,
        SystemType.SYS_1064, SystemType.SYS_1065, SystemType.SYS_1066
      ];
      return uncommonTypes[Math.floor(Math.random() * uncommonTypes.length)];
    }
    
    // 4% vereinzelt: 1067-1070
    if (rand < 0.99) {
      const rareTypes: SystemType[] = [
        SystemType.SYS_1067, SystemType.SYS_1068, SystemType.SYS_1069, SystemType.SYS_1070
      ];
      return rareTypes[Math.floor(Math.random() * rareTypes.length)];
    }
    
    // 1% sehr selten: 1071-1075
    const veryRareTypes: SystemType[] = [
      SystemType.SYS_1071, SystemType.SYS_1072, SystemType.SYS_1073,
      SystemType.SYS_1074, SystemType.SYS_1075
    ];
    return veryRareTypes[Math.floor(Math.random() * veryRareTypes.length)];
  }
  private readonly SECTORS_X = 6;
  private readonly SECTORS_Y = 6;
  private readonly FIELDS_PER_SECTOR = 20;

  // Initialize galaxy with sectors (STU-style: 36 sectors in 6x6 grid)
  async initializeGalaxy(name: string = 'Star Wars Universe') {
    // Check if galaxy already exists
    const existingGalaxy = await prisma.galaxy.findFirst();
    if (existingGalaxy) {
      return existingGalaxy;
    }

    // Create galaxy: 6x6 sectors = 36 total
    const galaxy = await prisma.galaxy.create({
      data: {
        name,
        sizeX: this.SECTORS_X,
        sizeY: this.SECTORS_Y,
      },
    });

    console.log(`🌌 Erstelle Galaxie "${name}" mit ${this.SECTORS_X}x${this.SECTORS_Y} Sektoren (${this.SECTORS_X * this.SECTORS_Y} total)...`);
    console.log(`📊 Jeder Sektor hat ${this.FIELDS_PER_SECTOR}x${this.FIELDS_PER_SECTOR} Felder`);
    console.log(`🗺️  Gesamte Galaxie: ${this.SECTORS_X * this.FIELDS_PER_SECTOR}x${this.SECTORS_Y * this.FIELDS_PER_SECTOR} Felder`);

    // Create 36 sectors (6x6 grid)
    const sectors = [];
    for (let x = 1; x <= this.SECTORS_X; x++) {
      for (let y = 1; y <= this.SECTORS_Y; y++) {
        // Determine sector type (85% normal, 10% nebula, 5% asteroid)
        const rand = Math.random();
        let sectorType = 'NORMAL';
        if (rand < 0.05) sectorType = 'ASTEROID_FIELD';
        else if (rand < 0.15) sectorType = 'NEBULA';

        sectors.push({
          galaxyId: galaxy.id,
          x,
          y,
          sectorType,
        });
      }
    }

    // Insert all 36 sectors
    await prisma.sector.createMany({
      data: sectors,
    });

    console.log(`✅ ${sectors.length} Sektoren erstellt`);

    // Generate systems in sectors (STU-style: systems contain planets)
    await this.generateSystemsInGalaxy(galaxy.id);

    return galaxy;
  }

  // Generate systems distributed across all sectors (STU-style)
  private async generateSystemsInGalaxy(galaxyId: number) {
    console.log(`⭐ Generiere Sonnensysteme in der Galaxie...`);

    const sectors = await prisma.sector.findMany({
      where: { galaxyId },
    });

    const systemNames = [
      'Tatooine', 'Hoth', 'Endor', 'Coruscant', 'Naboo',
      'Dantooine', 'Yavin', 'Bespin', 'Dagobah', 'Alderaan',
      'Kashyyyk', 'Mustafar', 'Kamino', 'Geonosis', 'Utapau',
      'Corellia', 'Mandalore', 'Ord Mantell', 'Ryloth', 'Mon Cala',
      'Scarif', 'Jedha', 'Lothal', 'Atollon', 'Dathomir',
      'Felucia', 'Mygeeto', 'Saleucami', 'Cato Neimoidia', 'Polis Massa',
      'Kessel', 'Sullust', 'Nar Shaddaa', 'Bothawui', 'Fondor'
    ];
    const planetClassesEnum: PlanetClass[] = [
      // ===== LEBENSFREUNDLICHE KLASSEN (höhere Wahrscheinlichkeit) =====
      PlanetClass.CLASS_M,        // erdähnlich - most common
      PlanetClass.CLASS_M,
      PlanetClass.CLASS_M,
      PlanetClass.CLASS_O,        // ozeanisch - common
      PlanetClass.CLASS_O,
      PlanetClass.CLASS_L,        // bewaldet - forests like Endor
      PlanetClass.CLASS_L,
      PlanetClass.CLASS_H,        // wüstenbedeckt - deserts like Tatooine
      PlanetClass.CLASS_H,
      PlanetClass.CLASS_P,        // eisbedeckt - ice worlds like Hoth
      PlanetClass.CLASS_K,        // marsähnlich - rocky worlds
      PlanetClass.CLASS_G,        // tundrabedeckt - tundra worlds
      PlanetClass.CLASS_D,        // mondähnlich - moon-like worlds

      // ===== EXTREME KLASSEN (selten, schwer kolonisierbar) =====
      PlanetClass.CLASS_Q,        // dichte Atmosphäre - toxic atmosphere
      PlanetClass.CLASS_X,        // vulkanisch - volcanic like Mustafar

      // ===== UNBEWOHNBARE PLANETEN (seltener) =====
      PlanetClass.CLASS_S,        // gezeitengebunden - tidally locked
      PlanetClass.CLASS_T,        // extreme Rotation - fast rotating
      PlanetClass.CLASS_I_1,      // Gasriese Typ 1 - like Yavin
      PlanetClass.CLASS_I_2,      // Gasriese Typ 2 - like Bespin
      PlanetClass.CLASS_I_3,      // Gasriese Typ 3 - massive gas giants
      PlanetClass.CLASS_N,        // spezielle Eigenschaften - unique worlds

      // Additional variety for more common types
      PlanetClass.CLASS_P_T,      // eisbedeckt weniger Wasser - polar ice
    ];

    let totalSystems = 0;
    let totalPlanets = 0;
    const usedNames = new Set<string>();

    for (const sector of sectors) {
      // Each sector has 400 fields (20x20)
      // 2-4% should have systems = 8-16 systems per sector
      const systemsInSector = Math.floor(Math.random() * 9) + 8; // 8-16 systems
      const occupiedFields = new Set<string>();

      for (let i = 0; i < systemsInSector; i++) {
        // Random field position (1-20, 1-20)
        let fieldX: number, fieldY: number, fieldKey: string;
        let attempts = 0;
        
        do {
          fieldX = Math.floor(Math.random() * this.FIELDS_PER_SECTOR) + 1;
          fieldY = Math.floor(Math.random() * this.FIELDS_PER_SECTOR) + 1;
          fieldKey = `${fieldX},${fieldY}`;
          attempts++;
        } while (occupiedFields.has(fieldKey) && attempts < 100);

        if (attempts >= 100) continue;
        occupiedFields.add(fieldKey);

        // Generate unique system name
        let systemName: string;
        let nameAttempts = 0;
        do {
          const baseName = systemNames[Math.floor(Math.random() * systemNames.length)];
          const suffix = Math.floor(Math.random() * 1000);
          systemName = usedNames.size < systemNames.length ? `${baseName}-System` : `${baseName}-${suffix}`;
          nameAttempts++;
        } while (usedNames.has(systemName) && nameAttempts < 50);

        if (nameAttempts >= 50) continue;
        usedNames.add(systemName);

        // Use STU weighted random system type generation
        const systemType = GalaxyService.getRandomSystemType();
        const systemTypeId = GalaxyService.getSystemTypeId(systemType);
        const gridSize = GalaxyService.getGridSizeForSystemType(systemTypeId);
        
        // Check if binary system and get component systemtypes
        const isBinary = systemTypeId >= 1001 && systemTypeId <= 1048;
        let primarySystemTypeId: number | null = null;
        let secondarySystemTypeId: number | null = null;
        
        if (isBinary) {
          const binaryCombo = GalaxyService.getBinarySystemCombo(systemTypeId);
          if (binaryCombo) {
            primarySystemTypeId = binaryCombo.primarySystemId;
            secondarySystemTypeId = binaryCombo.secondarySystemId;
          }
        }

        // Create the system
        const system = await prisma.system.create({
          data: {
            name: systemName,
            sectorId: sector.id,
            fieldX,
            fieldY,
            systemType,
            gridSize,
            isBinary,
            primarySystemTypeId,
            secondarySystemTypeId,
          },
        });

        // Generate STU-style rich systems with 6-15 objects
        await this.generateRichSystemContent(system, systemName, planetClassesEnum);
        totalPlanets += await this.countSystemObjects(system.id);

        totalSystems++;
      }
    }

    console.log(`✅ ${totalSystems} Systeme mit ${totalPlanets} Planeten in ${sectors.length} Sektoren generiert`);
  }

  // Helper: Convert number to Roman numeral
  private romanNumeral(num: number): string {
    const romanNumerals: [number, string][] = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  /**
   * Generate STU-style rich system content with planets, moons, and asteroids
   * Creates 15-25 total objects per system for maximum expansion opportunities
   */
  private async generateRichSystemContent(system: any, systemName: string, planetClassesEnum: any[]) {
    const gridCenter = Math.floor(system.gridSize / 2);

    // Track occupied grid positions to avoid overlaps
    const occupiedPositions = new Set<string>();

    // Dynamic star area reservation with realistic collision avoidance
    const isBinary = system.isBinary;

    if (isBinary && system.primarySystemTypeId && system.secondarySystemTypeId) {
      // Binary system: Reserve exclusion zones around both stars
      for (let x = 1; x <= system.gridSize; x++) {
        for (let y = 1; y <= system.gridSize; y++) {
          // Check if position is safe for planets (outside both star exclusion zones)
          const isSafe = isPositionSafeForPlanet(
            x, y, system.systemType, system.gridSize,
            system.primarySystemTypeId, system.secondarySystemTypeId
          );

          if (!isSafe) {
            occupiedPositions.add(`${x},${y}`);
          }
        }
      }

      console.log(`🌟 Binary system ${systemName}: Reserved ${occupiedPositions.size} positions for dual-star exclusion zones`);
    } else {
      // Single star system: Reserve exclusion zone around central star
      const exclusionZone = getStarExclusionZone(system.systemType, system.gridSize);
      const starAreaSize = calculateStarAreaSize(system.systemType, system.gridSize);

      for (let x = 1; x <= system.gridSize; x++) {
        for (let y = 1; y <= system.gridSize; y++) {
          const distanceFromCenter = Math.sqrt(Math.pow(x - gridCenter, 2) + Math.pow(y - gridCenter, 2));

          // Reserve star exclusion zone (star area + realistic buffer distance)
          if (distanceFromCenter <= exclusionZone.totalRadius) {
            occupiedPositions.add(`${x},${y}`);
          }
        }
      }

      console.log(`⭐ Single star system ${systemName}: ${starAreaSize}x${starAreaSize} star area + ${exclusionZone.bufferZone} unit buffer zone (${occupiedPositions.size} reserved positions)`);
    }

    // Get numeric ID from systemType enum (e.g., "SYS_1049" => 1049)
    const systemTypeId = GalaxyService.getSystemTypeId(system.systemType);

    // Determine planet/asteroid counts based on systemType
    let planetsCount: number;
    let asteroidsCount: number;

    // SYS_1061-1066 AND SYS_1071-1075: Very special systems, NO planets/asteroids
    if ((systemTypeId >= 1061 && systemTypeId <= 1066) ||
        (systemTypeId >= 1071 && systemTypeId <= 1075)) {
      planetsCount = 0;
      asteroidsCount = 0;
      console.log(`🚫 Special system ${systemName}: No planets/asteroids (type ${systemTypeId})`);
    }
    // SYS_1067-1070: Very rare, small systems with few objects
    else if (systemTypeId >= 1067 && systemTypeId <= 1070) {
      planetsCount = Math.floor(Math.random() * 3) + 3; // 3-5 planets
      asteroidsCount = Math.floor(Math.random() * 2) + 1; // 1-2 asteroids
    }
    // SYS_1041-1048: Rare, smaller systems
    else if (systemTypeId >= 1041 && systemTypeId <= 1048) {
      planetsCount = Math.floor(Math.random() * 4) + 4; // 4-7 planets
      asteroidsCount = Math.floor(Math.random() * 3) + 2; // 2-4 asteroids
    }
    // SYS_1049-1060: Common, larger systems (most abundant)
    else if (systemTypeId >= 1049 && systemTypeId <= 1060) {
      planetsCount = Math.floor(Math.random() * 6) + 8; // 8-13 planets
      asteroidsCount = Math.floor(Math.random() * 6) + 3; // 3-8 asteroids
    }
    // BIN_1001-1048: Binary systems, large with many objects
    else if (systemTypeId >= 1001 && systemTypeId <= 1048) {
      planetsCount = Math.floor(Math.random() * 8) + 10; // 10-17 planets (binaries are rich)
      asteroidsCount = Math.floor(Math.random() * 8) + 5; // 5-12 asteroids
    }
    // Fallback for any other types (shouldn't happen with current schema)
    else {
      planetsCount = Math.floor(Math.random() * 7) + 6; // 6-12 planets (default)
      asteroidsCount = Math.floor(Math.random() * 5) + 2; // 2-6 asteroids (default)
    }

    // Ensure minimum planets for all normal systems
    if (planetsCount > 0) {
      planetsCount = Math.max(planetsCount, 3); // At least 3 planets for normal systems
    }

    // Phase 1: Generate planets in orbital zones
    const createdPlanets = [];

    for (let p = 0; p < planetsCount; p++) {
      const planetName = `${systemName.replace('-System', '')} ${this.romanNumeral(p + 1)}`;
      const planetClass = planetClassesEnum[Math.floor(Math.random() * planetClassesEnum.length)];

      // Strategic orbital placement in zones
      const orbitZone = p < 3 ? 'inner' : p < 8 ? 'middle' : 'outer';
      const orbitRadius = this.getOrbitRadiusForZone(orbitZone, system.gridSize);
      const orbitAngle = Math.floor(Math.random() * 360);

      // Convert orbital position to grid coordinates
      const gridPos = this.orbitToGridPosition(orbitRadius, orbitAngle, gridCenter);

      // Ensure position is free and within bounds
      if (this.isPositionValid(gridPos, system.gridSize, occupiedPositions)) {
        const planet = await this.createPlanetWithFields(
          planetName, system.id, planetClass, orbitRadius, orbitAngle, gridPos.x, gridPos.y
        );

        createdPlanets.push(planet);
        occupiedPositions.add(`${gridPos.x},${gridPos.y}`);
      }
    }

    // Fallback: If we didn't place enough planets, use simpler placement
    if (createdPlanets.length < 3 && planetsCount > 0) {
      const needed = Math.min(3, planetsCount) - createdPlanets.length;
      console.log(`🔄 System ${systemName}: Only placed ${createdPlanets.length}/${planetsCount} planets, adding ${needed} fallback planets`);

      await this.createFallbackPlanets(system, systemName, planetClassesEnum, needed, occupiedPositions, createdPlanets);
    }

    // Phase 2: Add moons to 30% of planets
    const planetsWithMoons = createdPlanets.filter(() => Math.random() < 0.3);

    for (const parentPlanet of planetsWithMoons) {
      const moonsCount = Math.floor(Math.random() * 3) + 1; // 1-3 moons per planet

      for (let m = 0; m < moonsCount; m++) {
        const moonName = `${parentPlanet.name}-${String.fromCharCode(97 + m)}`; // a, b, c...
        const moonClass = this.selectMoonClass(planetClassesEnum);

        // Place moon near parent planet
        const moonPos = this.findMoonPosition(parentPlanet, system.gridSize, occupiedPositions);

        if (moonPos) {
          const moon = await prisma.planet.create({
            data: {
              name: moonName,
              systemId: system.id,
              planetClass: moonClass,
              celestialType: 'MOON',
              parentPlanetId: parentPlanet.id,
              orbitRadius: 1, // Close to parent
              orbitAngle: Math.floor(Math.random() * 360),
              gridX: moonPos.x,
              gridY: moonPos.y,
              sizeX: 5, // Smaller than planets
              sizeY: 5,
            },
          });

          // Create moon fields (5x5 grid) - STU-style: No underground layer for moons
          const moonFields = [];
          for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
              let fieldLayer: string;
              let fieldType: string;

              if (y <= 0) {
                // ORBIT layer (1 row)
                fieldLayer = 'ORBIT';
                fieldType = 'SPACE';
              } else {
                // SURFACE layer (4 rows) - STU-style: Moons have no underground
                fieldLayer = 'SURFACE';
                const rand = Math.random();
                if (rand < 0.15) fieldType = 'WATER';
                else if (rand < 0.25) fieldType = 'MOUNTAIN';
                else fieldType = 'LAND';
              }

              moonFields.push({
                planetId: moon.id,
                x,
                y,
                fieldLayer,
                fieldType,
              });
            }
          }

          await prisma.planetField.createMany({
            data: moonFields,
          });

          occupiedPositions.add(`${moonPos.x},${moonPos.y}`);
        }
      }
    }

    // Phase 3: Add asteroid fields (optional, 60% chance)
    const shouldGenerateAsteroids = asteroidsCount > 0 && Math.random() < 0.6;

    if (shouldGenerateAsteroids) {
      const asteroidClustersCount = Math.floor(Math.random() * asteroidsCount) + 1; // 1 to asteroidsCount clusters

      console.log(`☄️  System ${systemName}: Generating ${asteroidClustersCount} asteroid clusters`);

      for (let a = 0; a < asteroidClustersCount; a++) {
        const asteroidName = `${systemName.replace('-System', '')} Asteroid Field ${this.romanNumeral(a + 1)}`;
        const asteroidPos = this.findRandomPosition(system.gridSize, occupiedPositions, 3); // Keep 3 units from other objects

        if (asteroidPos) {
          // Generate random asteroid variant with proper STU asset support
          const asteroidVariants = ['NORMAL', 'GREEN', 'RED', 'ICE'];
          const randomVariant = asteroidVariants[Math.floor(Math.random() * asteroidVariants.length)];

          await prisma.planet.create({
            data: {
              systemId: system.id,
              name: asteroidName,
              planetClass: 'CLASS_K', // Rocky asteroid field class
              celestialType: 'ASTEROID_FIELD',
              asteroidVariant: randomVariant,
              gridX: asteroidPos.x,
              gridY: asteroidPos.y,
              visualSeed: Math.floor(Math.random() * 1000) + 1,
              durastahl: Math.floor(Math.random() * 5000) + 2000, // 2000-7000 durastahl
              kristallinesSilizium: Math.floor(Math.random() * 3000) + 1000, // 1000-4000 kristallines silizium
              // Default planet values for asteroid fields
              credits: 0,
              tibannaGas: 0,
              energiemodule: 0,
              kyberKristalle: 0,
              bacta: 0,
              beskar: 0,
              energyStorage: 0,
              energyStorageCapacity: 1000,
              storageCapacity: 500,
            },
          });

          occupiedPositions.add(`${asteroidPos.x},${asteroidPos.y}`);
        }
      }
    } else {
      console.log(`⭐ System ${systemName}: No asteroid fields generated`);
    }

    // Phase 4: Legacy special objects removed
    // DEBRIS_FIELD and SPACE_STATION had no real STU assets and caused UI errors
    // Only ASTEROID_FIELD objects are supported with 700-series assets
  }

  /**
   * Count total celestial objects in a system (planets + moons + asteroid fields)
   */
  private async countSystemObjects(systemId: number): Promise<number> {
    // All celestial objects are now Planet records (including asteroid fields)
    return await prisma.planet.count({ where: { systemId } });
  }

  /**
   * Create a planet with its field grid
   */
  private async createPlanetWithFields(
    name: string, systemId: number, planetClass: any, orbitRadius: number,
    orbitAngle: number, gridX: number, gridY: number
  ) {
    const planet = await prisma.planet.create({
      data: {
        name,
        systemId,
        planetClass,
        celestialType: 'PLANET',
        orbitRadius,
        orbitAngle,
        gridX,
        gridY,
        sizeX: 10,
        sizeY: 10,
      },
    });

    // Create planet fields (10x10 grid with layers) - same as original homeworld creation
    const fields = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        let fieldLayer: string;
        let fieldType: string;

        if (y <= 1) {
          // ORBIT layer (2 rows)
          fieldLayer = 'ORBIT';
          fieldType = 'SPACE';
        } else if (y <= 7) {
          // SURFACE layer (6 rows)
          fieldLayer = 'SURFACE';
          const rand = Math.random();
          if (rand < 0.2) fieldType = 'WATER';
          else if (rand < 0.25) fieldType = 'MOUNTAIN';
          else fieldType = 'LAND'; // Most fields are LAND
        } else {
          // UNDERGROUND layer (2 rows)
          fieldLayer = 'UNDERGROUND';
          const rand = Math.random();
          if (rand < 0.1) fieldType = 'CRYSTAL';
          else if (rand < 0.2) fieldType = 'METAL';
          else fieldType = 'ROCK';
        }

        fields.push({
          planetId: planet.id,
          x,
          y,
          fieldLayer,
          fieldType,
        });
      }
    }

    await prisma.planetField.createMany({
      data: fields,
    });

    return planet;
  }

  /**
   * Create fallback planets using simpler positioning when orbital placement fails
   */
  private async createFallbackPlanets(
    system: any, systemName: string, planetClassesEnum: any[],
    count: number, occupiedPositions: Set<string>, createdPlanets: any[]
  ): Promise<void> {
    for (let i = 0; i < count; i++) {
      const planetName = `${systemName.replace('-System', '')} ${this.romanNumeral(createdPlanets.length + i + 1)}`;
      const planetClass = planetClassesEnum[Math.floor(Math.random() * planetClassesEnum.length)];

      // Use simpler grid-based positioning (less restrictive than orbital)
      const fallbackPos = this.findRandomPosition(system.gridSize, occupiedPositions, 2); // 2 units minimum distance

      if (fallbackPos) {
        // Simple fallback orbit values
        const fallbackRadius = Math.floor(Math.random() * 5) + 3; // 3-7
        const fallbackAngle = Math.floor(Math.random() * 360);

        const planet = await this.createPlanetWithFields(
          planetName, system.id, planetClass, fallbackRadius, fallbackAngle,
          fallbackPos.x, fallbackPos.y
        );

        createdPlanets.push(planet);
        occupiedPositions.add(`${fallbackPos.x},${fallbackPos.y}`);

        console.log(`✅ Fallback planet placed: ${planetName} at (${fallbackPos.x},${fallbackPos.y})`);
      } else {
        console.log(`❌ Could not place fallback planet ${i + 1} in system ${systemName}`);
      }
    }
  }

  /**
   * Get orbit radius based on orbital zone and system size
   */
  private getOrbitRadiusForZone(zone: 'inner' | 'middle' | 'outer', gridSize: number): number {
    const maxRadius = Math.floor(gridSize * 0.4); // 40% of grid size

    switch (zone) {
      case 'inner': return Math.floor(Math.random() * Math.max(2, Math.floor(maxRadius * 0.3))) + 2; // 2 to 30% of max
      case 'middle': return Math.floor(Math.random() * Math.floor(maxRadius * 0.3)) + Math.floor(maxRadius * 0.3) + 1; // 30% to 60%
      case 'outer': return Math.floor(Math.random() * Math.floor(maxRadius * 0.4)) + Math.floor(maxRadius * 0.6) + 1; // 60% to 100%
      default: return 3;
    }
  }

  /**
   * Convert orbital coordinates to grid coordinates
   */
  private orbitToGridPosition(orbitRadius: number, orbitAngle: number, gridCenter: number): { x: number, y: number } {
    const angleRad = (orbitAngle * Math.PI) / 180;
    const x = Math.round(gridCenter + orbitRadius * Math.cos(angleRad));
    const y = Math.round(gridCenter + orbitRadius * Math.sin(angleRad));

    return { x, y };
  }

  /**
   * Check if a position is valid (within bounds and not occupied)
   */
  private isPositionValid(pos: { x: number, y: number }, gridSize: number, occupiedPositions: Set<string>): boolean {
    return pos.x >= 1 && pos.x <= gridSize &&
           pos.y >= 1 && pos.y <= gridSize &&
           !occupiedPositions.has(`${pos.x},${pos.y}`);
  }

  /**
   * Select appropriate planet class for moons (smaller, less habitable)
   */
  private selectMoonClass(planetClassesEnum: any[]): any {
    // Prefer moon-appropriate classes
    const moonPreferredClasses = ['CLASS_D', 'CLASS_P', 'CLASS_K', 'CLASS_S'];
    const availableMoonClasses = planetClassesEnum.filter(cls =>
      moonPreferredClasses.includes(cls.toString())
    );

    if (availableMoonClasses.length > 0) {
      return availableMoonClasses[Math.floor(Math.random() * availableMoonClasses.length)];
    }

    // Fallback to any class
    return planetClassesEnum[Math.floor(Math.random() * planetClassesEnum.length)];
  }

  /**
   * Find suitable position for a moon near its parent planet
   */
  private findMoonPosition(parentPlanet: any, gridSize: number, occupiedPositions: Set<string>): { x: number, y: number } | null {
    // Try positions in a 3x3 area around parent planet
    const parentX = parentPlanet.gridX;
    const parentY = parentPlanet.gridY;

    for (let attempts = 0; attempts < 20; attempts++) {
      const dx = Math.floor(Math.random() * 5) - 2; // -2 to 2
      const dy = Math.floor(Math.random() * 5) - 2; // -2 to 2

      if (dx === 0 && dy === 0) continue; // Don't place on parent

      const moonX = parentX + dx;
      const moonY = parentY + dy;

      if (this.isPositionValid({ x: moonX, y: moonY }, gridSize, occupiedPositions)) {
        return { x: moonX, y: moonY };
      }
    }

    return null;
  }

  /**
   * Find random free position with minimum distance from other objects
   */
  private findRandomPosition(gridSize: number, occupiedPositions: Set<string>, minDistance: number = 1): { x: number, y: number } | null {
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = Math.floor(Math.random() * gridSize) + 1;
      const y = Math.floor(Math.random() * gridSize) + 1;

      let tooClose = false;

      // Check minimum distance
      for (let dx = -minDistance; dx <= minDistance; dx++) {
        for (let dy = -minDistance; dy <= minDistance; dy++) {
          const checkX = x + dx;
          const checkY = y + dy;

          if (occupiedPositions.has(`${checkX},${checkY}`)) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) break;
      }

      if (!tooClose) {
        return { x, y };
      }
    }

    return null;
  }

  // Generate planets distributed across all sectors (DEPRECATED - use generateSystemsInGalaxy)
  private async generatePlanetsInGalaxy(galaxyId: number) {
    console.log(`🪐 Generiere Planeten in der Galaxie...`);

    const sectors = await prisma.sector.findMany({
      where: { galaxyId },
    });

    const planetTypes = ['TERRAN', 'DESERT', 'JUNGLE', 'ICE', 'VOLCANIC', 'FOREST', 'VOLCANO', 'OCEAN', 'CONTINENTAL', 'TROPICAL', 'TEMPERATE', 'HIGHLAND', 'MARSH', 'SWAMP', 'ARCHIPELAGO', 'COLONY', 'INDUSTRIAL', 'AGRICULTURAL', 'MINING', 'CITY', 'URBAN', 'RESEARCH', 'TRADING', 'MILITARY', 'MOON', 'BARREN', 'ROCKY', 'CRATER', 'LIFELESS', 'WASTELAND', 'ASTEROID_FIELD', 'DEBRIS_FIELD', 'SPACE_STATION', 'OUTPOST'];
    const planetClassesEnum: PlanetClass[] = [
      // ===== LEBENSFREUNDLICHE KLASSEN (höhere Wahrscheinlichkeit) =====
      PlanetClass.CLASS_M,        // erdähnlich - most common
      PlanetClass.CLASS_M,
      PlanetClass.CLASS_M,
      PlanetClass.CLASS_O,        // ozeanisch - common
      PlanetClass.CLASS_O,
      PlanetClass.CLASS_L,        // bewaldet - forests like Endor
      PlanetClass.CLASS_L,
      PlanetClass.CLASS_H,        // wüstenbedeckt - deserts like Tatooine
      PlanetClass.CLASS_H,
      PlanetClass.CLASS_P,        // eisbedeckt - ice worlds like Hoth
      PlanetClass.CLASS_K,        // marsähnlich - rocky worlds
      PlanetClass.CLASS_G,        // tundrabedeckt - tundra worlds
      PlanetClass.CLASS_D,        // mondähnlich - moon-like worlds

      // ===== EXTREME KLASSEN (selten, schwer kolonisierbar) =====
      PlanetClass.CLASS_Q,        // dichte Atmosphäre - toxic atmosphere
      PlanetClass.CLASS_X,        // vulkanisch - volcanic like Mustafar

      // ===== UNBEWOHNBARE PLANETEN (seltener) =====
      PlanetClass.CLASS_S,        // gezeitengebunden - tidally locked
      PlanetClass.CLASS_T,        // extreme Rotation - fast rotating
      PlanetClass.CLASS_I_1,      // Gasriese Typ 1 - like Yavin
      PlanetClass.CLASS_I_2,      // Gasriese Typ 2 - like Bespin
      PlanetClass.CLASS_I_3,      // Gasriese Typ 3 - massive gas giants
      PlanetClass.CLASS_N,        // spezielle Eigenschaften - unique worlds

      // Additional variety for more common types
      PlanetClass.CLASS_P_T,      // eisbedeckt weniger Wasser - polar ice
    ];
    const planetNames = [
      'Tatooine', 'Hoth', 'Endor', 'Coruscant', 'Naboo',
      'Dantooine', 'Yavin', 'Bespin', 'Dagobah', 'Alderaan',
      'Kashyyyk', 'Mustafar', 'Kamino', 'Geonosis', 'Utapau',
      'Corellia', 'Mandalore', 'Ord Mantell', 'Ryloth', 'Mon Cala',
      'Scarif', 'Jedha', 'Lothal', 'Atollon', 'Dathomir',
      'Felucia', 'Mygeeto', 'Saleucami', 'Cato Neimoidia', 'Polis Massa'
    ];

    let totalPlanets = 0;
    const usedNames = new Set<string>();

    for (const sector of sectors) {
      // Each sector has 400 fields (20x20)
      // 5-10% should have planets = 20-40 planets per sector
      const planetsInSector = Math.floor(Math.random() * 21) + 20; // 20-40 planets
      const occupiedFields = new Set<string>();

      for (let i = 0; i < planetsInSector; i++) {
        // Random field position (1-20, 1-20)
        let fieldX: number, fieldY: number, fieldKey: string;
        let attempts = 0;
        
        do {
          fieldX = Math.floor(Math.random() * this.FIELDS_PER_SECTOR) + 1;
          fieldY = Math.floor(Math.random() * this.FIELDS_PER_SECTOR) + 1;
          fieldKey = `${fieldX},${fieldY}`;
          attempts++;
        } while (occupiedFields.has(fieldKey) && attempts < 100);

        if (attempts >= 100) continue; // Skip if can't find free field

        occupiedFields.add(fieldKey);

        // Generate unique planet name
        let planetName: string;
        let nameAttempts = 0;
        do {
          const baseName = planetNames[Math.floor(Math.random() * planetNames.length)];
          const suffix = Math.floor(Math.random() * 1000);
          planetName = usedNames.size < planetNames.length ? baseName : `${baseName} ${suffix}`;
          nameAttempts++;
        } while (usedNames.has(planetName) && nameAttempts < 50);

        if (nameAttempts >= 50) continue;
        usedNames.add(planetName);

        const planetClass = planetClassesEnum[Math.floor(Math.random() * planetClassesEnum.length)];

        await prisma.planet.create({
          data: {
            name: planetName,
            systemId: sector.id,
            planetClass: planetClass,
            sizeX: 10,
            sizeY: 10,
          },
        });

        totalPlanets++;
      }
    }

    console.log(`✅ ${totalPlanets} Planeten in ${sectors.length} Sektoren generiert`);
  }

  // DEPRECATED: Fixed homeworld creation replaced with dynamic start planet selection
  async createStartPlanets() {
    console.log('⚠️  createStartPlanets() is deprecated - using dynamic start planet selection instead');
    console.log('✅ Startplaneten creation skipped - players will select from generated planets');
    return [];
  }

  // Get available start planets for a faction (Dynamic selection from generated planets)
  async getAvailableStartPlanets(factionId: number, options?: {
    nearSystemName?: string;  // Co-op feature - search near specific system
    refreshCount?: number;    // For randomization seed
  }) {
    // 1. Define faction territory sectors (opposite corners of 6x6 galaxy)
    const factionSectors = factionId === 1
      ? [[1,1], [1,2], [2,1], [2,2]]  // Imperium (top-left corner)
      : [[5,5], [5,6], [6,5], [6,6]]; // Rebellen (bottom-right corner)

    // 2. Build base query for habitable planets in faction territory
    let habitablePlanets = await prisma.planet.findMany({
      where: {
        planetClass: { in: ['CLASS_M', 'CLASS_L', 'CLASS_O'] }, // Only habitable classes
        playerId: null,  // Unclaimed only
        celestialType: 'PLANET',  // Not moons or asteroids
        system: {
          sector: {
            OR: factionSectors.map(([x, y]) => ({ x, y }))
          }
        }
      },
      include: {
        system: {
          include: {
            sector: true
          }
        }
      }
    });

    // 3. Handle co-op near system search
    if (options?.nearSystemName) {
      try {
        // Find the target system
        const targetSystem = await prisma.system.findFirst({
          where: {
            name: {
              contains: options.nearSystemName,
              mode: 'insensitive'
            }
          },
          include: { sector: true }
        });

        if (targetSystem) {
          // Filter planets to those within 2 sectors of the target system
          habitablePlanets = habitablePlanets.filter(planet => {
            const distance = Math.abs(planet.system.sector.x - targetSystem.sector.x) +
                           Math.abs(planet.system.sector.y - targetSystem.sector.y);
            return distance <= 2; // Within 2 sectors
          });

          console.log(`🤝 Co-op search: Found ${habitablePlanets.length} planets near "${options.nearSystemName}"`);
        } else {
          console.log(`⚠️  Co-op search: System "${options.nearSystemName}" not found`);
          // Return empty result for invalid system names
          return [];
        }
      } catch (error) {
        console.error('Error in co-op search:', error);
        return [];
      }
    }

    // 4. Randomize selection (use refreshCount as seed for different results)
    const seed = (options?.refreshCount || 0) + factionId;
    const shuffled = habitablePlanets.sort(() => {
      // Use deterministic randomization based on seed
      return (Math.sin(seed * 9999) * 10000) % 2 - 1;
    });

    // 5. Select up to 4 planets and format them
    const selectedPlanets = shuffled.slice(0, 4);

    console.log(`🌍 Dynamic selection: Found ${selectedPlanets.length} start planets for faction ${factionId}${options?.nearSystemName ? ` near ${options.nearSystemName}` : ''}`);

    return selectedPlanets.map(planet => ({
      id: planet.id,
      name: planet.name,
      planetClass: planet.planetClass,
      visualSeed: planet.visualSeed,
      sectorX: planet.system.sector.x,
      sectorY: planet.system.sector.y,
      systemName: planet.system.name,
      systemType: planet.system.systemType,
      available: true,
    }));
  }

  // Claim a start planet for a player
  async claimStartPlanet(playerId: number, planetId: number) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { planets: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    if (player.planets.length > 0) {
      throw new Error('Player already has a planet');
    }

    const planet = await prisma.planet.findUnique({
      where: { id: planetId },
      include: { fields: true },
    });

    if (!planet) {
      throw new Error('Planet not found');
    }

    if (planet.playerId) {
      throw new Error('Planet already claimed');
    }

    // Get or create building types
    const buildingTypes = await this.ensureBuildingTypes();

    // Assign planet to player
    const updatedPlanet = await prisma.planet.update({
      where: { id: planetId },
      data: { playerId },
      include: {
        system: {
          include: {
            sector: true,
          },
        },
        fields: true,
        player: true,
      },
    });

    // Build starter buildings
    await this.buildStarterBuildings(planet.id, buildingTypes);

    console.log(`✅ Player ${playerId} claimed planet ${planet.name}`);

    return updatedPlanet;
  }

  // Ensure building types exist in database
  private async ensureBuildingTypes() {
    // Simply return all building types from database
    // They should be seeded via seed-building-types.ts
    const buildingTypes = await prisma.buildingType.findMany();
    
    if (buildingTypes.length === 0) {
      throw new Error('No building types found in database. Please run seed-building-types.ts first.');
    }
    
    return buildingTypes;
  }

  // Build starter buildings on a new planet
  private async buildStarterBuildings(planetId: number, buildingTypes: any[]) {
    const commandCenter = buildingTypes.find(bt => bt.name === 'Kommandozentrale');
    const solarPlant = buildingTypes.find(bt => bt.name === 'Solarkraftwerk');
    const durastahlMine = buildingTypes.find(bt => bt.name === 'Durastahl-Mine');

    if (!commandCenter || !solarPlant || !durastahlMine) {
      console.error('Available building types:', buildingTypes.map(bt => bt.name));
      throw new Error('Required building types not found');
    }

    // Get available fields
    const fields = await prisma.planetField.findMany({
      where: { 
        planetId,
        fieldType: 'LAND',
        buildingId: null,
      },
      take: 3,
    });

    if (fields.length < 3) {
      throw new Error('Not enough land fields for starter buildings');
    }

    // Build Command Center
    const cc = await prisma.building.create({
      data: {
        planetId,
        buildingTypeId: commandCenter.id,
        level: 1,
        isActive: true,
        completedAt: new Date(),
      },
    });

    await prisma.planetField.update({
      where: { id: fields[0].id },
      data: { buildingId: cc.id },
    });

    // Build Solar Plant
    const sp = await prisma.building.create({
      data: {
        planetId,
        buildingTypeId: solarPlant.id,
        level: 1,
        isActive: true,
        completedAt: new Date(),
      },
    });

    await prisma.planetField.update({
      where: { id: fields[1].id },
      data: { buildingId: sp.id },
    });

    // Build Durastahl Mine
    const dm = await prisma.building.create({
      data: {
        planetId,
        buildingTypeId: durastahlMine.id,
        level: 1,
        isActive: true,
        completedAt: new Date(),
      },
    });

    await prisma.planetField.update({
      where: { id: fields[2].id },
      data: { buildingId: dm.id },
    });

    console.log(`✅ Built starter buildings on planet ${planetId}`);
  }

  /**
   * Helper: Get systemtype numeric ID from SystemType enum
   */
  private static getSystemTypeId(systemType: SystemType): number {
    const enumName = systemType.toString();
    if (enumName.startsWith('SYS_')) {
      return parseInt(enumName.replace('SYS_', ''));
    } else if (enumName.startsWith('BIN_')) {
      return parseInt(enumName.replace('BIN_', ''));
    }
    return 1050; // fallback
  }

  /**
   * Helper: Get grid size based on systemtype
   */
  private static getGridSizeForSystemType(systemTypeId: number): number {
    // 1061-1066 AND 1071-1075: Very small special systems
    if ((systemTypeId >= 1061 && systemTypeId <= 1066) ||
        (systemTypeId >= 1071 && systemTypeId <= 1075)) {
      return 10; // Very small special systems
    }

    // 1067-1070: Klein
    if (systemTypeId >= 1067 && systemTypeId <= 1070) {
      return 20;
    }

    // 1041-1048: Groß
    if (systemTypeId >= 1041 && systemTypeId <= 1048) {
      return Math.floor(Math.random() * 11) + 30; // 30-40
    }

    // 1049-1060: Common systems (removed 1061-1066 from this range)
    if (systemTypeId >= 1049 && systemTypeId <= 1060) {
      return Math.floor(Math.random() * 11) + 25; // 25-35
    }

    // Binärsysteme 1001-1048: Mittel bis groß
    if (systemTypeId >= 1001 && systemTypeId <= 1048) {
      return Math.floor(Math.random() * 11) + 25; // 25-35
    }

    return 30; // fallback
  }

  /**
   * Helper: Get binary system combo from systemtype ID
   * Returns primary and secondary systemtype IDs for binary systems
   */
  private static getBinarySystemCombo(binaryId: number): { primarySystemId: number; secondarySystemId: number } | null {
    // This mapping comes from frontend/src/config/systemAssets.ts BINARY_SYSTEMS
    const binaryMappings: Record<number, { primarySystemId: number; secondarySystemId: number }> = {
      // Riese + Riese (1001-1010)
      1001: { primarySystemId: 1049, secondarySystemId: 1049 },
      1002: { primarySystemId: 1049, secondarySystemId: 1050 },
      1003: { primarySystemId: 1050, secondarySystemId: 1050 },
      1004: { primarySystemId: 1051, secondarySystemId: 1050 },
      1005: { primarySystemId: 1050, secondarySystemId: 1052 },
      1006: { primarySystemId: 1049, secondarySystemId: 1051 },
      1007: { primarySystemId: 1051, secondarySystemId: 1051 },
      1008: { primarySystemId: 1051, secondarySystemId: 1052 },
      1009: { primarySystemId: 1052, secondarySystemId: 1049 },
      1010: { primarySystemId: 1052, secondarySystemId: 1052 },
      // Riese + Überriese (1011-1020)
      1011: { primarySystemId: 1049, secondarySystemId: 1053 },
      1012: { primarySystemId: 1050, secondarySystemId: 1053 },
      1013: { primarySystemId: 1050, secondarySystemId: 1054 },
      1014: { primarySystemId: 1050, secondarySystemId: 1055 },
      1015: { primarySystemId: 1050, secondarySystemId: 1056 },
      1016: { primarySystemId: 1051, secondarySystemId: 1053 },
      1017: { primarySystemId: 1051, secondarySystemId: 1055 },
      1018: { primarySystemId: 1051, secondarySystemId: 1056 },
      1019: { primarySystemId: 1052, secondarySystemId: 1053 },
      1020: { primarySystemId: 1052, secondarySystemId: 1056 },
      // Riese + Zwerg (1021-1030) - KORRIGIERT
      1021: { primarySystemId: 1049, secondarySystemId: 1057 },
      1022: { primarySystemId: 1049, secondarySystemId: 1058 },
      1023: { primarySystemId: 1050, secondarySystemId: 1058 },
      1024: { primarySystemId: 1051, secondarySystemId: 1058 },
      1025: { primarySystemId: 1052, secondarySystemId: 1058 },
      1026: { primarySystemId: 1049, secondarySystemId: 1059 },
      1027: { primarySystemId: 1051, secondarySystemId: 1059 },
      1028: { primarySystemId: 1052, secondarySystemId: 1059 },
      1029: { primarySystemId: 1049, secondarySystemId: 1060 },
      1030: { primarySystemId: 1052, secondarySystemId: 1060 },
      // Zwerg + Zwerg (1031-1040)
      1031: { primarySystemId: 1057, secondarySystemId: 1057 },
      1032: { primarySystemId: 1058, secondarySystemId: 1057 },
      1033: { primarySystemId: 1058, secondarySystemId: 1058 },
      1034: { primarySystemId: 1058, secondarySystemId: 1059 },
      1035: { primarySystemId: 1058, secondarySystemId: 1060 },
      1036: { primarySystemId: 1059, secondarySystemId: 1057 },
      1037: { primarySystemId: 1059, secondarySystemId: 1059 },
      1038: { primarySystemId: 1059, secondarySystemId: 1060 },
      1039: { primarySystemId: 1060, secondarySystemId: 1057 },
      1040: { primarySystemId: 1060, secondarySystemId: 1060 },
      // Neutronenstern + Riese (1041-1044) - NEU
      1041: { primarySystemId: 1067, secondarySystemId: 1049 },
      1042: { primarySystemId: 1067, secondarySystemId: 1050 },
      1043: { primarySystemId: 1067, secondarySystemId: 1051 },
      1044: { primarySystemId: 1067, secondarySystemId: 1052 },
      // Schwarzes Loch + Riese (1045-1048) - NEU
      1045: { primarySystemId: 1063, secondarySystemId: 1049 },
      1046: { primarySystemId: 1061, secondarySystemId: 1050 },
      1047: { primarySystemId: 1061, secondarySystemId: 1051 },
      1048: { primarySystemId: 1062, secondarySystemId: 1052 },
    };

    return binaryMappings[binaryId] || null;
  }
}

/**
 * Hyperlane Generator Class for creating organic hyperspace routes
 * Connects important systems across the galaxy with flowing, non-linear paths
 */
export class HyperlaneGenerator {
  private readonly GALAXY_SECTORS_X = 6;
  private readonly GALAXY_SECTORS_Y = 6;
  private readonly FIELDS_PER_SECTOR = 20;

  /**
   * Route definitions for major hyperlanes
   */
  private readonly ROUTE_DEFINITIONS = [
    {
      name: "Core Worlds Route",
      color: "#00ffff", // Cyan
      type: "MAJOR",
      description: "Main trade route connecting central galaxy systems"
    },
    {
      name: "Outer Rim Circuit",
      color: "#ff6600", // Orange
      type: "MAJOR",
      description: "Frontier route connecting outer rim territories"
    },
    {
      name: "Trade Superhighway",
      color: "#00ff00", // Green
      type: "TRADE",
      description: "Major economic corridor linking commercial hubs"
    },
    {
      name: "Military Corridor",
      color: "#ff0000", // Red
      type: "MAJOR",
      description: "Strategic defensive route through secure sectors"
    },
    {
      name: "Exploration Path",
      color: "#9900ff", // Purple
      type: "MINOR",
      description: "Route to research stations and uncharted regions"
    }
  ];

  /**
   * Canonical Star Wars hyperlane route definitions with fixed sector endpoints
   * These routes converge at Core sectors (3,3) and (3,4) for galactic center formation
   */
  private readonly CANONICAL_ROUTES = [
    {
      name: "Perlemian Trade Route",
      color: "#0080ff", // Star Wars blue
      type: "MAJOR",
      startSector: { x: 3, y: 3 },
      endSector: { x: 6, y: 1 },
      coreSectors: [{ x: 3, y: 3 }],
      priority: 6,
      description: "Ancient hyperlane connecting Core Worlds to northern territories"
    },
    {
      name: "Corellian Run",
      color: "#ff4500", // Red-orange
      type: "MAJOR",
      startSector: { x: 3, y: 4 },
      endSector: { x: 6, y: 6 },
      coreSectors: [{ x: 3, y: 4 }],
      priority: 7,
      description: "Main Outer Rim trade route connecting Core to southeastern territories"
    },
    {
      name: "Hydian Way",
      color: "#8000ff", // Purple
      type: "MAJOR",
      startSector: { x: 3, y: 1 },
      endSector: { x: 3, y: 6 },
      coreSectors: [{ x: 3, y: 3 }, { x: 3, y: 4 }],
      priority: 8,
      description: "Major vertical galactic traversal route"
    },
    {
      name: "Rimma Trade Route",
      color: "#00ff80", // Green (different from existing green)
      type: "TRADE",
      startSector: { x: 3, y: 4 },
      endSector: { x: 1, y: 6 },
      coreSectors: [{ x: 3, y: 4 }],
      priority: 9,
      description: "Mining world supply route to southern territories"
    },
    {
      name: "Corellian Trade Spine",
      color: "#ffff00", // Yellow
      type: "SPINE",
      startSector: { x: 2, y: 3 },
      endSector: { x: 1, y: 5 },
      coreSectors: [{ x: 2, y: 3 }],
      priority: 10,
      description: "Secondary inner worlds connection route"
    }
  ];

  /**
   * Generate all hyperlane routes in the galaxy (both generic and canonical)
   */
  async generateHyperlanes(): Promise<void> {
    console.log('🌌 Starting hyperlane generation with 10 total routes (5 generic + 5 canonical)...');

    let totalHyperlaneFields = 0;

    // Phase 1: Generate 5 generic routes (existing system)
    console.log('🛤️  Phase 1: Generating 5 generic routes...');
    const anchorSystems = await this.selectAnchorSystems();
    console.log(`⚓ Selected ${anchorSystems.length} anchor systems for generic routes`);

    const genericRoutes = this.createRouteConnections(anchorSystems);
    console.log(`🔗 Created ${genericRoutes.length} generic route connections`);

    for (let index = 0; index < genericRoutes.length; index++) {
      const route = genericRoutes[index];
      if (index >= this.ROUTE_DEFINITIONS.length) break; // Safety check

      const routeDef = this.ROUTE_DEFINITIONS[index];
      console.log(`🎨 Generating generic route: ${routeDef.name}`);

      const hyperlanePath = await this.createOrganicPath(route, routeDef);
      if (hyperlanePath.length > 0) {
        await this.saveHyperlaneFields(hyperlanePath);
        totalHyperlaneFields += hyperlanePath.length;
        console.log(`✅ Generic route "${routeDef.name}": ${hyperlanePath.length} fields`);
      }
    }

    // Phase 2: Generate 5 canonical Star Wars routes (new system)
    console.log('⭐ Phase 2: Generating 5 canonical Star Wars routes...');

    for (const canonicalRoute of this.CANONICAL_ROUTES) {
      console.log(`🎨 Generating canonical route: ${canonicalRoute.name}`);

      const hyperlanePath = await this.createCanonicalPath(canonicalRoute);
      if (hyperlanePath.length > 0) {
        await this.saveHyperlaneFields(hyperlanePath);
        totalHyperlaneFields += hyperlanePath.length;
        console.log(`✅ Canonical route "${canonicalRoute.name}": ${hyperlanePath.length} fields`);
      }
    }

    console.log(`🎯 Hyperlane generation complete: ${totalHyperlaneFields} total hyperlane fields created`);
    console.log(`📊 Final tally: ${this.ROUTE_DEFINITIONS.length} generic + ${this.CANONICAL_ROUTES.length} canonical = ${this.ROUTE_DEFINITIONS.length + this.CANONICAL_ROUTES.length} total routes`);
  }

  /**
   * Create canonical path between fixed sector endpoints with Core convergence
   */
  private async createCanonicalPath(canonicalRoute: any): Promise<any[]> {
    const hyperlaneFields = [];

    // Convert sector coordinates to galaxy coordinates
    const startGalaxyX = (canonicalRoute.startSector.x - 1) * this.FIELDS_PER_SECTOR + 10; // Center of sector
    const startGalaxyY = (canonicalRoute.startSector.y - 1) * this.FIELDS_PER_SECTOR + 10;
    const endGalaxyX = (canonicalRoute.endSector.x - 1) * this.FIELDS_PER_SECTOR + 10;
    const endGalaxyY = (canonicalRoute.endSector.y - 1) * this.FIELDS_PER_SECTOR + 10;

    // Generate organic path using Perlin noise
    const path = this.generatePerlinNoisePath(
      startGalaxyX, startGalaxyY, endGalaxyX, endGalaxyY,
      canonicalRoute.coreSectors, canonicalRoute.name
    );

    // Apply Core sector convergence density
    const enhancedPath = this.applyCoreSectorDensity(path, canonicalRoute.coreSectors);

    // Convert path coordinates to SectorField data
    for (const coord of enhancedPath) {
      const sectorX = Math.ceil(coord.x / this.FIELDS_PER_SECTOR);
      const sectorY = Math.ceil(coord.y / this.FIELDS_PER_SECTOR);
      const fieldX = coord.x - (sectorX - 1) * this.FIELDS_PER_SECTOR;
      const fieldY = coord.y - (sectorY - 1) * this.FIELDS_PER_SECTOR;

      // Ensure coordinates are within valid bounds
      if (sectorX >= 1 && sectorX <= this.GALAXY_SECTORS_X &&
          sectorY >= 1 && sectorY <= this.GALAXY_SECTORS_Y &&
          fieldX >= 1 && fieldX <= this.FIELDS_PER_SECTOR &&
          fieldY >= 1 && fieldY <= this.FIELDS_PER_SECTOR) {

        hyperlaneFields.push({
          sectorX,
          sectorY,
          fieldX,
          fieldY,
          laneName: canonicalRoute.name,
          laneColor: canonicalRoute.color,
          laneType: canonicalRoute.type
        });
      }
    }

    return hyperlaneFields;
  }

  /**
   * Generate organic orthogonal path for canonical routes
   */
  private generatePerlinNoisePath(
    startX: number, startY: number, endX: number, endY: number,
    coreSectors: Array<{x: number, y: number}>, routeName: string
  ): Array<{x: number, y: number}> {
    const rng = new SeededRNG(routeName);
    const path: Array<{x: number, y: number}> = [];

    // Generate waypoints including mandatory Core sector convergence points
    const waypoints = this.generateCoreSectorWaypoints(startX, startY, endX, endY, coreSectors, rng);

    // Create continuous path through all waypoints using orthogonal organic curves
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segment = this.createOrganicOrthogonalPath(waypoints[i], waypoints[i + 1], routeName);

      // Add segment, avoiding duplicate points at waypoint connections
      if (i === 0) {
        path.push(...segment);
      } else {
        path.push(...segment.slice(1)); // Skip first point to avoid duplication
      }
    }

    // Remove duplicates while preserving order
    return this.removeDuplicates(path);
  }

  /**
   * Generate waypoints with mandatory Core sector convergence using orthogonal-friendly positioning
   */
  private generateCoreSectorWaypoints(
    startX: number, startY: number, endX: number, endY: number,
    coreSectors: Array<{x: number, y: number}>, rng: SeededRNG
  ): Array<{x: number, y: number}> {
    const waypoints = [];
    waypoints.push({ x: startX, y: startY });

    // Add intermediate waypoint before core to create L-shaped approach
    if (coreSectors.length > 0) {
      const firstCore = coreSectors[0];
      const coreGalaxyX = (firstCore.x - 1) * this.FIELDS_PER_SECTOR + 10; // Center of sector
      const coreGalaxyY = (firstCore.y - 1) * this.FIELDS_PER_SECTOR + 10;

      // Create L-shaped approach to core sector
      if (rng.nextBoolean(0.5)) {
        // Approach via X first, then Y
        waypoints.push({ x: coreGalaxyX, y: startY });
        waypoints.push({ x: coreGalaxyX, y: coreGalaxyY });
      } else {
        // Approach via Y first, then X
        waypoints.push({ x: startX, y: coreGalaxyY });
        waypoints.push({ x: coreGalaxyX, y: coreGalaxyY });
      }
    }

    // Add remaining Core sector waypoints
    for (let i = 1; i < coreSectors.length; i++) {
      const coreSector = coreSectors[i];
      const coreGalaxyX = (coreSector.x - 1) * this.FIELDS_PER_SECTOR + rng.nextInt(8, 12); // Slightly randomized center
      const coreGalaxyY = (coreSector.y - 1) * this.FIELDS_PER_SECTOR + rng.nextInt(8, 12);
      waypoints.push({ x: coreGalaxyX, y: coreGalaxyY });
    }

    // Create L-shaped approach to end point
    if (coreSectors.length > 0) {
      const lastCore = waypoints[waypoints.length - 1];
      if (rng.nextBoolean(0.5)) {
        // Exit via X first, then Y
        waypoints.push({ x: endX, y: lastCore.y });
      } else {
        // Exit via Y first, then X
        waypoints.push({ x: lastCore.x, y: endY });
      }
    }

    waypoints.push({ x: endX, y: endY });
    return waypoints;
  }

  /**
   * Generate organic-looking orthogonal path with controlled randomness
   * Uses L-shaped segments and direction changes for natural appearance
   */
  private createOrganicOrthogonalPath(
    start: {x: number, y: number}, end: {x: number, y: number},
    routeSeed: string
  ): Array<{x: number, y: number}> {
    const rng = new SeededRNG(routeSeed);
    const path: Array<{x: number, y: number}> = [];

    let currentX = start.x;
    let currentY = start.y;
    path.push({ x: currentX, y: currentY });

    // Create organic segments with occasional "L-shaped" detours
    while (currentX !== end.x || currentY !== end.y) {
      const distanceX = Math.abs(end.x - currentX);
      const distanceY = Math.abs(end.y - currentY);

      // Occasionally create L-shaped detours for organic appearance
      const shouldDetour = rng.nextBoolean(0.15) && (distanceX > 3 && distanceY > 3);

      if (shouldDetour) {
        // Create small L-shaped detour
        const detourLength = rng.nextInt(2, Math.min(4, Math.min(distanceX, distanceY)));

        // Choose detour direction
        if (rng.nextBoolean(0.5)) {
          // Move X first, then Y
          for (let i = 0; i < detourLength && currentX !== end.x; i++) {
            currentX += currentX < end.x ? 1 : -1;
            path.push({ x: currentX, y: currentY });
          }
          for (let i = 0; i < detourLength && currentY !== end.y; i++) {
            currentY += currentY < end.y ? 1 : -1;
            path.push({ x: currentX, y: currentY });
          }
        } else {
          // Move Y first, then X
          for (let i = 0; i < detourLength && currentY !== end.y; i++) {
            currentY += currentY < end.y ? 1 : -1;
            path.push({ x: currentX, y: currentY });
          }
          for (let i = 0; i < detourLength && currentX !== end.x; i++) {
            currentX += currentX < end.x ? 1 : -1;
            path.push({ x: currentX, y: currentY });
          }
        }
      } else {
        // Standard movement - prefer direction with larger remaining distance
        if (distanceX >= distanceY && currentX !== end.x) {
          currentX += currentX < end.x ? 1 : -1;
        } else if (currentY !== end.y) {
          currentY += currentY < end.y ? 1 : -1;
        }

        path.push({ x: currentX, y: currentY });
      }
    }

    return path;
  }

  /**
   * Apply Core sector density enhancement for strategic galactic center
   */
  private applyCoreSectorDensity(
    path: Array<{x: number, y: number}>,
    coreSectors: Array<{x: number, y: number}>
  ): Array<{x: number, y: number}> {
    return path.map(coord => {
      const sectorX = Math.ceil(coord.x / this.FIELDS_PER_SECTOR);
      const sectorY = Math.ceil(coord.y / this.FIELDS_PER_SECTOR);

      // Check if coordinate is in a core sector
      const isInCore = coreSectors.some(core =>
        core.x === sectorX && core.y === sectorY
      );

      if (isInCore) {
        // Add additional path density in core sectors for strategic importance
        // This creates visual convergence at the galactic center
        return coord; // For now, just return the coordinate (can enhance with additional points later)
      }

      return coord;
    });
  }

  /**
   * Select anchor systems across galaxy corners for route connections
   */
  private async selectAnchorSystems(): Promise<any[]> {
    // Define corner and edge sectors for strategic anchor placement
    const strategicSectors = [
      { x: 1, y: 1 }, { x: 6, y: 1 }, // Top corners
      { x: 1, y: 6 }, { x: 6, y: 6 }, // Bottom corners
      { x: 3, y: 1 }, { x: 4, y: 1 }, // Top center
      { x: 3, y: 6 }, { x: 4, y: 6 }, // Bottom center
      { x: 1, y: 3 }, { x: 1, y: 4 }, // Left center
      { x: 6, y: 3 }, { x: 6, y: 4 }, // Right center
    ];

    const anchorSystems = [];

    for (const sectorCoord of strategicSectors) {
      // Find systems in this strategic sector
      const systems = await prisma.system.findMany({
        where: {
          sector: {
            x: sectorCoord.x,
            y: sectorCoord.y
          }
        },
        include: {
          sector: true,
          planets: true
        }
      });

      if (systems.length > 0) {
        // Prefer systems with more planets (higher importance)
        const bestSystem = systems.reduce((prev, current) =>
          current.planets.length > prev.planets.length ? current : prev
        );

        anchorSystems.push({
          system: bestSystem,
          galaxyX: (bestSystem.sector.x - 1) * this.FIELDS_PER_SECTOR + bestSystem.fieldX,
          galaxyY: (bestSystem.sector.y - 1) * this.FIELDS_PER_SECTOR + bestSystem.fieldY,
          sectorX: bestSystem.sector.x,
          sectorY: bestSystem.sector.y,
          fieldX: bestSystem.fieldX,
          fieldY: bestSystem.fieldY,
          importance: bestSystem.planets.length
        });
      }
    }

    return anchorSystems.slice(0, 12); // Maximum 12 anchor systems
  }

  /**
   * Create route connections between anchor systems
   */
  private createRouteConnections(anchorSystems: any[]): Array<{start: any, end: any}> {
    const routes = [];
    const usedSystems = new Set();

    // Generate 5 major routes connecting different anchor systems
    for (let i = 0; i < Math.min(5, this.ROUTE_DEFINITIONS.length); i++) {
      const availableStarts = anchorSystems.filter(sys => !usedSystems.has(sys.system.id));
      const availableEnds = anchorSystems.filter(sys => !usedSystems.has(sys.system.id));

      if (availableStarts.length === 0 || availableEnds.length === 0) break;

      // Select start and end systems with good distribution
      const startSystem = availableStarts[Math.floor(Math.random() * availableStarts.length)];

      // Prefer distant systems for interesting routes
      const endCandidates = availableEnds.filter(sys => {
        const distance = Math.abs(sys.galaxyX - startSystem.galaxyX) +
                        Math.abs(sys.galaxyY - startSystem.galaxyY);
        return sys.system.id !== startSystem.system.id && distance > 40; // Prefer routes across at least 2 sectors
      });

      if (endCandidates.length > 0) {
        const endSystem = endCandidates[Math.floor(Math.random() * endCandidates.length)];

        routes.push({
          start: startSystem,
          end: endSystem
        });

        usedSystems.add(startSystem.system.id);
        usedSystems.add(endSystem.system.id);
      }
    }

    return routes;
  }

  /**
   * Create an organic path between two systems using guided pathfinding
   */
  private async createOrganicPath(route: {start: any, end: any}, routeDef: any): Promise<any[]> {
    const { start, end } = route;
    const hyperlaneFields = [];

    // Modified A* pathfinding with organic curves
    const startX = start.galaxyX;
    const startY = start.galaxyY;
    const endX = end.galaxyX;
    const endY = end.galaxyY;

    const path = this.findOrganicPath(startX, startY, endX, endY);

    // Convert path coordinates to SectorField data
    for (const coord of path) {
      const sectorX = Math.ceil(coord.x / this.FIELDS_PER_SECTOR);
      const sectorY = Math.ceil(coord.y / this.FIELDS_PER_SECTOR);
      const fieldX = coord.x - (sectorX - 1) * this.FIELDS_PER_SECTOR;
      const fieldY = coord.y - (sectorY - 1) * this.FIELDS_PER_SECTOR;

      // Ensure coordinates are within valid bounds
      if (sectorX >= 1 && sectorX <= this.GALAXY_SECTORS_X &&
          sectorY >= 1 && sectorY <= this.GALAXY_SECTORS_Y &&
          fieldX >= 1 && fieldX <= this.FIELDS_PER_SECTOR &&
          fieldY >= 1 && fieldY <= this.FIELDS_PER_SECTOR) {

        hyperlaneFields.push({
          sectorX,
          sectorY,
          fieldX,
          fieldY,
          laneName: routeDef.name,
          laneColor: routeDef.color,
          laneType: routeDef.type
        });
      }
    }

    return hyperlaneFields;
  }

  /**
   * Find continuous organic path between two points using waypoints + orthogonal pathfinding
   * Ensures no gaps between route segments and only uses 4-directional movement
   */
  private findOrganicPath(startX: number, startY: number, endX: number, endY: number): Array<{x: number, y: number}> {
    // 1. Generate sparse waypoints with organic curves (reduced randomness)
    const waypoints = this.generateWaypoints(startX, startY, endX, endY);

    // 2. Create orthogonal path through all waypoints
    return this.createOrthogonalWaypointPath(waypoints);
  }

  /**
   * Generate orthogonal path through multiple waypoints
   * Each segment uses only 4-directional movement
   */
  private createOrthogonalWaypointPath(waypoints: Array<{x: number, y: number}>): Array<{x: number, y: number}> {
    const fullPath: Array<{x: number, y: number}> = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const segment = this.createOrthogonalPath(waypoints[i], waypoints[i + 1]);

      // Add segment, avoiding duplicate points at waypoint connections
      if (i === 0) {
        fullPath.push(...segment);
      } else {
        fullPath.push(...segment.slice(1)); // Skip first point to avoid duplication
      }
    }

    // Remove duplicates while preserving order
    return this.removeDuplicates(fullPath);
  }

  /**
   * Generate orthogonal-friendly waypoints with controlled organic variation
   * Ensures waypoints follow Manhattan distance principles
   */
  private generateWaypoints(startX: number, startY: number, endX: number, endY: number): Array<{x: number, y: number}> {
    const waypoints: Array<{x: number, y: number}> = [];
    waypoints.push({ x: startX, y: startY });

    const totalDistance = Math.abs(endX - startX) + Math.abs(endY - startY);
    const waypointCount = Math.max(Math.floor(totalDistance / 20), 2); // Fewer waypoints for better control

    const rng = new SeededRNG(`waypoints-${startX}-${startY}-${endX}-${endY}`);

    for (let i = 1; i < waypointCount; i++) {
      const progress = i / waypointCount;

      // Create L-shaped intermediate waypoints that maintain orthogonal paths
      let waypointX: number;
      let waypointY: number;

      if (rng.nextBoolean(0.5)) {
        // Move primarily in X direction first, then Y
        const xProgress = Math.min(progress * 1.5, 1); // Move faster in X initially
        const yProgress = Math.max((progress - 0.5) * 2, 0); // Move in Y later
        waypointX = Math.round(startX + (endX - startX) * xProgress);
        waypointY = Math.round(startY + (endY - startY) * yProgress);
      } else {
        // Move primarily in Y direction first, then X
        const yProgress = Math.min(progress * 1.5, 1); // Move faster in Y initially
        const xProgress = Math.max((progress - 0.5) * 2, 0); // Move in X later
        waypointX = Math.round(startX + (endX - startX) * xProgress);
        waypointY = Math.round(startY + (endY - startY) * yProgress);
      }

      // Add small orthogonal variance for organic feel (±2 fields max)
      const varianceX = rng.nextInt(-2, 2);
      const varianceY = rng.nextInt(-2, 2);

      // Apply variance one direction at a time (orthogonal principle)
      if (rng.nextBoolean(0.5)) {
        waypointX += varianceX;
      } else {
        waypointY += varianceY;
      }

      // Clamp to galaxy bounds
      waypointX = Math.max(1, Math.min(this.GALAXY_SECTORS_X * this.FIELDS_PER_SECTOR, waypointX));
      waypointY = Math.max(1, Math.min(this.GALAXY_SECTORS_Y * this.FIELDS_PER_SECTOR, waypointY));

      // Ensure waypoint is different from previous waypoint
      if (waypoints.length > 0) {
        const prevWaypoint = waypoints[waypoints.length - 1];
        if (waypointX !== prevWaypoint.x || waypointY !== prevWaypoint.y) {
          waypoints.push({ x: waypointX, y: waypointY });
        }
      } else {
        waypoints.push({ x: waypointX, y: waypointY });
      }
    }

    waypoints.push({ x: endX, y: endY });
    return waypoints;
  }

  /**
   * Create orthogonal path between two points using only 4-directional movement
   * No diagonal connections - only up/down/left/right steps
   */
  private createOrthogonalPath(start: {x: number, y: number}, end: {x: number, y: number}): Array<{x: number, y: number}> {
    const path: Array<{x: number, y: number}> = [];
    let currentX = start.x;
    let currentY = start.y;

    path.push({ x: currentX, y: currentY });

    // Create organic curve by alternating between horizontal and vertical movement
    // with occasional direction changes for visual variety
    const rng = new SeededRNG(`${start.x}-${start.y}-${end.x}-${end.y}`);

    while (currentX !== end.x || currentY !== end.y) {
      const needsMoveX = currentX !== end.x;
      const needsMoveY = currentY !== end.y;

      if (needsMoveX && needsMoveY) {
        // Create organic feel with smart direction bias
        const distanceX = Math.abs(end.x - currentX);
        const distanceY = Math.abs(end.y - currentY);

        // Prefer direction with larger remaining distance, with some randomness
        const preferX = distanceX >= distanceY;
        const shouldMoveX = preferX ? rng.nextBoolean(0.7) : rng.nextBoolean(0.3);

        if (shouldMoveX && needsMoveX) {
          currentX += currentX < end.x ? 1 : -1;
        } else if (needsMoveY) {
          currentY += currentY < end.y ? 1 : -1;
        }
      } else if (needsMoveX) {
        currentX += currentX < end.x ? 1 : -1;
      } else if (needsMoveY) {
        currentY += currentY < end.y ? 1 : -1;
      }

      path.push({ x: currentX, y: currentY });
    }

    return path;
  }

  /**
   * Remove duplicate points while preserving order
   */
  private removeDuplicates(path: Array<{x: number, y: number}>): Array<{x: number, y: number}> {
    const seen = new Set<string>();
    const result = [];

    for (const point of path) {
      const key = `${point.x},${point.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(point);
      }
    }

    return result;
  }

  /**
   * Save hyperlane fields to database
   */
  private async saveHyperlaneFields(hyperlaneFields: any[]): Promise<void> {
    for (const field of hyperlaneFields) {
      try {
        // Find the sector
        const sector = await prisma.sector.findFirst({
          where: {
            x: field.sectorX,
            y: field.sectorY
          }
        });

        if (!sector) {
          console.warn(`Sector ${field.sectorX},${field.sectorY} not found`);
          continue;
        }

        // Create or update the sector field
        await prisma.sectorField.upsert({
          where: {
            sectorId_fieldX_fieldY: {
              sectorId: sector.id,
              fieldX: field.fieldX,
              fieldY: field.fieldY
            }
          },
          update: {
            isHyperlane: true,
            laneName: field.laneName,
            laneColor: field.laneColor,
            laneType: field.laneType
          },
          create: {
            sectorId: sector.id,
            fieldX: field.fieldX,
            fieldY: field.fieldY,
            isHyperlane: true,
            laneName: field.laneName,
            laneColor: field.laneColor,
            laneType: field.laneType
          }
        });
      } catch (error) {
        console.error(`Error saving hyperlane field ${field.sectorX},${field.sectorY} (${field.fieldX},${field.fieldY}):`, error);
      }
    }
  }

  /**
   * Clear all existing hyperlane data (for regeneration)
   */
  async clearHyperlanes(): Promise<void> {
    await prisma.sectorField.deleteMany({
      where: {
        isHyperlane: true
      }
    });
    console.log('🧹 Cleared all existing hyperlane data');
  }
}

export const galaxyService = new GalaxyService();

