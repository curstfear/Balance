import './styles/tokens.css';
import './styles/app.css';
import { homeScreen } from './ui/home';
import { planScreen } from './ui/plan';
import { workoutScreen } from './ui/workout';
import { setRoot, push, pop, closeTo, haptic } from './ui/nav';

const app = document.getElementById('app')!;

// Launched from the iPhone home screen (not a Safari tab)
const standalone = (navigator as Navigator & { standalone?: boolean }).standalone || matchMedia('(display-mode: standalone)').matches;
document.documentElement.classList.toggle('standalone', standalone);

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
