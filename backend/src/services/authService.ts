import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { inviteService } from './inviteService';
import { mailService } from './mailService';

const SALT_ROUNDS = 10;

// Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  factionId: z.number().int().positive(),
  inviteCode: z.string().min(8, 'Invite code is required').max(8),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export class AuthService {
  async register(data: RegisterInput) {
    // Validate input
    const validated = registerSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          { username: validated.username },
        ],
      },
    });

    if (existingUser) {
      throw new Error('Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits');
    }

    // Check if faction exists
    const faction = await prisma.faction.findUnique({
      where: { id: validated.factionId },
    });

    if (!faction) {
      throw new Error('Ungültige Fraktion ausgewählt');
    }

    // Validate invite code
    const isValidInvite = await inviteService.validateCode(validated.inviteCode);
    if (!isValidInvite) {
      throw new Error('Ungültiger oder bereits verwendeter Invite-Code');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, SALT_ROUNDS);

    // Create user and player in transaction
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        username: validated.username,
        password: hashedPassword,
        player: {
          create: {
            factionId: validated.factionId,
            isAdmin: validated.inviteCode === 'ADMIN001', // Set admin flag for ADMIN001 code
            // Resources are now per-planet, not per-player
          },
        },
      },
      include: {
        player: {
          include: {
            faction: true,
          },
        },
      },
    });

    // Mark invite code as used
    await inviteService.useCode(validated.inviteCode, user.id);

    // Create 2 new invite codes for the new user
    const newInviteCodes = await inviteService.createInviteCodes(user.id, 2);

    // Send welcome email with invite codes
    try {
      await mailService.sendWelcomeEmail(
        {
          email: user.email,
          username: user.username,
        },
        newInviteCodes
      );
      console.log(`📧 Welcome email sent successfully to ${user.email}`);
    } catch (mailError) {
      // Log error but don't fail registration - email is not critical
      console.error('⚠️  Failed to send welcome email:', mailError);
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        player: user.player,
      },
      // Remove inviteCodes from response - they're now sent via email
      message: 'Registrierung erfolgreich! Überprüfe deine E-Mails für weitere Informationen.',
    };
  }

  async login(data: LoginInput) {
    // Validate input
    const validated = loginSchema.parse(data);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: {
        player: {
          include: {
            faction: true,
            planets: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Ungültige E-Mail oder Passwort');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validated.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Ungültige E-Mail oder Passwort');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        player: user.player,
      },
    };
  }

  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: {
          include: {
            faction: true,
            planets: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Benutzer nicht gefunden');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      player: user.player,
    };
  }

  async getUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  async updateUsername(userId: number, username: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { username },
    });
  }

  async updatePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  private generateToken(userId: number): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.sign(
      { userId },
      jwtSecret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { userId: number } {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    try {
      return jwt.verify(token, jwtSecret) as { userId: number };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Request password reset - generates token and sends email
   */
  async requestPasswordReset(data: ForgotPasswordInput): Promise<{ message: string }> {
    // Validate input
    const validated = forgotPasswordSchema.parse(data);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    // Always return success message (don't leak if email exists)
    const successMessage = 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.';

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${validated.email}`);
      return { message: successMessage };
    }

    // Clean up old reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: { gte: new Date() }, // Still valid tokens
      },
      data: { isUsed: true }, // Mark as used to prevent reuse
    });

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send password reset email
    try {
      await mailService.sendPasswordResetEmail(
        {
          email: user.email,
          username: user.username,
        },
        resetToken
      );
      console.log(`📧 Password reset email sent to ${user.email}`);
    } catch (mailError) {
      console.error('⚠️  Failed to send password reset email:', mailError);
      // Don't fail the request - token is still valid even if email fails
    }

    return { message: successMessage };
  }

  /**
   * Reset password with token
   */
  async resetPasswordWithToken(data: ResetPasswordInput): Promise<{ message: string }> {
    // Validate input
    const validated = resetPasswordSchema.parse(data);

    // Find valid reset token
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: validated.token,
        isUsed: false,
        expiresAt: { gte: new Date() }, // Not expired
      },
      include: {
        user: true,
      },
    });

    if (!resetTokenRecord) {
      throw new Error('Ungültiger oder abgelaufener Reset-Token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, SALT_ROUNDS);

    // Update user password and mark token as used in transaction
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { password: hashedPassword },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
    ]);

    console.log(`🔒 Password reset successful for user: ${resetTokenRecord.user.email}`);

    return {
      message: 'Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt mit deinem neuen Passwort anmelden.',
    };
  }

  /**
   * Clean up expired password reset tokens (maintenance method)
   */
  async cleanupExpiredResetTokens(): Promise<number> {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }, // Expired tokens
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired password reset tokens`);
    return result.count;
  }
}

export const authService = new AuthService();
