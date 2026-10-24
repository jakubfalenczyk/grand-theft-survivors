import './theme/index.css';
import './ui/styles/layout.css';
import './ui/styles/game.css';
import { createApp } from './app/createApp.ts';

const root = document.getElementById('app');
if (!root) throw new Error('Application host is missing');
const app = createApp(root);
if (import.meta.hot) import.meta.hot.dispose(() => app.destroy());
