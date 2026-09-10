import {describe, expect, it} from 'vitest';
import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

const locales = {en, es, pt};

describe('music translations', () => {
  it.each(Object.entries(locales))('defines the music creation strings in %s', (_locale, translations) => {
    expect(translations.music_library.create_new).toBeTruthy();
    expect(translations.music_form.info_label).toBeTruthy();
    expect(translations.music_form.info_placeholder).toBeTruthy();
    expect(translations.music_form.info_hint).toBeTruthy();
  });
});
