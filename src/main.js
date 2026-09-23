import './style.css';
import { Router } from './router.js';
import { createStartView } from './startView.js';
import { createVerticalView } from './verticalView.js';
import { createHorizontalView } from './horizontalView.js';

const app = document.getElementById('app');
let currentView = null;

function render(view) {
  if (currentView && typeof currentView.stop === 'function') {
    currentView.stop();
  }
  app.innerHTML = '';
  app.appendChild(view);
  currentView = view;
  if (typeof view.start === 'function') {
    view.start();
  }
}

const router = new Router({
  '/': () => render(window.innerWidth > window.innerHeight ? createHorizontalView(router) : createStartView(router)),
  '/start': () => render(createStartView(router)),
  '/vertical': () => render(createVerticalView(router)),
  '/horizontal': () => render(createHorizontalView(router))
});

router.init();
