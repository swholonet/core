import express from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';
import { getIo } from '../index';
import logger from '../lib/logger';

const router = express.Router();

// Get recent messages (last 100)
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.holoNetMessage.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        player: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
            faction: {
              select: {
                name: true,
              },
            },
          },
        },
        plot: true,
      },
    });

    logger.api('Fetched HoloNet messages:', messages.length);

    res.json(
      messages.reverse().map((msg) => ({
        id: msg.id,
        title: msg.title,
        message: msg.message,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        player: {
          id: msg.player.id,
          username: msg.player.user.username,
          factionName: msg.player.faction.name,
        },
        plot: msg.plot ? {
          id: msg.plot.id,
          title: msg.plot.title,
          description: msg.plot.description,
        } : null,
      }))
    );
  } catch (error: any) {
    logger.error('Failed to fetch HoloNet messages:', error);
    // Return empty array instead of error object to maintain API contract
    res.status(200).json([]);
  }
});

// Post a new message
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { title, message, plotId } = req.body;
    const user = (req as any).user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Nachricht darf nicht leer sein' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Nachricht zu lang (max 5000 Zeichen)' });
    }

    if (title && title.length > 100) {
      return res.status(400).json({ error: 'Titel zu lang (max 100 Zeichen)' });
    }

    // Validate plotId if provided - Enhanced access control
    if (plotId) {
      const plot = await prisma.holoNetPlot.findUnique({
        where: { id: plotId },
        include: {
          members: { select: { playerId: true } }
        }
      });

      if (!plot || !plot.isActive) {
        return res.status(404).json({ error: 'Plot nicht gefunden oder inaktiv' });
      }

      // Check if user is creator or member
      const isCreator = plot.creatorId === user.player.id;
      const isMember = plot.members.some(m => m.playerId === user.player.id);

      if (!isCreator && !isMember) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Plot' });
      }
    }

    const newMessage = await prisma.holoNetMessage.create({
      data: {
        playerId: user.player.id,
        plotId: plotId || null,
        title: title?.trim() || null,
        message: message.trim(),
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
            faction: {
              select: {
                name: true,
              },
            },
          },
        },
        plot: true,
      },
    });

    logger.info('New HoloNet message posted:', newMessage.id, 'by', newMessage.player.user.username);

    // Broadcast to all connected clients
    const io = getIo();
    io.emit('holonet:message', {
      id: newMessage.id,
      title: newMessage.title,
      message: newMessage.message,
      createdAt: newMessage.createdAt,
      player: {
        id: newMessage.player.id,
        username: newMessage.player.user.username,
        factionName: newMessage.player.faction.name,
      },
      plot: newMessage.plot ? {
        id: newMessage.plot.id,
        title: newMessage.plot.title,
        description: newMessage.plot.description,
      } : null,
    });

    res.json({
      id: newMessage.id,
      title: newMessage.title,
      message: newMessage.message,
      createdAt: newMessage.createdAt,
      player: {
        id: newMessage.player.id,
        username: newMessage.player.user.username,
        factionName: newMessage.player.faction.name,
      },
      plot: newMessage.plot ? {
        id: newMessage.plot.id,
        title: newMessage.plot.title,
        description: newMessage.plot.description,
      } : null,
    });
  } catch (error: any) {
    logger.error('Failed to post HoloNet message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Edit a message (only within 30 minutes)
router.put('/messages/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    const user = (req as any).user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Nachricht darf nicht leer sein' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Nachricht zu lang (max 5000 Zeichen)' });
    }

    if (title && title.length > 100) {
      return res.status(400).json({ error: 'Titel zu lang (max 100 Zeichen)' });
    }

    // Find existing message
    const existingMessage = await prisma.holoNetMessage.findUnique({
      where: { id: parseInt(id) },
      include: { player: true },
    });

    if (!existingMessage) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden' });
    }

    // Check ownership
    if (existingMessage.playerId !== user.player.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // Check 30 minute window
    const now = new Date();
    const createdAt = new Date(existingMessage.createdAt);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

    if (diffMinutes > 30) {
      return res.status(403).json({ error: 'Bearbeitungszeit abgelaufen (max 30 Minuten)' });
    }

    // Update message
    const updatedMessage = await prisma.holoNetMessage.update({
      where: { id: parseInt(id) },
      data: {
        title: title?.trim() || null,
        message: message.trim(),
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
            faction: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    logger.info('HoloNet message edited:', updatedMessage.id, 'by', updatedMessage.player.user.username);

    // Broadcast update to all connected clients
    const io = getIo();
    io.emit('holonet:updated', {
      id: updatedMessage.id,
      title: updatedMessage.title,
      message: updatedMessage.message,
      createdAt: updatedMessage.createdAt,
      updatedAt: updatedMessage.updatedAt,
      player: {
        id: updatedMessage.player.id,
        username: updatedMessage.player.user.username,
        factionName: updatedMessage.player.faction.name,
      },
    });

    res.json({
      id: updatedMessage.id,
      title: updatedMessage.title,
      message: updatedMessage.message,
      createdAt: updatedMessage.createdAt,
      updatedAt: updatedMessage.updatedAt,
      player: {
        id: updatedMessage.player.id,
        username: updatedMessage.player.user.username,
        factionName: updatedMessage.player.faction.name,
      },
    });
  } catch (error: any) {
    logger.error('Failed to edit HoloNet message:', error);
    res.status(500).json({ error: 'Fehler beim Bearbeiten' });
  }
});

// GET /api/holonet/plots - List all active plots
router.get('/plots', authMiddleware, async (req, res) => {
  try {
    const plots = await prisma.holoNetPlot.findMany({
      where: { isActive: true },
      include: {
        creator: {
          include: {
            user: { select: { username: true } },
            faction: { select: { name: true } }
          }
        },
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform data for frontend
    const plotsWithCount = plots.map(plot => ({
      id: plot.id,
      title: plot.title,
      description: plot.description,
      isActive: plot.isActive,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt,
      creator: {
        id: plot.creator.id,
        username: plot.creator.user.username,
        factionName: plot.creator.faction.name,
      },
      messageCount: plot._count.messages,
    }));

    logger.api('Fetched HoloNet plots:', plotsWithCount.length);
    res.json(plotsWithCount);
  } catch (error: any) {
    logger.error('Failed to fetch HoloNet plots:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Plots' });
  }
});

// POST /api/holonet/plots - Create new plot
router.post('/plots', authMiddleware, async (req, res) => {
  try {
    const { title, description, initialMembers } = req.body;
    const user = (req as any).user;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Titel darf nicht leer sein' });
    }

    if (title.length > 100) {
      return res.status(400).json({ error: 'Titel zu lang (max 100 Zeichen)' });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'Beschreibung zu lang (max 1000 Zeichen)' });
    }

    const plot = await prisma.holoNetPlot.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        creatorId: user.player.id
      },
      include: {
        creator: {
          include: {
            user: { select: { username: true } },
            faction: { select: { name: true } }
          }
        }
      }
    });

    // Add initial members if provided
    if (initialMembers && Array.isArray(initialMembers) && initialMembers.length > 0) {
      // Find players by username
      const memberPlayers = await prisma.player.findMany({
        where: {
          user: {
            username: {
              in: initialMembers.map((username: string) => username.trim()),
              mode: 'insensitive'
            }
          }
        },
        include: {
          user: { select: { username: true } }
        }
      });

      // Create member records for found players
      if (memberPlayers.length > 0) {
        const memberData = memberPlayers.map(player => ({
          plotId: plot.id,
          playerId: player.id,
          addedBy: user.player.id
        }));

        await prisma.holoNetPlotMember.createMany({
          data: memberData,
          skipDuplicates: true
        });

        logger.info('Added initial members to plot:', plot.id, 'members:', memberPlayers.map(p => p.user.username));
      }
    }

    logger.info('New HoloNet plot created:', plot.id, 'by', plot.creator.user.username);

    res.json({
      id: plot.id,
      title: plot.title,
      description: plot.description,
      isActive: plot.isActive,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt,
      creator: {
        id: plot.creator.id,
        username: plot.creator.user.username,
        factionName: plot.creator.faction.name,
      },
      messageCount: 0,
    });
  } catch (error: any) {
    logger.error('Failed to create HoloNet plot:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Plots' });
  }
});

// PUT /api/holonet/plots/:id/status - Toggle plot active status
router.put('/plots/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const plot = await prisma.holoNetPlot.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          include: {
            user: { select: { username: true } },
            faction: { select: { name: true } }
          }
        }
      }
    });

    if (!plot) {
      return res.status(404).json({ error: 'Plot nicht gefunden' });
    }

    if (plot.creatorId !== user.player.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const updatedPlot = await prisma.holoNetPlot.update({
      where: { id: parseInt(id) },
      data: { isActive: !plot.isActive }
    });

    logger.info('HoloNet plot status changed:', updatedPlot.id, 'active:', updatedPlot.isActive);

    res.json({
      id: updatedPlot.id,
      title: updatedPlot.title,
      description: updatedPlot.description,
      isActive: updatedPlot.isActive,
      createdAt: updatedPlot.createdAt,
      updatedAt: updatedPlot.updatedAt,
      creator: {
        id: plot.creator.id,
        username: plot.creator.user.username,
        factionName: plot.creator.faction.name,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update HoloNet plot status:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Plot-Status' });
  }
});

// GET /api/holonet/plots/:id/members - Get plot members (creator only)
router.get('/plots/:id/members', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only creator can view members
    const plot = await prisma.holoNetPlot.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: {
            player: {
              include: {
                user: { select: { username: true } },
                faction: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!plot) {
      return res.status(404).json({ error: 'Plot nicht gefunden' });
    }

    if (plot.creatorId !== user.player.id) {
      return res.status(403).json({ error: 'Keine Berechtigung - nur der Ersteller kann Mitglieder verwalten' });
    }

    const members = plot.members.map(member => ({
      id: member.player.id,
      username: member.player.user.username,
      factionName: member.player.faction.name,
      addedAt: member.addedAt
    }));

    logger.api('Fetched plot members:', plot.id, 'members:', members.length);
    res.json(members);
  } catch (error: any) {
    logger.error('Failed to fetch plot members:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Plot-Mitglieder' });
  }
});

// POST /api/holonet/plots/:id/members - Add member to plot (creator only)
router.post('/plots/:id/members', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    const user = (req as any).user;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Benutzername ist erforderlich' });
    }

    // Only creator can add members
    const plot = await prisma.holoNetPlot.findUnique({
      where: { id: parseInt(id) }
    });

    if (!plot) {
      return res.status(404).json({ error: 'Plot nicht gefunden' });
    }

    if (plot.creatorId !== user.player.id) {
      return res.status(403).json({ error: 'Nur der Ersteller kann Mitglieder hinzufügen' });
    }

    // Find player by username
    const targetPlayer = await prisma.player.findFirst({
      where: {
        user: { username: username.trim() }
      }
    });

    if (!targetPlayer) {
      return res.status(404).json({ error: 'Spieler nicht gefunden' });
    }

    // Check if already a member
    const existingMember = await prisma.holoNetPlotMember.findUnique({
      where: {
        plotId_playerId: {
          plotId: parseInt(id),
          playerId: targetPlayer.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Spieler ist bereits Mitglied dieses Plots' });
    }

    // Add member
    await prisma.holoNetPlotMember.create({
      data: {
        plotId: parseInt(id),
        playerId: targetPlayer.id,
        addedBy: user.player.id
      }
    });

    logger.info('Plot member added:', targetPlayer.id, 'to plot', parseInt(id), 'by', user.player.id);
    res.json({ success: true, message: 'Mitglied erfolgreich hinzugefügt' });
  } catch (error: any) {
    logger.error('Failed to add plot member:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Mitglieds' });
  }
});

// DELETE /api/holonet/plots/:id/members/:playerId - Remove member from plot (creator only)
router.delete('/plots/:id/members/:playerId', authMiddleware, async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const user = (req as any).user;

    // Only creator can remove members
    const plot = await prisma.holoNetPlot.findUnique({
      where: { id: parseInt(id) }
    });

    if (!plot) {
      return res.status(404).json({ error: 'Plot nicht gefunden' });
    }

    if (plot.creatorId !== user.player.id) {
      return res.status(403).json({ error: 'Nur der Ersteller kann Mitglieder entfernen' });
    }

    // Remove member
    const deletedMember = await prisma.holoNetPlotMember.deleteMany({
      where: {
        plotId: parseInt(id),
        playerId: parseInt(playerId)
      }
    });

    if (deletedMember.count === 0) {
      return res.status(404).json({ error: 'Mitgliedschaft nicht gefunden' });
    }

    logger.info('Plot member removed:', parseInt(playerId), 'from plot', parseInt(id), 'by', user.player.id);
    res.json({ success: true, message: 'Mitglied erfolgreich entfernt' });
  } catch (error: any) {
    logger.error('Failed to remove plot member:', error);
    res.status(500).json({ error: 'Fehler beim Entfernen des Mitglieds' });
  }
});

export default router;
