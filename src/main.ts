import './styles/tokens.css';
import './styles/app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import Home from './ui/screens/Home.svelte';
import { setRoot } from './ui/nav.svelte';
import { setupPwa } from './pwa';

setRoot(Home, {});
mount(App, { target: document.getElementById('root')! });
setupPwa();
