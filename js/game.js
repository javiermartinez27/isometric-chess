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

// Game state
let mapGenerator = null;
let turnManager = null;
let player = null;
let enemy = null;
const mapElement = document.getElementById('map');
const mapContainer = document.getElementById('map-container');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
let attackBtn = null;
let spellBtn = null;

// Initialize the game
function init() {
    // Initialize map generator
    mapGenerator = new MapGenerator(config, mapElement);

    // Initialize turn manager
    turnManager = new TurnManager();
    turnManager.init();

    // Add event listeners
    generateBtn.addEventListener('click', generateMap);
    clearBtn.addEventListener('click', clearMap);
    document.addEventListener('keydown', (event) => {
        if (player) {
            player.handleKeyPress(event);
        }
    });

    // Create attack button
    attackBtn = document.createElement('button');
    attackBtn.id = 'attackBtn';
    attackBtn.textContent = 'Attack (A)';
    attackBtn.addEventListener('click', () => {
        if (player) {
            player.startAttack();
        }
    });
    document.querySelector('.controls').appendChild(attackBtn);



    // Create spell button
    spellBtn = document.createElement('button');
    spellBtn.id = 'spellBtn';
    spellBtn.textContent = 'Cast Spell (S)';
    spellBtn.addEventListener('click', () => {
        if (player) {
            player.startSpellCast();
        }
    });
    document.querySelector('.controls').appendChild(spellBtn);

    // Create switch spell button
    const switchSpellBtn = document.createElement('button');
    switchSpellBtn.id = 'switchSpellBtn';
    switchSpellBtn.textContent = 'Switch Spell (Tab)';
    switchSpellBtn.addEventListener('click', () => {
        if (player) {
            const currentSpell = player.switchSpell();
            updateSpellUI(currentSpell);
        }
    });
    document.querySelector('.controls').appendChild(switchSpellBtn);

    // Add restart button listener (will be created by turnManager)
    document.addEventListener('click', (event) => {
        if (event.target.id === 'restart-btn') {
            turnManager.hideGameOver();
            generateMap();
        }

        // Win screen buttons
        if (event.target.id === 'win-new-map-btn') {
            turnManager.hideWinScreen();
            generateMap();
        }

        if (event.target.id === 'win-back-to-town-btn') {
            console.log('Returning to town...');
            alert('Returning to town... (Placeholder)');
        }
    });

    // Generate initial map
    generateMap();
}

// Generate a random map
function generateMap() {
    // Clear existing map
    clearMap();

    // Generate and render the map
    mapGenerator.generate();
    mapGenerator.render();

    // Create player
    player = new Player(config, mapElement, mapContainer, mapGenerator, turnManager);
    player.create();

    // Initialize magic system for player
    player.initializeMagicSystem();
    updateSpellUI(player.getCurrentSpell());

    // Create enemy (pass player reference for pathfinding)
    enemy = new Enemy(config, mapElement, mapContainer, mapGenerator, player, turnManager);
    enemy.create();

    // Register entities with turn manager
    turnManager.registerEntity(player, 'player');
    turnManager.registerEntity(enemy, 'enemy');

    // Start turn-based gameplay
    turnManager.start();
}


// Clear the map
function clearMap() {
    // Clear turn manager
    if (turnManager) {
        turnManager.clearEntities();
    }

    // Destroy enemy if it exists
    if (enemy) {
        enemy.destroy();
        enemy = null;
    }

    mapGenerator.clear();
}

// Update spell UI
function updateSpellUI(spell) {
    if (!spellBtn || !spell) return;

    spellBtn.textContent = `Cast ${spell.name} (S)`;
}

// Start the game
init();
