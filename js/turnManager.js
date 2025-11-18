// Turn Manager - State Machine for turn-based gameplay
class TurnManager {
    constructor() {
        this.entities = [];  // All entities that can take turns (players, enemies, etc.)
        this.currentTurnIndex = 0;
        this.turnInProgress = false;
        this.turnIndicator = null;
        this.movementIndicator = null;
        this.attackPrompt = null;
        this.spellPrompt = null;
        this.gameOverScreen = null;
    }

    // Initialize the turn manager
    init() {
        this.turnIndicator = this.createTurnIndicator();
        this.movementIndicator = this.createMovementIndicator();
        this.attackPrompt = this.createAttackPrompt();
        this.spellPrompt = this.createSpellPrompt();
        this.gameOverScreen = this.createGameOverScreen();
    }

    // Register an entity that can take turns
    registerEntity(entity, type) {
        this.entities.push({
            entity: entity,
            type: type,  // 'player' or 'enemy'
            name: type === 'player' ? 'Player' : `Enemy ${this.entities.filter(e => e.type === 'enemy').length + 1}`
        });
    }

    // Remove an entity (when it dies)
    removeEntity(entity) {
        const index = this.entities.findIndex(e => e.entity === entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            
            // Adjust current turn index if needed
            if (this.currentTurnIndex >= this.entities.length) {
                this.currentTurnIndex = 0;
            }
            
            // If no enemies left, player wins
            const hasEnemies = this.entities.some(e => e.type === 'enemy');
            if (!hasEnemies) {
                // Player wins - could show victory screen
                console.log('All enemies defeated!');
            }
        }
    }

    // Get entity at specific position
    getEntityAt(x, y) {
        for (const entityData of this.entities) {
            if (entityData.entity.x === x && entityData.entity.y === y) {
                return entityData.entity;
            }
        }
        return null;
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

    // Create attack direction prompt
    createAttackPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'attack-prompt';
        prompt.className = 'attack-prompt';
        prompt.style.display = 'none';
        prompt.textContent = 'Select Attack Direction (Arrow Keys)';
        document.body.appendChild(prompt);
        return prompt;
    }

    // Show attack direction prompt
    showAttackDirectionPrompt() {
        if (this.attackPrompt) {
            this.attackPrompt.style.display = 'block';
        }
    }

    // Hide attack direction prompt
    hideAttackDirectionPrompt() {
        if (this.attackPrompt) {
            this.attackPrompt.style.display = 'none';
        }
    }

    // Create spell direction prompt
    createSpellPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'spell-prompt';
        prompt.className = 'spell-prompt';
        prompt.style.display = 'none';
        prompt.innerHTML = `
            <div class="spell-prompt-content">
                <span class="spell-name">Spell</span>
                <span class="spell-info">Select Direction (Arrow Keys)</span>
            </div>
        `;
        document.body.appendChild(prompt);
        return prompt;
    }

    // Show spell direction prompt
    showSpellDirectionPrompt(spell) {
        if (this.spellPrompt) {
            const nameElement = this.spellPrompt.querySelector('.spell-name');
            if (nameElement && spell) {
                nameElement.textContent = spell.name;
            }
            this.spellPrompt.style.display = 'block';
        }
    }

    // Hide spell direction prompt
    hideSpellDirectionPrompt() {
        if (this.spellPrompt) {
            this.spellPrompt.style.display = 'none';
        }
    }

    // Create game over screen
    createGameOverScreen() {
        const screen = document.createElement('div');
        screen.id = 'game-over-screen';
        screen.className = 'game-over-screen';
        screen.style.display = 'none';
        screen.innerHTML = `
            <div class="game-over-content">
                <h1>Game Over</h1>
                <p>You were defeated!</p>
                <button id="restart-btn" class="restart-button">New Game</button>
            </div>
        `;
        document.body.appendChild(screen);
        return screen;
    }

    // Show game over screen
    gameOver() {
        this.turnInProgress = false;
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'flex';
        }
    }

    // Hide game over screen
    hideGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'none';
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
        if (this.attackPrompt && this.attackPrompt.parentNode) {
            this.attackPrompt.parentNode.removeChild(this.attackPrompt);
        }
        if (this.spellPrompt && this.spellPrompt.parentNode) {
            this.spellPrompt.parentNode.removeChild(this.spellPrompt);
        }
        if (this.gameOverScreen && this.gameOverScreen.parentNode) {
            this.gameOverScreen.parentNode.removeChild(this.gameOverScreen);
        }
        this.clearEntities();
    }
}
