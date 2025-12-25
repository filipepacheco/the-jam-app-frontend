import {describe, expect, it} from 'vitest';
import i18n from '../i18n';

describe('i18n smoke', () => {
  it('resolves a known translation key', async () => {
    // ensure i18n has initialized
    if (!i18n.isInitialized) {
      await new Promise<void>((resolve) => {
        i18n.on('initialized', () => resolve());
      });
    }

    const home = i18n.t('nav.home');
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
});

