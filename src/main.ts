import './styles/tokens.css';
import './styles/app.css';
import { homeScreen } from './ui/home';
import { planScreen } from './ui/plan';
import { workoutScreen } from './ui/workout';
import { setRoot, push, pop, closeTo, haptic } from './ui/nav';

const app = document.getElementById('app')!;

function openPlan() {
  haptic(15);
  push(planScreen({
    onBack: pop,
    onStart: (plan) => {
      const w = workoutScreen(plan, { onClose: () => closeTo(0) });
      push(w.el, 'modal', w.dispose);
    },
  }));
}

setRoot(app, homeScreen(openPlan));
