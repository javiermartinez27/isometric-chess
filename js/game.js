// Game configuration
const config = {
    mapWidth: 13,  // Number of tiles wide (1/3 of 40)
    mapHeight: 10, // Number of tiles tall (1/3 of 30)
    tileSize: 39,  // Size of each tile in pixels
    scale: 2.5,    // Zoom scale to make everything bigger
    // Update this path to point to your tiles directory
    tilePath: 'art/tiles/ground/',
    pillarPath: 'art/tiles/pillars/',
    // Add your tile filenames here
    tileTypes: [
        'tile_01.png',
        'tile_02.png',
        'tile_03.png',
        'tile_04.png',
        'tile_05.png',
        'tile_06.png',
        'tile_07.png',
        'tile_08.png',
        'tile_09.png',
        'tile_10.png',
        'tile_11.png',
        'tile_12.png',
    ],
    pillarTypes: [
        'base.png',
        'mid.png'
    ],
    pillarChance: 0.1,  // 10% chance of a pillar appearing on a tile
    emptyGroundChance: 0.05  // 5% chance of no ground tile
};

// Grid cell structure
class GridCell {
    constructor() {
        this.hasGround = true;     // Whether ground tile exists
        this.groundType = 0;       // Type of ground tile
        this.hasPillar = false;    // Whether pillar exists
        this.pillarType = 0;       // Type of pillar
        this.hasPlayer = false;    // Whether player is here
    }
}

// Game state
let grid = [];  // 2D grid matrix
let player = {
    x: 5,
    y: 5,
    element: null
};
const mapElement = document.getElementById('map');
const mapContainer = document.getElementById('map-container');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');

// Initialize the game
function init() {
    // Add event listeners
    generateBtn.addEventListener('click', generateMap);
    clearBtn.addEventListener('click', clearMap);
    document.addEventListener('keydown', handleKeyPress);
    
    // Generate initial map
    generateMap();
}

// Generate a random map
function generateMap() {
    // Clear existing map
    clearMap();
    
    // Initialize grid matrix
    grid = [];
    for (let y = 0; y < config.mapHeight; y++) {
        grid[y] = [];
        for (let x = 0; x < config.mapWidth; x++) {
            grid[y][x] = new GridCell();
            
            // Decide if this cell has ground
            if (Math.random() < config.emptyGroundChance) {
                grid[y][x].hasGround = false;
            } else {
                grid[y][x].hasGround = true;
                grid[y][x].groundType = Math.floor(Math.random() * config.tileTypes.length);
                
                // Only add pillars where there's ground
                if (Math.random() < config.pillarChance) {
                    grid[y][x].hasPillar = true;
                    grid[y][x].pillarType = Math.floor(Math.random() * config.pillarTypes.length);
                }
            }
        }
    }
    
    // Render the map from the grid
    renderMap();
    
    // Create player
    createPlayer();
}

// Render the map based on grid matrix
function renderMap() {
    // Set map element size to accommodate all tiles with padding
    const mapWidth = config.mapWidth * config.tileSize * 2 * config.scale;
    const mapHeight = config.mapHeight * config.tileSize * 2 * config.scale;
    mapElement.style.width = `${mapWidth}px`;
    mapElement.style.height = `${mapHeight}px`;
    
    for (let y = 0; y < config.mapHeight; y++) {
        for (let x = 0; x < config.mapWidth; x++) {
            const cell = grid[y][x];
            
            // Draw ground tile if it exists
            if (cell.hasGround) {
                createTile(x, y, cell.groundType);
            }
            
            // Draw pillar if it exists
            if (cell.hasPillar) {
                createPillar(x, y, cell.pillarType);
            }
        }
    }
}

// Create a tile at the specified position
function createTile(x, y, tileType) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    // Calculate position with isometric projection
    const isoX = (x - y) * (config.tileSize / 2) * config.scale;
    const isoY = (x + y) * (config.tileSize / 4) * config.scale;
    
    // Position the tile with offset to center the map
    const offsetX = config.mapWidth * config.tileSize * config.scale;
    const offsetY = config.tileSize * 2 * config.scale;
    tile.style.left = `${isoX + offsetX}px`;
    tile.style.top = `${isoY + offsetY}px`;
    tile.style.width = `${config.tileSize * config.scale}px`;
    tile.style.height = `${config.tileSize * config.scale}px`;
    
    // Set tile image (update the path to your actual tiles)
    tile.style.backgroundImage = `url('${config.tilePath}${config.tileTypes[tileType]}')`;
    
    // Add the tile to the map
    mapElement.appendChild(tile);
}

// Create a pillar at the specified position
function createPillar(x, y, pillarType) {
    const pillar = document.createElement('div');
    pillar.className = 'tile pillar';
    pillar.id = `pillar-${x}-${y}`;
    
    // Calculate position with isometric projection (same as tile)
    const isoX = (x - y) * (config.tileSize / 2) * config.scale;
    const isoY = (x + y) * (config.tileSize / 4) * config.scale;
    
    // Position the pillar at the same base position as the ground tile
    // The pillar image itself should extend upward from this position
    const offsetX = config.mapWidth * config.tileSize * config.scale;
    const offsetY = config.tileSize * 2 * config.scale;
    pillar.style.left = `${isoX + offsetX}px`;
    pillar.style.top = `${isoY + offsetY - (20 * config.scale)}px`;
    pillar.style.width = `${config.tileSize * config.scale}px`;
    pillar.style.height = `${config.tileSize * config.scale}px`;  // Same as ground tile
    pillar.style.zIndex = '2';  // Higher than ground tiles
    
    // Set pillar image
    pillar.style.backgroundImage = `url('${config.pillarPath}${config.pillarTypes[pillarType]}')`;
    
    // Add the pillar to the map
    mapElement.appendChild(pillar);
}

// Create the player
function createPlayer() {
    // Find a valid starting position (has ground, no pillar)
    let validPosition = false;
    while (!validPosition) {
        player.x = Math.floor(Math.random() * config.mapWidth);
        player.y = Math.floor(Math.random() * config.mapHeight);
        
        if (isValidPosition(player.x, player.y)) {
            validPosition = true;
        }
    }
    
    // Mark player position in grid
    grid[player.y][player.x].hasPlayer = true;
    
    // Create player element
    player.element = document.createElement('div');
    player.element.style.position = 'absolute';
    const playerSize = 10 * config.scale;
    player.element.style.width = `${playerSize}px`;
    player.element.style.height = `${playerSize}px`;
    player.element.style.backgroundColor = 'red';
    player.element.style.borderRadius = '50%';
    player.element.style.zIndex = '1';
    
    // Position the player
    updatePlayerPosition();
    
    // Add player to map
    mapElement.appendChild(player.element);
}

// Update player position on screen
function updatePlayerPosition() {
    const isoX = (player.x - player.y) * (config.tileSize / 2) * config.scale;
    const isoY = (player.x + player.y) * (config.tileSize / 4) * config.scale;
    
    const offsetX = config.mapWidth * config.tileSize * config.scale;
    const offsetY = config.tileSize * 2 * config.scale;
    const playerSize = 10 * config.scale;
    player.element.style.left = `${isoX + offsetX + (config.tileSize * config.scale) / 2 - playerSize / 2}px`;
    player.element.style.top = `${isoY + offsetY + (config.tileSize * config.scale) / 2 - playerSize - 15}px`;
    player.element.style.width = `${playerSize}px`;
    player.element.style.height = `${playerSize}px`;
    
    // Center camera on player
    centerCameraOnPlayer();
}

// Center the camera on the player
function centerCameraOnPlayer() {
    const isoX = (player.x - player.y) * (config.tileSize / 2) * config.scale;
    const isoY = (player.x + player.y) * (config.tileSize / 4) * config.scale;
    
    const offsetX = config.mapWidth * config.tileSize * config.scale;
    const offsetY = config.tileSize * 2 * config.scale;
    
    // Calculate the player's absolute position in the map
    const playerScreenX = isoX + offsetX + config.tileSize / 2;
    const playerScreenY = isoY + offsetY + config.tileSize / 2;
    
    // Get viewport dimensions
    const viewportWidth = mapContainer.clientWidth;
    const viewportHeight = mapContainer.clientHeight;
    
    // Calculate scroll position to center player
    const scrollX = playerScreenX - viewportWidth / 2;
    const scrollY = playerScreenY - viewportHeight / 2;
    
    // Smooth scroll to player position
    mapContainer.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth'
    });
}

// Handle keyboard input
function handleKeyPress(event) {
    let newX = player.x;
    let newY = player.y;
    
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
    if (isValidMove(newX, newY)) {
        // Update grid - remove player from old position
        grid[player.y][player.x].hasPlayer = false;
        
        // Move player
        player.x = newX;
        player.y = newY;
        
        // Update grid - add player to new position
        grid[player.y][player.x].hasPlayer = true; 

        
        updatePlayerPosition();
    }
}

// Check if a position is valid for the player
function isValidPosition(x, y) {
    // Check bounds
    if (x < 0 || x >= config.mapWidth || y < 0 || y >= config.mapHeight) {
        return false;
    }
    
    const cell = grid[y][x];
    
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

// Check if a move is valid (alias for isValidPosition)
function isValidMove(x, y) {
    return isValidPosition(x, y);
}

// Clear the map
function clearMap() {
    grid = [];
    while (mapElement.firstChild) {
        mapElement.removeChild(mapElement.firstChild);
    }
}

// Start the game
init();
