import express from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

// Building names for shipyard functionality (supports both old and new names)
const SHIPYARD_BUILDING_NAMES = ['Orbitales Raumdock', 'Raumschiffwerft', 'Shipyard'];

/**
 * GET /api/shipyard/:planetId
 * Get available blueprints and current build queue for a planet
 */
router.get('/:planetId', authMiddleware, async (req: any, res) => {
  try {
    const { planetId } = req.params;
    const playerId = req.user?.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    console.log(`Shipyard request for planet ${planetId} by player ${playerId}`);

    // Verify planet ownership
    const planet = await prisma.planet.findFirst({
      where: {
        id: parseInt(planetId),
        playerId,
      },
      include: {
        buildings: {
          where: {
            buildingType: {
              name: { in: SHIPYARD_BUILDING_NAMES },
            },
            isActive: true,
          },
          include: {
            buildingType: true,
          },
        },
      },
    });

    if (!planet) {
      return res.status(404).json({ error: 'Planet nicht gefunden oder keine Berechtigung' });
    }

    // Check if planet has an active shipyard
    if (planet.buildings.length === 0) {
      return res.status(400).json({ error: 'Planet hat kein aktives Orbitales Raumdock' });
    }

    // Get available blueprints (both player's own and public ones)
    const availableBlueprints = await prisma.shipBlueprint.findMany({
      where: {
        OR: [
          { playerId }, // Player's own blueprints
          { isPublic: true }, // Public blueprints
        ],
      },
      include: {
        player: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      },
      orderBy: [
        { shipClass: 'asc' },
        { totalCostCredits: 'asc' },
      ],
    });

    // Get current blueprint build queue
    const buildQueue = await prisma.blueprintBuildQueue.findMany({
      where: {
        planetId: parseInt(planetId),
        completedAt: null,
      },
      include: {
        blueprint: true,
      },
      orderBy: {
        constructionStartedAt: 'asc',
      },
    });

    // Get ships stationed at this planet
    const ships = await prisma.ship.findMany({
      where: {
        planetId: parseInt(planetId),
        fleetId: null, // Not assigned to a fleet
      },
      include: {
        blueprint: true,
      },
    });

    res.json({
      planet: {
        id: planet.id,
        name: planet.name,
        credits: planet.credits,
        durastahl: planet.durastahl,
        kristallinesSilizium: planet.kristallinesSilizium,
        tibannaGas: planet.tibannaGas,
        energiemodule: planet.energiemodule,
        kyberKristalle: planet.kyberKristalle,
        bacta: planet.bacta,
        beskar: planet.beskar,
      },
      availableBlueprints,
      buildQueue,
      ships,
    });
  } catch (error) {
    console.error('Error fetching shipyard:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * POST /api/shipyard/:planetId/build
 * Start building ships from blueprints
 */
router.post('/:planetId/build', authMiddleware, async (req: any, res) => {
  try {
    const { planetId } = req.params;
    const { blueprintId, quantity = 1 } = req.body;
    const playerId = req.user?.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    if (!blueprintId || quantity < 1) {
      return res.status(400).json({ error: 'Ungültige Eingabe' });
    }

    // Verify planet ownership and shipyard
    const planet = await prisma.planet.findFirst({
      where: {
        id: parseInt(planetId),
        playerId,
      },
      include: {
        buildings: {
          where: {
            buildingType: {
              name: { in: SHIPYARD_BUILDING_NAMES },
            },
            isActive: true,
          },
        },
      },
    });

    if (!planet) {
      return res.status(404).json({ error: 'Planet nicht gefunden' });
    }

    if (planet.buildings.length === 0) {
      return res.status(400).json({ error: 'Kein aktives Orbitales Raumdock vorhanden' });
    }

    // Get blueprint (check if player owns it or if it's public)
    const blueprint = await prisma.shipBlueprint.findFirst({
      where: {
        id: blueprintId,
        OR: [
          { playerId }, // Player's own blueprint
          { isPublic: true }, // Public blueprint
        ],
      },
    });

    if (!blueprint) {
      return res.status(404).json({ error: 'Blueprint nicht gefunden oder keine Berechtigung' });
    }

    // Calculate total costs using blueprint costs
    const totalCredits = blueprint.totalCostCredits * quantity;
    const totalDurastahl = blueprint.totalCostDurastahl * quantity;
    const totalKristallinesSilizium = blueprint.totalCostKristallinesSilizium * quantity;
    const totalTibannaGas = blueprint.totalCostTibannaGas * quantity;
    const totalEnergiemodule = blueprint.totalCostEnergiemodule * quantity;
    const totalKyberKristalle = blueprint.totalCostKyberKristalle * quantity;
    const totalBeskar = blueprint.totalCostBeskar * quantity;

    // Check resources
    if (
      planet.credits < totalCredits ||
      planet.durastahl < totalDurastahl ||
      planet.kristallinesSilizium < totalKristallinesSilizium ||
      planet.tibannaGas < totalTibannaGas ||
      planet.energiemodule < totalEnergiemodule ||
      planet.kyberKristalle < totalKyberKristalle ||
      planet.beskar < totalBeskar
    ) {
      return res.status(400).json({ error: 'Nicht genug Ressourcen' });
    }

    // Deduct resources and create blueprint build queue entry
    const updatedPlanet = await prisma.planet.update({
      where: { id: parseInt(planetId) },
      data: {
        credits: { decrement: totalCredits },
        durastahl: { decrement: totalDurastahl },
        kristallinesSilizium: { decrement: totalKristallinesSilizium },
        tibannaGas: { decrement: totalTibannaGas },
        energiemodule: { decrement: totalEnergiemodule },
        kyberKristalle: { decrement: totalKyberKristalle },
        beskar: { decrement: totalBeskar },
      },
    });

    const queueEntry = await prisma.blueprintBuildQueue.create({
      data: {
        planetId: parseInt(planetId),
        blueprintId,
        quantity,
      },
      include: {
        blueprint: true,
      },
    });

    res.json({
      message: `${quantity}x ${blueprint.name} werden gebaut`,
      queueEntry,
      planet: updatedPlanet,
    });
  } catch (error) {
    console.error('Error building ship:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * DELETE /api/shipyard/:planetId/queue/:queueId
 * Cancel blueprint ship construction (50% refund)
 */
router.delete('/:planetId/queue/:queueId', authMiddleware, async (req: any, res) => {
  try {
    const { planetId, queueId } = req.params;
    const playerId = req.user?.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    // Verify ownership
    const planet = await prisma.planet.findFirst({
      where: {
        id: parseInt(planetId),
        playerId,
      },
    });

    if (!planet) {
      return res.status(404).json({ error: 'Planet nicht gefunden' });
    }

    const queueEntry = await prisma.blueprintBuildQueue.findFirst({
      where: {
        id: parseInt(queueId),
        planetId: parseInt(planetId),
        completedAt: null,
      },
      include: {
        blueprint: true,
      },
    });

    if (!queueEntry) {
      return res.status(404).json({ error: 'Bauauftrag nicht gefunden' });
    }

    // 50% refund using blueprint costs
    const refundCredits = Math.floor(queueEntry.blueprint.totalCostCredits * queueEntry.quantity * 0.5);
    const refundDurastahl = Math.floor(queueEntry.blueprint.totalCostDurastahl * queueEntry.quantity * 0.5);
    const refundKristallinesSilizium = Math.floor(queueEntry.blueprint.totalCostKristallinesSilizium * queueEntry.quantity * 0.5);
    const refundTibannaGas = Math.floor(queueEntry.blueprint.totalCostTibannaGas * queueEntry.quantity * 0.5);
    const refundEnergiemodule = Math.floor(queueEntry.blueprint.totalCostEnergiemodule * queueEntry.quantity * 0.5);
    const refundKyberKristalle = Math.floor(queueEntry.blueprint.totalCostKyberKristalle * queueEntry.quantity * 0.5);
    const refundBeskar = Math.floor(queueEntry.blueprint.totalCostBeskar * queueEntry.quantity * 0.5);

    // Delete queue entry and refund resources
    await prisma.blueprintBuildQueue.delete({
      where: { id: parseInt(queueId) },
    });

    const updatedPlanet = await prisma.planet.update({
      where: { id: parseInt(planetId) },
      data: {
        credits: { increment: refundCredits },
        durastahl: { increment: refundDurastahl },
        kristallinesSilizium: { increment: refundKristallinesSilizium },
        tibannaGas: { increment: refundTibannaGas },
        energiemodule: { increment: refundEnergiemodule },
        kyberKristalle: { increment: refundKyberKristalle },
        beskar: { increment: refundBeskar },
      },
    });

    res.json({
      message: 'Bauauftrag abgebrochen (50% Rückerstattung)',
      refund: {
        credits: refundCredits,
        durastahl: refundDurastahl,
        kristallinesSilizium: refundKristallinesSilizium,
        tibannaGas: refundTibannaGas,
        energiemodule: refundEnergiemodule,
        kyberKristalle: refundKyberKristalle,
        beskar: refundBeskar,
      },
      planet: updatedPlanet,
    });
  } catch (error) {
    console.error('Error canceling ship construction:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

export default router;
