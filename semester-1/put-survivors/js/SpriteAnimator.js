class SpriteAnimator {
  constructor(spriteType, scale = 1) {
    this.spriteType = spriteType; // 'Vampires3', 'Slime1', 'Slime2', 'Slime3'
    this.scale = scale;
    this.currentAnimation = "Idle";
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.sprites = {};
    this.direction = 0; // 0=front, 1=back, 2=left, 3=right
    this.animationStates = {
      Idle: { frames: 12, loop: true, speed: 20 },
      Walk: { frames: 12, loop: true, speed: 12 },
      Run: { frames: 12, loop: true, speed: 8 },
      Attack: { frames: 12, loop: false, speed: 4 },
      Hurt: { frames: 12, loop: false, speed: 8 },
      Death: { frames: 12, loop: false, speed: 12 },
    };

    this.frameWidth = 64;
    this.frameHeight = 64;
    this.sheetColumns = 12;
    this.sheetRows = 4;

    this.loadSprites();
  }

  loadSprites() {
    const animations = ["Attack", "Death", "Hurt", "Idle", "Run", "Walk"];
    animations.forEach((animation) => {
      this.sprites[animation] = {};

      const img = new Image();
      img.src = `sprites/${this.spriteType}/${animation}/${this.spriteType}_${animation}_full.png`;
      this.sprites[animation].sheet = img;

      const shadowImg = new Image();
      shadowImg.src = `sprites/${this.spriteType}/${animation}/${this.spriteType}_${animation}_shadow.png`;
      this.sprites[animation].shadow = shadowImg;

      if (this.spriteType === "Vampires3" && animation === "Attack") {
        const magicImg = new Image();
        magicImg.src = `sprites/${this.spriteType}/${animation}/${this.spriteType}_${animation}_magic.png`;
        this.sprites[animation].magic = magicImg;
      }
    });
  }

  setAnimation(animationName) {
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
  }

  setDirection(moveX, moveY) {
    if (Math.abs(moveX) > Math.abs(moveY)) {
      this.direction = moveX > 0 ? 3 : 2; // right : left
    } else if (moveY !== 0) {
      this.direction = moveY > 0 ? 0 : 1; // front : back
    }
  }

  update() {
    const animState = this.animationStates[this.currentAnimation];
    if (!animState) return;

    this.frameTimer++;
    if (this.frameTimer >= animState.speed) {
      this.frameTimer = 0;

      if (animState.loop) {
        this.currentFrame = (this.currentFrame + 1) % animState.frames;
      } else if (this.currentFrame < animState.frames - 1) {
        this.currentFrame++;
      }
    }
  }

  draw(ctx, x, y, width = 64, height = 64) {
    const sprite = this.sprites[this.currentAnimation];
    if (!sprite || !sprite.sheet || !sprite.sheet.complete) {
      return;
    }

    const sheet = sprite.sheet;
    if (sheet.naturalWidth === 0 || sheet.naturalHeight === 0) {
      return;
    }

    ctx.save();

    const maxFrame = this.animationStates[this.currentAnimation].frames - 1;
    let safeFrame = Math.max(0, Math.min(this.currentFrame, maxFrame));

    const sourceX = safeFrame * this.frameWidth;
    const sourceY = this.direction * this.frameHeight;

    if (sourceX + this.frameWidth > sheet.naturalWidth) {
      safeFrame = 0;
    }

    if (sourceY + this.frameHeight > sheet.naturalHeight) {
      this.direction = 0;
    }

    const finalSourceX = safeFrame * this.frameWidth;
    const finalSourceY = this.direction * this.frameHeight;

    if (sprite.shadow && sprite.shadow.complete) {
      ctx.globalAlpha = 0.3;
      try {
        ctx.drawImage(
          sprite.shadow,
          finalSourceX,
          finalSourceY,
          this.frameWidth,
          this.frameHeight,
          x,
          y + height * 0.8,
          width * this.scale,
          height * 0.2 * this.scale,
        );
      } catch (e) {}
      ctx.globalAlpha = 1;
    }

    try {
      ctx.drawImage(
        sheet,
        finalSourceX,
        finalSourceY,
        this.frameWidth,
        this.frameHeight,
        x,
        y,
        width * this.scale,
        height * this.scale,
      );
    } catch (e) {}

    if (
      this.spriteType === "Vampires3" &&
      this.currentAnimation === "Attack" &&
      sprite.magic &&
      sprite.magic.complete
    ) {
      ctx.globalAlpha = 0.8;
      try {
        ctx.drawImage(
          sprite.magic,
          finalSourceX,
          finalSourceY,
          this.frameWidth,
          this.frameHeight,
          x,
          y,
          width * this.scale,
          height * this.scale,
        );
      } catch (e) {}
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
