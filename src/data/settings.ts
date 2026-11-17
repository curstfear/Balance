import type { BalanceDB } from './db';
import { DEFAULT_SETTINGS, type Settings } from './schema';

export const INSTALL_HINT_PAUSE_MS = 14 * 24 * 60 * 60 * 1000;

export async function getSettings(db: BalanceDB): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('app')) };
}

export async function updateSettings(db: BalanceDB, changes: Partial<Omit<Settings, 'id'>>) {
  await db.transaction('rw', db.settings, async () => {
    await db.settings.put({ ...(await getSettings(db)), ...changes, id: 'app' });
  });
}

export interface Platform { ios: boolean; standalone: boolean }

export function detectPlatform(nav: Navigator = navigator, mm: (q: string) => { matches: boolean } = matchMedia): Platform {
  const ua = nav.userAgent;
  // iPadOS reports itself as a Mac; touch points give it away
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1);
  const standalone = (nav as Navigator & { standalone?: boolean }).standalone === true || mm('(display-mode: standalone)').matches;
  return { ios, standalone };
}

/** Safari may evict data of sites not used for a while; home-screen apps keep it. */
export function showInstallHint(p: Platform, hiddenUntil: number | undefined, now: number): boolean {
  return p.ios && !p.standalone && now >= (hiddenUntil ?? 0);
}
