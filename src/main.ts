import './styles/tokens.css';
import './styles/app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import Home from './ui/screens/Home.svelte';
import Workout from './ui/screens/Workout.svelte';
import { nav, push, setRoot } from './ui/nav.svelte';
import { setupPwa } from './pwa';
import { openStorage } from './data/storage.svelte';
import { planFromWorkout } from './data/workouts';

setRoot(Home, {});
mount(App, { target: document.getElementById('root')! });
setupPwa();

// an unfinished workout reopens on the same set (the update path in pwa.ts never runs while it is open)
openStorage().then((launch) => {
  // only over a bare Home — if the person already moved on, the workout stays saved for the next launch
  if (launch.kind === 'resume' && nav.stack.length === 1) push(Workout, { plan: planFromWorkout(launch.data), restored: launch.data }, 'modal', true);
});
