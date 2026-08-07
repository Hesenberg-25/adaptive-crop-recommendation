import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import translationMR from './locales/mr/translation.json';
import translationTA from './locales/ta/translation.json';
import translationTE from './locales/te/translation.json';
import translationKN from './locales/kn/translation.json';
import translationGU from './locales/gu/translation.json';
import translationBN from './locales/bn/translation.json';
import translationPA from './locales/pa/translation.json';
import translationML from './locales/ml/translation.json';
import translationOR from './locales/or/translation.json';

const resources = {
  en: { translation: translationEN },
  hi: { translation: translationHI },
  mr: { translation: translationMR },
  ta: { translation: translationTA },
  te: { translation: translationTE },
  kn: { translation: translationKN },
  gu: { translation: translationGU },
  bn: { translation: translationBN },
  pa: { translation: translationPA },
  ml: { translation: translationML },
  or: { translation: translationOR }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
