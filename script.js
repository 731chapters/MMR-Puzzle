const bgmAudio = new Audio('./BGM.mp3');

(function () {
    "use strict";

    bgmAudio.loop = true;
    bgmAudio.volume = 0.045

    const getStart = new Audio('./start.mp3');
    getStart.volume = 1.0;


    const clickAudio = new Audio('./click.mp3');
    getStart.volume = 1.0;

    const moving = new Audio('./moving.mp3');
    moving.volume = 0.3;

    let bgmStarted = false;

    const LEVELS = {
        easy: 3,
        medium: 4,
        hard: 5,
    };

    const SHUFFLE_MOVES = {
        easy: 300,
        medium: 800,
        hard: 1500,
    };

    const PUZZLE_IMAGES = [
        "lev1.jpg",
        "lev2.jpg",
        "lev3.jpg",
        "lev4.jpg",
        "lev5.jpg",
        "lev6.jpg",
        "lev7.jpg",
        "lev8.png",
        "lev1.jpg",
    ];

    const IMAGE_INDEX_BY_LEVEL = {
        easy: [0, 1, 2],
        medium: [3, 4, 5],
        hard: [6, 7, 8],
    };
    const winAudio = new Audio('./win.mp3');
    winAudio.volume = 0.9;
    let state = {
        level: "easy",
        size: 4,
        grid: [],
        emptyIndex: 0,
        moves: 0,
        currentImageUrl: "",

    };

    const $ = (sel, el = document) => el.querySelector(sel);
    const $$ = (sel, el = document) => el.querySelectorAll(sel);

    function getNeighbors(index, size) {
        const n = size;
        const row = Math.floor(index / n);
        const col = index % n;
        const neighbors = [];
        if (row > 0) neighbors.push(index - n);
        if (row < n - 1) neighbors.push(index + n);
        if (col > 0) neighbors.push(index - 1);
        if (col < n - 1) neighbors.push(index + 1);
        return neighbors;
    }

    function createSolvablePuzzle(size) {
        const n = size * size;
        const grid = [];
        for (let i = 1; i < n; i++) grid.push(i);
        grid.push(0);
        let emptyIndex = n - 1;
        const movesCount = SHUFFLE_MOVES[state.level] || 500;
        for (let i = 0; i < movesCount; i++) {
            const neighbors = getNeighbors(emptyIndex, size);
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            [grid[emptyIndex], grid[next]] = [grid[next], grid[emptyIndex]];
            emptyIndex = next;
        }
        return { grid, emptyIndex };
    }

    function startNewGame() {
        state.size = LEVELS[state.level];
        const indices = IMAGE_INDEX_BY_LEVEL[state.level];
        state.currentImageUrl = PUZZLE_IMAGES[indices[Math.floor(Math.random() * indices.length)]];
        const { grid, emptyIndex } = createSolvablePuzzle(state.size);
        state.grid = grid;
        state.emptyIndex = emptyIndex;
        state.moves = 0;
        render();
        $("#winOverlay").classList.add("hidden");
    }

    function playBgm() {
        if (bgmStarted) return;
        bgmStarted = true;
        bgmAudio.currentTime = 0;
        const playPromise = bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.warn('bgm play failed', err));
        }
    }

    function tryStartBgmOnInteraction() {
        if (bgmStarted) return;
        playBgm();
        window.removeEventListener('pointerdown', tryStartBgmOnInteraction);
        window.removeEventListener('keydown', tryStartBgmOnInteraction);
    }

    function playStartSound() {
        getStart.currentTime = 0;
        const playPromise = getStart.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.warn('start sound failed', err));
        }
    }

    function playClickSound() {
        clickAudio.currentTime = 0;
        const playPromise = clickAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.warn('start sound failed', err));
        }
    }

    function playMoveSound() {
        moving.currentTime = 0;
        moving.play().catch(err => console.warn('move sound failed', err));
    }

    function playWinSound() {
        if (typeof winAudio === 'undefined') return;
        winAudio.currentTime = 0;
        const playPromise = winAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.warn('win sound failed', err));
        }
    }

    function isAdjacentToEmpty(index) {
        return getNeighbors(state.emptyIndex, state.size).includes(index);
    }

    function moveTile(index) {
        if (!isAdjacentToEmpty(index)) return;
        playMoveSound();
        const empty = state.emptyIndex;
        [state.grid[empty], state.grid[index]] = [state.grid[index], state.grid[empty]];
        state.emptyIndex = index;
        state.moves += 1;
        render();
        if (checkWin()) {
            $("#winMoves").textContent = "Moves: " + state.moves;
            $("#winOverlay").classList.remove("hidden");
            playWinSound();
        }
    }

    function checkWin() {
        const n = state.grid.length;
        for (let i = 0; i < n - 1; i++) {
            if (state.grid[i] !== i + 1) return false;
        }
        return state.grid[n - 1] === 0;
    }

    function render() {
        const board = $("#board");
        const size = state.size;
        board.className = "board size-" + size;
        board.innerHTML = "";
        const n = size * size;
        for (let i = 0; i < n; i++) {
            const value = state.grid[i];
            const tile = document.createElement("div");
            tile.className = "tile" + (value === 0 ? " empty" : " tile-image");
            tile.dataset.index = i;
            tile.setAttribute("role", "gridcell");
            if (value !== 0) {
                const pieceIndex = value - 1;
                const row = Math.floor(pieceIndex / size);
                const col = pieceIndex % size;
                tile.style.backgroundImage = "url(" + state.currentImageUrl + ")";
                tile.style.backgroundSize = size * 100 + "% " + size * 100 + "%";
                tile.style.backgroundRepeat = "no-repeat";
                if (size > 1) {
                    const xPct = (col / (size - 1)) * 100;
                    const yPct = (row / (size - 1)) * 100;
                    tile.style.backgroundPosition = xPct + "% " + yPct + "%";
                } else {
                    tile.style.backgroundPosition = "0% 0%";
                }
                tile.addEventListener("click", () => moveTile(i));
            }
            board.appendChild(tile);
        }
        $("#moves").textContent = "Moves: " + state.moves;
    }

    function startGame(level) {
        state.level = level;
        state.size = LEVELS[level];
        playStartSound();
        document.body.classList.add('in-game');
        $("#levelScreen").classList.add("hidden");
        $("#gameScreen").classList.remove("hidden");
        $("#levelBadge").textContent = level.charAt(0).toUpperCase() + level.slice(1);
        startNewGame();
    }

    function goToLevelScreen() {
        document.body.classList.remove('in-game');
        $("#gameScreen").classList.add("hidden");
        $("#winOverlay").classList.add("hidden");
        $("#levelScreen").classList.remove("hidden");
    }

    document.addEventListener("DOMContentLoaded", () => {
        window.addEventListener('pointerdown', tryStartBgmOnInteraction);
        window.addEventListener('keydown', tryStartBgmOnInteraction);
        $("#startButton").addEventListener("click", () => {
            playClickSound();
            $(".startscreen").classList.add("hidden");
            $("#levelScreen").classList.remove("hidden");
        });

        $$(".level-btn[data-level]").forEach((btn) => {
            btn.addEventListener("click", () => startGame(btn.dataset.level));
        });
        $("#newGameBtn").addEventListener("click", startNewGame);
        $("#changeLevelBtn").addEventListener("click", () => {
            $(".startscreen").classList.add("hidden");
            goToLevelScreen();
        });
        $("#playAgainBtn").addEventListener("click", () => {
            $("#winOverlay").classList.add("hidden");
            startNewGame();
        });
        $("#changeLevelFromWinBtn").addEventListener("click", () => {
            $("#winOverlay").classList.add("hidden");
            playClickSound();
            $(".startscreen").classList.add("hidden");
            goToLevelScreen();
        });
    });

})();
