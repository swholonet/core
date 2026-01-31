import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { databaseService } from '../services/databaseService';
import logger from '../lib/logger';

const router = Router();

// GET /api/database/players - Siedlerliste sortiert nach Forschungsfortschritt
router.get('/players', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const players = await databaseService.getPlayersRanking();
    res.json(players);
  } catch (error: any) {
    logger.error('Database players ranking error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Siedlerliste' });
  }
});

// GET /api/database/systems - Sternensysteme Übersicht mit SystemTypes
router.get('/systems', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const systemsOverview = await databaseService.getSystemsOverview();
    res.json(systemsOverview);
  } catch (error: any) {
    logger.error('Database systems overview error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Sternensysteme' });
  }
});

// GET /api/database/planets - Planetentypen Statistiken
router.get('/planets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const planetsStats = await databaseService.getPlanetsStatistics();
    res.json(planetsStats);
  } catch (error: any) {
    logger.error('Database planets statistics error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Planeten-Statistiken' });
  }
});

// GET /api/database/buildings - Gebäude-Informationen mit Kosten/Produktion
router.get('/buildings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const buildingsOverview = await databaseService.getBuildingsOverview();
    res.json(buildingsOverview);
  } catch (error: any) {
    logger.error('Database buildings overview error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Gebäude-Informationen' });
  }
});

// GET /api/database/research - Forschungs-Übersicht (Technologie-Baum)
router.get('/research', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const researchOverview = await databaseService.getResearchOverview();
    res.json(researchOverview);
  } catch (error: any) {
    logger.error('Database research overview error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Forschungs-Übersicht' });
  }
});

// GET /api/database/ships - Schiffs-Statistiken (anonymisiert)
router.get('/ships', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const shipsStats = await databaseService.getShipsStatistics();
    res.json(shipsStats);
  } catch (error: any) {
    logger.error('Database ships statistics error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Schiffs-Statistiken' });
  }
});

export default router;