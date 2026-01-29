/**
 * controls.js - UI control bindings
 * 
 * Connects the control panel buttons to simulation logic.
 */

import { eventBus, EVENTS } from '../core/eventBus.js';

class Controls {
    constructor() {
        this.onReset = null;
        this.onPauseToggle = null;
        this.onSpeedChange = null;
        this.onAddNPC = null;
        this.onRemoveNPC = null;
        this.onSeedChange = null;
        
        this.isPaused = false;
        this.currentSpeed = 1;
    }
    
    /**
     * Initialize control bindings
     */
    init() {
        // Seed input
        const seedInput = document.getElementById('seed-input');
        const applyBtn = document.getElementById('btn-apply-seed');
        
        applyBtn.addEventListener('click', () => {
            const seed = parseInt(seedInput.value) || 42;
            if (this.onSeedChange) {
                this.onSeedChange(seed);
            }
        });
        
        // Speed buttons
        const speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                this.setSpeed(speed);
                
                speedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Pause button
        const pauseBtn = document.getElementById('btn-pause');
        pauseBtn.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            pauseBtn.textContent = this.isPaused ? '▶ Play' : '⏸ Pause';
            pauseBtn.classList.toggle('paused-indicator', this.isPaused);
            
            if (this.onPauseToggle) {
                this.onPauseToggle(this.isPaused);
            }
            
            eventBus.emit(this.isPaused ? EVENTS.SIMULATION_PAUSE : EVENTS.SIMULATION_RESUME);
        });
        
        // Population buttons
        const addBtn = document.getElementById('btn-add-npc');
        const removeBtn = document.getElementById('btn-remove-npc');
        
        addBtn.addEventListener('click', () => {
            if (this.onAddNPC) this.onAddNPC();
        });
        
        removeBtn.addEventListener('click', () => {
            if (this.onRemoveNPC) this.onRemoveNPC();
        });
        
        // Reset button
        const resetBtn = document.getElementById('btn-reset');
        resetBtn.addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });
        
        // Initial NPC input
        const initialInput = document.getElementById('initial-npc-input');
        initialInput.addEventListener('change', () => {
            const value = parseInt(initialInput.value) || 150;
            initialInput.value = Math.max(10, Math.min(500, value));
        });
    }
    
    /**
     * Set simulation speed
     */
    setSpeed(speed) {
        this.currentSpeed = speed;
        if (this.onSpeedChange) {
            this.onSpeedChange(speed);
        }
        eventBus.emit(EVENTS.SPEED_CHANGE, { speed });
    }
    
    /**
     * Get initial NPC count from input
     */
    getInitialNPCCount() {
        const input = document.getElementById('initial-npc-input');
        return parseInt(input.value) || 150;
    }
    
    /**
     * Get current seed from input
     */
    getSeed() {
        const input = document.getElementById('seed-input');
        return parseInt(input.value) || 42;
    }
    
    /**
     * Set callback for reset
     */
    setOnReset(callback) {
        this.onReset = callback;
    }
    
    /**
     * Set callback for pause toggle
     */
    setOnPauseToggle(callback) {
        this.onPauseToggle = callback;
    }
    
    /**
     * Set callback for speed change
     */
    setOnSpeedChange(callback) {
        this.onSpeedChange = callback;
    }
    
    /**
     * Set callback for add NPC
     */
    setOnAddNPC(callback) {
        this.onAddNPC = callback;
    }
    
    /**
     * Set callback for remove NPC
     */
    setOnRemoveNPC(callback) {
        this.onRemoveNPC = callback;
    }
    
    /**
     * Set callback for seed change
     */
    setOnSeedChange(callback) {
        this.onSeedChange = callback;
    }
}

// Singleton
export const controls = new Controls();
