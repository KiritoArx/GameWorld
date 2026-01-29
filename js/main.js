/**
 * main.js - Entry point and game loop orchestration
 * 
 * Manages:
 * - Initialization of all systems
 * - Game loop (sim tick rate vs render frame rate)
 * - NPC spawning
 * - Stats tracking
 */

import { CONFIG } from './core/constants.js';
import { rng } from './core/rng.js';
import { world } from './core/ecs.js';
import { eventBus, EVENTS } from './core/eventBus.js';

import { createPosition } from './components/position.js';
import { createNPC } from './components/npc.js';
import { relationshipStore } from './components/relationships.js';

import { generateWorld, findRandomWalkablePosition } from './world/worldGen.js';
import { stockpile } from './world/stockpile.js';

import { runNeedsDecay } from './systems/needsDecay.js';
import { runDecisionSystem } from './systems/decision.js';
import { runMovementSystem } from './systems/movement.js';
import { runActionsSystem } from './systems/actions.js';
import { runSocialSystem } from './systems/social.js';
import { runResourceRegenSystem } from './systems/resourceRegen.js';

import { renderer } from './render/renderer.js';
import { debugPanel } from './ui/debugPanel.js';
import { controls } from './ui/controls.js';

// Game state
let currentTick = 0;
let isPaused = false;
let simSpeed = 1;
let lastTickTime = 0;
let tickAccumulator = 0;

// Stats elements
let statTick, statPop, statStockpile, statRelationships;

/**
 * Initialize the game
 */
function init() {
    console.log('🎮 Coded World - Initializing...');
    
    // Get stats elements
    statTick = document.getElementById('stat-tick');
    statPop = document.getElementById('stat-pop');
    statStockpile = document.getElementById('stat-stockpile');
    statRelationships = document.getElementById('stat-relationships');
    
    // Initialize UI
    controls.init();
    debugPanel.init();
    
    // Initialize renderer
    const canvas = document.getElementById('gameCanvas');
    renderer.init(canvas);
    
    // Set up renderer selection callback
    renderer.setOnSelect((entityId) => {
        if (entityId !== null) {
            debugPanel.show(entityId);
        } else {
            debugPanel.hide();
        }
    });
    
    // Set up control callbacks
    controls.setOnReset(() => resetSimulation());
    controls.setOnPauseToggle((paused) => { isPaused = paused; });
    controls.setOnSpeedChange((speed) => { simSpeed = speed; });
    controls.setOnAddNPC(() => spawnNPCs(CONFIG.NPC_SPAWN_BATCH));
    controls.setOnRemoveNPC(() => removeNPCs(CONFIG.NPC_SPAWN_BATCH));
    controls.setOnSeedChange((seed) => {
        rng.setSeed(seed);
        resetSimulation();
    });
    
    // Initialize simulation
    resetSimulation();
    
    // Start game loop
    lastTickTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    console.log('✅ Coded World - Ready!');
}

/**
 * Reset the entire simulation
 */
function resetSimulation() {
    console.log('🔄 Resetting simulation...');
    
    // Clear ECS
    world.clear();
    relationshipStore.clear();
    stockpile.reset();
    
    // Reset tick counter
    currentTick = 0;
    tickAccumulator = 0;
    
    // Reset RNG (but keep current seed)
    rng.reset();
    
    // Generate world
    generateWorld();
    
    // Spawn initial NPCs
    const initialCount = controls.getInitialNPCCount();
    spawnNPCs(initialCount);
    
    // Clear selection
    renderer.clearSelection();
    debugPanel.hide();
    
    // Emit event
    eventBus.emit(EVENTS.SIMULATION_RESET, { seed: rng.getSeed() });
    
    console.log(`✅ Simulation reset. Seed: ${rng.getSeed()}, NPCs: ${initialCount}`);
}

/**
 * Spawn N NPCs
 */
function spawnNPCs(count) {
    const currentCount = getNPCCount();
    const toSpawn = Math.min(count, CONFIG.MAX_NPC_COUNT - currentCount);
    
    for (let i = 0; i < toSpawn; i++) {
        const entityId = world.createEntity();
        const pos = findRandomWalkablePosition();
        
        world.addComponent(entityId, 'position', createPosition(pos.x, pos.y));
        world.addComponent(entityId, 'npc', createNPC(entityId));
        world.addTag(entityId, 'npc');
        
        eventBus.emit(EVENTS.NPC_SPAWNED, { entityId });
    }
    
    return toSpawn;
}

/**
 * Remove N NPCs
 */
function removeNPCs(count) {
    const npcs = [...world.query('npc')];
    const toRemove = Math.min(count, npcs.length);
    
    for (let i = 0; i < toRemove; i++) {
        const entityId = npcs[npcs.length - 1 - i]; // Remove from end
        relationshipStore.removeNPC(entityId);
        world.removeEntity(entityId);
        
        eventBus.emit(EVENTS.NPC_REMOVED, { entityId });
    }
    
    world.flushRemovals();
    
    return toRemove;
}

/**
 * Get current NPC count
 */
function getNPCCount() {
    let count = 0;
    for (const _ of world.query('npc')) {
        count++;
    }
    return count;
}

/**
 * Run one simulation tick
 */
function tick() {
    currentTick++;
    
    // Run systems in order (deterministic!)
    runNeedsDecay();
    runDecisionSystem(currentTick);
    runMovementSystem();
    runActionsSystem(currentTick);
    runSocialSystem(currentTick);
    runResourceRegenSystem();
    
    // Flush entity removals
    world.flushRemovals();
    
    // Update stats
    updateStats();
    
    // Emit tick event
    eventBus.emit(EVENTS.TICK, { tick: currentTick });
}

/**
 * Update HUD stats
 */
function updateStats() {
    const npcCount = getNPCCount();
    const stockpileTotal = stockpile.getTotal();
    const relationshipCount = relationshipStore.count();
    
    // Calculate average hunger
    let totalHunger = 0;
    for (const entityId of world.query('npc')) {
        const npc = world.getComponent(entityId, 'npc');
        if (npc) totalHunger += npc.needs.hunger;
    }
    
    statTick.textContent = `Tick: ${currentTick}`;
    statPop.textContent = `Pop: ${npcCount}`;
    statStockpile.textContent = `Stockpile: ${stockpileTotal}`;
    statRelationships.textContent = `Relations: ${relationshipCount}`;
}

/**
 * Main game loop
 */
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTickTime;
    lastTickTime = timestamp;
    
    // Calculate tick progress for interpolation
    const msPerTick = 1000 / CONFIG.SIM_TICK_RATE;
    
    if (!isPaused) {
        // Accumulate time for simulation ticks
        tickAccumulator += deltaTime * simSpeed;
        
        // Run simulation ticks
        while (tickAccumulator >= msPerTick) {
            tick();
            tickAccumulator -= msPerTick;
        }
        
        // Calculate interpolation progress
        const tickProgress = tickAccumulator / msPerTick;
        renderer.setTickProgress(tickProgress);
    }
    
    // Update debug panel if visible
    if (debugPanel.selectedEntityId !== null) {
        debugPanel.update();
    }
    
    // Render
    renderer.render();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging in console
window.CodedWorld = {
    world,
    rng,
    eventBus,
    stockpile,
    relationshipStore,
    renderer,
    tick,
    resetSimulation,
    spawnNPCs,
    removeNPCs,
    getStats: () => ({
        tick: currentTick,
        population: getNPCCount(),
        stockpile: stockpile.getStats(),
        relationships: relationshipStore.count(),
        rng: rng.getDebugInfo()
    })
};
