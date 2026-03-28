import type { IStrategy } from '../types.js';
import { CS2Strategy } from './cs2.js';
import { CommunityStrategy } from './community.js';
import { DefaultStrategy } from './default.js';

/**
 * Strategy registry: maps (appId, contextId) → IStrategy.
 * Open for extension via register() (FR68).
 */
export class StrategyRegistry {
  private strategies = new Map<string, IStrategy>();
  private defaultStrategy = new DefaultStrategy();

  constructor() {
    this.register(730, 2, new CS2Strategy());
    this.register(753, 6, new CommunityStrategy());
  }

  private key(appId: number, contextId: number): string {
    return `${appId}_${contextId}`;
  }

  register(appId: number, contextId: number, strategy: IStrategy): void {
    this.strategies.set(this.key(appId, contextId), strategy);
  }

  get(appId: number, contextId: number): IStrategy {
    return this.strategies.get(this.key(appId, contextId)) ?? this.defaultStrategy;
  }
}
