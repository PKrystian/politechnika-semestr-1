const CONFIG = {
  BULLET_SPEED: 10,
  ENEMY_SPAWN_RATE: 35,
  FIRE_RATE: 500,
  ORB_COLLECTION_DISTANCE: 150,
  EXP_REQUIRED_BASE: 100,

  PLAYER: {
    RADIUS: 64,
    HEALTH: 100,
    SPRITE_SIZE: 128,
    SPEED_MIN: 2,
    SPEED_MAX: 3,
  },

  ENEMY: {
    BASIC: { RADIUS: 10, SPEED: 2, DAMAGE: 25, EXP: 20 },
    RANGED: { RADIUS: 10, SPEED: 1.5, DAMAGE: 20, EXP: 30 },
    TANK: { RADIUS: 17, SPEED: 1, DAMAGE: 40, EXP: 50, HEALTH: 5 },
  },
};

const REWARD_TYPES = [
  {
    id: "heal",
    name: "Heal",
    description: "Restore 50 HP",
    icon: "💚",
    apply: (player) => {
      player.health = Math.min(player.maxHealth, player.health + 50);
    },
  },
  {
    id: "moreBullets",
    name: "More Bullets",
    description: "+1 Bullet per attack",
    icon: "🔫",
    apply: (player) => {
      player.bulletsPerShot += 1;
    },
  },
  {
    id: "fasterAttack",
    name: "Faster Attack",
    description: "25% faster attack speed",
    icon: "⚡",
    apply: (player) => {
      player.attackSpeedMultiplier += 0.25;
    },
  },
  {
    id: "moreHealth",
    name: "More Health",
    description: "+25 Max HP and heal to full",
    icon: "❤️",
    apply: (player) => {
      player.maxHealth += 25;
      player.health = player.maxHealth;
    },
  },
  {
    id: "biggerPickup",
    name: "Bigger Pickup Area",
    description: "50% larger exp pickup range",
    icon: "🔍",
    apply: (player) => {
      player.expPickupRadius = Math.floor(player.expPickupRadius * 1.5);
    },
  },
  {
    id: "movementSpeed",
    name: "Movement Speed",
    description: "+0.5 movement speed",
    icon: "👟",
    apply: (player) => {
      player.speed += 0.5;
    },
  },
];
