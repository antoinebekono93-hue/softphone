"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple dict approach
const dictionaries: Record<Language, Record<string, string>> = {
  fr: {
    "dashboard.overview": "Tableau de bord",
    "dashboard.softphone": "Softphone",
    "dashboard.contacts": "Contacts",
    "dashboard.sequences": "Séquences d'appels",
    "dashboard.inbox": "Boîte de réception",
    "dashboard.analytics": "Revenus & Churn",
    "dashboard.numbers": "Numéros de téléphone",
    "dashboard.ivr": "SVI & Routage",
    "dashboard.settings": "Paramètres",
    "dashboard.sms_campaigns": "Campagnes SMS",
    "dashboard.sms_inbox": "Boîte SMS",
    "dashboard.sms_profiles": "Profils SMS",
    "dashboard.sms_templates": "Modèles",
    "dashboard.wa_crm": "CRM Pipeline",
    "dashboard.wa_campaigns": "Campagnes Broadcast",
    "dashboard.ai_agents": "Équipe IA",
    "dashboard.ai_tickets": "Tickets Support",
    "dashboard.ai_automations": "Automatisations",
    "dashboard.ai_voices": "Voix IA",
    "dashboard.ai_rag": "Base de Connaissances"
  },
  en: {
    "dashboard.overview": "Dashboard",
    "dashboard.softphone": "Softphone",
    "dashboard.contacts": "Contacts",
    "dashboard.sequences": "Call Sequences",
    "dashboard.inbox": "Inbox",
    "dashboard.analytics": "Revenue & Churn",
    "dashboard.numbers": "Phone Numbers",
    "dashboard.ivr": "IVR & Routing",
    "dashboard.settings": "Settings",
    "dashboard.sms_campaigns": "SMS Campaigns",
    "dashboard.sms_inbox": "SMS Inbox",
    "dashboard.sms_profiles": "SMS Profiles",
    "dashboard.sms_templates": "Templates",
    "dashboard.wa_crm": "CRM Pipeline",
    "dashboard.wa_campaigns": "Broadcast Campaigns",
    "dashboard.ai_agents": "AI Team",
    "dashboard.ai_tickets": "Support Tickets",
    "dashboard.ai_automations": "Automations",
    "dashboard.ai_voices": "AI Voices",
    "dashboard.ai_rag": "Knowledge Base"
  },
  ar: {
    "dashboard.overview": "لوحة القيادة",
    "dashboard.softphone": "الهاتف البرمجي",
    "dashboard.contacts": "جهات الاتصال",
    "dashboard.sequences": "تسلسلات الاتصال",
    "dashboard.inbox": "صندوق الوارد",
    "dashboard.analytics": "الإيرادات والاضطراب",
    "dashboard.numbers": "أرقام الهواتف",
    "dashboard.ivr": "الرد الصوتي التفاعلي والتوجيه",
    "dashboard.settings": "الإعدادات",
    "dashboard.sms_campaigns": "حملات الرسائل القصيرة",
    "dashboard.sms_inbox": "صندوق الرسائل",
    "dashboard.sms_profiles": "ملفات الرسائل",
    "dashboard.sms_templates": "قوالب",
    "dashboard.wa_crm": "خط أنابيب إدارة العلاقات",
    "dashboard.wa_campaigns": "حملات البث",
    "dashboard.ai_agents": "فريق الذكاء الاصطناعي",
    "dashboard.ai_tickets": "تذاكر الدعم",
    "dashboard.ai_automations": "الأتمتة",
    "dashboard.ai_voices": "أصوات الذكاء الاصطناعي",
    "dashboard.ai_rag": "قاعدة المعرفة"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    // Load from localStorage if available
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && dictionaries[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    return dictionaries[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
