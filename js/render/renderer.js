/**
 * renderer.js - Canvas rendering system
 * 
 * Pure function of simulation state - rendering never affects logic.
 * Supports panning and zooming with the mouse.
 */

import { world } from '../core/ecs.js';
import { CONFIG, COLORS, ACTIONS } from '../core/constants.js';
import { getTileGrid } from '../world/worldGen.js';
import { stockpile } from '../world/stockpile.js';
import { getResourceColor } from '../components/resource.js';
import { getActionName } from '../ai/utilityAI.js';

class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        
        // Camera state
        this.cameraX = CONFIG.WORLD_WIDTH / 2;
        this.cameraY = CONFIG.WORLD_HEIGHT / 2;
        this.zoom = 1.5;
        
        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Selection
        this.selectedEntityId = null;
        this.hoveredEntityId = null;
        
        // Interpolation for smooth rendering
        this.lastTickTime = 0;
        this.tickProgress = 0;
    }
    
    /**
     * Initialize the renderer
     */
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        
        // Handle resize
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        
        // Center camera on stockpile
        this.cameraX = CONFIG.STOCKPILE_X;
        this.cameraY = CONFIG.STOCKPILE_Y;
    }
    
    /**
     * Resize canvas to fit viewport
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    /**
     * Update tick progress for interpolation
     */
    setTickProgress(progress) {
        this.tickProgress = progress;
    }
    
    /**
     * Render the world
     */
    render() {
        const ctx = this.ctx;
        const tileGrid = getTileGrid();
        
        if (!ctx || !tileGrid) return;
        
        // Clear canvas
        ctx.fillStyle = '#050807';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate visible area
        const tileSize = CONFIG.TILE_SIZE * this.zoom;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const startX = Math.floor(this.cameraX - centerX / tileSize);
        const endX = Math.ceil(this.cameraX + centerX / tileSize);
        const startY = Math.floor(this.cameraY - centerY / tileSize);
        const endY = Math.ceil(this.cameraY + centerY / tileSize);
        
        // Draw tiles
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = tileGrid.get(x, y);
                if (!tile) continue;
                
                const screenX = centerX + (x - this.cameraX) * tileSize;
                const screenY = centerY + (y - this.cameraY) * tileSize;
                
                ctx.fillStyle = tile.color;
                ctx.fillRect(screenX, screenY, tileSize + 1, tileSize + 1);
            }
        }
        
        // Draw stockpile area
        this.drawStockpile(centerX, centerY, tileSize);
        
        // Draw resources
        this.drawResources(centerX, centerY, tileSize);
        
        // Draw NPCs
        this.drawNPCs(centerX, centerY, tileSize);
        
        // Draw selection highlight
        if (this.selectedEntityId !== null) {
            this.drawSelection(centerX, centerY, tileSize);
        }
    }
    
    /**
     * Draw the stockpile area
     */
    drawStockpile(centerX, centerY, tileSize) {
        const ctx = this.ctx;
        const spX = stockpile.x;
        const spY = stockpile.y;
        const spR = stockpile.radius;
        
        for (let dy = -spR; dy <= spR; dy++) {
            for (let dx = -spR; dx <= spR; dx++) {
                const screenX = centerX + (spX + dx - this.cameraX) * tileSize;
                const screenY = centerY + (spY + dy - this.cameraY) * tileSize;
                
                // Glow effect
                ctx.fillStyle = COLORS.STOCKPILE_GLOW;
                ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
        }
        
        // Center marker
        const spScreenX = centerX + (spX - this.cameraX) * tileSize;
        const spScreenY = centerY + (spY - this.cameraY) * tileSize;
        
        ctx.fillStyle = COLORS.STOCKPILE;
        ctx.beginPath();
        ctx.arc(spScreenX + tileSize/2, spScreenY + tileSize/2, tileSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw resource nodes
     */
    drawResources(centerX, centerY, tileSize) {
        const ctx = this.ctx;
        
        for (const entityId of world.query('resource', 'position')) {
            const resource = world.getComponent(entityId, 'resource');
            const pos = world.getComponent(entityId, 'position');
            
            if (!resource || !pos || resource.depleted) continue;
            
            const screenX = centerX + (pos.x - this.cameraX) * tileSize;
            const screenY = centerY + (pos.y - this.cameraY) * tileSize;
            
            // Skip if off screen
            if (screenX < -tileSize || screenX > this.canvas.width + tileSize ||
                screenY < -tileSize || screenY > this.canvas.height + tileSize) {
                continue;
            }
            
            ctx.fillStyle = getResourceColor(resource.type);
            
            // Draw as a small diamond
            const size = tileSize * 0.3;
            ctx.beginPath();
            ctx.moveTo(screenX + tileSize/2, screenY + tileSize/2 - size);
            ctx.lineTo(screenX + tileSize/2 + size, screenY + tileSize/2);
            ctx.lineTo(screenX + tileSize/2, screenY + tileSize/2 + size);
            ctx.lineTo(screenX + tileSize/2 - size, screenY + tileSize/2);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /**
     * Draw NPCs
     */
    drawNPCs(centerX, centerY, tileSize) {
        const ctx = this.ctx;
        
        for (const entityId of world.query('npc', 'position')) {
            const npc = world.getComponent(entityId, 'npc');
            const pos = world.getComponent(entityId, 'position');
            
            if (!npc || !pos) continue;
            
            // Interpolate position for smooth movement
            let drawX = pos.x;
            let drawY = pos.y;
            
            if (pos.prevX !== pos.x || pos.prevY !== pos.y) {
                drawX = pos.prevX + (pos.x - pos.prevX) * this.tickProgress;
                drawY = pos.prevY + (pos.y - pos.prevY) * this.tickProgress;
            }
            
            const screenX = centerX + (drawX - this.cameraX) * tileSize;
            const screenY = centerY + (drawY - this.cameraY) * tileSize;
            
            // Skip if off screen
            if (screenX < -tileSize || screenX > this.canvas.width + tileSize ||
                screenY < -tileSize || screenY > this.canvas.height + tileSize) {
                continue;
            }
            
            // Color based on state
            let color = COLORS.NPC_DEFAULT;
            
            if (entityId === this.selectedEntityId) {
                color = COLORS.NPC_SELECTED;
            } else if (npc.needs.hunger < 20 || npc.needs.thirst < 20) {
                color = COLORS.NPC_CRITICAL;
            } else if (npc.needs.hunger < 40 || npc.needs.thirst < 40) {
                color = COLORS.NPC_HUNGRY;
            } else if (npc.state.action === ACTIONS.REST) {
                color = COLORS.NPC_RESTING;
            } else if (npc.state.action === ACTIONS.SOCIALIZE) {
                color = COLORS.NPC_SOCIAL;
            }
            
            // Draw NPC as a small circle
            const radius = tileSize * 0.35;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(screenX + tileSize/2, screenY + tileSize/2, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw direction indicator if moving
            if (npc.state.targetX !== null && npc.state.targetY !== null) {
                const dx = npc.state.targetX - pos.x;
                const dy = npc.state.targetY - pos.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                
                if (len > 0) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(screenX + tileSize/2, screenY + tileSize/2);
                    ctx.lineTo(
                        screenX + tileSize/2 + (dx/len) * radius * 1.5,
                        screenY + tileSize/2 + (dy/len) * radius * 1.5
                    );
                    ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Draw selection highlight
     */
    drawSelection(centerX, centerY, tileSize) {
        const ctx = this.ctx;
        const pos = world.getComponent(this.selectedEntityId, 'position');
        
        if (!pos) return;
        
        const screenX = centerX + (pos.x - this.cameraX) * tileSize;
        const screenY = centerY + (pos.y - this.cameraY) * tileSize;
        
        ctx.strokeStyle = COLORS.NPC_SELECTED;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(screenX + tileSize/2, screenY + tileSize/2, tileSize * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const tileSize = CONFIG.TILE_SIZE * this.zoom;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            x: Math.floor(this.cameraX + (screenX - centerX) / tileSize),
            y: Math.floor(this.cameraY + (screenY - centerY) / tileSize)
        };
    }
    
    /**
     * Find NPC at world position
     */
    findNPCAtPosition(worldX, worldY) {
        for (const entityId of world.query('npc', 'position')) {
            const pos = world.getComponent(entityId, 'position');
            if (pos && pos.x === worldX && pos.y === worldY) {
                return entityId;
            }
        }
        return null;
    }
    
    /**
     * Mouse event handlers
     */
    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    onMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            
            const tileSize = CONFIG.TILE_SIZE * this.zoom;
            this.cameraX -= dx / tileSize;
            this.cameraY -= dy / tileSize;
            
            // Clamp camera to world bounds
            this.cameraX = Math.max(0, Math.min(CONFIG.WORLD_WIDTH, this.cameraX));
            this.cameraY = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT, this.cameraY));
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const zoomDelta = e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP;
        this.zoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, this.zoom + zoomDelta));
    }
    
    onClick(e) {
        if (this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const worldPos = this.screenToWorld(screenX, screenY);
        const entityId = this.findNPCAtPosition(worldPos.x, worldPos.y);
        
        this.selectedEntityId = entityId;
        
        // Notify UI
        if (this.onSelect) {
            this.onSelect(entityId);
        }
    }
    
    /**
     * Set selection callback
     */
    setOnSelect(callback) {
        this.onSelect = callback;
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedEntityId = null;
    }
    
    /**
     * Center camera on entity
     */
    centerOn(entityId) {
        const pos = world.getComponent(entityId, 'position');
        if (pos) {
            this.cameraX = pos.x;
            this.cameraY = pos.y;
        }
    }
}

// Singleton instance
export const renderer = new Renderer();
