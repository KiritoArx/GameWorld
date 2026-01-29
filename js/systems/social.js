/**
 * social.js - System that handles social interactions
 * 
 * When NPCs socialize, their relationships update based on
 * personality compatibility.
 */

import { world } from '../core/ecs.js';
import { ACTIONS, CONFIG } from '../core/constants.js';
import { relationshipStore } from '../components/relationships.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { rng } from '../core/rng.js';

/**
 * Run the social system
 */
export function runSocialSystem(currentTick) {
    for (const entityId of world.query('npc', 'position')) {
        const npc = world.getComponent(entityId, 'npc');
        
        if (!npc || npc.state.action !== ACTIONS.SOCIALIZE) continue;
        
        const targetId = npc.state.targetEntity;
        if (!targetId || !world.hasComponent(targetId, 'npc')) {
            npc.state.action = ACTIONS.IDLE;
            continue;
        }
        
        const targetNpc = world.getComponent(targetId, 'npc');
        
        // Calculate interaction outcome based on personality compatibility
        const compatibility = calculateCompatibility(npc, targetNpc);
        
        // Update relationships (both directions, but asymmetric)
        const gains = CONFIG.RELATIONSHIP_GAIN_PER_INTERACTION;
        
        // How much affinity changes depends on compatibility
        const affinityGain = gains.affinity * compatibility;
        const trustGain = gains.trust * (0.5 + compatibility * 0.5);
        const familiarityGain = gains.familiarity;
        
        // Update A -> B relationship
        const isNew = !relationshipStore.has(entityId, targetId);
        relationshipStore.recordInteraction(
            entityId, targetId,
            affinityGain, trustGain, familiarityGain,
            currentTick
        );
        
        // Update B -> A relationship (slightly different based on B's perspective)
        const reverseCompatibility = calculateCompatibility(targetNpc, npc);
        relationshipStore.recordInteraction(
            targetId, entityId,
            gains.affinity * reverseCompatibility,
            gains.trust * (0.5 + reverseCompatibility * 0.5),
            familiarityGain,
            currentTick
        );
        
        if (isNew) {
            eventBus.emit(EVENTS.RELATIONSHIP_FORMED, {
                from: entityId,
                to: targetId,
                tick: currentTick
            });
        }
        
        // Satisfy social need
        npc.needs.social = Math.min(100, npc.needs.social + 10);
        targetNpc.needs.social = Math.min(100, targetNpc.needs.social + 5);
        
        // Update stats
        npc.stats.socialInteractions++;
        
        // Interaction complete
        npc.state.action = ACTIONS.IDLE;
        npc.state.targetEntity = null;
    }
}

/**
 * Calculate personality compatibility between two NPCs
 * Returns value from -1 (hostile) to 1 (very compatible)
 */
function calculateCompatibility(npc1, npc2) {
    const t1 = npc1.traits;
    const t2 = npc2.traits;
    
    let score = 0;
    
    // Cooperative NPCs get along better
    score += (t1.cooperativeness + t2.cooperativeness) * 0.3;
    
    // Similar aggression levels work better
    score -= Math.abs(t1.aggression - t2.aggression) * 0.4;
    
    // Attached NPCs form stronger bonds
    score += (t1.attachment * t2.attachment) * 0.3;
    
    // Very greedy NPCs clash
    if (t1.greed > 0.7 && t2.greed > 0.7) {
        score -= 0.3;
    }
    
    // Innovative NPCs enjoy each other
    if (t1.innovation > 0.6 && t2.innovation > 0.6) {
        score += 0.2;
    }
    
    // Add small random variance (deterministic)
    score += (rng.next() - 0.5) * 0.2;
    
    // Clamp to [-1, 1]
    return Math.max(-1, Math.min(1, score));
}
