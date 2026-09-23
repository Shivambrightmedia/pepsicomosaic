export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mosaic_channel') : null;
    this.onBroadcastListener = null;

    if (this.channel) {
      this.channel.onmessage = (e) => {
        if (this.onBroadcastListener) this.onBroadcastListener(e.data);
      };
    }

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    const raw = (window.location.hash || '').replace('#', '');
    if (!raw || raw === '/') {
      window.location.hash = window.innerWidth > window.innerHeight ? '#/horizontal' : '#/start';
    }
    // Always call handleRoute() on initialization!
    this.handleRoute();
  }

  handleRoute() {
    const raw = (window.location.hash || '').replace('#', '') || '/start';
    const clean = raw.split('?')[0];
    const handler = this.routes[clean] || this.routes['/start'] || this.routes['/horizontal'] || this.routes['/vertical'];
    if (handler) {
      handler();
    }
  }

  navigate(path) {
    if (window.location.hash === `#${path}`) {
      this.handleRoute();
    } else {
      window.location.hash = `#${path}`;
    }
  }

  broadcast(msg) {
    if (this.channel) this.channel.postMessage(msg);
  }

  onBroadcast(fn) {
    this.onBroadcastListener = fn;
  }
}
