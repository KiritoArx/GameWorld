/**
 * eventBus.js - Pub/sub event system for decoupled communication
 * 
 * Used for:
 * - UI updates (NPC selected, stats changed)
 * - Simulation events (tick completed, NPC spawned/died)
 * - Debug logging
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.eventLog = []; // For debugging
        this.logEvents = false;
    }
    
    /**
     * Subscribe to an event
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }
    
    /**
     * Subscribe to an event (one-time)
     */
    once(eventName, callback) {
        const wrapper = (...args) => {
            this.off(eventName, wrapper);
            callback(...args);
        };
        this.on(eventName, wrapper);
    }
    
    /**
     * Unsubscribe from an event
     */
    off(eventName, callback) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }
    
    /**
     * Emit an event
     */
    emit(eventName, data = {}) {
        if (this.logEvents) {
            this.eventLog.push({ time: Date.now(), event: eventName, data });
            if (this.eventLog.length > 1000) {
                this.eventLog.shift();
            }
        }
        
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Error in event handler for ${eventName}:`, e);
                }
            });
        }
    }
    
    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
        this.eventLog = [];
    }
    
    /**
     * Get event log (for debugging)
     */
    getLog() {
        return [...this.eventLog];
    }
    
    /**
     * Enable/disable event logging
     */
    setLogging(enabled) {
        this.logEvents = enabled;
    }
}

// Event names as constants to avoid typos
export const EVENTS = {
    // Simulation
    TICK: 'tick',
    SIMULATION_RESET: 'simulation:reset',
    SIMULATION_PAUSE: 'simulation:pause',
    SIMULATION_RESUME: 'simulation:resume',
    SPEED_CHANGE: 'simulation:speed',
    
    // NPCs
    NPC_SPAWNED: 'npc:spawned',
    NPC_REMOVED: 'npc:removed',
    NPC_DECISION: 'npc:decision',
    NPC_ACTION_COMPLETE: 'npc:action_complete',
    NPC_SELECTED: 'npc:selected',
    NPC_DESELECTED: 'npc:deselected',
    
    // Resources
    RESOURCE_GATHERED: 'resource:gathered',
    RESOURCE_SPAWNED: 'resource:spawned',
    RESOURCE_DEPLETED: 'resource:depleted',
    
    // Stockpile
    STOCKPILE_DEPOSIT: 'stockpile:deposit',
    STOCKPILE_UPDATED: 'stockpile:updated',
    
    // Relationships
    RELATIONSHIP_FORMED: 'relationship:formed',
    RELATIONSHIP_UPDATED: 'relationship:updated',
    
    // Stats
    STATS_UPDATED: 'stats:updated',
    
    // Camera
    CAMERA_MOVED: 'camera:moved',
    CAMERA_ZOOMED: 'camera:zoomed'
};

// Singleton instance
export const eventBus = new EventBus();
