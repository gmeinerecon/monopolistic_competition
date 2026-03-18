/* Central State Store */

export const State = {
  round: 1,
  firms: [],
  choices: {},
  history: [],
  params: {},
  lastResults: null,

  isHost: false,
  myFirmId: null,
  myColor: "#FF7A32",

  watchers: [],

  subscribe(fn) { this.watchers.push(fn); },

  notify() { for (const fn of this.watchers) fn(this); },

  applyServerState(payload) {
    Object.assign(this, payload, { lastResults: null });
    this.notify();
  },

  applyServerResults(payload) {
    this.lastResults = payload.results;
    Object.assign(this, payload.state);
    this.notify();
  }
};