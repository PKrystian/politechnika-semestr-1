class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.PLAYER.RADIUS;
    this.speed = Math.min(
      CONFIG.PLAYER.SPEED_MAX,
      Math.max(CONFIG.PLAYER.SPEED_MIN, 2.5),
    );
    this.health = CONFIG.PLAYER.HEALTH;
    this.maxHealth = CONFIG.PLAYER.HEALTH;
    this.invulnerableTime = 0;
    this.level = 1;
    this.experience = 0;
    this.experienceToNext = CONFIG.EXP_REQUIRED_BASE;

    this.bulletsPerShot = 1;
    this.attackSpeedMultiplier = 1;
    this.expPickupRadius = CONFIG.ORB_COLLECTION_DISTANCE;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.lastMoveX = 0;
    this.lastMoveY = 0;

    this.animator = new SpriteAnimator("Vampires3", 1);
  }

  update(keys, gameState) {
    let isMoving = false;
    let moveX = 0,
      moveY = 0;

    if (keys.ArrowLeft || keys.KeyA) {
      this.x -= this.speed;
      moveX = -1;
      isMoving = true;
    }
    if (keys.ArrowRight || keys.KeyD) {
      this.x += this.speed;
      moveX = 1;
      isMoving = true;
    }
    if (keys.ArrowUp || keys.KeyW) {
      this.y -= this.speed;
      moveY = -1;
      isMoving = true;
    }
    if (keys.ArrowDown || keys.KeyS) {
      this.y += this.speed;
      moveY = 1;
      isMoving = true;
    }

    const canvas = document.getElementById("gameCanvas");
    this.x = Math.max(
      this.radius,
      Math.min(canvas.width - this.radius, this.x),
    );
    this.y = Math.max(
      this.radius,
      Math.min(canvas.height - this.radius, this.y),
    );

    if (isMoving) {
      this.animator.setDirection(moveX, moveY);
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      if (this.hurtTimer === 0) {
        this.isHurt = false;
      }
    }

    if (this.isHurt && this.hurtTimer > 0) {
      this.animator.setAnimation("Hurt");
    } else if (isMoving) {
      const speed = Math.sqrt(moveX * moveX + moveY * moveY) * this.speed;
      if (speed > 3) {
        this.animator.setAnimation("Run");
      } else {
        this.animator.setAnimation("Walk");
      }
    } else {
      this.animator.setAnimation("Idle");
    }

    this.animator.update();

    if (this.invulnerableTime > 0) {
      this.invulnerableTime--;
    }

    const adjustedFireRate = CONFIG.FIRE_RATE / this.attackSpeedMultiplier;
    if (Date.now() - gameState.lastShotTime >= adjustedFireRate) {
      const closestEnemy = this.findClosestEnemy(gameState.enemies);
      if (closestEnemy) {
        this.shoot(closestEnemy, gameState);
        gameState.lastShotTime = Date.now();
      }
    }
  }

  findClosestEnemy(enemies) {
    let closestEnemy = null;
    let closestDistance = Infinity;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }

  shoot(target, gameState) {
    for (let i = 0; i < this.bulletsPerShot; i++) {
      const bullet = new Bullet(this.x, this.y, target, i, this.bulletsPerShot);
      gameState.bullets.push(bullet);
      gameState.stats.bulletsFired++;
    }

    if (window.game && window.game.soundManager) {
      window.game.soundManager.playShoot();
    }
  }

  takeDamage(damage, gameState) {
    if (this.invulnerableTime > 0) return false;

    this.health -= damage;
    this.invulnerableTime = 60;
    this.isHurt = true;
    this.hurtTimer = 15;

    gameState.stats.damageTaken += damage;

    if (window.game && window.game.soundManager) {
      window.game.soundManager.playHurt();
    }

    return this.health <= 0;
  }

  gainExperience(exp, gameState) {
    this.experience += exp;
    gameState.stats.totalExperience += exp;

    while (this.experience >= this.experienceToNext) {
      this.experience -= this.experienceToNext;
      this.level++;
      this.experienceToNext = Math.floor(
        CONFIG.EXP_REQUIRED_BASE * Math.pow(1.5, this.level - 1),
      );
      return true;
    }
    return false;
  }

  draw(ctx) {
    this.animator.draw(
      ctx,
      this.x - CONFIG.PLAYER.SPRITE_SIZE / 2,
      this.y - CONFIG.PLAYER.SPRITE_SIZE / 2,
      CONFIG.PLAYER.SPRITE_SIZE,
      CONFIG.PLAYER.SPRITE_SIZE,
    );

    ctx.fillStyle = "red";
    ctx.fillRect(this.x - 25, this.y - 40, 50, 5);
    ctx.fillStyle = "green";
    ctx.fillRect(
      this.x - 25,
      this.y - 40,
      (this.health / this.maxHealth) * 50,
      5,
    );
  }
}
