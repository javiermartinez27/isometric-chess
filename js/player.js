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
        this.maxMovementPoints = 5;  // Can be upgraded
        this.currentMovementPoints = 5;
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
            
            // Update grid - remove player from old position
            grid[this.y][this.x].hasPlayer = false;
            
            // Move player
            this.x = newX;
            this.y = newY;
            
            // Update grid - add player to new position
            grid[this.y][this.x].hasPlayer = true;
            
            this.updatePosition();
            
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
