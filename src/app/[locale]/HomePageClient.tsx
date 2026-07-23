'use client';

import { Link as I18nLink } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import PhotoWall from '@/components/PhotoWall';
import AiToolsShowcase from '@/components/AiToolsShowcase';
import CinematicLanding from '@/components/home/CinematicLanding';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const serif: React.CSSProperties = {
  fontFamily: 'var(--font-heading), Georgia, "Times New Roman", serif',
  fontStyle: 'italic',
};

export default function HomePageClient() {
  const t = useTranslations('pages.home');

  const transformationItems = [
    { id: 1, key: 'portrait' },
    { id: 2, key: 'magic3d' },
    { id: 3, key: 'color' },
    { id: 4, key: 'pose' },
    { id: 5, key: 'brand' },
    { id: 6, key: 'style' },
  ];

  const howToSteps = [
    { step: "01", key: "1", image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/HowItWorks/step-1.webp` },
    { step: "02", key: "2", image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/HowItWorks/step-2.webp` },
    { step: "03", key: "3", image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/HowItWorks/step-3.webp` },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <CinematicLanding />

      {/* What Images Can Be Edited Section */}
      <section className="py-16 lg:py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block liquid-glass text-white/80 text-sm font-medium px-3 py-1 rounded-full mb-4">
              {t('transformation.badge')}
            </div>
            <h2 className="text-4xl lg:text-5xl text-white mb-4" style={serif}>
              {t('transformation.title')}
            </h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto">
              {t('transformation.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {transformationItems.map((item) => (
              <div key={item.key} className="liquid-glass rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 group">
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="relative bg-white/5 rounded-lg aspect-[9/16] overflow-hidden">
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/WhatImagesCanBeEdited/${item.id}-before.webp`}
                      alt={`Before ${item.key}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="relative bg-white/5 rounded-lg aspect-[9/16] overflow-hidden">
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/WhatImagesCanBeEdited/${item.id}-after.webp`}
                      alt={`After ${item.key}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{t(`transformation.items.${item.key}.title`)}</h3>
                  <p className="text-white/60 text-sm">
                    {t(`transformation.items.${item.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <I18nLink href="/ai-image-effects/ai-figure-generator" prefetch={false}>
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 text-lg font-semibold shadow-lg"
              >
                {t('transformation.cta')}
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </I18nLink>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-16 lg:py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block liquid-glass text-white/80 text-sm font-medium px-3 py-1 rounded-full mb-4">
              {t('showcase.badge')}
            </div>
            <h2 className="text-4xl lg:text-5xl text-white mb-4" style={serif}>
              {t('showcase.title')}
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              {t('showcase.subtitle')}
            </p>
          </div>
          
          {/* Photo Wall Gallery */}
          <PhotoWall />
          
          <div className="text-center mt-12">
            <I18nLink href="/ai-image-effects/ai-figure-generator" prefetch={false}>
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 text-lg font-semibold shadow-lg"
              >
                {t('showcase.cta')}
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </I18nLink>
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section className="py-16 lg:py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block liquid-glass text-white/80 text-sm font-medium px-3 py-1 rounded-full mb-4">
              {t('howTo.badge')}
            </div>
            <h2 className="text-4xl lg:text-5xl text-white mb-4" style={serif}>
              {t('howTo.title')}
            </h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto">
              {t('howTo.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {howToSteps.map((stepData, index) => (
              <div key={stepData.step}>
                {/* Step Content */}
                <div className="liquid-glass rounded-2xl p-6 text-center relative flex-1 max-w-sm transition-transform duration-200 hover:-translate-y-1 h-full flex flex-col">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                    {stepData.step}
                  </div>
                  <div className="mb-6 relative pt-8">
                    <div className="relative w-full aspect-square">
                      <Image 
                        src={stepData.image} 
                        alt={`Step ${stepData.step} illustration`}
                        fill
                        className="object-cover rounded-2xl"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{t(`howTo.steps.${stepData.key}.title`)}</h3>
                  <p className="text-white/60">
                    {t(`howTo.steps.${stepData.key}.description`)}
                  </p>
                </div>
                
                {/* Arrow - only show between steps */}
                {index < 2 && (
                  <>
                    <div className="hidden lg:flex items-center justify-center">
                      <i className="ri-arrow-right-line text-2xl text-yellow-500"></i>
                    </div>
                    <div className="lg:hidden flex items-center justify-center">
                      <i className="ri-arrow-down-line text-2xl text-yellow-500"></i>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    
      
      {/* Featured Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl text-white mb-4" style={serif}>
              {t('features.title')}
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-ping"></div>
                <span className="text-2xl relative z-10">🖼️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('features.items.creation.title')}</h3>
              <p className="text-white/60 mb-6">
                {t('features.items.creation.description')}
              </p>
              <I18nLink href="/image-editor" prefetch={false}>
                <Button className="bg-yellow-400 hover:bg-yellow-300 text-black">
                  {t('features.items.creation.cta')}
                </Button>
              </I18nLink>
            </div>

            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('features.items.background.title')}</h3>
              <p className="text-white/60 mb-6">
                 {t('features.items.background.description')}
              </p>
              <I18nLink href="/remove-background" prefetch={false}>
                <Button className="bg-yellow-400 hover:bg-yellow-300 text-black">
                  {t('features.items.background.cta')}
                </Button>
              </I18nLink>
            </div>

            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">📐</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('features.items.templates.title')}</h3>
              <p className="text-white/60 mb-6">
                 {t('features.items.templates.description')}
              </p>
              <I18nLink href="/templates" prefetch={false}>
                <Button className="bg-yellow-400 hover:bg-yellow-300 text-black">
                   {t('features.items.templates.cta')}
                </Button>
              </I18nLink>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Nano Banana Section */}
      <section className="py-16 lg:py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl text-white mb-4" style={serif}>
              {t('whyChoose.title')}
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {t('whyChoose.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl animate-pulse"></div>
                <span className="text-2xl relative z-10">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('whyChoose.items.speed.title')}</h3>
              <p className="text-white/60 mb-6">
                {t('whyChoose.items.speed.description')}
              </p>
            </div>
            
            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-spin"></div>
                <span className="text-2xl relative z-10">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('whyChoose.items.limitless.title')}</h3>
              <p className="text-white/60 mb-6">
                {t('whyChoose.items.limitless.description')}
              </p>
            </div>
            
            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">💸</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('whyChoose.items.risk.title')}</h3>
              <p className="text-white/60 mb-6">
                {t('whyChoose.items.risk.description')}
              </p>
            </div>
            
            <div className="liquid-glass rounded-2xl p-8 text-center transition-transform duration-200 hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('whyChoose.items.privacy.title')}</h3>
              <p className="text-white/60 mb-6">
                {t('whyChoose.items.privacy.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Showcase */}
      <AiToolsShowcase />

      {/* Why Choose Nano Banana final CTA band */}
      <section className="py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-0 bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 rounded-2xl p-8 lg:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                {t('whyChoose.finalCta.title')}
              </h3>
              <p className="text-lg text-gray-700 mb-8">
                {t('whyChoose.finalCta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <I18nLink href="/image-editor" prefetch={true}>
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                  >
                    {t('whyChoose.finalCta.start')}
                    <i className="ri-arrow-right-line ml-2"></i>
                  </Button>
                </I18nLink>
                <I18nLink href="/free-credits" prefetch={true}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white px-8 py-4 text-lg font-semibold bg-white"
                  >
                    {t('whyChoose.finalCta.free')}
                  </Button>
                </I18nLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}