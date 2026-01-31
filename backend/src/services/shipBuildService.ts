import prisma from '../lib/prisma';
import { shipStatsService } from './shipStatsService';

let io: any = null;

export function setShipBuildIO(socketIO: any) {
  io = socketIO;
}

class ShipBuildService {
  /**
   * Runs every 10 seconds to check for completed ship constructions
   * Now only handles BlueprintBuildQueue (legacy system removed)
   */
  async checkCompletedShips() {
    try {
      // Check Blueprint build queue
      await this.checkBlueprintBuilds();
    } catch (error) {
      console.error('Error checking ship completions:', error);
    }
  }

  /**
   * Check Blueprint builds (new system)
   */
  private async checkBlueprintBuilds() {
    const queueItems = await prisma.blueprintBuildQueue.findMany({
      where: {
        completedAt: null,
      },
      include: {
        blueprint: true,
        planet: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
            system: {
              include: {
                sector: true,
              },
            },
          },
        },
      },
    });

    for (const queue of queueItems) {
      const startTime = new Date(queue.constructionStartedAt).getTime();
      const buildTimeMs = queue.blueprint.totalBuildTime * 60 * 1000; // Convert minutes to milliseconds
      const now = Date.now();

      if (now >= startTime + buildTimeMs) {
        // Construction complete! Create the ships
        const ships = [];

        if (!queue.planet) {
          console.error(`Planet ${queue.planetId} not found for blueprint ship construction`);
          continue;
        }

        // Calculate ship's initial position (at planet in system)
        const systemCenterX = Math.floor(queue.planet.system.gridSize / 2);
        const systemCenterY = Math.floor(queue.planet.system.gridSize / 2);
        const galaxyX = (queue.planet.system.sector.x - 1) * 20 + queue.planet.system.fieldX;
        const galaxyY = (queue.planet.system.sector.y - 1) * 20 + queue.planet.system.fieldY;

        for (let i = 0; i < queue.quantity; i++) {
          // Create ship from blueprint using shipStatsService
          const ship = await shipStatsService.createShipFromBlueprint({
            playerId: queue.planet.playerId!,
            blueprintId: queue.blueprintId,
            name: `${queue.blueprint.name} ${Math.floor(Math.random() * 1000)}`,
            planetId: queue.planetId,
            currentSystemId: queue.planet.systemId,
            currentGalaxyX: galaxyX,
            currentGalaxyY: galaxyY,
          });

          // Update ship position after creation (system coordinates)
          await prisma.ship.update({
            where: { id: ship.id },
            data: {
              currentSystemX: systemCenterX,
              currentSystemY: systemCenterY,
              status: 'DOCKED',
            },
          });
          ships.push(ship);
        }

        // Mark queue item as completed
        await prisma.blueprintBuildQueue.update({
          where: { id: queue.id },
          data: { completedAt: new Date() },
        });

        console.log(`✓ Blueprint ship construction completed: ${queue.quantity}x ${queue.blueprint.name} on planet ${queue.planetId}`);

        // Emit socket event to player
        if (queue.planet.player) {
          const socketRoom = `player:${queue.planet.player.userId}`;
          io.to(socketRoom).emit('ship:completed', {
            planetId: queue.planetId,
            blueprint: queue.blueprint,
            quantity: queue.quantity,
            ships,
          });
        }
      }
    }
  }

  /**
   * Start the ship completion checker (runs every 10 seconds)
   */
  startCompletionChecker() {
    console.log('🚀 Ship completion service started');
    
    // Initial check
    this.checkCompletedShips();
    
    // Check every 10 seconds
    setInterval(() => {
      this.checkCompletedShips();
    }, 10000);
  }
}

export const shipBuildService = new ShipBuildService();
