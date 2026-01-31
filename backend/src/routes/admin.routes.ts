import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import prisma from '../lib/prisma';
import { tickSystem, getIo } from '../index';
import { shipStatsService } from '../services/shipStatsService';

const router = Router();

// All admin routes require both auth and admin middleware
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Trigger tick manually
router.post('/trigger-tick', async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;

    console.log(`🔧 Admin ${user.username} manually triggered a tick`);

    // Process tick
    await tickSystem.processTick();

    res.json({ 
      success: true, 
      message: 'Tick erfolgreich ausgelöst' 
    });
  } catch (error: any) {
    console.error('Admin trigger tick error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add resources to a planet
router.post('/add-resources', async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const { planetId, credits, durastahl, kristall, energy } = req.body;

    if (!planetId) {
      return res.status(400).json({ error: 'Planet ID erforderlich' });
    }

    // Get planet
    const planet = await prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      return res.status(404).json({ error: 'Planet nicht gefunden' });
    }

    // Update resources
    const updatedPlanet = await prisma.planet.update({
      where: { id: planetId },
      data: {
        credits: { increment: credits || 0 },
        durastahl: { increment: durastahl || 0 },
        kristallinesSilizium: { increment: kristall || 0 },
        energyStorage: { increment: energy || 0 },
      },
    });

    console.log(`🔧 Admin ${user.username} added resources to planet ${planetId}`);

    // Emit resource update
    if (planet.playerId) {
      const io = getIo();
      io.to(`player:${planet.playerId}`).emit('resource:updated', {
        planetId,
        credits: updatedPlanet.credits,
        durastahl: updatedPlanet.durastahl,
        kristall: updatedPlanet.kristallinesSilizium,
        energyStorage: updatedPlanet.energyStorage,
      });
    }

    res.json({ 
      success: true, 
      message: 'Ressourcen hinzugefügt',
      planet: updatedPlanet,
    });
  } catch (error: any) {
    console.error('Admin add resources error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Spawn a ship for any player at any location using Blueprint
router.post('/spawn-ship', async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const {
      playerId,
      blueprintId,
      name,
      galaxyX,
      galaxyY,
      planetId,
      systemX,
      systemY,
      systemId
    } = req.body;

    if (!playerId || !blueprintId) {
      return res.status(400).json({ error: 'Spieler ID und Blueprint ID erforderlich' });
    }

    // Validate player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true }
    });

    if (!player) {
      return res.status(404).json({ error: 'Spieler nicht gefunden' });
    }

    // Validate blueprint exists
    const blueprint = await prisma.shipBlueprint.findUnique({
      where: { id: blueprintId }
    });

    if (!blueprint) {
      return res.status(404).json({ error: 'Blueprint nicht gefunden' });
    }

    // Validate planet if provided
    let planet = null;
    if (planetId) {
      planet = await prisma.planet.findUnique({
        where: { id: planetId }
      });
      if (!planet) {
        return res.status(404).json({ error: 'Planet nicht gefunden' });
      }
    }

    // Validate system if provided
    let system = null;
    if (systemId) {
      system = await prisma.system.findUnique({
        where: { id: systemId }
      });
      if (!system) {
        return res.status(404).json({ error: 'System nicht gefunden' });
      }
    }

    // Determine ship position data
    const positionData: any = {};

    // Set position based on priority: Planet > System > Galaxy coordinates
    if (planet) {
      positionData.planetId = planetId;
      positionData.currentSystemId = planet.systemId;
      // Set system coordinates to planet's system center
      const planetSystem = await prisma.system.findUnique({
        where: { id: planet.systemId }
      });
      if (planetSystem) {
        positionData.currentSystemX = Math.floor(planetSystem.gridSize / 2);
        positionData.currentSystemY = Math.floor(planetSystem.gridSize / 2);
      }
    } else if (system) {
      positionData.currentSystemId = systemId;
      positionData.currentSystemX = systemX || Math.floor(30 / 2); // Default to center
      positionData.currentSystemY = systemY || Math.floor(30 / 2);
    } else if (galaxyX !== undefined && galaxyY !== undefined) {
      // Hyperspace coordinates
      positionData.currentGalaxyX = galaxyX;
      positionData.currentGalaxyY = galaxyY;
      positionData.currentSystemId = null;
    } else {
      return res.status(400).json({
        error: 'Entweder Planet ID, System ID mit Koordinaten, oder Galaxy-Koordinaten erforderlich'
      });
    }

    // Create the ship using the shipStatsService
    const newShip = await shipStatsService.createShipFromBlueprint({
      playerId,
      blueprintId,
      name: name || `${blueprint.name} ${Math.floor(Math.random() * 1000)}`,
      ...positionData
    });

    console.log(`🔧 Admin ${user.username} spawned ship ${newShip.id} (${blueprint.name}) for player ${player.user.username}`);

    // Emit update to player
    if (player.id) {
      const io = getIo();
      io.to(`player:${player.id}`).emit('ship:spawned', {
        shipId: newShip.id,
        shipName: newShip.name,
        blueprintName: blueprint.name,
        position: {
          galaxyX: newShip.currentGalaxyX,
          galaxyY: newShip.currentGalaxyY,
          systemId: newShip.currentSystemId,
          planetId: newShip.planetId
        }
      });
    }

    res.json({
      success: true,
      message: `Schiff ${newShip.name} erfolgreich für ${player.user.username} gespawnt`,
      ship: {
        id: newShip.id,
        name: newShip.name,
        blueprintName: blueprint.name,
        shipClass: blueprint.shipClass,
        position: {
          galaxyX: newShip.currentGalaxyX,
          galaxyY: newShip.currentGalaxyY,
          systemId: newShip.currentSystemId,
          systemX: newShip.currentSystemX,
          systemY: newShip.currentSystemY,
          planetId: newShip.planetId
        }
      }
    });
  } catch (error: any) {
    console.error('Admin spawn ship error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all players for ship spawning dropdown
router.get('/players', async (req: AuthRequest, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        user: {
          select: { username: true }
        },
        faction: {
          select: { name: true }
        }
      },
      orderBy: {
        user: {
          username: 'asc'
        }
      }
    });

    res.json({
      players: players.map(p => ({
        id: p.id,
        username: p.user.username,
        factionName: p.faction.name
      }))
    });
  } catch (error: any) {
    console.error('Admin get players error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all blueprints for spawning dropdown
router.get('/blueprints', async (req: AuthRequest, res: Response) => {
  try {
    const blueprints = await prisma.shipBlueprint.findMany({
      where: {
        isPublic: true, // Only show public blueprints to admin for spawning
      },
      orderBy: { name: 'asc' },
      include: {
        player: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      }
    });

    res.json({
      blueprints: blueprints.map(bp => ({
        id: bp.id,
        name: bp.name,
        shipClass: bp.shipClass,
        description: bp.description,
        createdBy: bp.player.user.username,
        stats: {
          hullPoints: bp.totalHullPoints,
          damage: bp.totalDamage,
          shieldStrength: bp.totalShieldStrength,
          speed: bp.totalSpeed,
          sensorRange: bp.totalSensorRange,
          cargoCapacity: bp.totalCargoCapacity,
          crewRequired: bp.totalCrewRequired,
        },
        costs: {
          credits: bp.totalCostCredits,
          durastahl: bp.totalCostDurastahl,
          buildTime: bp.totalBuildTime,
        }
      }))
    });
  } catch (error: any) {
    console.error('Admin get blueprints error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all planets for spawning dropdown
router.get('/planets', async (req: AuthRequest, res: Response) => {
  try {
    const planets = await prisma.planet.findMany({
      include: {
        system: {
          include: {
            sector: true
          }
        },
        player: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      planets: planets.map(p => ({
        id: p.id,
        name: p.name,
        systemName: p.system.name,
        coordinates: `${(p.system.sector.x - 1) * 20 + p.system.fieldX}|${(p.system.sector.y - 1) * 20 + p.system.fieldY}`,
        owner: p.player?.user.username || 'Unkolonisiert'
      }))
    });
  } catch (error: any) {
    console.error('Admin get planets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all systems for spawning dropdown
router.get('/systems', async (req: AuthRequest, res: Response) => {
  try {
    const systems = await prisma.system.findMany({
      include: {
        sector: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      systems: systems.map(s => ({
        id: s.id,
        name: s.name,
        coordinates: `${(s.sector.x - 1) * 20 + s.fieldX}|${(s.sector.y - 1) * 20 + s.fieldY}`,
        gridSize: s.gridSize
      }))
    });
  } catch (error: any) {
    console.error('Admin get systems error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin status
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;

    res.json({
      isAdmin: user.player.isAdmin,
      username: user.username,
    });
  } catch (error: any) {
    console.error('Admin status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
