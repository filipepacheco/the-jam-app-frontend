import {describe, expect, it} from 'vitest';
import i18n from '../i18n';

describe('i18n smoke', () => {
  async function waitForI18n() {
    if (!i18n.isInitialized) {
      await new Promise<void>((resolve) => {
        i18n.on('initialized', () => resolve());
      });
    }
  }

  it('resolves a known translation key', async () => {
    await waitForI18n()

    const home = i18n.getFixedT('en')('nav.home');
    expect(home).toBeTruthy();
    expect(home).toMatch(/Home/i);

    // check jam status keys
    const active = i18n.t('jams.statuses.active');
    const inactive = i18n.t('jams.statuses.inactive');
    const finished = i18n.t('jams.statuses.finished');

    expect(active).toBeTruthy();
    expect(inactive).toBeTruthy();
    expect(finished).toBeTruthy();

    expect(active).not.toMatch(/jams\.statuses\.active/);
    expect(inactive).not.toMatch(/jams\.statuses\.inactive/);
    expect(finished).not.toMatch(/jams\.statuses\.finished/);
  });

  it.each([
    ['pt', ['Nenhuma música', '1 música', '12 músicas']],
    ['en', ['No songs', '1 song', '12 songs']],
    ['es', ['No hay canciones', '1 canción', '12 canciones']],
  ] as const)('uses i18next zero, one, and many plural forms for %s', async (locale, expected) => {
    await waitForI18n()
    const t = i18n.getFixedT(locale)

    expect([0, 1, 12].map((count) => t('jams.songs_count', { count }))).toEqual(expected)
  });
});
