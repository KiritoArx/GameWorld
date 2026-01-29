/**
 * utilityAI.js - Utility-based AI for NPC decision making
 * 
 * NPCs evaluate all possible actions and choose the one with
 * the highest utility score. The score is based on:
 * - Need pressures (how urgent is each need?)
 * - Trait modifiers (personality influences choices)
 * - Context (what's nearby? what's the current state?)
 * - Costs (distance, time, risk)
 * 
 * The "WHY" breakdown is stored for the Grand Debugger.
 */

import { ACTIONS, CONFIG, RESOURCE_TYPES } from '../core/constants.js';
import { world } from '../core/ecs.js';
import { rng } from '../core/rng.js';
import { applyTraitModifier, hasItemsToDeposit, getTotalInventory } from '../components/npc.js';
import { findNearestResource } from '../world/worldGen.js';
import { stockpile } from '../world/stockpile.js';
import { manhattanDistance } from '../components/position.js';
import { relationshipStore } from '../components/relationships.js';

/**
 * Calculate utility scores for all candidate actions
 * Returns sorted list of { action, score, breakdown }
 */
export function evaluateActions(entityId, currentTick) {
    const npc = world.getComponent(entityId, 'npc');
    const pos = world.getComponent(entityId, 'position');
    
    if (!npc || !pos) return [];
    
    const candidates = [];
    
    // === EAT ===
    if (npc.inventory.food > 0) {
        const needPressure = getNeedPressure(npc.needs.hunger);
        const traitMod = 1.0;
        const baseUtility = 60;
        const cost = 0;
        
        const score = baseUtility * needPressure * traitMod - cost;
        candidates.push({
            action: ACTIONS.EAT,
            score,
            breakdown: {
                base: baseUtility,
                needPressure: needPressure.toFixed(2),
                needValue: npc.needs.hunger.toFixed(1),
                traitMod: traitMod.toFixed(2),
                cost: cost.toFixed(1),
                reason: `Hunger at ${npc.needs.hunger.toFixed(0)}%, have food`
            }
        });
    }
    
    // === DRINK ===
    if (npc.inventory.water > 0) {
        const needPressure = getNeedPressure(npc.needs.thirst);
        const traitMod = 1.0;
        const baseUtility = 60;
        const cost = 0;
        
        const score = baseUtility * needPressure * traitMod - cost;
        candidates.push({
            action: ACTIONS.DRINK,
            score,
            breakdown: {
                base: baseUtility,
                needPressure: needPressure.toFixed(2),
                needValue: npc.needs.thirst.toFixed(1),
                traitMod: traitMod.toFixed(2),
                cost: cost.toFixed(1),
                reason: `Thirst at ${npc.needs.thirst.toFixed(0)}%, have water`
            }
        });
    }
    
    // === REST ===
    {
        const needPressure = getNeedPressure(npc.needs.rest);
        const traitMod = applyTraitModifier(npc, 'riskTolerance', 1.0, -0.3);
        const baseUtility = 50;
        const cost = 5;
        
        const score = baseUtility * needPressure * traitMod - cost;
        candidates.push({
            action: ACTIONS.REST,
            score,
            breakdown: {
                base: baseUtility,
                needPressure: needPressure.toFixed(2),
                needValue: npc.needs.rest.toFixed(1),
                traitMod: traitMod.toFixed(2),
                cost: cost.toFixed(1),
                reason: `Rest at ${npc.needs.rest.toFixed(0)}%`
            }
        });
    }
    
    // === GATHER FOOD ===
    {
        const nearestFood = findNearestResource(pos.x, pos.y, RESOURCE_TYPES.FOOD);
        if (nearestFood) {
            const dist = manhattanDistance(pos, nearestFood);
            const needPressure = getNeedPressure(npc.needs.hunger) * 0.7 + 0.3;
            const traitMod = applyTraitModifier(npc, 'greed', 1.0, 0.3);
            const baseUtility = 40;
            const cost = dist * 0.5;
            
            const score = baseUtility * needPressure * traitMod - cost;
            candidates.push({
                action: ACTIONS.GATHER_FOOD,
                score,
                targetX: nearestFood.x,
                targetY: nearestFood.y,
                targetEntity: nearestFood.entityId,
                breakdown: {
                    base: baseUtility,
                    needPressure: needPressure.toFixed(2),
                    needValue: npc.needs.hunger.toFixed(1),
                    traitMod: traitMod.toFixed(2),
                    cost: cost.toFixed(1),
                    distance: dist,
                    reason: `Food ${dist} tiles away`
                }
            });
        }
    }
    
    // === GATHER WATER ===
    {
        const nearestWater = findNearestResource(pos.x, pos.y, RESOURCE_TYPES.WATER);
        if (nearestWater) {
            const dist = manhattanDistance(pos, nearestWater);
            const needPressure = getNeedPressure(npc.needs.thirst) * 0.7 + 0.3;
            const traitMod = applyTraitModifier(npc, 'greed', 1.0, 0.3);
            const baseUtility = 40;
            const cost = dist * 0.5;
            
            const score = baseUtility * needPressure * traitMod - cost;
            candidates.push({
                action: ACTIONS.GATHER_WATER,
                score,
                targetX: nearestWater.x,
                targetY: nearestWater.y,
                targetEntity: nearestWater.entityId,
                breakdown: {
                    base: baseUtility,
                    needPressure: needPressure.toFixed(2),
                    needValue: npc.needs.thirst.toFixed(1),
                    traitMod: traitMod.toFixed(2),
                    cost: cost.toFixed(1),
                    distance: dist,
                    reason: `Water ${dist} tiles away`
                }
            });
        }
    }
    
    // === GATHER WOOD ===
    {
        const nearestWood = findNearestResource(pos.x, pos.y, RESOURCE_TYPES.WOOD);
        if (nearestWood) {
            const dist = manhattanDistance(pos, nearestWood);
            const traitMod = applyTraitModifier(npc, 'innovation', 1.0, 0.4);
            const baseUtility = 25;
            const cost = dist * 0.5;
            const basicNeedsPenalty = (npc.needs.hunger < 40 || npc.needs.thirst < 40) ? 0.5 : 1.0;
            
            const score = baseUtility * traitMod * basicNeedsPenalty - cost;
            candidates.push({
                action: ACTIONS.GATHER_WOOD,
                score,
                targetX: nearestWood.x,
                targetY: nearestWood.y,
                targetEntity: nearestWood.entityId,
                breakdown: {
                    base: baseUtility,
                    needPressure: basicNeedsPenalty.toFixed(2),
                    traitMod: traitMod.toFixed(2),
                    cost: cost.toFixed(1),
                    distance: dist,
                    reason: `Wood ${dist} tiles away`
                }
            });
        }
    }
    
    // === GATHER STONE ===
    {
        const nearestStone = findNearestResource(pos.x, pos.y, RESOURCE_TYPES.STONE);
        if (nearestStone) {
            const dist = manhattanDistance(pos, nearestStone);
            const traitMod = applyTraitModifier(npc, 'innovation', 1.0, 0.4);
            const baseUtility = 25;
            const cost = dist * 0.5;
            const basicNeedsPenalty = (npc.needs.hunger < 40 || npc.needs.thirst < 40) ? 0.5 : 1.0;
            
            const score = baseUtility * traitMod * basicNeedsPenalty - cost;
            candidates.push({
                action: ACTIONS.GATHER_STONE,
                score,
                targetX: nearestStone.x,
                targetY: nearestStone.y,
                targetEntity: nearestStone.entityId,
                breakdown: {
                    base: baseUtility,
                    needPressure: basicNeedsPenalty.toFixed(2),
                    traitMod: traitMod.toFixed(2),
                    cost: cost.toFixed(1),
                    distance: dist,
                    reason: `Stone ${dist} tiles away`
                }
            });
        }
    }
    
    // === DEPOSIT TO STOCKPILE ===
    if (hasItemsToDeposit(npc)) {
        const distToStockpile = stockpile.distanceTo(pos.x, pos.y);
        const inventoryFullness = getTotalInventory(npc) / 20;
        const traitMod = applyTraitModifier(npc, 'cooperativeness', 1.0, 0.5);
        const baseUtility = 30;
        const cost = distToStockpile * 0.3;
        
        const score = baseUtility * (0.5 + inventoryFullness * 0.5) * traitMod - cost;
        candidates.push({
            action: ACTIONS.DEPOSIT,
            score,
            targetX: stockpile.x,
            targetY: stockpile.y,
            breakdown: {
                base: baseUtility,
                needPressure: inventoryFullness.toFixed(2),
                traitMod: traitMod.toFixed(2),
                cost: cost.toFixed(1),
                distance: distToStockpile,
                reason: `Deposit ${getTotalInventory(npc)} items`
            }
        });
    }
    
    // === SOCIALIZE ===
    {
        const nearbyNPCs = world.getNearbyEntities(pos.x, pos.y, CONFIG.SOCIAL_RANGE)
            .filter(id => id !== entityId && world.hasComponent(id, 'npc'));
        
        if (nearbyNPCs.length > 0) {
            const needPressure = getNeedPressure(npc.needs.social);
            const traitMod = applyTraitModifier(npc, 'attachment', 1.0, 0.4);
            const baseUtility = 35;
            const cost = 2;
            
            let bestTarget = null;
            let bestFamiliarity = -1;
            
            for (const targetId of nearbyNPCs) {
                const rel = relationshipStore.has(entityId, targetId) 
                    ? relationshipStore.get(entityId, targetId)
                    : null;
                const familiarity = rel ? rel.familiarity : 0;
                
                if (familiarity > bestFamiliarity || (familiarity === bestFamiliarity && rng.nextBool(0.5))) {
                    bestFamiliarity = familiarity;
                    bestTarget = targetId;
                }
            }
            
            const score = baseUtility * needPressure * traitMod - cost;
            candidates.push({
                action: ACTIONS.SOCIALIZE,
                score,
                targetEntity: bestTarget,
                breakdown: {
                    base: baseUtility,
                    needPressure: needPressure.toFixed(2),
                    needValue: npc.needs.social.toFixed(1),
                    traitMod: traitMod.toFixed(2),
                    cost: cost.toFixed(1),
                    nearby: nearbyNPCs.length,
                    reason: `${nearbyNPCs.length} NPCs nearby, social at ${npc.needs.social.toFixed(0)}%`
                }
            });
        }
    }
    
    // === WANDER ===
    {
        const traitMod = applyTraitModifier(npc, 'riskTolerance', 1.0, 0.3);
        const baseUtility = 10;
        const cost = 0;
        const safetyBoost = npc.needs.safety < 50 ? 1.2 : 1.0;
        
        const score = baseUtility * traitMod * safetyBoost - cost;
        candidates.push({
            action: ACTIONS.WANDER,
            score,
            breakdown: {
                base: baseUtility,
                needPressure: safetyBoost.toFixed(2),
                traitMod: traitMod.toFixed(2),
                cost: cost.toFixed(1),
                reason: 'Explore the world'
            }
        });
    }
    
    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates;
}

/**
 * Convert a need value (0-100) to a pressure multiplier
 */
function getNeedPressure(needValue) {
    const normalized = needValue / 100;
    return 1.0 + (1.0 - normalized) * 3.0;
}

/**
 * Make a decision for an NPC
 */
export function makeDecision(entityId, currentTick) {
    const candidates = evaluateActions(entityId, currentTick);
    
    if (candidates.length === 0) {
        return {
            action: ACTIONS.IDLE,
            score: 0,
            breakdown: { reason: 'No valid actions' }
        };
    }
    
    const chosen = candidates[0];
    
    const npc = world.getComponent(entityId, 'npc');
    if (npc) {
        npc.lastDecision = {
            tick: currentTick,
            candidates: candidates.map(c => ({
                action: c.action,
                score: c.score,
                breakdown: c.breakdown
            })),
            chosen: chosen.action,
            reason: chosen.breakdown.reason
        };
    }
    
    return chosen;
}

/**
 * Get human-readable action name
 */
export function getActionName(action) {
    const names = {
        [ACTIONS.IDLE]: 'Idling',
        [ACTIONS.EAT]: 'Eating',
        [ACTIONS.DRINK]: 'Drinking',
        [ACTIONS.REST]: 'Resting',
        [ACTIONS.WANDER]: 'Wandering',
        [ACTIONS.GATHER_FOOD]: 'Gathering Food',
        [ACTIONS.GATHER_WATER]: 'Gathering Water',
        [ACTIONS.GATHER_WOOD]: 'Gathering Wood',
        [ACTIONS.GATHER_STONE]: 'Gathering Stone',
        [ACTIONS.SOCIALIZE]: 'Socializing',
        [ACTIONS.DEPOSIT]: 'Depositing',
        [ACTIONS.MOVE_TO]: 'Moving'
    };
    return names[action] || action;
}
