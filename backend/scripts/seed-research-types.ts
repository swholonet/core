import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Faction IDs
const IMPERIAL = 1;
const REBEL = 2;

async function seedResearchTypes() {
  console.log('Seeding research types with faction-specific research...');

  const researchTypes = [
    // ========== LEVEL 0 - Production-based (Universal) ==========
    {
      name: 'Energieeffizienz',
      description: 'Verbesserte Energiesysteme ermoeglichen den Bau von Fusionsreaktoren.',
      category: 'ENERGY',
      researchLevel: 0,
      factionId: null, // Universal
      researchPointCost: 0,
      requiredLabCount: 0,
      requiredEnergyPerTick: 50,
      requiredEnergyTotal: 150,
      unlocksBuilding: 'Fusionsreaktor',
    },
    {
      name: 'Fortgeschrittener Bergbau',
      description: 'Automatisierte Bergbautechnologie fuer hoehere Durastahl-Ausbeute.',
      category: 'ECONOMICS',
      researchLevel: 0,
      factionId: null, // Universal
      researchPointCost: 0,
      requiredLabCount: 0,
      requiredDurastahlPerTick: 30,
      requiredDurastahlTotal: 60,
      unlocksBuilding: 'Automatisierte Mine',
    },
    {
      name: 'Kristallverarbeitung',
      description: 'Synthetische Kristallproduktion fuer fortgeschrittene Technologie.',
      category: 'SCIENCE',
      researchLevel: 0,
      factionId: null, // Universal
      researchPointCost: 0,
      requiredLabCount: 0,
      requiredKristallinesSiliziumPerTick: 20,
      requiredKristallinesSiliziumTotal: 60,
      unlocksBuilding: 'Kristallsyntheseanlage',
    },

    // ========== LEVEL 1 - Basic Research (Universal) ==========
    // ECONOMICS (Universal)
    {
      name: 'Handelsnetzwerk',
      description: 'Verbesserte Handelsrouten generieren mehr Credits.',
      category: 'ECONOMICS',
      researchLevel: 1,
      factionId: null, // Universal
      researchPointCost: 100,
      requiredLabCount: 1,
      bonusType: 'TRADE_BONUS',
      bonusValue: 20,
    },
    {
      name: 'Bergbauoptimierung',
      description: 'Effizientere Abbaumethoden erhoehen die Ressourcenausbeute.',
      category: 'ECONOMICS',
      researchLevel: 1,
      factionId: null, // Universal
      researchPointCost: 120,
      requiredLabCount: 1,
      bonusType: 'MINING_BONUS',
      bonusValue: 10,
    },
    {
      name: 'Steuerverwaltung',
      description: 'Verbesserte Verwaltung generiert zusaetzliche Credits aus Planeten.',
      category: 'ECONOMICS',
      researchLevel: 1,
      factionId: null, // Universal
      researchPointCost: 140,
      requiredLabCount: 1,
      bonusType: 'CREDIT_BONUS',
      bonusValue: 15,
    },

    // ENERGY (Universal)
    {
      name: 'Erweiterte Energiesysteme',
      description: 'Schaltet verbesserte Energiegebaeude frei.',
      category: 'ENERGY',
      researchLevel: 1,
      factionId: null, // Universal
      researchPointCost: 120,
      requiredLabCount: 1,
      unlocksBuilding: 'Erweiterte Solarzellen',
    },
    {
      name: 'Energieeffizienz I',
      description: 'Reduziert den Energieverbrauch aller Gebaeude um 10%.',
      category: 'ENERGY',
      researchLevel: 1,
      factionId: null, // Universal
      researchPointCost: 160,
      requiredLabCount: 1,
      bonusType: 'ENERGY_EFFICIENCY',
      bonusValue: 10,
    },

    // SCIENCE (Universal)
    {
      name: 'Computerforschung I',
      description: 'Verbesserte Datenverarbeitung erhoeht die Forschungsgeschwindigkeit.',
      category: 'SCIENCE',
      researchLevel: 1,
      factionId: null, // Universal
      researchPointCost: 200,
      requiredLabCount: 1,
      bonusType: 'RESEARCH_BONUS',
      bonusValue: 10,
    },

    // ========== MILITARY LEVEL 1 - Faction Specific ==========
    // IMPERIAL MILITARY
    {
      name: 'TIE-Jaeger Produktion',
      description: 'Ermoeglicht den Bau von TIE-Jaegern - dem Standard-Jaeger des Imperiums.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: IMPERIAL,
      researchPointCost: 150,
      requiredLabCount: 1,
      unlocksShip: 'TIE-Jaeger',
    },
    {
      name: 'TIE-Bomber Technologie',
      description: 'Freischaltung von TIE-Bombern fuer schwere Angriffe auf Bodenziele.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: IMPERIAL,
      researchPointCost: 180,
      requiredLabCount: 1,
      unlocksShip: 'TIE-Bomber',
    },
    {
      name: 'Imperiale Waffensysteme I',
      description: 'Grundlegende imperiale Verteidigungssysteme fuer planetare Abwehr.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: IMPERIAL,
      researchPointCost: 200,
      requiredLabCount: 1,
      unlocksBuilding: 'Plasmaturm',
    },
    {
      name: 'Turbolaser-Batterien',
      description: 'Schwere Laserwaffentechnologie fuer imperiale Planeten- und Schiffsverteidigung.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: IMPERIAL,
      researchPointCost: 250,
      requiredLabCount: 1,
      bonusType: 'DEFENSE_BONUS',
      bonusValue: 15,
    },

    // REBEL MILITARY
    {
      name: 'X-Wing Produktion',
      description: 'Ermoeglicht den Bau von X-Wing-Jaegern - dem vielseitigsten Jaeger der Rebellen.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: REBEL,
      researchPointCost: 150,
      requiredLabCount: 1,
      unlocksShip: 'X-Wing',
    },
    {
      name: 'Y-Wing Bomber',
      description: 'Freischaltung von Y-Wing-Bombern fuer schwere Angriffe.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: REBEL,
      researchPointCost: 180,
      requiredLabCount: 1,
      unlocksShip: 'Y-Wing',
    },
    {
      name: 'Rebellen-Verteidigung I',
      description: 'Improvisierte aber effektive Verteidigungssysteme der Rebellion.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: REBEL,
      researchPointCost: 200,
      requiredLabCount: 1,
      unlocksBuilding: 'Plasmaturm',
    },
    {
      name: 'Ionenkanonen',
      description: 'Ionenwaffen deaktivieren imperiale Schiffe ohne sie zu zerstoeren.',
      category: 'MILITARY',
      researchLevel: 1,
      factionId: REBEL,
      researchPointCost: 250,
      requiredLabCount: 1,
      bonusType: 'SPECIAL_WEAPON',
      bonusValue: 1,
    },

    // ========== LEVEL 2 - Advanced Research ==========
    // IMPERIAL LEVEL 2
    {
      name: 'TIE-Interceptor',
      description: 'Fortgeschrittene imperiale Jaegertechnologie mit ueberlegener Geschwindigkeit.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: IMPERIAL,
      researchPointCost: 600,
      requiredLabCount: 2,
      unlocksShip: 'TIE-Interceptor',
    },
    {
      name: 'Imperiale Korvetten',
      description: 'Raider-Klasse Korvetten fuer schnelle Einsaetze und Patrouillen.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: IMPERIAL,
      researchPointCost: 800,
      requiredLabCount: 2,
      unlocksShip: 'Raider-Korvette',
    },
    {
      name: 'Imperiale Fregatten',
      description: 'Lancer-Klasse Fregatten zur Jaegerabwehr.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: IMPERIAL,
      researchPointCost: 1000,
      requiredLabCount: 2,
      unlocksShip: 'Lancer-Fregatte',
    },
    {
      name: 'Imperiale Schildtechnologie',
      description: 'Massenproduzierte Energieschilde fuer imperiale Verteidigung.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: IMPERIAL,
      researchPointCost: 700,
      requiredLabCount: 2,
      unlocksBuilding: 'Planetarer Schild',
    },

    // REBEL LEVEL 2
    {
      name: 'A-Wing Schnelljaeger',
      description: 'Wendige A-Wing Abfangjaeger fuer Aufklaerung und schnelle Angriffe.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: REBEL,
      researchPointCost: 600,
      requiredLabCount: 2,
      unlocksShip: 'A-Wing',
    },
    {
      name: 'CR90-Korvetten',
      description: 'Corellianische Korvetten - das Rueckgrat der Rebellenflotte.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: REBEL,
      researchPointCost: 800,
      requiredLabCount: 2,
      unlocksShip: 'CR90-Korvette',
    },
    {
      name: 'Nebulon-B Fregatten',
      description: 'Vielseitige Fregatten fuer Eskortmissionen und Krankenstationen.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: REBEL,
      researchPointCost: 1000,
      requiredLabCount: 2,
      unlocksShip: 'Nebulon-B',
    },
    {
      name: 'Rebellen-Schildgeneratoren',
      description: 'Erbeutete und modifizierte Schildtechnologie fuer Rebellenstuetzpunkte.',
      category: 'MILITARY',
      researchLevel: 2,
      factionId: REBEL,
      researchPointCost: 700,
      requiredLabCount: 2,
      unlocksBuilding: 'Planetarer Schild',
    },

    // UNIVERSAL LEVEL 2
    {
      name: 'Hyperraum-Handelsrouten',
      description: 'Schnellere Handelsschiffe erhoehen die Einnahmen drastisch.',
      category: 'ECONOMICS',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 500,
      requiredLabCount: 2,
      bonusType: 'TRADE_BONUS',
      bonusValue: 35,
    },
    {
      name: 'Fortgeschrittene Raffination',
      description: 'Verbesserte Ressourcenverarbeitung fuer hoehere Ausbeuten.',
      category: 'ECONOMICS',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 600,
      requiredLabCount: 2,
      bonusType: 'REFINING_BONUS',
      bonusValue: 20,
    },
    {
      name: 'Automatisierte Produktion',
      description: 'Roboter und Droiden steigern die Produktionseffizienz.',
      category: 'ECONOMICS',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 750,
      requiredLabCount: 2,
      bonusType: 'PRODUCTION_BONUS',
      bonusValue: 15,
    },
    {
      name: 'Fusionsreaktor-Technologie',
      description: 'Hochleistungs-Energieproduktion durch Fusionsreaktoren.',
      category: 'ENERGY',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 700,
      requiredLabCount: 2,
      unlocksBuilding: 'Fusionsreaktor',
    },
    {
      name: 'Energieeffizienz II',
      description: 'Weitere Reduktion des Energieverbrauchs um 15%.',
      category: 'ENERGY',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 550,
      requiredLabCount: 2,
      bonusType: 'ENERGY_EFFICIENCY',
      bonusValue: 15,
    },
    {
      name: 'Computerforschung II',
      description: 'Supercomputer verdoppeln die Forschungsgeschwindigkeit.',
      category: 'SCIENCE',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 800,
      requiredLabCount: 2,
      bonusType: 'RESEARCH_BONUS',
      bonusValue: 25,
    },
    {
      name: 'Kyber-Kristall-Forschung',
      description: 'Verstaendnis der Kyber-Kristalle ermoeglicht fortgeschrittene Waffen.',
      category: 'SCIENCE',
      researchLevel: 2,
      factionId: null, // Universal
      researchPointCost: 900,
      requiredLabCount: 2,
      bonusType: 'KYBER_RESEARCH',
      bonusValue: 1,
    },

    // ========== LEVEL 3 - Master Research ==========
    // IMPERIAL LEVEL 3
    {
      name: 'Sternzerstoerer-Konstruktion',
      description: 'Ermoeglicht den Bau von Imperialen Sternzerstoerern.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: IMPERIAL,
      researchPointCost: 3000,
      requiredLabCount: 5,
      unlocksShip: 'Imperialer Sternzerstoerer',
    },
    {
      name: 'Super-Sternzerstoerer',
      description: 'Ermoeglicht den Bau von Executor-Klasse Super-Sternzerstoerern.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: IMPERIAL,
      researchPointCost: 8000,
      requiredLabCount: 8,
      unlocksShip: 'Super-Sternzerstoerer',
    },
    {
      name: 'Superlaser-Technologie',
      description: 'Ultimative Waffentechnologie - Planetenzerstoerende Waffen.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: IMPERIAL,
      researchPointCost: 10000,
      requiredLabCount: 10,
      unlocksBuilding: 'Superlaser-Plattform',
    },
    {
      name: 'Todesstern-Prototyp',
      description: 'Blaupausen fuer die ultimative Waffe des Imperiums.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: IMPERIAL,
      researchPointCost: 50000,
      requiredLabCount: 20,
      bonusType: 'SUPERWEAPON',
      bonusValue: 1,
    },

    // REBEL LEVEL 3
    {
      name: 'Mon Calamari Kreuzer',
      description: 'Organische Schiffskonstruktion der Rebellen fuer massive Kreuzer.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: REBEL,
      researchPointCost: 3000,
      requiredLabCount: 5,
      unlocksShip: 'Mon Calamari Kreuzer',
    },
    {
      name: 'MC80 Sternenkreuzer',
      description: 'Die groessten Schiffe der Rebellenflotte.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: REBEL,
      researchPointCost: 5000,
      requiredLabCount: 6,
      unlocksShip: 'MC80 Sternenkreuzer',
    },
    {
      name: 'Guerilla-Taktiken',
      description: 'Fortgeschrittene Guerilla-Kriegsfuehrung - erhoehter Schaden gegen groessere Schiffe.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: REBEL,
      researchPointCost: 4000,
      requiredLabCount: 5,
      bonusType: 'GUERILLA_TACTICS',
      bonusValue: 25, // +25% damage vs capital ships
    },
    {
      name: 'Versteckte Stuetzpunkte',
      description: 'Verbesserte Tarnung fuer Rebellenstuetzpunkte.',
      category: 'MILITARY',
      researchLevel: 3,
      factionId: REBEL,
      researchPointCost: 3500,
      requiredLabCount: 4,
      bonusType: 'BASE_STEALTH',
      bonusValue: 1,
    },

    // UNIVERSAL LEVEL 3
    {
      name: 'Galaktisches Handelsnetz',
      description: 'Galaxisweites Handelsnetzwerk mit allen Sektoren.',
      category: 'ECONOMICS',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 2500,
      requiredLabCount: 5,
      bonusType: 'TRADE_BONUS',
      bonusValue: 60,
    },
    {
      name: 'Synthetische Ressourcen',
      description: 'Kuenstliche Herstellung seltener Ressourcen.',
      category: 'ECONOMICS',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 4000,
      requiredLabCount: 7,
      bonusType: 'SYNTHETIC_PRODUCTION',
      bonusValue: 1,
    },
    {
      name: 'Hyperreaktor',
      description: 'Hyperraum-Energiegewinnung fuer massive Energiemengen.',
      category: 'ENERGY',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 3500,
      requiredLabCount: 6,
      unlocksBuilding: 'Hyperreaktor',
    },
    {
      name: 'Nullpunkt-Energie',
      description: 'Theoretische Physik ermoeglicht unbegrenzte Energieversorgung.',
      category: 'ENERGY',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 8000,
      requiredLabCount: 10,
      bonusType: 'ZERO_POINT_ENERGY',
      bonusValue: 1,
    },
    {
      name: 'Planetare Terraformung',
      description: 'Veraendert Planetentypen und erschliesst neue Ressourcen.',
      category: 'SCIENCE',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 5000,
      requiredLabCount: 7,
      bonusType: 'TERRAFORMING',
      bonusValue: 1,
    },
    {
      name: 'Klontechnologie',
      description: 'Klonproduktion fuer beschleunigtes Bevoelkerungswachstum.',
      category: 'SCIENCE',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 6000,
      requiredLabCount: 8,
      bonusType: 'CLONE_PRODUCTION',
      bonusValue: 1,
    },
    {
      name: 'Macht-Forschung',
      description: 'Verstaendnis der Macht ermoeglicht einzigartige Technologien.',
      category: 'SCIENCE',
      researchLevel: 3,
      factionId: null, // Universal
      researchPointCost: 15000,
      requiredLabCount: 15,
      bonusType: 'FORCE_RESEARCH',
      bonusValue: 1,
    },
  ];

  // Delete existing research (optional - uncomment if you want clean slate)
  // await prisma.playerResearch.deleteMany({});
  // await prisma.researchType.deleteMany({});

  // Create or update all research types
  for (const research of researchTypes) {
    const existing = await prisma.researchType.findUnique({
      where: { name: research.name },
    });

    if (existing) {
      await prisma.researchType.update({
        where: { name: research.name },
        data: research,
      });
      const factionLabel = research.factionId === IMPERIAL ? '[IMPERIAL]' : research.factionId === REBEL ? '[REBEL]' : '[UNIVERSAL]';
      console.log(`✓ Updated ${factionLabel} ${research.name} (Level ${research.researchLevel})`);
    } else {
      await prisma.researchType.create({
        data: research,
      });
      const factionLabel = research.factionId === IMPERIAL ? '[IMPERIAL]' : research.factionId === REBEL ? '[REBEL]' : '[UNIVERSAL]';
      console.log(`✓ Created ${factionLabel} ${research.name} (Level ${research.researchLevel})`);
    }
  }

  // Set prerequisites (after all are created)
  const prerequisites = [
    // Imperial Military chain
    { from: 'TIE-Jaeger Produktion', to: 'TIE-Interceptor' },
    { from: 'TIE-Interceptor', to: 'Imperiale Korvetten' },
    { from: 'Imperiale Korvetten', to: 'Imperiale Fregatten' },
    { from: 'Imperiale Fregatten', to: 'Sternzerstoerer-Konstruktion' },
    { from: 'Sternzerstoerer-Konstruktion', to: 'Super-Sternzerstoerer' },
    { from: 'Super-Sternzerstoerer', to: 'Superlaser-Technologie' },
    { from: 'Superlaser-Technologie', to: 'Todesstern-Prototyp' },
    { from: 'Imperiale Waffensysteme I', to: 'Imperiale Schildtechnologie' },

    // Rebel Military chain
    { from: 'X-Wing Produktion', to: 'A-Wing Schnelljaeger' },
    { from: 'A-Wing Schnelljaeger', to: 'CR90-Korvetten' },
    { from: 'CR90-Korvetten', to: 'Nebulon-B Fregatten' },
    { from: 'Nebulon-B Fregatten', to: 'Mon Calamari Kreuzer' },
    { from: 'Mon Calamari Kreuzer', to: 'MC80 Sternenkreuzer' },
    { from: 'Rebellen-Verteidigung I', to: 'Rebellen-Schildgeneratoren' },
    { from: 'Ionenkanonen', to: 'Guerilla-Taktiken' },

    // Economics chain (Universal)
    { from: 'Handelsnetzwerk', to: 'Hyperraum-Handelsrouten' },
    { from: 'Hyperraum-Handelsrouten', to: 'Galaktisches Handelsnetz' },
    { from: 'Bergbauoptimierung', to: 'Fortgeschrittene Raffination' },
    { from: 'Fortgeschrittene Raffination', to: 'Synthetische Ressourcen' },

    // Energy chain (Universal)
    { from: 'Erweiterte Energiesysteme', to: 'Fusionsreaktor-Technologie' },
    { from: 'Fusionsreaktor-Technologie', to: 'Hyperreaktor' },
    { from: 'Hyperreaktor', to: 'Nullpunkt-Energie' },
    { from: 'Energieeffizienz I', to: 'Energieeffizienz II' },

    // Science chain (Universal)
    { from: 'Computerforschung I', to: 'Computerforschung II' },
    { from: 'Computerforschung II', to: 'Kyber-Kristall-Forschung' },
    { from: 'Kyber-Kristall-Forschung', to: 'Macht-Forschung' },
  ];

  for (const { from, to } of prerequisites) {
    const fromResearch = await prisma.researchType.findUnique({ where: { name: from } });
    const toResearch = await prisma.researchType.findUnique({ where: { name: to } });

    if (fromResearch && toResearch) {
      await prisma.researchType.update({
        where: { id: toResearch.id },
        data: { prerequisiteId: fromResearch.id },
      });
      console.log(`✓ Set ${from} as prerequisite for ${to}`);
    }
  }

  // Summary
  const imperialCount = researchTypes.filter(r => r.factionId === IMPERIAL).length;
  const rebelCount = researchTypes.filter(r => r.factionId === REBEL).length;
  const universalCount = researchTypes.filter(r => r.factionId === null).length;

  console.log('\n=== SUMMARY ===');
  console.log(`Imperial Research: ${imperialCount}`);
  console.log(`Rebel Research: ${rebelCount}`);
  console.log(`Universal Research: ${universalCount}`);
  console.log(`Total: ${researchTypes.length}`);
  console.log('Done!');
}

seedResearchTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
