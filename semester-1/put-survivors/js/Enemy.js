class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;

    const config = CONFIG.ENEMY[type];
    this.radius = config.RADIUS;
    this.speed = config.SPEED;
    this.damage = config.DAMAGE;
    this.expValue = config.EXP;

    if (config.HEALTH) {
      this.health = config.HEALTH;
      this.maxHealth = config.HEALTH;
    }

    this.color =
      type === "BASIC" ? "green" : type === "RANGED" ? "purple" : "orange";

    this.isHurt = false;
    this.hurtTimer = 0;
    this.isDead = false;
    this.deathTimer = 0;

    const spriteType =
      type === "BASIC" ? "Slime1" : type === "RANGED" ? "Slime2" : "Slime3";
    const scale = type === "TANK" ? 1.33 : 1.07;
    this.animator = new SpriteAnimator(spriteType, scale);
  }

  update(player, enemies, gameState) {
    if (this.isDead) {
      this.updateDeath(gameState);
      return;
    }

    this.updateMovement(player, enemies);
    this.updateTimers();
    this.updateAnimation();
    this.animator.update();
  }

  updateMovement(player, enemies) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const newX = this.x + (dx / distance) * this.speed;
    const newY = this.y + (dy / distance) * this.speed;

    const canMove = !enemies.some((enemy) => {
      if (enemy === this || enemy.isDead) return false;
      const distanceToOther = Math.sqrt(
        (newX - enemy.x) ** 2 + (newY - enemy.y) ** 2,
      );
      return distanceToOther < this.radius + enemy.radius;
    });

    if (canMove) {
      this.animator.setDirection(dx / distance, dy / distance);
      this.x = newX;
      this.y = newY;
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
  }

  updateTimers() {
    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      if (this.hurtTimer === 0) {
        this.isHurt = false;
      }
    }
  }

  updateAnimation() {
    if (this.isHurt && this.hurtTimer > 0) {
      this.animator.setAnimation("Hurt");
    } else if (this.isMoving) {
      if (this.speed > 1.8) {
        this.animator.setAnimation("Run");
      } else {
        this.animator.setAnimation("Walk");
      }
    } else {
      this.animator.setAnimation("Idle");
    }
  }

  updateDeath(gameState) {
    this.deathTimer--;
    if (this.deathTimer <= 0) {
      gameState.stats.enemiesKilled++;
      this.spawnExpOrb(gameState);
      return true;
    }
    this.animator.setAnimation("Death");
    this.animator.update();
    return false;
  }

  takeDamage(gameState) {
    this.isHurt = true;
    this.hurtTimer = 10;

    if (this.health) {
      this.health -= 1;
      if (this.health <= 0) {
        this.die();
      }
    } else {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.deathTimer = 60;

    if (window.game && window.game.soundManager) {
      window.game.soundManager.playEnemyDeath();
    }
  }

  spawnExpOrb(gameState) {
    const orb = new ExpOrb(this.x, this.y, this.expValue);
    gameState.expOrbs.push(orb);
  }

  checkCollisionWithPlayer(player, gameState) {
    if (this.isDead) return false;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.radius * 0.8 + this.radius * 0.8) {
      return player.takeDamage(this.damage, gameState);
    }
    return false;
  }

  checkCollisionWithBullet(bullet) {
    if (this.isDead) return false;

    const distance = Math.sqrt(
      (bullet.x - this.x) ** 2 + (bullet.y - this.y) ** 2,
    );
    return distance < this.radius * 0.9 + 3;
  }

  draw(ctx) {
    const spriteSize = this.radius * 4;
    this.animator.draw(
      ctx,
      this.x - spriteSize / 2,
      this.y - spriteSize / 2,
      spriteSize,
      spriteSize,
    );

    if (this.health && !this.isDead) {
      const healthBarWidth = this.radius * 2;
      const healthBarY = this.y - this.radius - 10;

      ctx.fillStyle = "red";
      ctx.fillRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth, 4);
      ctx.fillStyle = "green";
      ctx.fillRect(
        this.x - healthBarWidth / 2,
        healthBarY,
        (this.health / this.maxHealth) * healthBarWidth,
        4,
      );
    }
  }

  static spawn(canvas) {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0:
        x = Math.random() * canvas.width;
        y = 0;
        break;
      case 1:
        x = canvas.width;
        y = Math.random() * canvas.height;
        break;
      case 2:
        x = Math.random() * canvas.width;
        y = canvas.height;
        break;
      case 3:
        x = 0;
        y = Math.random() * canvas.height;
        break;
    }

    const rand = Math.random();
    let type;
    if (rand < 0.4) {
      type = "BASIC";
    } else if (rand < 0.7) {
      type = "RANGED";
    } else {
      type = "TANK";
    }

    return new Enemy(x, y, type);
  }
}
