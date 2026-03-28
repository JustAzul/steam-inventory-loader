import { describe, it, expect } from 'vitest';
import { DescriptionStore } from '../../src/repository/description-store.js';
import type { ItemDescription } from '../../src/types.js';

function desc(classid: string, instanceid = '0', name = 'item'): ItemDescription {
  return { appid: 753, classid, instanceid, name } as ItemDescription;
}

describe('DescriptionStore — rolling window', () => {
  it('single page: current lookup works', () => {
    const store = new DescriptionStore();
    store.addPage([desc('100', '0', 'Hat')]);

    expect(store.get('100', '0')?.name).toBe('Hat');
  });

  it('two pages: previous page lookup works', () => {
    const store = new DescriptionStore();
    store.addPage([desc('100', '0', 'Hat')]);
    store.addPage([desc('200', '0', 'Sword')]);

    // Current page
    expect(store.get('200', '0')?.name).toBe('Sword');
    // Previous page still accessible
    expect(store.get('100', '0')?.name).toBe('Hat');
  });

  it('three pages: oldest page evicted', () => {
    const store = new DescriptionStore();
    store.addPage([desc('100', '0', 'Hat')]);
    store.addPage([desc('200', '0', 'Sword')]);
    store.addPage([desc('300', '0', 'Shield')]);

    // Current and previous available
    expect(store.get('300', '0')?.name).toBe('Shield');
    expect(store.get('200', '0')?.name).toBe('Sword');
    // Oldest evicted
    expect(store.get('100', '0')).toBeUndefined();
  });

  it('empty descriptions page', () => {
    const store = new DescriptionStore();
    store.addPage([]);

    expect(store.get('100', '0')).toBeUndefined();
  });

  it('duplicate classid+instanceid within page: last wins', () => {
    const store = new DescriptionStore();
    store.addPage([
      desc('100', '0', 'First'),
      desc('100', '0', 'Second'),
    ]);

    expect(store.get('100', '0')?.name).toBe('Second');
  });

  it('different instanceid treated as different items', () => {
    const store = new DescriptionStore();
    store.addPage([
      desc('100', '1', 'Instance1'),
      desc('100', '2', 'Instance2'),
    ]);

    expect(store.get('100', '1')?.name).toBe('Instance1');
    expect(store.get('100', '2')?.name).toBe('Instance2');
  });

  it('missing instanceid defaults to "0"', () => {
    const store = new DescriptionStore();
    store.addPage([{ appid: 753, classid: '100' } as ItemDescription]);

    expect(store.get('100', '0')).toBeDefined();
    expect(store.get('100', '')).toBeDefined();
  });

  it('clear() resets both maps', () => {
    const store = new DescriptionStore();
    store.addPage([desc('100')]);
    store.addPage([desc('200')]);

    store.clear();

    expect(store.get('100', '0')).toBeUndefined();
    expect(store.get('200', '0')).toBeUndefined();
  });
});
