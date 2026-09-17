'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface PetDanceFaqProps {
  /** i18n namespace supplying the `faq.*` copy for this page. */
  namespace?: string;
  /** How many question keys exist under `<namespace>.faq.items`. */
  count?: number;
}

export default function PetDanceFaq({ namespace = 'aiPetDance', count = 10 }: PetDanceFaqProps) {
  const t = useTranslations(namespace);
  const [openFaq, setOpenFaq] = useState<number | null>(1);
  const faqIndexes = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <section className="bg-white text-slate-900">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('faq.badge')}</p>
        <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
        <p className="text-slate-600">{t('faq.subtitle')}</p>
      </div>
      <div className="mx-auto max-w-4xl space-y-4 px-4 pb-16">
        {faqIndexes.map((index) => {
          const isOpen = openFaq === index;
          return (
            <div
              key={index}
              className="overflow-hidden rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)]"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-slate-900">{t(`faq.items.${index}.question`)}</span>
                <span className="text-2xl text-[#C69312]">{isOpen ? '–' : '+'}</span>
              </button>
              {isOpen && <div className="px-6 pb-6 text-sm text-slate-600">{t(`faq.items.${index}.answer`)}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
