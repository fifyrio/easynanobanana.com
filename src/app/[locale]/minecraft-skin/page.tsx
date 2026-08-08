import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { FAQSchema, BreadcrumbSchema, SoftwareAppSchema } from '@/components/seo';
import { getMinecraftLanding, MINECRAFT_LANDING_LOCALES } from '@/lib/minecraft-skin';
import { StepList, FeatureGrid, LandingFaq } from '@/components/minecraft-skin/MinecraftLandingUI';

const BASE_URL = 'https://www.easynanobanana.com';
const TOOL_PATH = '/ai-image-effects/ai-minecraft-skin';

// Per-locale UI labels (CTA + FAQ heading).
const LABELS: Record<string, { cta: string; faqTitle: string; stepsTitle: string; featuresTitle: string }> = {
  en: { cta: 'Create your skin now', faqTitle: 'FAQ', stepsTitle: 'How it works', featuresTitle: 'Why AI' },
  es: { cta: 'Crea tu skin ahora', faqTitle: 'Preguntas frecuentes', stepsTitle: 'Cómo funciona', featuresTitle: 'Por qué con IA' },
  pt: { cta: 'Crie sua skin agora', faqTitle: 'Perguntas frequentes', stepsTitle: 'Como funciona', featuresTitle: 'Por que com IA' },
  de: { cta: 'Jetzt Skin erstellen', faqTitle: 'Häufige Fragen', stepsTitle: 'So funktioniert es', featuresTitle: 'Warum mit KI' },
};

export function generateStaticParams() {
  return MINECRAFT_LANDING_LOCALES.map((locale) => ({ locale }));
}

function canonicalFor(locale: string): string {
  const seg = locale === 'en' ? '' : `/${locale}`;
  return `${BASE_URL}${seg}/minecraft-skin`;
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const data = getMinecraftLanding(locale);
  if (!data) {
    return { robots: { index: false, follow: false } };
  }

  const canonicalUrl = canonicalFor(locale);
  const languages: Record<string, string> = { 'x-default': canonicalFor('en') };
  for (const l of MINECRAFT_LANDING_LOCALES) languages[l] = canonicalFor(l);

  return {
    title: data.seo.title,
    description: data.seo.description,
    keywords: data.seo.keywords,
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      url: canonicalUrl,
      siteName: 'Easy Nano Banana',
      locale: data.ogLocale,
      type: 'website',
    },
    alternates: { canonical: canonicalUrl, languages },
    robots: { index: true, follow: true },
  };
}

export default function MinecraftSkinLandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const data = getMinecraftLanding(locale);
  if (!data) {
    notFound();
  }

  const labels = LABELS[locale] ?? LABELS.en;
  const canonicalUrl = canonicalFor(locale);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <SoftwareAppSchema
        name={data.seo.title}
        description={data.seo.description}
        url={canonicalUrl}
        applicationCategory="Game"
      />
      <FAQSchema items={data.faq.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: locale === 'en' ? BASE_URL : `${BASE_URL}/${locale}` },
          { name: data.h1, url: canonicalUrl },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{data.h1}</h1>
      <p className="text-slate-600 mt-4 leading-relaxed">{data.lead}</p>

      <Link
        href={TOOL_PATH}
        className="inline-block mt-6 bg-[#FFD84D] text-slate-900 font-semibold rounded-full px-6 py-2.5 text-sm shadow-[0_10px_30px_rgba(255,216,77,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
      >
        {labels.cta}
      </Link>

      <StepList title={labels.stepsTitle} steps={data.steps} />
      <FeatureGrid title={labels.featuresTitle} features={data.features} />
      <LandingFaq title={labels.faqTitle} items={data.faq} />

      <div className="mt-10 text-center">
        <Link
          href={TOOL_PATH}
          className="inline-block bg-slate-900 text-white font-semibold rounded-full px-6 py-2.5 text-sm transition hover:bg-slate-700"
        >
          {labels.cta}
        </Link>
      </div>
    </main>
  );
}
