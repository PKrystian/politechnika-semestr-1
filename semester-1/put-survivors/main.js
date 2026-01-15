// Create the canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Make canvas responsive to viewport size
function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.95);
    canvas.width = size;
    canvas.height = size;
}

// Initial canvas setup
resizeCanvas();
document.body.appendChild(canvas);

// Resize canvas when window is resized
window.addEventListener('resize', () => {
    resizeCanvas();
    // Reposition player to center if game is active
    if (gameState.player && !gameState.gameOver) {
        gameState.player.x = canvas.width / 2;
        gameState.player.y = canvas.height / 2;
    }
});

// Game state
let gameState = {
    player: null,
    bullets: [],
    enemies: [],
    expOrbs: [],
    enemySpawnCounter: 0,
    startTime: 0,
    gameOver: false,
    lastShotTime: 0
};

// Constants
const bulletSpeed = 10;
const enemyBulletSpeed = 6;
const enemySpawnRate = 35;
const gameDuration = 5 * 60; // 5 minutes in seconds
const fireRate = 500; // Minimum time between shots in milliseconds
const orbCollectionDistance = 150; // Distance at which orbs start moving to player
const expRequiredBase = 100; // Base experience required for level 2

// Initialize game
function initGame() {
    gameState = {
        player: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 20,
            speed: Math.max(3, canvas.width * 0.004), // Scale speed with canvas size
            health: 100,
            invulnerableTime: 0,
            level: 1,
            experience: 0,
            experienceToNext: expRequiredBase
        },
        bullets: [],
        enemies: [],
        expOrbs: [],
        enemySpawnCounter: 0,
        startTime: Date.now(),
        gameOver: false,
        lastShotTime: 0
    };
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update timer
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - gameState.startTime) / 1000);
    const remainingTime = Math.max(0, gameDuration - elapsedTime);

    // Draw timer
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')}`, canvas.width / 2, 30);

    // Draw level and experience bar
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${gameState.player.level}`, 20, canvas.height - 40);

    // Experience bar background
    ctx.fillStyle = 'gray';
    ctx.fillRect(20, canvas.height - 25, 300, 15);

    // Experience bar fill
    const expPercentage = gameState.player.experience / gameState.player.experienceToNext;
    ctx.fillStyle = 'gold';
    ctx.fillRect(20, canvas.height - 25, 300 * expPercentage, 15);

    // Experience text
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`${gameState.player.experience} / ${gameState.player.experienceToNext} EXP`, 170, canvas.height - 14);

    // Check for win condition
    if (remainingTime <= 0 && !gameState.gameOver) {
        endGame('You Win!');
        return;
    }

    updatePlayer();
    updateBullets();
    updateEnemies();
    updateExpOrbs();

    // Spawn enemies
    gameState.enemySpawnCounter++;
    if (gameState.enemySpawnCounter >= enemySpawnRate) {
        spawnEnemy();
        gameState.enemySpawnCounter = 0;
    }

    if (!gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function updatePlayer() {
    const player = gameState.player;

    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;

    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.invulnerableTime > 0 ? 'rgba(0, 0, 255, 0.5)' : 'blue';
    ctx.fill();

    // Draw player health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x - 25, player.y - 40, 50, 5);
    ctx.fillStyle = 'green';
    ctx.fillRect(player.x - 25, player.y - 40, player.health / 2, 5);

    // Update invulnerability timer
    if (player.invulnerableTime > 0) {
        player.invulnerableTime--;
    }

    // Auto-attack
    if (Date.now() - gameState.lastShotTime >= fireRate) {
        const closestEnemy = findClosestEnemy();
        if (closestEnemy) {
            shootBullet(closestEnemy);
            gameState.lastShotTime = Date.now();
        }
    }
}

function updateBullets() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove bullets that are out of bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            gameState.bullets.splice(i, 1);
            continue;
        }

        // Draw bullet
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = bullet.isEnemy ? 'yellow' : 'red';
        ctx.fill();
    }
}

function updateEnemies() {
    const player = gameState.player;

    for (let i = 0; i < gameState.enemies.length; i++) {
        const enemy = gameState.enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate new position
        let newX = enemy.x + (dx / distance) * enemy.speed;
        let newY = enemy.y + (dy / distance) * enemy.speed;

        // Check for collision with other enemies
        let canMove = true;
        for (let j = 0; j < gameState.enemies.length; j++) {
            if (i !== j) {
                const otherEnemy = gameState.enemies[j];
                const distanceToOther = Math.sqrt((newX - otherEnemy.x) ** 2 + (newY - otherEnemy.y) ** 2);
                if (distanceToOther < enemy.radius + otherEnemy.radius) {
                    canMove = false;
                    break;
                }
            }
        }

        // Move enemy if no collision
        if (canMove) {
            enemy.x = newX;
            enemy.y = newY;
        }

        if (enemy.canShoot) {
            enemy.shootCounter++;
            if (enemy.shootCounter >= enemy.shootRate) {
                enemyShoot(enemy);
                enemy.shootCounter = 0;
            }
        }

        // Check for collision with player bullets
        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const bullet = gameState.bullets[j];
            if (!bullet.isEnemy) {
                const bulletDistance = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
                if (bulletDistance < enemy.radius + 5) {
                    let enemyKilled = false;
                    if (enemy.health) {
                        enemy.health -= 1;
                        if (enemy.health <= 0) {
                            enemyKilled = true;
                        }
                    } else {
                        enemyKilled = true;
                    }

                    if (enemyKilled) {
                        // Drop experience orb based on enemy type
                        let expValue = 20; // Default exp for basic enemy
                        if (enemy.color === 'purple') expValue = 30; // Shooting enemy
                        else if (enemy.color === 'orange') expValue = 50; // Tank enemy

                        spawnExpOrb(enemy.x, enemy.y, expValue);
                        gameState.enemies.splice(i, 1);
                        i--; // Adjust index after removing enemy
                    }
                    gameState.bullets.splice(j, 1);
                    break;
                }
            }
        }

        // Check for collision with player
        if (distance < player.radius + enemy.radius && player.invulnerableTime <= 0) {
            player.health -= enemy.damage;
            player.invulnerableTime = 60; // 1 second of invulnerability (assuming 60 FPS)
            if (player.health <= 0) {
                endGame('Game Over!');
                return;
            }
        }

        // Draw enemy
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();

        // Draw health bar for enemies with health
        if (enemy.health) {
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x - 20, enemy.y - 30, 40, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(enemy.x - 20, enemy.y - 30, (enemy.health / enemy.maxHealth) * 40, 5);
        }
    }

    // Check for player collision with enemy bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        if (bullet.isEnemy) {
            const bulletDistance = Math.sqrt((bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2);
            if (bulletDistance < player.radius + 5 && player.invulnerableTime <= 0) {
                player.health -= 10;
                player.invulnerableTime = 60; // 1 second of invulnerability (assuming 60 FPS)
                gameState.bullets.splice(i, 1);
                if (player.health <= 0) {
                    endGame('Game Over!');
                    return;
                }
            }
        }
    }
}

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = 0;
            break;
        case 1: // Right
            x = canvas.width;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height;
            break;
        case 3: // Left
            x = 0;
            y = Math.random() * canvas.height;
            break;
    }

    const enemyType = Math.random();
    let enemy;

    if (enemyType < 0.4) { // 40% chance for basic enemy
        enemy = {
            x, y,
            radius: 15,
            speed: 2,
            canShoot: false,
            color: 'green',
            damage: 25
        };
    } else if (enemyType < 0.7) { // 30% chance for shooting enemy
        enemy = {
            x, y,
            radius: 15,
            speed: 1.5,
            canShoot: true,
            shootRate: 120,
            shootCounter: 0,
            color: 'purple',
            damage: 20
        };
    } else { // 30% chance for tank enemy
        enemy = {
            x, y,
            radius: 25,
            speed: 1,
            canShoot: false,
            health: 5,
            maxHealth: 5,
            color: 'orange',
            damage: 40
        };
    }

    // Check if the new enemy overlaps with existing enemies
    const canSpawn = !gameState.enemies.some(existingEnemy => {
        const distance = Math.sqrt((x - existingEnemy.x) ** 2 + (y - existingEnemy.y) ** 2);
        return distance < enemy.radius + existingEnemy.radius;
    });

    if (canSpawn) {
        gameState.enemies.push(enemy);
    }
}


function enemyShoot(enemy) {
    const player = gameState.player;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    gameState.bullets.push({
        x: enemy.x,
        y: enemy.y,
        dx: (dx / distance) * enemyBulletSpeed,
        dy: (dy / distance) * enemyBulletSpeed,
        isEnemy: true
    });
}


function findClosestEnemy() {
    let closestEnemy = null;
    let closestDistance = Infinity;
    const player = gameState.player;

    for (const enemy of gameState.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    }

    return closestEnemy;
}

function shootBullet(target) {
    const player = gameState.player;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    gameState.bullets.push({
        x: player.x,
        y: player.y,
        dx: (dx / distance) * bulletSpeed,
        dy: (dy / distance) * bulletSpeed,
        isEnemy: false
    });
}

function spawnExpOrb(x, y, expValue) {
    gameState.expOrbs.push({
        x: x,
        y: y,
        expValue: expValue,
        radius: 8,
        collected: false,
        movingToPlayer: false
    });
}

function updateExpOrbs() {
    const player = gameState.player;

    for (let i = gameState.expOrbs.length - 1; i >= 0; i--) {
        const orb = gameState.expOrbs[i];

        // Calculate distance to player
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if orb should start moving to player
        if (distance <= orbCollectionDistance && !orb.movingToPlayer) {
            orb.movingToPlayer = true;
        }

        // Move orb to player if it's being collected
        if (orb.movingToPlayer) {
            const speed = 5;
            orb.x += (dx / distance) * speed;
            orb.y += (dy / distance) * speed;
        }

        // Check for collection
        if (distance <= player.radius + orb.radius) {
            // Give experience to player
            gameState.player.experience += orb.expValue;

            // Check for level up
            while (gameState.player.experience >= gameState.player.experienceToNext) {
                gameState.player.experience -= gameState.player.experienceToNext;
                gameState.player.level++;
                // Each level requires more experience (exponential growth)
                gameState.player.experienceToNext = Math.floor(expRequiredBase * Math.pow(1.5, gameState.player.level - 1));
            }

            // Remove orb
            gameState.expOrbs.splice(i, 1);
            continue;
        }

        // Draw orb
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = orb.movingToPlayer ? 'lightblue' : 'cyan';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function endGame(message) {
    gameState.gameOver = true;
    setTimeout(() => {
        alert(message);
        initGame();
        gameLoop();
    }, 100);
}

// Keyboard input
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// Start the game
initGame();
gameLoop();