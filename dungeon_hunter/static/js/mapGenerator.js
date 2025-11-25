// Grid cell structure
class GridCell {
    constructor() {
        this.hasGround = true;     // Whether ground tile exists
        this.groundType = 0;       // Type of ground tile
        this.hasPillar = false;    // Whether pillar exists
        this.pillarType = 0;       // Type of pillar
        this.hasPlayer = false;    // Whether player is here
        this.hasEnemy = false;     // Whether enemy is here
    }
}

// Map Generator Module
class MapGenerator {
    constructor(config, mapElement) {
        this.config = config;
        this.mapElement = mapElement;
        this.grid = [];
    }

    // Generate a random map
    generate() {
        // Initialize grid matrix
        this.grid = [];
        for (let y = 0; y < this.config.mapHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.config.mapWidth; x++) {
                this.grid[y][x] = new GridCell();
                
                // Decide if this cell has ground
                if (Math.random() < this.config.emptyGroundChance) {
                    this.grid[y][x].hasGround = false;
                } else {
                    this.grid[y][x].hasGround = true;
                    this.grid[y][x].groundType = Math.floor(Math.random() * this.config.tileTypes.length);
                    
                    // Only add pillars where there's ground
                    if (Math.random() < this.config.pillarChance) {
                        this.grid[y][x].hasPillar = true;
                        this.grid[y][x].pillarType = Math.floor(Math.random() * this.config.pillarTypes.length);
                    }
                }
            }
        }
        
        return this.grid;
    }

    // Render the map based on grid matrix
    render() {
        // Set map element size to accommodate all tiles with padding
        const mapWidth = this.config.mapWidth * this.config.tileSize * 2 * this.config.scale;
        const mapHeight = this.config.mapHeight * this.config.tileSize * 2 * this.config.scale;
        this.mapElement.style.width = `${mapWidth}px`;
        this.mapElement.style.height = `${mapHeight}px`;
        
        for (let y = 0; y < this.config.mapHeight; y++) {
            for (let x = 0; x < this.config.mapWidth; x++) {
                const cell = this.grid[y][x];
                
                // Draw ground tile if it exists
                if (cell.hasGround) {
                    this.createTile(x, y, cell.groundType);
                }
                
                // Draw pillar if it exists
                if (cell.hasPillar) {
                    this.createPillar(x, y, cell.pillarType);
                }
            }
        }
    }

    // Create a tile at the specified position
    createTile(x, y, tileType) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        
        // Calculate position with isometric projection
        const isoX = (x - y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (x + y) * (this.config.tileSize / 4) * this.config.scale;
        
        // Position the tile with offset to center the map
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        tile.style.left = `${isoX + offsetX}px`;
        tile.style.top = `${isoY + offsetY}px`;
        tile.style.width = `${this.config.tileSize * this.config.scale}px`;
        tile.style.height = `${this.config.tileSize * this.config.scale}px`;
        
        // Set tile image (update the path to your actual tiles)
        tile.style.backgroundImage = `url('${this.config.tilePath}${this.config.tileTypes[tileType]}')`;
        
        // Add the tile to the map
        this.mapElement.appendChild(tile);
    }

    // Create a pillar at the specified position
    createPillar(x, y, pillarType) {
        const pillar = document.createElement('div');
        pillar.className = 'tile pillar';
        pillar.id = `pillar-${x}-${y}`;
        
        // Calculate position with isometric projection (same as tile)
        const isoX = (x - y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (x + y) * (this.config.tileSize / 4) * this.config.scale;
        
        // Position the pillar at the same base position as the ground tile
        // The pillar image itself should extend upward from this position
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        pillar.style.left = `${isoX + offsetX}px`;
        pillar.style.top = `${isoY + offsetY - (20 * this.config.scale)}px`;
        pillar.style.width = `${this.config.tileSize * this.config.scale}px`;
        pillar.style.height = `${this.config.tileSize * this.config.scale}px`;  // Same as ground tile
        pillar.style.zIndex = this.calculateZIndex(x, y);
        
        // Set pillar image
        pillar.style.backgroundImage = `url('${this.config.pillarPath}${this.config.pillarTypes[pillarType]}')`;
        
        // Add the pillar to the map
        this.mapElement.appendChild(pillar);
    }

    // Clear the map
    clear() {
        this.grid = [];
        while (this.mapElement.firstChild) {
            this.mapElement.removeChild(this.mapElement.firstChild);
        }
    }

    // Get the current grid
    getGrid() {
        return this.grid;
    }

    // Calculate z-index based on grid position
    // Lower on the map (higher y) and to the right (higher x) should have higher z-index
    calculateZIndex(x, y) {
        // Base z-index calculation: y * mapWidth + x
        // This ensures sprites lower on the map appear in front
        return y * this.config.mapWidth + x;
    }

    // Check if a position is valid (has ground, no pillar)
    isValidPosition(x, y) {
        // Check bounds
        if (x < 0 || x >= this.config.mapWidth || y < 0 || y >= this.config.mapHeight) {
            return false;
        }
        
        const cell = this.grid[y][x];
        
        // Must have ground
        if (!cell.hasGround) {
            return false;
        }
        
        // Cannot have pillar
        if (cell.hasPillar) {
            return false;
        }
        
        return true;
    }
}
