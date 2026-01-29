/**
 * worldGen.js - Procedural world generation
 * 
 * Generates a finite grid with biomes using simple noise.
 * Architecture supports future chunking.
 */

import { CONFIG, BIOMES, RESOURCE_TYPES } from '../core/constants.js';
import { rng } from '../core/rng.js';
import { TileGrid } from '../components/tile.js';
import { world } from '../core/ecs.js';
import { createPosition } from '../components/position.js';
import { createResource } from '../components/resource.js';

// Global tile grid
export let tileGrid = null;

/**
 * Simple 2D noise function (value noise)
 */
function noise2D(x, y, scale = 0.1) {
    // Use RNG in a deterministic way based on coordinates
    const ix = Math.floor(x * scale);
    const iy = Math.floor(y * scale);
    const fx = (x * scale) - ix;
    const fy = (y * scale) - iy;
    
    // Hash function for grid points
    const hash = (px, py) => {
        const h = (px * 374761393 + py * 668265263) ^ (px * 1274126177);
        return ((h * h * h * 60493) >>> 0) / 4294967296;
    };
    
    // Get values at corners
    const v00 = hash(ix, iy);
    const v10 = hash(ix + 1, iy);
    const v01 = hash(ix, iy + 1);
    const v11 = hash(ix + 1, iy + 1);
    
    // Smooth interpolation
    const smoothstep = t => t * t * (3 - 2 * t);
    const sx = smoothstep(fx);
    const sy = smoothstep(fy);
    
    // Bilinear interpolation
    const v0 = v00 + sx * (v10 - v00);
    const v1 = v01 + sx * (v11 - v01);
    return v0 + sy * (v1 - v0);
}

/**
 * Multi-octave noise for more natural terrain
 */
function fractalNoise(x, y, octaves = 4, persistence = 0.5, scale = 0.05) {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;
    let freq = scale;
    
    for (let i = 0; i < octaves; i++) {
        total += noise2D(x, y, freq) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        freq *= 2;
    }
    
    return total / maxValue;
}

/**
 * Generate the world
 */
export function generateWorld() {
    const width = CONFIG.WORLD_WIDTH;
    const height = CONFIG.WORLD_HEIGHT;
    
    // Create tile grid
    tileGrid = new TileGrid(width, height);
    
    // Generate biomes using noise
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Multiple noise layers for different features
            const elevation = fractalNoise(x, y, 4, 0.5, 0.02);
            const moisture = fractalNoise(x + 1000, y + 1000, 3, 0.6, 0.03);
            
            // Determine biome based on elevation and moisture
            let biomeId;
            
            if (elevation < 0.3) {
                // Low elevation = water
                biomeId = BIOMES.WATER.id;
            } else if (elevation < 0.4 && moisture > 0.5) {
                // Low-ish elevation with moisture = water (lakes)
                biomeId = BIOMES.WATER.id;
            } else if (moisture > 0.6) {
                // High moisture = forest
                biomeId = BIOMES.FOREST.id;
            } else if (elevation > 0.7) {
                // High elevation = stone/mountains
                biomeId = BIOMES.STONE.id;
            } else {
                // Default = grass
                biomeId = BIOMES.GRASS.id;
            }
            
            tileGrid.set(x, y, biomeId);
        }
    }
    
    // Ensure stockpile area is walkable (grass)
    const spX = CONFIG.STOCKPILE_X;
    const spY = CONFIG.STOCKPILE_Y;
    const spR = CONFIG.STOCKPILE_RADIUS + 2;
    
    for (let dy = -spR; dy <= spR; dy++) {
        for (let dx = -spR; dx <= spR; dx++) {
            tileGrid.set(spX + dx, spY + dy, BIOMES.GRASS.id);
        }
    }
    
    // Spawn resource nodes
    spawnResources();
    
    return tileGrid;
}

/**
 * Spawn resource nodes on the map
 */
function spawnResources() {
    const width = CONFIG.WORLD_WIDTH;
    const height = CONFIG.WORLD_HEIGHT;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Skip stockpile area
            const distToStockpile = Math.abs(x - CONFIG.STOCKPILE_X) + Math.abs(y - CONFIG.STOCKPILE_Y);
            if (distToStockpile < CONFIG.STOCKPILE_RADIUS + 5) continue;
            
            const tile = tileGrid.get(x, y);
            if (!tile || !tile.walkable) continue;
            
            // Random chance to spawn resource based on biome
            if (rng.next() > CONFIG.RESOURCE_DENSITY) continue;
            
            let resourceType;
            const biomeId = tile.biomeId;
            
            // Resource type depends on biome
            if (biomeId === BIOMES.FOREST.id) {
                resourceType = rng.nextBool(0.7) ? RESOURCE_TYPES.WOOD : RESOURCE_TYPES.FOOD;
            } else if (biomeId === BIOMES.STONE.id) {
                resourceType = RESOURCE_TYPES.STONE;
            } else {
                // Grass: mostly food, some water puddles
                resourceType = rng.nextBool(0.8) ? RESOURCE_TYPES.FOOD : RESOURCE_TYPES.WATER;
            }
            
            // Create resource entity
            const entityId = world.createEntity();
            world.addComponent(entityId, 'position', createPosition(x, y));
            world.addComponent(entityId, 'resource', createResource(resourceType, rng.nextInt(5, 15)));
            world.addTag(entityId, 'resource');
            world.addTag(entityId, resourceType);
        }
    }
}

/**
 * Find a random walkable position
 */
export function findRandomWalkablePosition() {
    const maxAttempts = 1000;
    
    for (let i = 0; i < maxAttempts; i++) {
        const x = rng.nextInt(0, CONFIG.WORLD_WIDTH - 1);
        const y = rng.nextInt(0, CONFIG.WORLD_HEIGHT - 1);
        
        if (tileGrid.isWalkable(x, y)) {
            return { x, y };
        }
    }
    
    // Fallback: near stockpile (guaranteed walkable)
    return { x: CONFIG.STOCKPILE_X, y: CONFIG.STOCKPILE_Y };
}

/**
 * Find nearest resource of type
 */
export function findNearestResource(x, y, resourceType, maxDist = 50) {
    let nearest = null;
    let nearestDist = maxDist;
    
    for (const entityId of world.query('position', 'resource')) {
        const resource = world.getComponent(entityId, 'resource');
        if (resource.depleted) continue;
        if (resourceType && resource.type !== resourceType) continue;
        
        const pos = world.getComponent(entityId, 'position');
        const dist = Math.abs(pos.x - x) + Math.abs(pos.y - y);
        
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { entityId, x: pos.x, y: pos.y, type: resource.type };
        }
    }
    
    return nearest;
}

/**
 * Get tile grid (for external access)
 */
export function getTileGrid() {
    return tileGrid;
}
