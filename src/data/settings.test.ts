import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { BalanceDB } from './db';
import { DEFAULT_SETTINGS } from './schema';
import { detectPlatform, getSettings, showInstallHint, updateSettings } from './settings';

let n = 0;
const nav = (o: object) => o as Navigator;
const mm = (m: boolean) => () => ({ matches: m });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';

describe('showInstallHint', () => {
  it('matrix', () => {
    expect(showInstallHint({ ios: true, standalone: false }, undefined, 1)).toBe(true);
    expect(showInstallHint({ ios: false, standalone: false }, undefined, 1)).toBe(false);
    expect(showInstallHint({ ios: true, standalone: true }, undefined, 1)).toBe(false);
    expect(showInstallHint({ ios: true, standalone: false }, 100, 99)).toBe(false);
    expect(showInstallHint({ ios: true, standalone: false }, 100, 100)).toBe(true);
    expect(showInstallHint({ ios: true, standalone: false }, 100, 101)).toBe(true);
  });
});

describe('detectPlatform', () => {
  it('iPhone', () => expect(detectPlatform(nav({ userAgent: IPHONE, maxTouchPoints: 5 }), mm(false))).toEqual({ ios: true, standalone: false }));
  it('iPad as Mac', () => expect(detectPlatform(nav({ userAgent: MAC, maxTouchPoints: 5 }), mm(false)).ios).toBe(true));
  it('real Mac', () => expect(detectPlatform(nav({ userAgent: MAC, maxTouchPoints: 0 }), mm(false)).ios).toBe(false));
  it('navigator.standalone', () => expect(detectPlatform(nav({ userAgent: IPHONE, maxTouchPoints: 5, standalone: true }), mm(false)).standalone).toBe(true));
  it('display-mode', () => expect(detectPlatform(nav({ userAgent: IPHONE, maxTouchPoints: 5 }), mm(true)).standalone).toBe(true));
  it('standalone=false is not standalone', () => expect(detectPlatform(nav({ userAgent: IPHONE, maxTouchPoints: 5, standalone: false }), mm(false)).standalone).toBe(false));
});

describe('settings storage', () => {
  it('defaults and merge', async () => {
    const db = new BalanceDB(`s-${Date.now()}-${n++}`);
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
    await updateSettings(db, { sound: false });
    await updateSettings(db, { installHintHiddenUntil: 5 });
    expect(await getSettings(db)).toEqual({ ...DEFAULT_SETTINGS, sound: false, installHintHiddenUntil: 5 });
    expect(await db.settings.count()).toBe(1);
    db.close();
  });
});
