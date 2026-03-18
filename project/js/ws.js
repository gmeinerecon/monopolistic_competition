/* WebSocket Manager */

export class WSManager {
  constructor({ onMessage, onOpen, onClose }) {
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.connect();
  }

  connect() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${protocol}://${location.host}`);

    this.ws.addEventListener("open", () => {
      if (this.onOpen) this.onOpen();
    });

    this.ws.addEventListener("close", () => {
      if (this.onClose) this.onClose();
      setTimeout(() => this.connect(), 1500);
    });

    this.ws.addEventListener("message", (ev) => {
      let msg = JSON.parse(ev.data);
      if (this.onMessage) this.onMessage(msg);
    });
  }

  send(type, payload = {}) {
    const data = JSON.stringify({ type, payload });
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(data);
  }
}