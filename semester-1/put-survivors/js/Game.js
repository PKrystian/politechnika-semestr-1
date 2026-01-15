class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ui = new UIManager();
    this.soundManager = new SoundManager();
    this.keys = {};
    this.gameStarted = false;

    this.gameState = this.createInitialGameState();

    this.setupEventListeners();
    this.setupCanvas();
    this.showStartModal();

    window.selectReward = (index) =>
      this.ui.selectReward(index, this.gameState.player, this.gameState);
    window.restartGame = () => this.restart();
    window.startGame = () => this.handleStartGame();
    window.toggleMusic = () => this.toggleMusic();
    window.toggleSounds = () => this.toggleSounds();
  }

  createInitialGameState() {
    const canvas = this.canvas;
    const player = new Player(canvas.width / 2, canvas.height / 2);

    return {
      player: player,
      bullets: [],
      enemies: [],
      expOrbs: [],
      enemySpawnCounter: 0,
      startTime: Date.now(),
      gameOver: false,
      lastShotTime: 0,
      stats: {
        enemiesKilled: 0,
        bulletsFired: 0,
        damageTaken: 0,
        totalExperience: 0,
        rewardsChosen: 0,
        maxHealthReached: CONFIG.PLAYER.HEALTH,
        maxBulletsPerShot: 1,
      },
    };
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    document.addEventListener("keyup", (e) => (this.keys[e.code] = false));
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  setupCanvas() {
    this.resizeCanvas();
  }

  resizeCanvas() {
    const availableWidth = window.innerWidth - 500;
    const availableHeight = window.innerHeight - 40;
    const size = Math.min(availableWidth * 0.95, availableHeight * 0.95);
    this.canvas.width = size;
    this.canvas.height = size;

    if (this.gameState.player && !this.gameState.gameOver) {
      this.gameState.player.x = this.canvas.width / 2;
      this.gameState.player.y = this.canvas.height / 2;
    }
  }

  showStartModal() {
    const startModal = document.getElementById("startModal");
    startModal.style.display = "flex";
  }

  hideStartModal() {
    const startModal = document.getElementById("startModal");
    startModal.style.display = "none";
  }

  handleStartGame() {
    this.hideStartModal();
    this.gameStarted = true;
    this.soundManager.startBackgroundMusic();
    this.start();
  }

  start() {
    if (this.gameStarted) {
      this.gameLoop();
    }
  }

  restart() {
    this.ui.hideGameOverModal();
    this.soundManager.stopBackgroundMusic();
    this.gameState = this.createInitialGameState();
    this.gameStarted = false;
    this.showStartModal();
  }

  gameLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ui.updatePlayerStats(this.gameState.player);

    if (!this.ui.levelUpPending) {
      this.updateGame();
    }

    if (!this.gameState.gameOver) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  updateGame() {
    this.gameState.player.update(this.keys, this.gameState);

    this.updateBullets();

    this.updateEnemies();

    this.updateExpOrbs();

    this.gameState.enemySpawnCounter++;
    if (this.gameState.enemySpawnCounter >= CONFIG.ENEMY_SPAWN_RATE) {
      this.spawnEnemy();
      this.gameState.enemySpawnCounter = 0;
    }

    this.draw();
  }

  updateBullets() {
    for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = this.gameState.bullets[i];

      if (bullet.update(this.canvas)) {
        this.gameState.bullets.splice(i, 1);
        continue;
      }

      for (let j = this.gameState.enemies.length - 1; j >= 0; j--) {
        const enemy = this.gameState.enemies[j];
        if (enemy.checkCollisionWithBullet(bullet)) {
          enemy.takeDamage(this.gameState);
          this.gameState.bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  updateEnemies() {
    for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = this.gameState.enemies[i];

      enemy.update(
        this.gameState.player,
        this.gameState.enemies,
        this.gameState,
      );

      if (enemy.isDead && enemy.updateDeath(this.gameState)) {
        this.gameState.enemies.splice(i, 1);
        continue;
      }

      if (
        enemy.checkCollisionWithPlayer(this.gameState.player, this.gameState)
      ) {
        this.endGame("GAME OVER");
        return;
      }
    }
  }

  updateExpOrbs() {
    for (let i = this.gameState.expOrbs.length - 1; i >= 0; i--) {
      const orb = this.gameState.expOrbs[i];

      if (orb.update(this.gameState.player)) {
        this.soundManager.playPickup();
        if (
          this.gameState.player.gainExperience(orb.expValue, this.gameState)
        ) {
          this.soundManager.playLevelUp();
          this.ui.triggerLevelUp();
        }
        this.gameState.expOrbs.splice(i, 1);
      }
    }
  }

  spawnEnemy() {
    const enemy = Enemy.spawn(this.canvas);

    const canSpawn = !this.gameState.enemies.some((existingEnemy) => {
      const distance = Math.sqrt(
        (enemy.x - existingEnemy.x) ** 2 + (enemy.y - existingEnemy.y) ** 2,
      );
      return distance < enemy.radius + existingEnemy.radius;
    });

    if (canSpawn) {
      this.gameState.enemies.push(enemy);
    }
  }

  draw() {
    this.gameState.player.draw(this.ctx);

    this.gameState.bullets.forEach((bullet) => bullet.draw(this.ctx));

    this.gameState.enemies.forEach((enemy) => enemy.draw(this.ctx));

    this.gameState.expOrbs.forEach((orb) => orb.draw(this.ctx));
  }

  toggleMusic() {
    const isEnabled = this.soundManager.toggleMusic();
    const musicButton = document.getElementById("musicMuteButton");
    if (musicButton) {
      musicButton.textContent = isEnabled ? "Music: ON" : "Music: OFF";
    }
  }

  toggleSounds() {
    const isEnabled = this.soundManager.toggleSound();
    const soundButton = document.getElementById("soundMuteButton");
    if (soundButton) {
      soundButton.textContent = isEnabled ? "SFX: ON" : "SFX: OFF";
    }
  }

  endGame(message) {
    this.gameState.gameOver = true;
    this.soundManager.stopBackgroundMusic();
    this.soundManager.playPlayerDeath();
    setTimeout(() => {
      this.ui.showGameOverModal(message, this.gameState, this.gameState.player);
    }, 100);
  }
}
