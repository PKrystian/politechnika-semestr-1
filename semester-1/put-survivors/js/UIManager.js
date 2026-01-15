class UIManager {
  constructor() {
    this.levelUpPending = false;
    this.currentRewardOptions = [];
  }

  updatePlayerStats(player) {
    const levelElement = document.getElementById("playerLevel");
    if (levelElement) {
      levelElement.textContent = player.level;
    }

    const expCurrentElement = document.getElementById("expCurrent");
    const expRequiredElement = document.getElementById("expRequired");
    const expBarFillElement = document.getElementById("expBarFill");

    if (expCurrentElement) {
      expCurrentElement.textContent = player.experience;
    }
    if (expRequiredElement) {
      expRequiredElement.textContent = player.experienceToNext;
    }
    if (expBarFillElement) {
      const expPercentage = (player.experience / player.experienceToNext) * 100;
      expBarFillElement.style.width = `${expPercentage}%`;
    }

    const healthCurrentElement = document.getElementById("healthCurrent");
    const healthMaxElement = document.getElementById("healthMax");
    const healthBarFillElement = document.getElementById("healthBarFill");

    if (healthCurrentElement) {
      healthCurrentElement.textContent = player.health;
    }
    if (healthMaxElement) {
      healthMaxElement.textContent = player.maxHealth;
    }
    if (healthBarFillElement) {
      const healthPercentage = (player.health / player.maxHealth) * 100;
      healthBarFillElement.style.width = `${healthPercentage}%`;
    }
  }

  triggerLevelUp() {
    this.levelUpPending = true;
    this.currentRewardOptions = this.getRandomRewards(3);
    this.showLevelUpModal();
    return true;
  }

  getRandomRewards(count) {
    const shuffled = [...REWARD_TYPES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  showLevelUpModal() {
    const modal = document.getElementById("levelUpModal");

    for (let i = 0; i < 3; i++) {
      const reward = this.currentRewardOptions[i];
      if (reward) {
        document.getElementById(`cardIcon${i + 1}`).textContent = reward.icon;
        document.getElementById(`cardTitle${i + 1}`).textContent = reward.name;
        document.getElementById(`cardDescription${i + 1}`).textContent =
          reward.description;
      }
    }

    modal.style.display = "flex";
  }

  selectReward(index, player, gameState) {
    const selectedReward = this.currentRewardOptions[index];
    if (selectedReward) {
      selectedReward.apply(player);

      gameState.stats.rewardsChosen++;

      gameState.stats.maxHealthReached = Math.max(
        gameState.stats.maxHealthReached,
        player.maxHealth,
      );
      gameState.stats.maxBulletsPerShot = Math.max(
        gameState.stats.maxBulletsPerShot,
        player.bulletsPerShot,
      );

      document.getElementById("levelUpModal").style.display = "none";
      this.levelUpPending = false;
      this.currentRewardOptions = [];
    }
  }

  calculateFinalScore(gameState, player) {
    const stats = gameState.stats;
    const currentTime = Date.now();
    const survivedSeconds = Math.floor(
      (currentTime - gameState.startTime) / 1000,
    );

    let score = 0;

    score += stats.totalExperience * 10;

    score += stats.enemiesKilled * 50;

    score += survivedSeconds * 1;

    score += (player.level - 1) * 100;

    if (stats.bulletsFired > 0) {
      const accuracy = stats.enemiesKilled / stats.bulletsFired;
      score += Math.floor(accuracy * 1000);
    }

    const maxPossibleDamage = Math.max(1000, stats.damageTaken + player.health);
    const healthBonus = Math.floor((player.health / maxPossibleDamage) * 500);
    score += healthBonus;

    return Math.floor(score);
  }

  showGameOverModal(message, gameState, player) {
    const modal = document.getElementById("gameOverModal");
    const stats = gameState.stats;
    const currentTime = Date.now();
    const survivedTime = Math.floor((currentTime - gameState.startTime) / 1000);
    const minutes = Math.floor(survivedTime / 60);
    const seconds = survivedTime % 60;

    document.getElementById("gameOverTitle").textContent = message;

    const finalScore = this.calculateFinalScore(gameState, player);
    document.getElementById("finalScore").textContent =
      finalScore.toLocaleString();

    document.getElementById("enemiesKilled").textContent = stats.enemiesKilled;
    document.getElementById("bulletsFired").textContent = stats.bulletsFired;
    document.getElementById("damageTaken").textContent = stats.damageTaken;
    document.getElementById("finalLevel").textContent = player.level;
    document.getElementById("totalExp").textContent = stats.totalExperience;
    document.getElementById("rewardsChosen").textContent = stats.rewardsChosen;
    document.getElementById("timeSurvived").textContent =
      `${minutes}:${seconds.toString().padStart(2, "0")}`;
    document.getElementById("maxHealthReached").textContent =
      stats.maxHealthReached;
    document.getElementById("maxBullets").textContent = stats.maxBulletsPerShot;

    modal.style.display = "flex";
  }

  hideGameOverModal() {
    document.getElementById("gameOverModal").style.display = "none";
  }
}
