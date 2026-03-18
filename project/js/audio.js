export const AudioCue = {
  init() {
    this.audio = new Audio("./assets/sounds/all-submitted.mp3");
    this.hasPlayed = false;
  },

  playOnce() {
    if (!this.hasPlayed) {
      this.audio.currentTime = 0;
      this.audio.play();
      this.hasPlayed = true;
    }
  },

  reset() { this.hasPlayed = false; }
};