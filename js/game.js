const toggleButton = document.getElementById('toggleMenu');
const controlsContainer = document.getElementById('controlsContainer');
toggleButton.addEventListener('click', () => {
    controlsContainer.classList.toggle('hidden');
});

const grid = document.getElementById('grid');
const startButton = document.getElementById('start');
const previousButton = document.getElementById('previous');
const nextButton = document.getElementById('next');
const randomButton = document.getElementById('random');
const speedControl = document.getElementById('speed');
const patternsSelect = document.getElementById('patterns');
const saveButton = document.getElementById('save');
const loadButton = document.getElementById('load');
const generationDisplay = document.getElementById('generation');
const liveCellsDisplay = document.getElementById('live-cells');

let cells = new Map();
let interval;
let history = [];
let generation = 0;

function createCell(row, col) {
    const key = `${row},${col}`;
    if (cells.has(key)) return cells.get(key);

    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.transform = `translate(${col * 21}px, ${row * 21}px)`;
    cell.dataset.row = row;
    cell.dataset.col = col;

    cell.addEventListener('click', () => {
        const pattern = patternsSelect.value;
        if (pattern === 'single') {
            cell.classList.toggle('alive');
        } else {
            applyPattern(row, col, pattern);
        }
    });

    grid.appendChild(cell);
    cells.set(key, cell);
    return cell;
}

function applyPattern(row, col, pattern) {
    const patterns = {
        single: [[0, 0]],
        glider: [[0, 0], [1, 1], [2, -1], [2, 0], [2, 1]],
        pulsar: [
            [-1, -2], [-1, -3], [-1, -4], [-2, -1], [-3, -1], [-4, -1],
            [1, 2], [1, 3], [1, 4], [2, 1], [3, 1], [4, 1],
            [1, -2], [1, -3], [1, -4], [2, -1], [3, -1], [4, -1],
            [-1, 2], [-1, 3], [-1, 4], [-2, 1], [-3, 1], [-4, 1]
        ],
        lwss: [[0, 1], [0, 4], [1, 0], [1, 4], [2, 4], [2, 0], [3, 1], [3, 2], [3, 3], [3, 4]],
        block: [[0, 0], [0, 1], [1, 0], [1, 1]],
        beehive: [[0, 1], [0, 2], [1, 0], [1, 3], [2, 1], [2, 2]],
        loaf: [[0, 1], [0, 2], [1, 0], [1, 3], [2, 1], [2, 3], [3, 2]],
        boat: [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1]],
        tub: [[0, 1], [1, 0], [1, 2], [2, 1]],
    };

    patterns[pattern].forEach(([dx, dy]) => {
        const targetCell = createCell(row + dx, col + dy);
        targetCell.classList.add('alive');
    });
}

function populateVisibleGrid() {
    const { scrollTop, scrollLeft, clientWidth, clientHeight } = grid;
    const startRow = Math.floor(scrollTop / 21) - 1;
    const startCol = Math.floor(scrollLeft / 21) - 1;
    const visibleRows = Math.ceil(clientHeight / 21) + 2;
    const visibleCols = Math.ceil(clientWidth / 21) + 2;

    for (let row = startRow; row < startRow + visibleRows; row++) {
        for (let col = startCol; col < startCol + visibleCols; col++) {
            createCell(row, col);
        }
    }
}

function saveState() {
    const currentState = Array.from(cells.entries()).map(([key, cell]) => [key, cell.classList.contains('alive')]);
    history.push(currentState);
}

function restoreState() {
    if (history.length > 0) {
        const previousState = history.pop();
        cells.forEach(cell => cell.classList.remove('alive'));
        previousState.forEach(([key, alive]) => {
            if (alive) cells.get(key)?.classList.add('alive');
        });
        generation = Math.max(0, generation - 1);
        updateStats();
    }
}

function getAliveNeighbors(row, col) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    let aliveNeighbors = 0;

    directions.forEach(([dx, dy]) => {
        const neighbor = cells.get(`${row + dx},${col + dy}`);
        if (neighbor?.classList.contains('alive')) {
            aliveNeighbors++;
        }
    });

    return aliveNeighbors;
}

function step() {
    saveState();
    const newStates = [];

    cells.forEach((cell, key) => {
        const [row, col] = key.split(',').map(Number);
        const aliveNeighbors = getAliveNeighbors(row, col);
        const isAlive = cell.classList.contains('alive');

        if (isAlive && (aliveNeighbors < 2 || aliveNeighbors > 3)) {
            newStates.push({ cell, alive: false });
        } else if (!isAlive && aliveNeighbors === 3) {
            newStates.push({ cell, alive: true });
        }
    });

    newStates.forEach(({ cell, alive }) => {
        if (alive) {
            cell.classList.add('alive');
        } else {
            cell.classList.remove('alive');
        }
    });

    generation++;
    updateStats();
}

// Función para crear la siguiente generación usando 'step'
function nextGeneration() {
    step();
}

function nextFrame() {
    saveState();
    step();
}

function randomSeed() {
    cells.forEach(cell => cell.classList.remove('alive'));
    const { scrollTop, scrollLeft, clientWidth, clientHeight } = grid;
    const startRow = Math.floor(scrollTop / 21) - 1;
    const startCol = Math.floor(scrollLeft / 21) - 1;
    const visibleRows = Math.ceil(clientHeight / 21) + 2;
    const visibleCols = Math.ceil(clientWidth / 21) + 2;

    for (let row = startRow; row < startRow + visibleRows; row++) {
        for (let col = startCol; col < startCol + visibleCols; col++) {
            const cell = createCell(row, col);
            if (Math.random() < 0.3) {
                cell.classList.add('alive');
            }
        }
    }
    generation = 0;
    updateStats();
}

function updateStats() {
    const liveCells = Array.from(cells.values()).filter(cell => cell.classList.contains('alive')).length;
    generationDisplay.textContent = generation;
    liveCellsDisplay.textContent = liveCells;
}

startButton.addEventListener('click', () => {
    if (interval) {
        clearInterval(interval);
        interval = null;
        startButton.textContent = 'Iniciar Simulación';
    } else {
        interval = setInterval(() => {
            nextGeneration();
        }, parseInt(speedControl.value));
        startButton.textContent = 'Detener Simulación';
    }
});

// Fix speed control - update interval when slider changes
speedControl.addEventListener('input', () => {
    if (interval) {
        clearInterval(interval);
        interval = setInterval(nextGeneration, parseInt(speedControl.value));
    }
});

previousButton.addEventListener('click', () => {
    if (interval) clearInterval(interval);
    interval = null;
    startButton.textContent = 'Iniciar Simulación';
    restoreState();
});

nextButton.addEventListener('click', () => {
    if (interval) clearInterval(interval);
    interval = null;
    startButton.textContent = 'Iniciar Simulación';
    nextFrame();
});

randomButton.addEventListener('click', randomSeed);

// Improve save/load functionality
saveButton.addEventListener('click', () => {
    const gameState = {
        cells: Array.from(cells.entries())
            .filter(([_, cell]) => cell.classList.contains('alive'))
            .map(([key, _]) => key),
        generation: generation
    };

    const blob = new Blob([JSON.stringify(gameState)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-of-life-state-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

loadButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const gameState = JSON.parse(e.target.result);
            
            // Clear current state
            cells.forEach(cell => cell.classList.remove('alive'));
            
            // Restore saved state
            gameState.cells.forEach(key => {
                const [row, col] = key.split(',').map(Number);
                const cell = createCell(row, col);
                cell.classList.add('alive');
            });
            
            generation = gameState.generation;
            updateStats();
        };
        
        reader.readAsText(file);
    };

    input.click();
});

grid.addEventListener('scroll', populateVisibleGrid);
populateVisibleGrid();
updateStats();