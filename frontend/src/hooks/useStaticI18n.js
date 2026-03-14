import { useCallback } from 'react';
import { useTranslationContext } from '../context/TranslationContext';

const hi = {
  dashboard: 'डैशबोर्ड',
  prediction: 'पूर्वानुमान',
  inventoryHub: 'इन्वेंटरी हब',
  donationLocator: 'डोनेशन लोकेटर',
  payment: 'पेमेंट',
  guide: 'गाइड',
  pricing: 'प्राइसिंग',
  keyAnalytics: 'मुख्य एनालिटिक्स',
  timeRangeAnalytics: 'समय सीमा एनालिटिक्स',
  reports: 'रिपोर्ट्स',
  nearestNgos: 'निकटतम एनजीओ',
  history: 'इतिहास',
  map: 'मैप',
  billing: 'बिलिंग',
  invoices: 'इनवॉइस',
  paymentMethods: 'पेमेंट मेथड्स',
  gettingStarted: 'शुरुआत',
  features: 'फीचर्स',
  talkToUs: 'हमसे बात करें',
  freeDemo: 'फ्री डेमो',
  all: 'सभी',
  expirySoon: 'जल्दी समाप्त',
  addItem: 'आइटम जोड़ें',
  expired: 'समाप्त',
  runPrediction: 'पूर्वानुमान चलाएँ',
  logPurchase: 'खरीद लॉग करें',
  saveItem: 'आइटम सेव करें',
  reset: 'रीसेट',
  login: 'लॉगिन',
  register: 'रजिस्टर',
  generateReport: 'रिपोर्ट बनाएं',
  requestDemo: 'डेमो अनुरोध करें',
  choosePlan: 'प्लान चुनें',
  light: 'लाइट',
  dark: 'डार्क'
};

export default function useStaticI18n() {
  const { language } = useTranslationContext();

  const tx = useCallback((key, fallback) => {
    if (language === 'hi') {
      return hi[key] || fallback || key;
    }

    return fallback || key;
  }, [language]);

  return {
    language,
    tx
  };
}