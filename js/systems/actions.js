/**
 * actions.js - System that executes NPC actions
 * 
 * Once an NPC has decided on an action and moved to the target,
 * this system executes the action (eat, gather, etc.)
 */

import { world } from '../core/ecs.js';
import { ACTIONS, CONFIG, RESOURCE_TYPES } from '../core/constants.js';
import { clampNeeds } from '../components/npc.js';
import { gatherResource } from '../components/resource.js';
import { stockpile } from '../world/stockpile.js';
import { eventBus, EVENTS } from '../core/eventBus.js';

/**
 * Run the actions system
 */
export function runActionsSystem(currentTick) {
    for (const entityId of world.query('npc', 'position')) {
        const npc = world.getComponent(entityId, 'npc');
        const pos = world.getComponent(entityId, 'position');
        
        if (!npc || !pos) continue;
        
        const action = npc.state.action;
        
        switch (action) {
            case ACTIONS.EAT:
                executeEat(npc);
                break;
                
            case ACTIONS.DRINK:
                executeDrink(npc);
                break;
                
            case ACTIONS.REST:
                executeRest(npc);
                break;
                
            case ACTIONS.GATHER_FOOD:
            case ACTIONS.GATHER_WATER:
            case ACTIONS.GATHER_WOOD:
            case ACTIONS.GATHER_STONE:
                executeGather(entityId, npc, pos, action, currentTick);
                break;
                
            case ACTIONS.DEPOSIT:
                executeDeposit(entityId, npc, pos);
                break;
                
            case ACTIONS.WANDER:
                // Movement handled by movement system
                // Clear target after reaching it
                if (npc.state.targetX === pos.x && npc.state.targetY === pos.y) {
                    npc.state.action = ACTIONS.IDLE;
                    npc.state.targetX = null;
                    npc.state.targetY = null;
                }
                break;
                
            case ACTIONS.IDLE:
            default:
                // Do nothing
                break;
        }
    }
}

/**
 * Eat food from inventory
 */
function executeEat(npc) {
    if (npc.inventory.food > 0) {
        npc.inventory.food--;
        npc.needs.hunger = Math.min(100, npc.needs.hunger + 25);
        clampNeeds(npc);
        
        // Action complete, go idle
        npc.state.action = ACTIONS.IDLE;
    }
}

/**
 * Drink water from inventory
 */
function executeDrink(npc) {
    if (npc.inventory.water > 0) {
        npc.inventory.water--;
        npc.needs.thirst = Math.min(100, npc.needs.thirst + 30);
        clampNeeds(npc);
        
        npc.state.action = ACTIONS.IDLE;
    }
}

/**
 * Rest to recover energy
 */
function executeRest(npc) {
    npc.state.actionProgress++;
    
    // Resting takes time but restores rest need
    npc.needs.rest = Math.min(100, npc.needs.rest + 3);
    npc.needs.safety = Math.min(100, npc.needs.safety + 1);
    clampNeeds(npc);
    
    // Complete after 10 ticks
    if (npc.state.actionProgress >= 10) {
        npc.state.action = ACTIONS.IDLE;
        npc.state.actionProgress = 0;
    }
}

/**
 * Gather resource from a node
 */
function executeGather(entityId, npc, pos, action, currentTick) {
    const targetX = npc.state.targetX;
    const targetY = npc.state.targetY;
    const targetEntity = npc.state.targetEntity;
    
    // Check if at target
    if (pos.x !== targetX || pos.y !== targetY) {
        return; // Still moving
    }
    
    // Get resource node
    if (!targetEntity || !world.hasComponent(targetEntity, 'resource')) {
        // Resource gone, go idle
        npc.state.action = ACTIONS.IDLE;
        return;
    }
    
    const resource = world.getComponent(targetEntity, 'resource');
    
    // Determine expected resource type
    let expectedType;
    switch (action) {
        case ACTIONS.GATHER_FOOD: expectedType = RESOURCE_TYPES.FOOD; break;
        case ACTIONS.GATHER_WATER: expectedType = RESOURCE_TYPES.WATER; break;
        case ACTIONS.GATHER_WOOD: expectedType = RESOURCE_TYPES.WOOD; break;
        case ACTIONS.GATHER_STONE: expectedType = RESOURCE_TYPES.STONE; break;
    }
    
    if (resource.type !== expectedType || resource.depleted) {
        npc.state.action = ACTIONS.IDLE;
        return;
    }
    
    // Gather the resource
    const gathered = gatherResource(resource, 1);
    if (gathered > 0) {
        npc.inventory[resource.type] += gathered;
        npc.stats.resourcesGathered += gathered;
        
        eventBus.emit(EVENTS.RESOURCE_GATHERED, {
            entityId,
            resourceType: resource.type,
            amount: gathered,
            tick: currentTick
        });
        
        if (resource.depleted) {
            eventBus.emit(EVENTS.RESOURCE_DEPLETED, {
                resourceEntityId: targetEntity,
                resourceType: resource.type
            });
        }
    }
    
    // Go idle after gathering
    npc.state.action = ACTIONS.IDLE;
}

/**
 * Deposit items to stockpile
 */
function executeDeposit(entityId, npc, pos) {
    // Check if at stockpile
    if (!stockpile.isInRange(pos.x, pos.y)) {
        return; // Still moving
    }
    
    // Deposit all inventory
    let deposited = 0;
    
    for (const type of ['food', 'water', 'wood', 'stone']) {
        const amount = npc.inventory[type];
        if (amount > 0) {
            stockpile.deposit(type, amount);
            deposited += amount;
            npc.inventory[type] = 0;
        }
    }
    
    if (deposited > 0) {
        eventBus.emit(EVENTS.STOCKPILE_UPDATED, {
            entityId,
            deposited,
            stockpile: stockpile.getStats()
        });
    }
    
    // Go idle
    npc.state.action = ACTIONS.IDLE;
}
