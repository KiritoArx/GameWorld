/**
 * stockpile.js - Central stockpile management
 * 
 * The stockpile is where NPCs deposit gathered resources.
 * It's a shared resource pool for the settlement.
 */

import { CONFIG } from '../core/constants.js';
import { eventBus, EVENTS } from '../core/eventBus.js';

class Stockpile {
    constructor() {
        this.x = CONFIG.STOCKPILE_X;
        this.y = CONFIG.STOCKPILE_Y;
        this.radius = CONFIG.STOCKPILE_RADIUS;
        
        this.resources = {
            food: 0,
            water: 0,
            wood: 0,
            stone: 0
        };
        
        this.totalDeposits = 0;
    }
    
    /**
     * Deposit resources
     */
    deposit(resourceType, amount) {
        if (this.resources[resourceType] !== undefined) {
            this.resources[resourceType] += amount;
            this.totalDeposits += amount;
            
            eventBus.emit(EVENTS.STOCKPILE_DEPOSIT, {
                type: resourceType,
                amount,
                total: this.resources[resourceType]
            });
            
            return true;
        }
        return false;
    }
    
    /**
     * Withdraw resources (returns amount actually withdrawn)
     */
    withdraw(resourceType, amount) {
        if (this.resources[resourceType] === undefined) return 0;
        
        const available = this.resources[resourceType];
        const withdrawn = Math.min(amount, available);
        this.resources[resourceType] -= withdrawn;
        
        return withdrawn;
    }
    
    /**
     * Check if position is within stockpile area
     */
    isInRange(x, y) {
        return Math.abs(x - this.x) <= this.radius && 
               Math.abs(y - this.y) <= this.radius;
    }
    
    /**
     * Get distance to stockpile
     */
    distanceTo(x, y) {
        return Math.abs(x - this.x) + Math.abs(y - this.y);
    }
    
    /**
     * Get total resources
     */
    getTotal() {
        return Object.values(this.resources).reduce((a, b) => a + b, 0);
    }
    
    /**
     * Get stats for display
     */
    getStats() {
        return {
            ...this.resources,
            total: this.getTotal(),
            totalDeposits: this.totalDeposits
        };
    }
    
    /**
     * Reset stockpile
     */
    reset() {
        this.resources = {
            food: 0,
            water: 0,
            wood: 0,
            stone: 0
        };
        this.totalDeposits = 0;
    }
}

// Singleton instance
export const stockpile = new Stockpile();
