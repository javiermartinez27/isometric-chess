// Turn Manager - State Machine for turn-based gameplay
class TurnManager {
    constructor() {
        this.entities = [];  // All entities that can take turns (players, enemies, etc.)
        this.currentTurnIndex = 0;
        this.turnInProgress = false;
        this.turnIndicator = null;
        this.movementIndicator = null;
    }

    // Initialize the turn manager
    init() {
        this.turnIndicator = this.createTurnIndicator();
        this.movementIndicator = this.createMovementIndicator();
    }

    // Register an entity that can take turns
    registerEntity(entity, type) {
        this.entities.push({
            entity: entity,
            type: type,  // 'player' or 'enemy'
            name: type === 'player' ? 'Player' : `Enemy ${this.entities.filter(e => e.type === 'enemy').length + 1}`
        });
    }

    // Clear all registered entities
    clearEntities() {
        this.entities = [];
        this.currentTurnIndex = 0;
        this.turnInProgress = false;
    }

    // Start the turn-based system
    start() {
        if (this.entities.length === 0) {
            console.warn('No entities registered for turns');
            return;
        }
        
        this.currentTurnIndex = 0;
        this.startTurn();
    }

    // Start the current entity's turn
    startTurn() {
        if (this.entities.length === 0) return;
        
        const current = this.entities[this.currentTurnIndex];
        this.turnInProgress = true;
        
        // Update visual indicator
        this.updateTurnIndicator(current);
        
        // Initialize movement indicator with max moves
        const maxMoves = current.entity.getMaxMoves();
        this.updateMovementIndicator(maxMoves, maxMoves);
        
        // Notify the entity it's their turn
        if (current.type === 'player') {
            current.entity.startTurn();
        } else if (current.type === 'enemy') {
            // Enemy takes 1 second to start, then will call endTurn when done
            setTimeout(() => {
                if (this.turnInProgress) {
                    current.entity.takeTurn();
                }
            }, 1000);
        }
    }

    // End the current turn and move to next entity
    endTurn() {
        this.turnInProgress = false;
        
        // Move to next entity
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.entities.length;
        
        // Start next turn
        this.startTurn();
    }

    // Check if it's a specific entity's turn
    isEntityTurn(entity) {
        if (this.entities.length === 0) return false;
        return this.entities[this.currentTurnIndex].entity === entity;
    }

    // Get current turn entity type
    getCurrentTurnType() {
        if (this.entities.length === 0) return null;
        return this.entities[this.currentTurnIndex].type;
    }

    // Create visual turn indicator
    createTurnIndicator() {
        return document.getElementById('turn-indicator');
    }

    // Create movement indicator
    createMovementIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'movement-indicator';
        indicator.className = 'movement-indicator';
        document.body.appendChild(indicator);
        return indicator;
    }

    // Update movement indicator display
    updateMovementIndicator(current, max) {
        if (!this.movementIndicator) return;
        
        // Clear existing dots
        this.movementIndicator.innerHTML = '';
        
        // Create movement dots
        for (let i = 0; i < max; i++) {
            const dot = document.createElement('div');
            dot.className = 'movement-dot';
            if (i < current) {
                dot.classList.add('active');
            }
            this.movementIndicator.appendChild(dot);
        }
    }

    // Update turn indicator display
    updateTurnIndicator(currentEntity) {
        if (!this.turnIndicator) return;
        
        const isPlayer = currentEntity.type === 'player';
        this.turnIndicator.textContent = `${currentEntity.name}'s Turn`;
        
        // Different colors for player vs enemy
        if (isPlayer) {
            this.turnIndicator.style.backgroundColor = '#ffefefff';
        } else {
            this.turnIndicator.style.backgroundColor = '#ebebffff';
        }
    }

    // Destroy the turn manager
    destroy() {
        if (this.turnIndicator && this.turnIndicator.parentNode) {
            this.turnIndicator.parentNode.removeChild(this.turnIndicator);
        }
        if (this.movementIndicator && this.movementIndicator.parentNode) {
            this.movementIndicator.parentNode.removeChild(this.movementIndicator);
        }
        this.clearEntities();
    }
}
