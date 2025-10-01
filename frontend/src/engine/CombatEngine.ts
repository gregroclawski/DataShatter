// Core Combat Engine - Tick-based system running at 20 TPS (faster XP processing)
export class CombatEngine {
  private tickRate = 20; // 20 ticks per second for responsive XP awarding
  private tickInterval: number = 1000 / this.tickRate; // 100ms per tick
  private lastTick: number = 0;
  private isRunning: boolean = false;
  private tickCallbacks: Array<() => void> = [];

  constructor() {
    this.lastTick = Date.now();
  }

  // Start the combat engine
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTick = Date.now();
    this.gameLoop();
  }

  // Stop the combat engine
  stop(): void {
    this.isRunning = false;
  }

  // Add callback to be called every tick
  addTickCallback(callback: () => void): void {
    this.tickCallbacks.push(callback);
  }

  // Remove tick callback
  removeTickCallback(callback: () => void): void {
    const index = this.tickCallbacks.indexOf(callback);
    if (index > -1) {
      this.tickCallbacks.splice(index, 1);
    }
  }

  // Main game loop - runs at 10 TPS
  private gameLoop(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = now - this.lastTick;

    // Only process if enough time has passed for next tick
    if (deltaTime >= this.tickInterval) {
      // Execute all tick callbacks
      this.tickCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in tick callback:', error);
        }
      });

      this.lastTick = now;
    }

    // Schedule next frame - Mobile compatible timing instead of requestAnimationFrame
    setTimeout(() => this.gameLoop(), this.tickInterval);
  }

  // Get current tick timestamp for cooldown calculations
  getCurrentTick(): number {
    return Math.floor(this.lastTick / this.tickInterval);
  }

  // Convert seconds to ticks
  secondsToTicks(seconds: number): number {
    return Math.floor(seconds * this.tickRate);
  }

  // Convert ticks to seconds
  ticksToSeconds(ticks: number): number {
    return ticks / this.tickRate;
  }
}

// Damage calculation system
export interface DamageResult {
  damage: number;
  isCritical: boolean;
  damageType: 'physical' | 'magical' | 'true';
  effects?: DamageEffect[];
}

export interface DamageEffect {
  type: 'dot' | 'heal' | 'buff' | 'debuff' | 'stun';
  duration: number; // in ticks
  value: number;
  tickInterval: number; // how often the effect triggers (in ticks)
}

export class DamageCalculator {
  // Calculate base damage with crit chance
  static calculateDamage(
    baseDamage: number, 
    attackerStats: CombatStats, 
    defenderStats: CombatStats
  ): DamageResult {
    let finalDamage = baseDamage;
    let isCritical = false;

    // Apply attack stat bonus
    finalDamage *= (1 + attackerStats.attack / 100);

    // Check for critical hit
    if (Math.random() < attackerStats.critChance / 100) {
      finalDamage *= (1 + attackerStats.critDamage / 100);
      isCritical = true;
    }

    // Apply defense reduction
    const damageReduction = defenderStats.defense / (defenderStats.defense + 100);
    finalDamage *= (1 - damageReduction);

    // Minimum damage is 1
    finalDamage = Math.max(1, Math.floor(finalDamage));

    return {
      damage: finalDamage,
      isCritical,
      damageType: 'physical'
    };
  }

  // Calculate DoT damage per tick
  static calculateDoTDamage(effect: DamageEffect, attackerStats: CombatStats): number {
    let damage = effect.value;
    damage *= (1 + attackerStats.attack / 100);
    return Math.max(1, Math.floor(damage));
  }
}

// Combat stats interface
export interface CombatStats {
  attack: number;
  defense: number;
  health: number;
  maxHealth: number;
  critChance: number; // percentage
  critDamage: number; // percentage bonus
  cooldownReduction: number; // percentage
  resistance?: { [key: string]: number }; // elemental resistances
}

// Status effect system
export interface StatusEffect {
  id: string;
  type: 'dot' | 'heal' | 'buff' | 'debuff' | 'stun';
  remainingTicks: number;
  tickInterval: number;
  lastTick: number;
  value: number;
  stackable: boolean;
  stacks?: number;
}

export class StatusEffectManager {
  private effects: Map<string, StatusEffect[]> = new Map();

  // Add status effect to entity
  addEffect(entityId: string, effect: StatusEffect): void {
    if (!this.effects.has(entityId)) {
      this.effects.set(entityId, []);
    }

    const entityEffects = this.effects.get(entityId)!;
    
    // Check if effect is stackable or should replace existing
    const existingIndex = entityEffects.findIndex(e => e.id === effect.id);
    
    if (existingIndex >= 0) {
      const existing = entityEffects[existingIndex];
      if (effect.stackable && existing.stacks && existing.stacks < 10) {
        existing.stacks++;
        existing.remainingTicks = Math.max(existing.remainingTicks, effect.remainingTicks);
      } else {
        // Replace existing effect
        entityEffects[existingIndex] = effect;
      }
    } else {
      entityEffects.push(effect);
    }
  }

  // Process status effects for all entities each tick
  processTick(currentTick: number): Map<string, DamageResult[]> {
    const tickResults = new Map<string, DamageResult[]>();

    this.effects.forEach((entityEffects, entityId) => {
      const results: DamageResult[] = [];
      
      // Process each effect
      for (let i = entityEffects.length - 1; i >= 0; i--) {
        const effect = entityEffects[i];
        
        // Check if it's time to trigger this effect
        if (currentTick >= effect.lastTick + effect.tickInterval) {
          // Apply effect
          const result = this.applyEffect(effect);
          if (result) {
            results.push(result);
          }
          
          effect.lastTick = currentTick;
          effect.remainingTicks--;
        }

        // Remove expired effects
        if (effect.remainingTicks <= 0) {
          entityEffects.splice(i, 1);
        }
      }

      if (results.length > 0) {
        tickResults.set(entityId, results);
      }
    });

    return tickResults;
  }

  // Apply individual status effect
  private applyEffect(effect: StatusEffect): DamageResult | null {
    switch (effect.type) {
      case 'dot':
        const stacks = effect.stacks || 1;
        return {
          damage: effect.value * stacks,
          isCritical: false,
          damageType: 'magical'
        };
      
      case 'heal':
        return {
          damage: -effect.value, // negative damage = healing
          isCritical: false,
          damageType: 'true'
        };
      
      default:
        return null;
    }
  }

  // Get all effects for an entity
  getEffects(entityId: string): StatusEffect[] {
    return this.effects.get(entityId) || [];
  }

  // Clear all effects for an entity
  clearEffects(entityId: string): void {
    this.effects.delete(entityId);
  }
}

// Global combat engine instance
export const combatEngine = new CombatEngine();