'use client';

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

interface CookieCategory {
  id: string;
  label: string;
  description: string;
  required?: boolean;
  defaultEnabled: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    label: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take such as setting your privacy preferences, logging in, or filling in forms.',
    required: true,
    defaultEnabled: true,
  },
  {
    id: 'functional',
    label: 'Functional Cookies',
    description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    defaultEnabled: true,
  },
  {
    id: 'analytics',
    label: 'Analytics Cookies',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.',
    defaultEnabled: true,
  },
  {
    id: 'advertising',
    label: 'Advertising Cookies',
    description: 'These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant ads on other sites.',
    defaultEnabled: false,
  },
];

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.id, c.defaultEnabled]))
  );

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (prefs: Record<string, boolean>) => {
    const value = JSON.stringify(prefs);
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    document.cookie = `cookie-consent=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;
    setVisible(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.id, true]));
    saveConsent(allAccepted);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const toggleCategory = (id: string) => {
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      {!showSettings && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#FFE7A1] bg-[#FFFDF5] shadow-[0_-4px_20px_rgba(247,201,72,0.15)]"
          role="banner"
          aria-label="Cookie consent"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 text-center sm:text-left">
              We use cookies to enhance your experience and analyze site usage. By clicking &quot;Accept All Cookies&quot;, you agree to our use of cookies.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleAcceptAll}
                className="rounded-full bg-[#FFD84D] px-5 py-2.5 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition-all"
              >
                Accept All Cookies
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full border border-[#FFE7A1] px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#FFF3B2] transition-colors"
              >
                Cookies Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_40px_120px_rgba(247,201,72,0.25)]">
            {/* Close button */}
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF3B2] text-slate-600 hover:bg-[#FFE7A1] transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <h2 className="text-xl font-bold text-slate-900 mb-4 pr-8">Privacy Preference Center</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">
                When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences, or your device, and is mostly used to make the site work as you expect. The information does not usually identify you directly, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to learn more and change our default settings. Blocking some types of cookies may impact your experience of the site and the services we are able to offer.
              </p>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-[#C69312] hover:text-[#8C6A00] underline underline-offset-2 mb-6"
              >
                More information
              </a>

              {/* Manage preferences */}
              <h3 className="text-lg font-bold text-slate-900 mb-4">Manage Consent Preferences</h3>
              <div className="space-y-3">
                {COOKIE_CATEGORIES.map((category) => {
                  const isExpanded = expandedCategory === category.id;
                  const isEnabled = category.required || preferences[category.id];

                  return (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-[#FFE7A1] bg-[#FFFDF5] overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-5 py-4">
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                          className="flex items-center gap-2 text-left flex-1"
                        >
                          <span className="text-[#C69312] text-lg font-bold">{isExpanded ? '−' : '+'}</span>
                          <span className="font-semibold text-slate-900 text-sm">{category.label}</span>
                        </button>

                        {category.required ? (
                          <span className="text-xs font-medium text-slate-400 px-3 py-1 rounded-full bg-slate-100">
                            Always Active
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              isEnabled ? 'bg-[#FFD84D]' : 'bg-slate-200'
                            }`}
                            aria-label={`Toggle ${category.label}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-4 pt-0">
                          <p className="text-xs text-slate-500 leading-relaxed">{category.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 rounded-full bg-[#FFD84D] px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition-all"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 rounded-full border border-[#FFE7A1] px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-[#FFF3B2] transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
