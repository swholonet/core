import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// Get all factions
router.get('/', async (req, res) => {
  try {
    const factions = await prisma.faction.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(factions);
  } catch (error) {
    console.error('Error fetching factions:', error);
    // Return empty array instead of error object to maintain API contract
    res.status(200).json([]);
  }
});

export default router;
