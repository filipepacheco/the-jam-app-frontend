import {describe, expect, it} from 'vitest';
import {assembleResources} from '../locales/catalogue';
import {catalogue} from '../locales/catalogue/catalogue';

const locales = assembleResources(catalogue);

describe('music translations', () => {
  it.each(Object.entries(locales))('defines the music creation strings in %s', (_locale, {translation: translations}) => {
    expect(translations.music_library.create_new).toBeTruthy();
    expect(translations.music_form.info_label).toBeTruthy();
    expect(translations.music_form.info_placeholder).toBeTruthy();
    expect(translations.music_form.info_hint).toBeTruthy();
  });
});
