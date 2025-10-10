import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationFR from './fr.json';
import translationEN from './en.json';

const resources = {
  fr: {
    translation: translationFR
  },
  en: {
    translation: translationEN
  }
};

const i18n = createInstance();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;