import prisma from '../lib/prisma';
import { CombatRating, calculateCombatRating } from '../types/blueprint.types';

// =====================================================
// Combat Service - Server-Side Combat Calculations
// =====================================================
// This service handles ALL combat calculations using secret game data.
// Combat values (damage, shield strength) are NEVER exposed to clients.
// Clients receive only results (hit/miss, damage as %, outcomes).
// =====================================================

// Combat outcome types (safe to send to client)
export interface CombatOutcome {
  attackerHit: boolean;
  damagePercentage: number;  // % of defender's HP lost (no exact values)
  defenderDestroyed: boolean;
  criticalHit: boolean;
}

export interface CombatRoundResult {
  roundNumber: number;
  attackerShipId: number;
  defenderShipId: number;
  outcome: CombatOutcome;
  attackerRemainingHpPercent: number;
  defenderRemainingHpPercent: number;
}

export interface CombatResult {
  winnerId: number | null;  // null = draw
  loserId: number | null;
  rounds: CombatRoundResult[];
  totalRounds: number;
  combatLog: string[];  // Narrative log (safe for client)
}

// Internal combat state (server-side only)
interface ShipCombatState {
  shipId: number;
  playerId: number;
  blueprintId: number;
  currentHullPoints: number;
  maxHullPoints: number;
  currentShieldPoints: number;
  maxShieldPoints: number;
  damage: number;
  speed: number;
  sensorRange: number;
}

class CombatService {
  // Combat constants (could be loaded from YAML later)
  private readonly BASE_HIT_CHANCE = 0.7;  // 70% base hit chance
  private readonly CRIT_CHANCE = 0.1;       // 10% crit chance
  private readonly CRIT_MULTIPLIER = 1.5;   // 50% extra damage on crit
  private readonly SHIELD_EFFICIENCY = 0.8; // Shields absorb 80% of damage
  private readonly MAX_COMBAT_ROUNDS = 20;

  /**
   * Calculate hit chance based on speed difference
   * Higher speed = better hit chance against slower targets
   */
  private calculateHitChance(attackerSpeed: number, defenderSpeed: number): number {
    const speedDiff = attackerSpeed - defenderSpeed;
    const speedModifier = speedDiff * 0.01; // 1% per speed point difference
    return Math.min(0.95, Math.max(0.3, this.BASE_HIT_CHANCE + speedModifier));
  }

  /**
   * Calculate damage dealt (server-side only)
   * Returns actual damage number for internal calculations
   */
  private calculateDamage(baseDamage: number, isCrit: boolean): number {
    const variance = 0.9 + Math.random() * 0.2; // 90-110% variance
    let damage = Math.floor(baseDamage * variance);
    if (isCrit) {
      damage = Math.floor(damage * this.CRIT_MULTIPLIER);
    }
    return damage;
  }

  /**
   * Apply damage to defender (handles shields first)
   * Returns remaining damage after shield absorption
   */
  private applyDamage(defender: ShipCombatState, damage: number): number {
    // Shields absorb damage first
    if (defender.currentShieldPoints > 0) {
      const shieldDamage = Math.min(defender.currentShieldPoints, damage * this.SHIELD_EFFICIENCY);
      defender.currentShieldPoints -= shieldDamage;
      damage -= Math.floor(shieldDamage / this.SHIELD_EFFICIENCY);
    }

    // Remaining damage goes to hull
    if (damage > 0) {
      defender.currentHullPoints = Math.max(0, defender.currentHullPoints - damage);
    }

    return damage;
  }

  /**
   * Load ship combat state from database (server-side only)
   * Includes SECRET combat values from ship's stored stats
   */
  async loadShipCombatState(shipId: number): Promise<ShipCombatState | null> {
    const ship = await prisma.ship.findUnique({
      where: { id: shipId },
      include: {
        blueprint: true,
      },
    });

    if (!ship) return null;

    // Use ship's stored stats (these are SECRET, never exposed to client directly)
    // The Ship model stores: hullPoints, deflectorShieldStrength, weaponDamage, etc.
    return {
      shipId: ship.id,
      playerId: ship.playerId,
      blueprintId: ship.blueprintId ?? 0,
      currentHullPoints: ship.hullPoints,
      maxHullPoints: ship.hullPoints, // For now, max = current (no damage tracking yet)
      currentShieldPoints: ship.deflectorShieldStrength,
      maxShieldPoints: ship.deflectorShieldStrength,
      damage: ship.weaponDamage,
      speed: ship.subLightSpeed,
      sensorRange: ship.sensorRange,
    };
  }

  /**
   * Execute a single combat round (server-side only)
   */
  private executeCombatRound(
    attacker: ShipCombatState,
    defender: ShipCombatState,
    roundNumber: number
  ): CombatRoundResult {
    const hitChance = this.calculateHitChance(attacker.speed, defender.speed);
    const hitRoll = Math.random();
    const attackerHit = hitRoll < hitChance;

    let damagePercentage = 0;
    let criticalHit = false;

    if (attackerHit) {
      criticalHit = Math.random() < this.CRIT_CHANCE;
      const damageDealt = this.calculateDamage(attacker.damage, criticalHit);
      this.applyDamage(defender, damageDealt);

      // Calculate percentage of max HP lost (safe to show client)
      damagePercentage = Math.round((damageDealt / defender.maxHullPoints) * 100);
    }

    const defenderDestroyed = defender.currentHullPoints <= 0;

    return {
      roundNumber,
      attackerShipId: attacker.shipId,
      defenderShipId: defender.shipId,
      outcome: {
        attackerHit,
        damagePercentage,
        defenderDestroyed,
        criticalHit,
      },
      attackerRemainingHpPercent: Math.round((attacker.currentHullPoints / attacker.maxHullPoints) * 100),
      defenderRemainingHpPercent: Math.round((defender.currentHullPoints / defender.maxHullPoints) * 100),
    };
  }

  /**
   * Generate combat log message (safe for client)
   */
  private generateCombatLogMessage(round: CombatRoundResult, attackerName: string, defenderName: string): string {
    if (!round.outcome.attackerHit) {
      return `Runde ${round.roundNumber}: ${attackerName} verfehlt ${defenderName}!`;
    }

    let message = `Runde ${round.roundNumber}: ${attackerName} trifft ${defenderName}`;
    if (round.outcome.criticalHit) {
      message += ' (KRITISCHER TREFFER!)';
    }
    message += ` - ${round.outcome.damagePercentage}% Schaden`;

    if (round.outcome.defenderDestroyed) {
      message += ` - ${defenderName} ZERSTOERT!`;
    }

    return message;
  }

  /**
   * Execute full combat between two ships
   * Returns public-safe combat result
   */
  async executeCombat(attackerShipId: number, defenderShipId: number): Promise<CombatResult> {
    const attacker = await this.loadShipCombatState(attackerShipId);
    const defender = await this.loadShipCombatState(defenderShipId);

    if (!attacker || !defender) {
      throw new Error('Invalid ship(s) for combat');
    }

    // Get ship names for log
    const attackerShip = await prisma.ship.findUnique({
      where: { id: attackerShipId },
      include: { blueprint: true },
    });
    const defenderShip = await prisma.ship.findUnique({
      where: { id: defenderShipId },
      include: { blueprint: true },
    });

    const attackerName = attackerShip?.blueprint?.name || `Schiff ${attackerShipId}`;
    const defenderName = defenderShip?.blueprint?.name || `Schiff ${defenderShipId}`;

    const rounds: CombatRoundResult[] = [];
    const combatLog: string[] = [];
    let roundNumber = 1;

    combatLog.push(`Kampf beginnt: ${attackerName} vs ${defenderName}`);

    // Combat loop - alternating attacks
    while (
      attacker.currentHullPoints > 0 &&
      defender.currentHullPoints > 0 &&
      roundNumber <= this.MAX_COMBAT_ROUNDS
    ) {
      // Faster ship attacks first each round
      const firstAttacker = attacker.speed >= defender.speed ? attacker : defender;
      const secondAttacker = attacker.speed >= defender.speed ? defender : attacker;

      // First attack
      const round1 = this.executeCombatRound(
        firstAttacker,
        firstAttacker === attacker ? defender : attacker,
        roundNumber
      );
      rounds.push(round1);
      combatLog.push(this.generateCombatLogMessage(
        round1,
        firstAttacker === attacker ? attackerName : defenderName,
        firstAttacker === attacker ? defenderName : attackerName
      ));

      // Check if combat ended
      if (round1.outcome.defenderDestroyed) break;

      // Second attack
      const round2 = this.executeCombatRound(
        secondAttacker,
        secondAttacker === attacker ? defender : attacker,
        roundNumber
      );
      rounds.push(round2);
      combatLog.push(this.generateCombatLogMessage(
        round2,
        secondAttacker === attacker ? attackerName : defenderName,
        secondAttacker === attacker ? defenderName : attackerName
      ));

      roundNumber++;
    }

    // Determine winner
    let winnerId: number | null = null;
    let loserId: number | null = null;

    if (attacker.currentHullPoints <= 0 && defender.currentHullPoints <= 0) {
      combatLog.push('Kampf endet unentschieden - beide Schiffe zerstoert!');
    } else if (attacker.currentHullPoints <= 0) {
      winnerId = defender.shipId;
      loserId = attacker.shipId;
      combatLog.push(`${defenderName} gewinnt den Kampf!`);
    } else if (defender.currentHullPoints <= 0) {
      winnerId = attacker.shipId;
      loserId = defender.shipId;
      combatLog.push(`${attackerName} gewinnt den Kampf!`);
    } else {
      // Timeout - winner is whoever has more HP%
      const attackerHpPercent = attacker.currentHullPoints / attacker.maxHullPoints;
      const defenderHpPercent = defender.currentHullPoints / defender.maxHullPoints;

      if (attackerHpPercent > defenderHpPercent) {
        winnerId = attacker.shipId;
        loserId = defender.shipId;
        combatLog.push(`Kampf endet nach ${roundNumber - 1} Runden - ${attackerName} gewinnt!`);
      } else if (defenderHpPercent > attackerHpPercent) {
        winnerId = defender.shipId;
        loserId = attacker.shipId;
        combatLog.push(`Kampf endet nach ${roundNumber - 1} Runden - ${defenderName} gewinnt!`);
      } else {
        combatLog.push(`Kampf endet unentschieden nach ${roundNumber - 1} Runden!`);
      }
    }

    // Update ship HP in database
    await this.updateShipAfterCombat(attacker);
    await this.updateShipAfterCombat(defender);

    return {
      winnerId,
      loserId,
      rounds,
      totalRounds: roundNumber - 1,
      combatLog,
    };
  }

  /**
   * Update ship HP after combat
   * Note: Updates the main hullPoints and deflectorShieldStrength fields
   * In a future implementation, we may want separate current/max fields
   */
  private async updateShipAfterCombat(state: ShipCombatState): Promise<void> {
    await prisma.ship.update({
      where: { id: state.shipId },
      data: {
        hullPoints: state.currentHullPoints,
        deflectorShieldStrength: state.currentShieldPoints,
      },
    });
  }

  /**
   * Get combat rating for a ship (safe for client)
   */
  async getShipCombatRating(shipId: number): Promise<CombatRating> {
    const state = await this.loadShipCombatState(shipId);
    if (!state) return 'NIEDRIG';

    return calculateCombatRating(state.damage, state.maxShieldPoints);
  }

  /**
   * Calculate expected combat outcome (for UI preview, no actual combat)
   * Returns vague estimation, not exact values
   */
  async estimateCombatOutcome(
    attackerShipId: number,
    defenderShipId: number
  ): Promise<{ attackerAdvantage: 'STRONG' | 'SLIGHT' | 'EVEN' | 'DISADVANTAGE' | 'SEVERE_DISADVANTAGE' }> {
    const attacker = await this.loadShipCombatState(attackerShipId);
    const defender = await this.loadShipCombatState(defenderShipId);

    if (!attacker || !defender) {
      return { attackerAdvantage: 'EVEN' };
    }

    // Calculate power scores (internal only)
    const attackerPower = attacker.damage + attacker.maxShieldPoints + attacker.maxHullPoints + attacker.speed;
    const defenderPower = defender.damage + defender.maxShieldPoints + defender.maxHullPoints + defender.speed;

    const powerRatio = attackerPower / defenderPower;

    if (powerRatio >= 1.5) return { attackerAdvantage: 'STRONG' };
    if (powerRatio >= 1.2) return { attackerAdvantage: 'SLIGHT' };
    if (powerRatio >= 0.8) return { attackerAdvantage: 'EVEN' };
    if (powerRatio >= 0.6) return { attackerAdvantage: 'DISADVANTAGE' };
    return { attackerAdvantage: 'SEVERE_DISADVANTAGE' };
  }
}

export const combatService = new CombatService();
