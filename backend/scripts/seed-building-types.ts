import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Field Types Reference:
 *
 * ORBIT Layer (y: 0-1):
 *   - SPACE: Orbital construction zone
 *
 * SURFACE Layer (y: 2-7):
 *   - LAND: Standard terrain for most buildings
 *   - WATER: Aquatic areas (lakes, oceans)
 *   - MOUNTAIN: Rocky elevated terrain
 *
 * UNDERGROUND Layer (y: 8-9):
 *   - ROCK: Standard underground
 *   - CRYSTAL: Crystal-rich deposits
 *   - METAL: Metal ore deposits
 */

async function seedBuildingTypes() {
  console.log('Seeding building types with terrain restrictions...');

  // Delete existing buildings before deleting types to avoid foreign key constraints
  await prisma.building.deleteMany({});
  console.log('✓ Deleted existing buildings');

  // Delete old building types
  await prisma.buildingType.deleteMany({});

  const buildingTypes = [
    // ===== BASIS-GEBAEUDE (SURFACE - LAND) =====
    {
      name: 'Kommandozentrale',
      description: 'Das Herz deiner Kolonie. Generiert Credits und ermoeglicht Bevoelkerungswachstum.',
      category: 'INFRASTRUCTURE',
      allowedFieldTypes: 'LAND', // Only on land
      buildCostCredits: 0,
      buildCostDurastahl: 0,
      buildCostKristallinesSilizium: 0,
      buildTime: 0,
      energyCostPerTick: 0,
      energyCostToBuild: 0,
      energyProduction: 20,
      creditProduction: 100,
      storageBonus: 500,
    },
    {
      name: 'Solarkraftwerk',
      description: 'Erzeugt Energie fuer deine Gebaeude und Produktion. Benoetigt offenes Land.',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,MOUNTAIN', // Land or elevated areas (good for sun)
      buildCostCredits: 300,
      buildCostDurastahl: 100,
      buildCostKristallinesSilizium: 0,
      buildTime: 5,
      energyCostPerTick: 0,
      energyCostToBuild: 100,
      energyProduction: 50,
    },
    {
      name: 'Durastahl-Mine',
      description: 'Foerdert Durastahl fuer Schiffs- und Gebaedekonstruktion.',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,MOUNTAIN,ROCK,METAL', // Surface or underground mining
      buildCostCredits: 400,
      buildCostDurastahl: 50,
      buildCostKristallinesSilizium: 0,
      buildTime: 10,
      energyCostPerTick: 10,
      energyCostToBuild: 150,
      durastahlProduction: 30,
    },
    {
      name: 'Kristallraffinerie',
      description: 'Gewinnt Kristallines Silizium fuer fortgeschrittene Technologie.',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,MOUNTAIN,ROCK,CRYSTAL', // Surface or underground
      buildCostCredits: 500,
      buildCostDurastahl: 150,
      buildCostKristallinesSilizium: 0,
      buildTime: 15,
      energyCostToBuild: 150,
      energyCostPerTick: 15,
      kristallinesSiliziumProduction: 20,
    },
    {
      name: 'Lagerhaus',
      description: 'Erhoeht die Lagerkapazitaet fuer Ressourcen.',
      category: 'INFRASTRUCTURE',
      allowedFieldTypes: 'LAND,ROCK', // Surface or underground storage
      buildCostCredits: 300,
      buildCostDurastahl: 100,
      buildCostKristallinesSilizium: 0,
      buildTime: 5,
      energyCostToBuild: 50,
      energyCostPerTick: 5,
      storageBonus: 500,
    },
    {
      name: 'Handelszentrum',
      description: 'Ermoeglicht Handel mit anderen Spielern und generiert zusaetzliche Credits.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'LAND', // Only on land (needs access)
      buildCostCredits: 600,
      buildCostDurastahl: 200,
      buildCostKristallinesSilizium: 50,
      buildTime: 15,
      energyCostToBuild: 150,
      energyCostPerTick: 10,
      creditProduction: 50,
    },

    // ===== ORBITAL GEBAEUDE (ORBIT - SPACE) =====
    {
      name: 'Orbitales Raumdock',
      description: 'Orbitale Werft fuer den Bau von Raumschiffen. Ermoeglicht den Zugriff auf den modularen Blueprint-Editor.',
      category: 'ORBITAL',
      allowedFieldTypes: 'SPACE', // Only in orbit
      buildCostCredits: 800,
      buildCostDurastahl: 400,
      buildCostKristallinesSilizium: 200,
      buildTime: 20,
      energyCostToBuild: 200,
      energyCostPerTick: 25,
    },
    {
      name: 'Orbitale Handelsstation',
      description: 'Eine Raumstation fuer interstellaren Handel. Erhoehter Credit-Bonus.',
      category: 'ORBITAL',
      allowedFieldTypes: 'SPACE', // Only in orbit
      buildCostCredits: 1200,
      buildCostDurastahl: 600,
      buildCostKristallinesSilizium: 300,
      buildTime: 25,
      energyCostToBuild: 250,
      energyCostPerTick: 20,
      creditProduction: 100,
    },
    {
      name: 'Orbitale Verteidigungsplattform',
      description: 'Bewaffnete Raumstation zur Verteidigung des Planeten aus dem Orbit.',
      category: 'ORBITAL',
      allowedFieldTypes: 'SPACE', // Only in orbit
      buildCostCredits: 1500,
      buildCostDurastahl: 1000,
      buildCostKristallinesSilizium: 500,
      buildTime: 30,
      energyCostToBuild: 400,
      energyCostPerTick: 50,
    },

    // ===== FORSCHUNG & SPEZIAL (SURFACE) =====
    {
      name: 'Forschungslabor',
      description: 'Entwickelt neue Technologien fuer fortgeschrittene Gebaeude, Schiffe und Upgrades.',
      category: 'RESEARCH',
      allowedFieldTypes: 'LAND', // Standard surface building
      buildCostCredits: 1000,
      buildCostDurastahl: 300,
      buildCostKristallinesSilizium: 500,
      buildTime: 25,
      energyCostToBuild: 250,
      energyCostPerTick: 20,
    },
    {
      name: 'Hangar',
      description: 'Beherbergt deine Raumschiffe und erhoeht die maximale Flottenkapazitaet.',
      category: 'INFRASTRUCTURE',
      allowedFieldTypes: 'LAND', // Needs flat surface for landing
      buildCostCredits: 500,
      buildCostDurastahl: 300,
      buildCostKristallinesSilizium: 100,
      buildTime: 12,
      energyCostToBuild: 120,
      energyCostPerTick: 10,
    },

    // ===== VERTEIDIGUNG (MULTIPLE TERRAINS) =====
    {
      name: 'Verteidigungsgitter',
      description: 'Bietet planetare Verteidigung gegen feindliche Flotten.',
      category: 'DEFENSE',
      allowedFieldTypes: 'LAND,MOUNTAIN', // Surface defense, elevated good for range
      buildCostCredits: 600,
      buildCostDurastahl: 500,
      buildCostKristallinesSilizium: 100,
      buildTime: 15,
      energyCostToBuild: 150,
      energyCostPerTick: 30,
    },
    {
      name: 'Plasmaturm',
      description: 'Fortgeschrittenes Verteidigungssystem mit Plasmawaffenplattformen.',
      category: 'DEFENSE',
      allowedFieldTypes: 'LAND,MOUNTAIN', // Elevated positions optimal
      buildCostCredits: 1200,
      buildCostDurastahl: 800,
      buildCostKristallinesSilizium: 400,
      buildCostEnergiemodule: 30,
      buildTime: 30,
      energyCostToBuild: 300,
      energyCostPerTick: 40,
    },
    {
      name: 'Planetarer Schild',
      description: 'Energieschild zum Schutz des gesamten Planeten vor Angriffen. Wird aus dem Orbit projiziert.',
      category: 'DEFENSE',
      allowedFieldTypes: 'SPACE', // Shield generator in orbit
      buildCostCredits: 3000,
      buildCostDurastahl: 2000,
      buildCostKristallinesSilizium: 1500,
      buildCostKyberKristalle: 50,
      buildTime: 60,
      energyCostToBuild: 600,
      energyCostPerTick: 100,
    },
    {
      name: 'Unterirdischer Bunker',
      description: 'Versteckter Bunker fuer kritische Ressourcen und Schutz vor Bombardement.',
      category: 'DEFENSE',
      allowedFieldTypes: 'ROCK', // Underground only
      buildCostCredits: 800,
      buildCostDurastahl: 600,
      buildCostKristallinesSilizium: 200,
      buildTime: 20,
      energyCostToBuild: 200,
      energyCostPerTick: 15,
      storageBonus: 1000, // Secure storage
    },

    // ===== RESSOURCEN - SPEZIELLE TERRAINS =====
    {
      name: 'Tibanna-Raffinerie',
      description: 'Extrahiert wertvolles Tibanna-Gas. Kann auch auf Wasser gebaut werden (Gas-Gewinnung).',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,WATER', // Land or water extraction
      buildCostCredits: 1200,
      buildCostDurastahl: 600,
      buildCostKristallinesSilizium: 300,
      buildTime: 30,
      energyCostToBuild: 300,
      energyCostPerTick: 25,
      tibannaGasProduction: 15,
    },
    {
      name: 'Energiemodulfabrik',
      description: 'Produziert portable Energiemodule fuer Raumschiffe und Technologie.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'LAND', // Factory needs stable ground
      buildCostCredits: 1500,
      buildCostDurastahl: 800,
      buildCostKristallinesSilizium: 400,
      buildCostTibannaGas: 100,
      buildTime: 35,
      energyCostToBuild: 350,
      energyCostPerTick: 40,
      energiemoduleProduction: 10,
    },
    {
      name: 'Kyber-Extraktionsanlage',
      description: 'Extrahiert seltene Kyber-Kristalle fuer Laser- und Lichtschwerttechnologie.',
      category: 'RESOURCE',
      allowedFieldTypes: 'CRYSTAL', // Only in crystal deposits underground
      buildCostCredits: 2500,
      buildCostDurastahl: 1500,
      buildCostKristallinesSilizium: 1000,
      buildCostTibannaGas: 200,
      buildTime: 50,
      energyCostToBuild: 500,
      energyCostPerTick: 60,
      kyberKristalleProduction: 5,
    },
    {
      name: 'Bacta-Labor',
      description: 'Produziert Bacta fuer medizinische Versorgung und Truppenheilung.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'LAND,WATER', // Can be built near water for bacta growth
      buildCostCredits: 2000,
      buildCostDurastahl: 1000,
      buildCostKristallinesSilizium: 800,
      buildCostEnergiemodule: 50,
      buildTime: 40,
      energyCostToBuild: 400,
      energyCostPerTick: 35,
      bactaProduction: 8,
    },
    {
      name: 'Beskar-Schmiede',
      description: 'Verarbeitet rohes Beskar-Erz zu hochfesten Platten fuer ultimative Ruestungen und Schiffe.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'MOUNTAIN,METAL', // Mountain (volcanic) or metal deposits
      buildCostCredits: 5000,
      buildCostDurastahl: 3000,
      buildCostKristallinesSilizium: 2000,
      buildCostEnergiemodule: 200,
      buildTime: 90,
      energyCostToBuild: 900,
      energyCostPerTick: 80,
      beskarProduction: 3,
    },
    {
      name: 'Verarbeitungsanlage',
      description: 'Verarbeitet Rohstoffe effizienter und steigert Durastahl- und Kristallproduktion.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'LAND,ROCK', // Surface or underground processing
      buildCostCredits: 700,
      buildCostDurastahl: 200,
      buildCostKristallinesSilizium: 150,
      buildTime: 18,
      energyCostToBuild: 180,
      energyCostPerTick: 15,
      durastahlProduction: 15,
      kristallinesSiliziumProduction: 10,
    },

    // ===== ERWEITERTE ENERGIE-GEBAEUDE =====
    {
      name: 'Fusionsreaktor',
      description: 'Hochleistungs-Energieproduktion durch Fusionsreaktor-Technologie.',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,ROCK', // Surface or underground (safety)
      buildCostCredits: 1000,
      buildCostDurastahl: 500,
      buildCostKristallinesSilizium: 300,
      buildTime: 25,
      energyCostToBuild: 250,
      energyCostPerTick: 0,
      energyProduction: 100,
    },
    {
      name: 'Erweiterte Solarzellen',
      description: 'Verbesserte Solartechnologie fuer hoehere Energieausbeute.',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,MOUNTAIN,SPACE', // Surface, elevated, or orbital solar
      buildCostCredits: 600,
      buildCostDurastahl: 250,
      buildCostKristallinesSilizium: 100,
      buildTime: 15,
      energyCostToBuild: 150,
      energyCostPerTick: 0,
      energyProduction: 75,
    },
    {
      name: 'Hyperreaktor',
      description: 'Ultimative Energieproduktion durch Hyperraum-Technologie.',
      category: 'RESOURCE',
      allowedFieldTypes: 'ROCK', // Deep underground for safety
      buildCostCredits: 2500,
      buildCostDurastahl: 1500,
      buildCostKristallinesSilizium: 1000,
      buildCostEnergiemodule: 100,
      buildTime: 45,
      energyCostToBuild: 450,
      energyCostPerTick: 0,
      energyProduction: 200,
    },
    {
      name: 'Gezeitenkraftwerk',
      description: 'Nutzt Gezeitenkraefte auf Wasserflaechen zur Energiegewinnung.',
      category: 'RESOURCE',
      allowedFieldTypes: 'WATER', // Only on water
      buildCostCredits: 800,
      buildCostDurastahl: 400,
      buildCostKristallinesSilizium: 200,
      buildTime: 20,
      energyCostToBuild: 200,
      energyCostPerTick: 0,
      energyProduction: 60,
    },

    // ===== ERWEITERTE PRODUKTIONS-GEBAEUDE =====
    {
      name: 'Automatisierte Mine',
      description: 'Vollautomatisierte Durastahl-Mine mit erhoehter Ausbeute.',
      category: 'RESOURCE',
      allowedFieldTypes: 'MOUNTAIN,ROCK,METAL', // Mining terrain
      buildCostCredits: 800,
      buildCostDurastahl: 200,
      buildCostKristallinesSilizium: 100,
      buildTime: 20,
      energyCostToBuild: 200,
      energyCostPerTick: 15,
      durastahlProduction: 50,
    },
    {
      name: 'Kristallsyntheseanlage',
      description: 'Synthetische Kristallproduktion fuer fortgeschrittene Technologie.',
      category: 'RESOURCE',
      allowedFieldTypes: 'LAND,CRYSTAL', // Surface or crystal deposits
      buildCostCredits: 900,
      buildCostDurastahl: 300,
      buildCostKristallinesSilizium: 150,
      buildTime: 22,
      energyCostToBuild: 220,
      energyCostPerTick: 20,
      kristallinesSiliziumProduction: 35,
    },
    {
      name: 'Mega-Raffinerie',
      description: 'Gigantische Verarbeitungsanlage fuer eine hohe, kombinierte Ressourcenausbeute.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'LAND', // Needs lots of space on surface
      buildCostCredits: 1800,
      buildCostDurastahl: 800,
      buildCostKristallinesSilizium: 600,
      buildCostTibannaGas: 150,
      buildTime: 35,
      energyCostToBuild: 350,
      energyCostPerTick: 30,
      durastahlProduction: 60,
      kristallinesSiliziumProduction: 40,
    },

    // ===== WASSER-SPEZIFISCHE GEBAEUDE =====
    {
      name: 'Aqua-Farm',
      description: 'Unterwasser-Landwirtschaft fuer Nahrung und biologische Ressourcen.',
      category: 'PRODUCTION',
      allowedFieldTypes: 'WATER', // Water only
      buildCostCredits: 400,
      buildCostDurastahl: 200,
      buildCostKristallinesSilizium: 100,
      buildTime: 12,
      energyCostToBuild: 100,
      energyCostPerTick: 8,
      creditProduction: 30,
    },
    {
      name: 'Unterwasser-Basis',
      description: 'Versteckte Basis unter Wasser. Bietet Schutz und Lagerkapazitaet.',
      category: 'INFRASTRUCTURE',
      allowedFieldTypes: 'WATER', // Water only
      buildCostCredits: 1000,
      buildCostDurastahl: 500,
      buildCostKristallinesSilizium: 300,
      buildTime: 25,
      energyCostToBuild: 250,
      energyCostPerTick: 20,
      storageBonus: 750,
    },

    // ===== UNTERGRUND-SPEZIFISCHE GEBAEUDE =====
    {
      name: 'Tiefenmine',
      description: 'Tiefe unterirdische Mine mit stark erhoehter Metallausbeute.',
      category: 'RESOURCE',
      allowedFieldTypes: 'METAL', // Only on metal deposits
      buildCostCredits: 1200,
      buildCostDurastahl: 400,
      buildCostKristallinesSilizium: 200,
      buildTime: 28,
      energyCostToBuild: 280,
      energyCostPerTick: 25,
      durastahlProduction: 80,
    },
    {
      name: 'Untergrund-Lager',
      description: 'Grosses unterirdisches Lager fuer sichere Ressourcenaufbewahrung.',
      category: 'INFRASTRUCTURE',
      allowedFieldTypes: 'ROCK', // Underground storage
      buildCostCredits: 600,
      buildCostDurastahl: 300,
      buildCostKristallinesSilizium: 100,
      buildTime: 15,
      energyCostToBuild: 100,
      energyCostPerTick: 5,
      storageBonus: 1500,
    },
  ];

  for (const building of buildingTypes) {
    await prisma.buildingType.create({
      data: building,
    });
    console.log(`✓ Created ${building.name} [${building.allowedFieldTypes}]`);
  }

  // Summary by terrain type
  console.log('\n=== TERRAIN SUMMARY ===');
  const terrains = ['LAND', 'WATER', 'MOUNTAIN', 'SPACE', 'ROCK', 'CRYSTAL', 'METAL'];
  for (const terrain of terrains) {
    const count = buildingTypes.filter(b => b.allowedFieldTypes.includes(terrain)).length;
    console.log(`${terrain}: ${count} buildings`);
  }

  console.log(`\nDone! Created ${buildingTypes.length} building types.`);
}

seedBuildingTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
