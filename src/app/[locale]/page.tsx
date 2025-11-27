import Header from '@/components/common/Header';
import { Link as I18nLink } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import PhotoWall from '@/components/PhotoWall';
import { useTranslations } from 'next-intl';

export default function HomePage() {
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 overflow-hidden min-h-[600px] lg:min-h-[700px]">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-left">
              {/* Logo Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg">
                  <span className="text-3xl">🍌</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                {t('hero.title1')}
                <br />
                {t('hero.title2')}
              </h1>

              {/* Powered By Badge */}
              <div className="mb-6 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-yellow-500 shadow-md">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
                </svg>
                <span className="text-sm font-semibold text-gray-900">
                  {t('hero.poweredBy')}
                </span>
                <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  Nano Banana
                </span>
              </div>

              {/* Description */}
              <p className="text-base lg:text-lg text-gray-700 mb-8 max-w-lg leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Buttons - Horizontal Layout */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <I18nLink href="/image-editor">
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 text-base font-semibold shadow-lg rounded-xl w-full sm:w-auto"
                  >
                    {t('hero.cta')}
                  </Button>
                </I18nLink>
                <a
                  href="https://apps.apple.com/us/app/seedream-ai-photo-fix/id6751611982"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-colors duration-200 text-base font-semibold shadow-lg w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span>{t('hero.appStore')}</span>
                </a>
              </div>
            </div>

            {/* Right Column - Phone Mockup with Video */}
            <div className="flex justify-center lg:justify-end items-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: '320px' }}>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-3xl z-10"></div>

                  {/* Screen Content */}
                  <div className="relative bg-black rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                    {/* Video Player */}
                    <video
                      src="https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/videos/nano-web.mp4"
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full opacity-10 -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full opacity-10 translate-x-20 translate-y-20"></div>
      </section>          

      {/* What Images Can Be Edited Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              {t('transformation.badge')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t('transformation.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('transformation.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {transformationItems.map((item) => (
              <div key={item.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="relative bg-gray-200 rounded-lg aspect-[9/16] overflow-hidden">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/WhatImagesCanBeEdited/${item.id}-before.webp`}
                      alt={`Before ${item.key}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative bg-gray-200 rounded-lg aspect-[9/16] overflow-hidden">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/WhatImagesCanBeEdited/${item.id}-after.webp`}
                      alt={`After ${item.key}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(`transformation.items.${item.key}.title`)}</h3>
                  <p className="text-gray-600 text-sm">
                    {t(`transformation.items.${item.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <I18nLink href="/ai-image-effects/ai-figure-generator">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 text-lg font-semibold shadow-lg"
              >
                {t('transformation.cta')}
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </I18nLink>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              {t('showcase.badge')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t('showcase.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('showcase.subtitle')}
            </p>
          </div>
          
          {/* Photo Wall Gallery */}
          <PhotoWall />
          
          <div className="text-center mt-12">
            <I18nLink href="/ai-image-effects/ai-figure-generator">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 text-lg font-semibold shadow-lg"
              >
                {t('showcase.cta')}
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </I18nLink>
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              {t('howTo.badge')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t('howTo.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('howTo.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {howToSteps.map((stepData, index) => (
              <div key={stepData.step}>
                {/* Step Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center relative flex-1 max-w-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                    {stepData.step}
                  </div>
                  <div className="mb-6 relative pt-8">
                    <img 
                      src={stepData.image} 
                      alt={`Step ${stepData.step} illustration`}
                      className="w-full aspect-square object-cover rounded-2xl"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t(`howTo.steps.${stepData.key}.title`)}</h3>
                  <p className="text-gray-600">
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
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-ping"></div>
                <span className="text-2xl relative z-10">🖼️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.items.creation.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('features.items.creation.description')}
              </p>
              <I18nLink href="/image-editor">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  {t('features.items.creation.cta')}
                </Button>
              </I18nLink>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.items.background.title')}</h3>
              <p className="text-gray-600 mb-6">
                 {t('features.items.background.description')}
              </p>
              <I18nLink href="/remove-background">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  {t('features.items.background.cta')}
                </Button>
              </I18nLink>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">📐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.items.templates.title')}</h3>
              <p className="text-gray-600 mb-6">
                 {t('features.items.templates.description')}
              </p>
              <I18nLink href="/templates">
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                   {t('features.items.templates.cta')}
                </Button>
              </I18nLink>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Nano Banana Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t('whyChoose.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('whyChoose.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl animate-pulse"></div>
                <span className="text-2xl relative z-10">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('whyChoose.items.speed.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('whyChoose.items.speed.description')}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-spin"></div>
                <span className="text-2xl relative z-10">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('whyChoose.items.limitless.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('whyChoose.items.limitless.description')}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">💸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('whyChoose.items.risk.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('whyChoose.items.risk.description')}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('whyChoose.items.privacy.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('whyChoose.items.privacy.description')}
              </p>
            </div>
          </div>
          
          <div className="mt-16 bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 rounded-2xl p-8 lg:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                {t('whyChoose.finalCta.title')}
              </h3>
              <p className="text-lg text-gray-700 mb-8">
                {t('whyChoose.finalCta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <I18nLink href="/image-editor">
                  <Button 
                    size="lg" 
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                  >
                    {t('whyChoose.finalCta.start')}
                    <i className="ri-arrow-right-line ml-2"></i>
                  </Button>
                </I18nLink>
                <I18nLink href="/free-credits">
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