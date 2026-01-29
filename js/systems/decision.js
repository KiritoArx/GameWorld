/**
 * decision.js - System that triggers NPC decision making
 * 
 * NPCs don't reconsider their action every tick (expensive).
 * Instead, they decide every DECISION_INTERVAL ticks, or when
 * their current action completes.
 */

import { world } from '../core/ecs.js';
import { CONFIG, ACTIONS } from '../core/constants.js';
import { makeDecision } from '../ai/utilityAI.js';
import { eventBus, EVENTS } from '../core/eventBus.js';

/**
 * Run the decision system
 */
export function runDecisionSystem(currentTick) {
    for (const entityId of world.query('npc')) {
        const npc = world.getComponent(entityId, 'npc');
        if (!npc) continue;
        
        npc.state.ticksSinceLastDecision++;
        
        // Check if NPC needs to make a new decision
        const shouldDecide = 
            npc.state.action === ACTIONS.IDLE ||
            npc.state.ticksSinceLastDecision >= CONFIG.DECISION_INTERVAL;
        
        if (shouldDecide) {
            const decision = makeDecision(entityId, currentTick);
            
            // Update NPC state
            npc.state.action = decision.action;
            npc.state.targetX = decision.targetX || null;
            npc.state.targetY = decision.targetY || null;
            npc.state.targetEntity = decision.targetEntity || null;
            npc.state.actionProgress = 0;
            npc.state.ticksSinceLastDecision = 0;
            
            // Emit event for debugging
            eventBus.emit(EVENTS.NPC_DECISION, {
                entityId,
                action: decision.action,
                score: decision.score,
                breakdown: decision.breakdown
            });
        }
    }
}
