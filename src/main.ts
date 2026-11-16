import './styles/tokens.css';
import './styles/app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import Home from './ui/screens/Home.svelte';
import { setRoot } from './ui/nav.svelte';

setRoot(Home, {});
mount(App, { target: document.getElementById('root')! });
