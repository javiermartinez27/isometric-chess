// Player Module
class Player {
    constructor(config, mapElement, mapContainer, mapGenerator, turnManager) {
        this.config = config;
        this.mapElement = mapElement;
        this.mapContainer = mapContainer;
        this.mapGenerator = mapGenerator;
        this.turnManager = turnManager;
        this.x = 0;
        this.y = 0;
        this.element = null;
        this.healthBar = null;
        this.maxMovementPoints = 5;  // Can be upgraded
        this.currentMovementPoints = 5;
        this.maxHealth = 10;
        this.currentHealth = 10;
        this.attackPoints = 1;  // Can be upgraded
        this.isSelectingAttackDirection = false;
    }

    // Create the player
    create() {
        // Find a valid starting position (has ground, no pillar)
        let validPosition = false;
        const grid = this.mapGenerator.getGrid();
        
        while (!validPosition) {
            this.x = Math.floor(Math.random() * this.config.mapWidth);
            this.y = Math.floor(Math.random() * this.config.mapHeight);
            
            if (this.mapGenerator.isValidPosition(this.x, this.y)) {
                validPosition = true;
            }
        }
        
        // Mark player position in grid
        grid[this.y][this.x].hasPlayer = true;
        
        // Create player element
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        const playerSize = 10 * this.config.scale;
        this.element.style.width = `${playerSize}px`;
        this.element.style.height = `${playerSize}px`;
        this.element.style.backgroundColor = 'red';
        this.element.style.borderRadius = '50%';
        this.element.style.zIndex = '1';
        
        // Position the player
        this.updatePosition();
        
        // Add player to map
        this.mapElement.appendChild(this.element);
        
        // Create health bar
        this.createHealthBar();
    }

    // Update player position on screen
    updatePosition() {
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;
        
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        const playerSize = 10 * this.config.scale;
        this.element.style.left = `${isoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - playerSize / 2}px`;
        this.element.style.top = `${isoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - playerSize - 15}px`;
        this.element.style.width = `${playerSize}px`;
        this.element.style.height = `${playerSize}px`;
        
        // Center camera on player
        this.centerCamera();
    }

    // Center the camera on the player
    centerCamera() {
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;
        
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        
        // Calculate the player's absolute position in the map
        const playerScreenX = isoX + offsetX + this.config.tileSize / 2;
        const playerScreenY = isoY + offsetY + this.config.tileSize / 2;
        
        // Get viewport dimensions
        const viewportWidth = this.mapContainer.clientWidth;
        const viewportHeight = this.mapContainer.clientHeight;
        
        // Calculate scroll position to center player
        const scrollX = playerScreenX - viewportWidth / 2;
        const scrollY = playerScreenY - viewportHeight / 2;
        
        // Smooth scroll to player position
        this.mapContainer.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
        });
    }

    // Start player's turn
    startTurn() {
        this.currentMovementPoints = this.maxMovementPoints;
        this.isSelectingAttackDirection = false;
    }

    // Create health bar
    createHealthBar() {
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'health-bar';
        this.healthBar.innerHTML = `
            <div class="health-bar-bg">
                <div class="health-bar-fill" style="width: 100%"></div>
            </div>
        `;
        this.mapElement.appendChild(this.healthBar);
        this.updateHealthBar();
    }

    // Update health bar position and value
    updateHealthBar() {
        if (!this.healthBar) return;
        
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;
        
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        
        this.healthBar.style.left = `${isoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - 20}px`;
        this.healthBar.style.top = `${isoY + offsetY - 25}px`;
        
        const healthPercent = (this.currentHealth / this.maxHealth) * 100;
        const fillElement = this.healthBar.querySelector('.health-bar-fill');
        fillElement.style.width = `${healthPercent}%`;
        
        // Color based on health
        if (healthPercent > 60) {
            fillElement.style.backgroundColor = '#4CAF50';
        } else if (healthPercent > 30) {
            fillElement.style.backgroundColor = '#FFC107';
        } else {
            fillElement.style.backgroundColor = '#F44336';
        }
    }

    // Take damage
    takeDamage(amount) {
        this.currentHealth -= amount;
        if (this.currentHealth < 0) this.currentHealth = 0;
        this.updateHealthBar();
        
        if (this.currentHealth <= 0) {
            this.turnManager.gameOver();
        }
    }

    // Start attack mode
    startAttack() {
        if (!this.turnManager.isEntityTurn(this) || this.currentMovementPoints <= 0) {
            return;
        }
        this.isSelectingAttackDirection = true;
        this.turnManager.showAttackDirectionPrompt();
    }

    // Attack in a direction
    attack(direction) {
        if (!this.isSelectingAttackDirection) return;
        
        let targetX = this.x;
        let targetY = this.y;
        
        switch(direction) {
            case 'up': targetY--; break;
            case 'down': targetY++; break;
            case 'left': targetX--; break;
            case 'right': targetX++; break;
        }
        
        // Check if target is in bounds
        if (targetX < 0 || targetX >= this.config.mapWidth || 
            targetY < 0 || targetY >= this.config.mapHeight) {
            this.isSelectingAttackDirection = false;
            this.turnManager.hideAttackDirectionPrompt();
            return;
        }
        
        // Check if enemy is at target position
        const grid = this.mapGenerator.getGrid();
        if (grid[targetY][targetX].hasEnemy) {
            // Find and damage the enemy
            const enemy = this.turnManager.getEntityAt(targetX, targetY);
            if (enemy) {
                enemy.takeDamage(this.attackPoints);
            }
        }
        
        // Attack consumes all remaining movement points and ends turn
        this.currentMovementPoints = 0;
        this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);
        
        this.isSelectingAttackDirection = false;
        this.turnManager.hideAttackDirectionPrompt();
        
        // End turn
        this.turnManager.endTurn();
    }

    // Get remaining movement points
    getRemainingMoves() {
        return this.currentMovementPoints;
    }

    // Get max movement points
    getMaxMoves() {
        return this.maxMovementPoints;
    }

    // Upgrade movement points (for future upgrades)
    upgradeMovement(additionalPoints) {
        this.maxMovementPoints += additionalPoints;
    }

    // Handle keyboard input
    handleKeyPress(event) {
        // Handle attack direction selection
        if (this.isSelectingAttackDirection) {
            switch(event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    this.attack('up');
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    this.attack('down');
                    return;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.attack('left');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    this.attack('right');
                    return;
                case 'Escape':
                    this.isSelectingAttackDirection = false;
                    this.turnManager.hideAttackDirectionPrompt();
                    return;
            }
            return;
        }
        
        // Handle attack button
        if (event.key === 'a' || event.key === 'A') {
            this.startAttack();
            return;
        }
        
        // Only allow movement if it's player's turn and they have movement points
        if (!this.turnManager.isEntityTurn(this) || this.currentMovementPoints <= 0) {
            return;
        }
        
        let newX = this.x;
        let newY = this.y;
        
        switch(event.key) {
            case 'ArrowUp':
                newY--;
                break;
            case 'ArrowDown':
                newY++;
                break;
            case 'ArrowLeft':
                newX--;
                break;
            case 'ArrowRight':
                newX++;
                break;
            default:
                return;  // Ignore other keys
        }
        
        // Prevent default arrow key behavior (scrolling)
        event.preventDefault();
        
        // Check if move is valid
        if (this.isValidMove(newX, newY)) {
            const grid = this.mapGenerator.getGrid();
            
            // Check if space is occupied by enemy
            if (grid[newY][newX].hasEnemy) {
                return; // Can't move into enemy space
            }
            
            // Update grid - remove player from old position
            grid[this.y][this.x].hasPlayer = false;
            
            // Move player
            this.x = newX;
            this.y = newY;
            
            // Update grid - add player to new position
            grid[this.y][this.x].hasPlayer = true;
            
            this.updatePosition();
            this.updateHealthBar();
            
            // Decrease movement points
            this.currentMovementPoints--;
            this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);
            
            // End turn if no movement points left
            if (this.currentMovementPoints <= 0) {
                this.turnManager.endTurn();
            }
        }
    }

    // Check if a move is valid
    isValidMove(x, y) {
        return this.mapGenerator.isValidPosition(x, y);
    }
}
