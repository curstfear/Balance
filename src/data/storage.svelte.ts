// The app's single database connection and its reactive status for the UI.
// If IndexedDB cannot be opened the app keeps working in memory and Home explains what is lost.
import { BalanceDB, classifyError, type StorageProblem } from './db';
import { resolveOnLaunch, type Launch } from './workouts';
import { INSTALL_HINT_PAUSE_MS, detectPlatform, getSettings, showInstallHint, updateSettings } from './settings';

export const storage = $state({
  status: 'pending' as 'pending' | 'ok' | 'error',
  problem: null as StorageProblem | null,
  retrying: false,
  retryFailed: false,
  installHint: false,
  /** a workout left open too long was closed on this launch (its sets are kept) */
  autoClosed: false,
});

let db: BalanceDB | null = null;
let markReady: () => void;
/** Resolves once the first attempt to open the database has finished (either way). */
export const storageReady = new Promise<void>((r) => (markReady = r));
let queue: Promise<unknown> = Promise.resolve();

function fail(e: unknown) {
  db?.close();
  db = null;
  storage.status = 'error';
  storage.problem = classifyError(e);
  console.warn('[storage]', e); // warn, not error: the app keeps working
}

export async function openStorage(now = Date.now()): Promise<Launch> {
  let d: BalanceDB | undefined;
  try {
    d = new BalanceDB();
    // a newer version of the app opened the database in another tab
    const conn = d;
    d.on('versionchange', () => {
      conn.close();
      if (db === conn) { db = null; storage.status = 'error'; storage.problem = 'newer'; }
      return false;
    });
    // an older tab keeps the previous version open: the upgrade waits until it closes
    d.on('blocked', () => { storage.status = 'error'; storage.problem = 'blocked'; });
    await d.open();
    const settings = await getSettings(d);
    const launch = await resolveOnLaunch(d, now);
    db = d;
    storage.status = 'ok';
    storage.problem = null;
    storage.installHint = showInstallHint(detectPlatform(), settings.installHintHiddenUntil, now);
    if (launch.kind !== 'none' && launch.autoClosed) storage.autoClosed = true;
    // best effort: iOS grants it to home-screen apps; false is not an error
    navigator.storage?.persist?.().catch(() => {});
    return launch;
  } catch (e) {
    d?.close();
    fail(e);
    return { kind: 'none' };
  } finally {
    markReady();
  }
}

export async function retryStorage() {
  if (storage.problem === 'newer') { location.reload(); return; }
  storage.retrying = true;
  storage.retryFailed = false;
  await openStorage();
  storage.retrying = false;
  storage.retryFailed = storage.status !== 'ok';
}

export const canPersist = () => db !== null;

/**
 * Queued write: keeps the order of writes. A failed write is retried once on a fresh connection
 * (iOS may drop the connection in the background); a second failure switches to in-memory mode.
 * Writes are transactions with stable ids, so a retry never duplicates data.
 */
export function write(fn: (db: BalanceDB) => Promise<unknown>): Promise<unknown> {
  const d = db;
  if (!d) return queue;
  queue = queue
    .then(() => (db === d ? fn(d) : undefined))
    .catch(async (e) => {
      if (db !== d) return;
      console.warn('[storage] write failed, retrying', e);
      try {
        d.close();
        await d.open();
        await fn(d);
      } catch (e2) {
        fail(e2);
      }
    });
  return queue;
}

export function hideInstallHint(now = Date.now()) {
  storage.installHint = false;
  write((d) => updateSettings(d, { installHintHiddenUntil: now + INSTALL_HINT_PAUSE_MS }));
}
