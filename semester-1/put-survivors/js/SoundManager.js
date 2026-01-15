class SoundManager {
  constructor() {
    this.sounds = {};
    this.backgroundMusic = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.volume = 1.0;
    this.musicVolume = 0.1;

    this.loadSounds();
  }

  loadSounds() {
    const soundFiles = {
      shoot: "sounds/shoot.wav",
      hurt: "sounds/hurt.wav",
      deathPlayer: "sounds/death-player.mp3",
      deathEnemy: "sounds/death-enemy.wav",
      pickup: "sounds/pickup.wav",
      levelUp: "sounds/level-up.wav",
    };

    for (const [key, path] of Object.entries(soundFiles)) {
      this.sounds[key] = new Audio(path);
      this.sounds[key].volume = this.volume;
      this.sounds[key].preload = "auto";
    }

    this.backgroundMusic = new Audio("sounds/soundtrack.mp3");
    this.backgroundMusic.volume = this.musicVolume;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.preload = "auto";
  }

  playSound(soundName) {
    if (!this.soundEnabled || !this.sounds[soundName]) {
      return;
    }

    try {
      const sound = this.sounds[soundName].cloneNode();
      sound.volume = this.volume;
      sound.play().catch((e) => {
        console.warn(`Could not play sound ${soundName}:`, e);
      });
    } catch (e) {
      console.warn(`Error playing sound ${soundName}:`, e);
    }
  }

  startBackgroundMusic() {
    if (!this.musicEnabled || !this.backgroundMusic) {
      return;
    }

    try {
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.play().catch((e) => {
        console.warn("Could not play background music:", e);
      });
    } catch (e) {
      console.warn("Error starting background music:", e);
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  resumeBackgroundMusic() {
    if (
      this.musicEnabled &&
      this.backgroundMusic &&
      this.backgroundMusic.paused
    ) {
      this.backgroundMusic.play().catch((e) => {
        console.warn("Could not resume background music:", e);
      });
    }
  }

  setSoundVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    for (const sound of Object.values(this.sounds)) {
      sound.volume = this.volume;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.resumeBackgroundMusic();
    } else {
      this.pauseBackgroundMusic();
    }
    return this.musicEnabled;
  }

  playShoot() {
    this.playSound("shoot");
  }

  playHurt() {
    this.playSound("hurt");
  }

  playPlayerDeath() {
    this.playSound("deathPlayer");
  }

  playEnemyDeath() {
    this.playSound("deathEnemy");
  }

  playPickup() {
    this.playSound("pickup");
  }

  playLevelUp() {
    this.playSound("levelUp");
  }
}
