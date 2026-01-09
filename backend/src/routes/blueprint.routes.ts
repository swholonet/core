import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { blueprintService } from '../services/blueprintService';
import { CreateBlueprintInput, UpdateBlueprintInput, SHIP_CLASS_CONFIG } from '../types/blueprint.types';
import { ShipClass } from '@prisma/client';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/blueprints
 * Holt alle Blueprints des Spielers
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    const blueprints = await blueprintService.getPlayerBlueprints(playerId);
    res.json({ blueprints });
  } catch (error: any) {
    console.error('Error fetching blueprints:', error);
    res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
});

/**
 * GET /api/blueprints/modules/available
 * Holt alle verfügbaren Module basierend auf Research
 */
router.get('/modules/available', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    const modules = await blueprintService.getAvailableModules(playerId);
    res.json({ modules });
  } catch (error: any) {
    console.error('Error fetching available modules:', error);
    res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
});

/**
 * GET /api/blueprints/build-queue/:planetId
 * Holt die Build-Queue fuer einen Planeten (Blueprint-basierte Schiffe)
 */
router.get('/build-queue/:planetId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;
    const { planetId } = req.params;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    // Verify planet ownership
    const planet = await prisma.planet.findFirst({
      where: {
        id: parseInt(planetId),
        playerId,
      },
    });

    if (!planet) {
      return res.status(404).json({ error: 'Planet nicht gefunden oder keine Berechtigung' });
    }

    // Get blueprint build queue for this planet
    const buildQueue = await prisma.blueprintBuildQueue.findMany({
      where: {
        planetId: parseInt(planetId),
        completedAt: null,
      },
      include: {
        blueprint: {
          select: {
            id: true,
            name: true,
            shipClass: true,
            totalBuildTime: true,
          },
        },
      },
      orderBy: {
        constructionStartedAt: 'asc',
      },
    });

    res.json({ buildQueue });
  } catch (error: any) {
    console.error('Error fetching build queue:', error);
    res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
});

/**
 * GET /api/blueprints/ship-classes
 * Holt Konfiguration aller Schiffsklassen
 */
router.get('/ship-classes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const shipClasses = Object.entries(SHIP_CLASS_CONFIG).map(([key, config]) => ({
      id: key,
      name: key,
      maxSlots: config.maxSlots,
      hullMultiplier: config.baseHullMultiplier,
      costMultiplier: config.baseCostMultiplier,
    }));

    res.json({ shipClasses });
  } catch (error: any) {
    console.error('Error fetching ship classes:', error);
    res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
});

/**
 * GET /api/blueprints/:id
 * Holt einen spezifischen Blueprint mit Stats und Kosten
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;
    const blueprintId = parseInt(req.params.id);

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    if (isNaN(blueprintId)) {
      return res.status(400).json({ error: 'Ungültige Blueprint-ID' });
    }

    const blueprint = await blueprintService.getBlueprintById(playerId, blueprintId);
    res.json({ blueprint });
  } catch (error: any) {
    console.error('Error fetching blueprint:', error);
    if (error.message === 'Blueprint nicht gefunden.') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
});

/**
 * POST /api/blueprints
 * Erstellt einen neuen Blueprint
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    const { name, shipClass, description, isPublic, modules } = req.body;

    // Validierung
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    if (!shipClass || !Object.values(ShipClass).includes(shipClass)) {
      return res.status(400).json({ error: 'Ungültige Schiffsklasse' });
    }

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'Mindestens ein Modul ist erforderlich' });
    }

    // Validiere jedes Modul
    for (const module of modules) {
      if (!module.moduleTypeId || typeof module.moduleTypeId !== 'number') {
        return res.status(400).json({ error: 'moduleTypeId ist für jedes Modul erforderlich' });
      }
      if (!module.level || typeof module.level !== 'number' || module.level < 1) {
        return res.status(400).json({ error: 'level muss mindestens 1 sein' });
      }
      if (!module.slotPosition || typeof module.slotPosition !== 'number' || module.slotPosition < 1) {
        return res.status(400).json({ error: 'slotPosition muss mindestens 1 sein' });
      }
    }

    const input: CreateBlueprintInput = {
      name: name.trim(),
      shipClass,
      description: description?.trim(),
      isPublic: !!isPublic,
      modules,
    };

    const blueprint = await blueprintService.createBlueprint(playerId, input);
    res.status(201).json({ message: 'Blueprint erstellt', blueprint });
  } catch (error: any) {
    console.error('Error creating blueprint:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ein Blueprint mit diesem Namen existiert bereits' });
    }
    res.status(400).json({ error: error.message || 'Fehler beim Erstellen des Blueprints' });
  }
});

/**
 * PUT /api/blueprints/:id
 * Aktualisiert einen Blueprint
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;
    const blueprintId = parseInt(req.params.id);

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    if (isNaN(blueprintId)) {
      return res.status(400).json({ error: 'Ungültige Blueprint-ID' });
    }

    const { name, description, isPublic, modules } = req.body;

    const input: UpdateBlueprintInput = {};

    if (name !== undefined) input.name = name.trim();
    if (description !== undefined) input.description = description?.trim();
    if (isPublic !== undefined) input.isPublic = !!isPublic;
    if (modules !== undefined) {
      // Validiere Module
      if (!Array.isArray(modules)) {
        return res.status(400).json({ error: 'modules muss ein Array sein' });
      }
      for (const module of modules) {
        if (!module.moduleTypeId || typeof module.moduleTypeId !== 'number') {
          return res.status(400).json({ error: 'moduleTypeId ist für jedes Modul erforderlich' });
        }
        if (!module.level || typeof module.level !== 'number' || module.level < 1) {
          return res.status(400).json({ error: 'level muss mindestens 1 sein' });
        }
        if (!module.slotPosition || typeof module.slotPosition !== 'number' || module.slotPosition < 1) {
          return res.status(400).json({ error: 'slotPosition muss mindestens 1 sein' });
        }
      }
      input.modules = modules;
    }

    const blueprint = await blueprintService.updateBlueprint(playerId, blueprintId, input);
    res.json({ message: 'Blueprint aktualisiert', blueprint });
  } catch (error: any) {
    console.error('Error updating blueprint:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ein Blueprint mit diesem Namen existiert bereits' });
    }
    res.status(400).json({ error: error.message || 'Fehler beim Aktualisieren des Blueprints' });
  }
});

/**
 * DELETE /api/blueprints/:id
 * Löscht einen Blueprint
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;
    const blueprintId = parseInt(req.params.id);

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    if (isNaN(blueprintId)) {
      return res.status(400).json({ error: 'Ungültige Blueprint-ID' });
    }

    await blueprintService.deleteBlueprint(playerId, blueprintId);
    res.json({ message: 'Blueprint gelöscht' });
  } catch (error: any) {
    console.error('Error deleting blueprint:', error);
    res.status(400).json({ error: error.message || 'Fehler beim Löschen des Blueprints' });
  }
});

/**
 * POST /api/blueprints/:id/build
 * Startet den Bau eines Schiffs aus einem Blueprint
 */
router.post('/:id/build', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;
    const blueprintId = parseInt(req.params.id);

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    if (isNaN(blueprintId)) {
      return res.status(400).json({ error: 'Ungültige Blueprint-ID' });
    }

    const { planetId, quantity = 1 } = req.body;

    if (!planetId || typeof planetId !== 'number') {
      return res.status(400).json({ error: 'planetId ist erforderlich' });
    }

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
      return res.status(400).json({ error: 'quantity muss zwischen 1 und 100 liegen' });
    }

    const result = await blueprintService.buildShipFromBlueprint(playerId, blueprintId, planetId, quantity);
    res.json(result);
  } catch (error: any) {
    console.error('Error building ship from blueprint:', error);
    res.status(400).json({ error: error.message || 'Fehler beim Starten des Schiffsbaus' });
  }
});

/**
 * POST /api/blueprints/:id/calculate
 * Berechnet Stats und Kosten für eine Blueprint-Konfiguration (ohne zu speichern)
 * Nützlich für Live-Vorschau im Frontend
 */
router.post('/:id/calculate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req as any;
    const playerId = user.player?.id;

    if (!playerId) {
      return res.status(403).json({ error: 'Kein Spieler-Account gefunden' });
    }

    const { shipClass, modules } = req.body;

    if (!shipClass || !Object.values(ShipClass).includes(shipClass)) {
      return res.status(400).json({ error: 'Ungültige Schiffsklasse' });
    }

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'Mindestens ein Modul ist erforderlich' });
    }

    // Hole ModuleTypes aus der Datenbank
    const moduleTypeIds = modules.map((m: any) => m.moduleTypeId);
    const { default: prisma } = await import('../lib/prisma');
    const moduleTypes = await prisma.moduleType.findMany({
      where: { id: { in: moduleTypeIds } },
    });

    if (moduleTypes.length !== moduleTypeIds.length) {
      return res.status(400).json({ error: 'Ein oder mehrere Module wurden nicht gefunden' });
    }

    const moduleTypeMap = new Map(moduleTypes.map((mt) => [mt.id, mt]));
    const modulesWithTypes = modules.map((m: any) => ({
      level: m.level,
      moduleTypeId: m.moduleTypeId,
      moduleType: moduleTypeMap.get(m.moduleTypeId)!,
    }));

    // Berechne Stats und Kosten
    const stats = blueprintService.calculateBlueprintStats(modulesWithTypes, shipClass);
    const costs = blueprintService.calculateConstructionCosts(modulesWithTypes, shipClass);
    const researchValidation = await blueprintService.validateBlueprintResearch(playerId, modulesWithTypes);

    res.json({
      stats,
      costs,
      researchValidation,
    });
  } catch (error: any) {
    console.error('Error calculating blueprint:', error);
    res.status(400).json({ error: error.message || 'Fehler bei der Berechnung' });
  }
});

export default router;
