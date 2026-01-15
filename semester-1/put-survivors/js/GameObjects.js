class Bullet {
  constructor(x, y, target, bulletIndex = 0, totalBullets = 1) {
    this.x = x;
    this.y = y;

    const dx = target.x - x;
    const dy = target.y - y;
    const baseAngle = Math.atan2(dy, dx);
    const spreadAngle = (bulletIndex - (totalBullets - 1) / 2) * 0.2;
    const finalAngle = baseAngle + spreadAngle;

    this.dx = Math.cos(finalAngle) * CONFIG.BULLET_SPEED;
    this.dy = Math.sin(finalAngle) * CONFIG.BULLET_SPEED;
    this.radius = 5;
  }

  update(canvas) {
    this.x += this.dx;
    this.y += this.dy;

    return (
      this.x < 0 ||
      this.x > canvas.width ||
      this.y < 0 ||
      this.y > canvas.height
    );
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  }
}

class ExpOrb {
  constructor(x, y, expValue) {
    this.x = x;
    this.y = y;
    this.expValue = expValue;
    this.radius = 8;
    this.movingToPlayer = false;
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= player.expPickupRadius && !this.movingToPlayer) {
      this.movingToPlayer = true;
    }

    if (this.movingToPlayer) {
      const speed = 5;
      this.x += (dx / distance) * speed;
      this.y += (dy / distance) * speed;
    }

    return distance <= player.radius + this.radius;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.movingToPlayer ? "lightblue" : "cyan";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
