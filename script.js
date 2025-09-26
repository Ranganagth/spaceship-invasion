const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const gameOptions = document.getElementById("gameOptions");
const gameContainer = document.getElementById("gameContainer");
const currentScoreElement = document.getElementById("currentScore");
const highestScoreElement = document.getElementById("highestScore");
const remainingTimeElement = document.getElementById("remainingTime");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalHighestScoreValue = document.getElementById("finalHighestScoreValue");

const hitSound = document.getElementById("hitSound");
const groundSound = document.getElementById("groundSound");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const INITIAL_TIME = 120;

let gameLoopId;
let timerId;
let gameRunning = false;
let score = 0;
let highestScore = 0;
let remainingTime = INITIAL_TIME;
let keys = {};

class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = (GAME_WIDTH - this.width) / 2;
        this.y = GAME_HEIGHT - this.height - 10;
        this.speed = 5;
    }

    draw() {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + this.width / 2 - 5, this.y - 10, 10, 10);
    }

    move() {
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] && this.x < GAME_WIDTH - this.width) {
            this.x += this.speed;
        }
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 7;
        this.active = true;
    }

    draw() {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed;
        if (this.y < 0) {
            this.active = false;
        }
    }
}

class Invader {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 20;
        this.speed = 0.5;
        this.active = true;
    }

    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
        if (this.y + this.height >= GAME_HEIGHT) {
            this.active = false;
            updateScore(-10);
            playGroundSound();
        }
    }
}

let player;
let bullets = [];
let invaders = [];
let invaderSpawnInterval = 1000;
let lastSpawnTime = 0;

function updateScore(points) {
    score += points;

    if (points > 0) {
        if (score >= highestScore) {
            highestScore = score;
            score += 10;
            highestScore += 10;
        }
    } else if (score < 0) {
        score = 0;
        endGame();
    }

    currentScoreElement.textContent = score;
    highestScoreElement.textContent = highestScore;

    if (score > 100 && player.speed < 8) {
        player.speed = 8;
        Invader.prototype.speed = 0.8;
    } else if (score > 250 && player.speed < 10) {
        player.speed = 10;
        Invader.prototype.speed = 1.0;
    }
}

function updateTimer() {
    remainingTime--;
    remainingTimeElement.textContent = remainingTime;

    if (remainingTime <= 0) {
        endGame();
    }
}

function endGame() {
    if (!gameRunning) return;

    gameRunning = false;
    clearInterval(gameLoopId);
    clearInterval(timerId);

    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.flexDirection = 'column';
    finalHighestScoreValue.textContent = highestScore;

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

function spawnInvader() {
    const x = Math.random() * (GAME_WIDTH - 30);
    const y = -20;
    invaders.push(new Invader(x, y));
}

function checkCollisions() {
    bullets.forEach(bullet => {
        if (!bullet.active) return;

        invaders.forEach(invader => {
            if (!invader.active) return;

            if (bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {

                bullet.active = false;
                invader.active = false;
                updateScore(10);
                playHitSound();
            }
        });
    });
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    player.draw();
    bullets.forEach(bullet => bullet.draw());
    invaders.forEach(invader => invader.draw());
}

function update(deltaTime) {
    if (!gameRunning) return;

    player.move();

    bullets.forEach(bullet => bullet.update());
    bullets = bullets.filter(bullet => bullet.active);

    invaders.forEach(invader => invader.update());
    invaders = invaders.filter(invader => invader.active);

    if (Date.now() - lastSpawnTime > invaderSpawnInterval) {
        spawnInvader();
        lastSpawnTime = Date.now();
        if (invaderSpawnInterval > 300) {
            invaderSpawnInterval -= 10;
        }
    }

    checkCollisions();
}

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function playHitSound() {
    if (hitSound) {
        hitSound.currentTime = 0;
        hitSound.play().catch(e => console.error("Hit sound error:", e));
    }
}

function playGroundSound() {
    if (groundSound) {
        groundSound.currentTime = 0;
        groundSound.play().catch(e => console.error("Ground sound error:", e));
    }
}



function handleKeyDown(event) {
    keys[event.key] = true;

    if (event.key === ' ' && gameRunning) {
        const x = player.x + player.width / 2 - 2;
        const y = player.y - 15;
        bullets.push(new Bullet(x, y));
        event.preventDefault();
    }
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

function startGame() {
    gameOptions.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverScreen.style.display = 'none';

    score = 0;
    remainingTime = INITIAL_TIME;
    bullets = [];
    invaders = [];
    invaderSpawnInterval = 1000;
    player = new Player();
    gameRunning = true;

    currentScoreElement.textContent = score;
    remainingTimeElement.textContent = remainingTime;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    timerId = setInterval(updateTimer, 1000);
    gameLoop(0);
}

startButton.addEventListener('click', startGame);

gameContainer.style.display = 'none';
gameOverScreen.style.display = 'none';