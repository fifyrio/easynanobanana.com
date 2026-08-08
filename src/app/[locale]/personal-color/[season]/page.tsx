import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { FAQSchema, BreadcrumbSchema } from '@/components/seo';
import { getSeason, getAllSeasons, SEASON_SLUGS, PERSONAL_COLOR_LOCALE } from '@/lib/personal-color';
import { ColorPalette, FeatureList, FaqSection, ComingSoonCta } from '@/components/personal-color/PersonalColorUI';

const BASE_URL = 'https://www.easynanobanana.com';

export function generateStaticParams() {
  return SEASON_SLUGS.map((season) => ({ season }));
}

export async function generateMetadata({
  params: { locale, season },
}: {
  params: { locale: string; season: string };
}): Promise<Metadata> {
  const data = getSeason(season);
  if (locale !== PERSONAL_COLOR_LOCALE || !data) {
    return { robots: { index: false, follow: false } };
  }

  const canonicalUrl = `${BASE_URL}/${PERSONAL_COLOR_LOCALE}/personal-color/${season}`;

  return {
    title: data.seo.title,
    description: data.seo.description,
    keywords: data.seo.keywords,
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      url: canonicalUrl,
      siteName: 'Easy Nano Banana',
      locale: 'ja_JP',
      type: 'article',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default function PersonalColorSeasonPage({
  params: { locale, season },
}: {
  params: { locale: string; season: string };
}) {
  const data = getSeason(season);
  if (locale !== PERSONAL_COLOR_LOCALE || !data) {
    notFound();
  }

  const canonicalUrl = `${BASE_URL}/${PERSONAL_COLOR_LOCALE}/personal-color/${season}`;
  const others = getAllSeasons().filter((s) => s.roman !== season);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <FAQSchema items={data.faq.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: `${BASE_URL}/${PERSONAL_COLOR_LOCALE}` },
          { name: 'パーソナルカラー診断', url: `${BASE_URL}/${PERSONAL_COLOR_LOCALE}/personal-color` },
          { name: data.name, url: canonicalUrl },
        ]}
      />

      <nav className="text-sm text-slate-400 mb-4">
        <Link href="/personal-color" className="hover:text-slate-700">パーソナルカラー診断</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-600">{data.name}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{data.h1}</h1>
      <p className="text-slate-600 mt-4 leading-relaxed">{data.lead}</p>

      <FeatureList title={`${data.name}の特徴`} items={data.features} />
      <ColorPalette title={`${data.name}に似合う色`} swatches={data.palette} />
      <ColorPalette title={`${data.name}が避けたい色`} swatches={data.avoid} />
      <ColorPalette title={`${data.name}に似合う髪色`} swatches={data.hair} />

      <ComingSoonCta />

      <FaqSection title="よくある質問" items={data.faq} />

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">他のタイプも見る</h2>
        <div className="grid grid-cols-3 gap-3">
          {others.map((s) => (
            <Link
              key={s.roman}
              href={`/personal-color/${s.roman}` as Parameters<typeof Link>[0]['href']}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold text-slate-800 hover:border-[#FFD84D] hover:bg-[#FFF9E6] transition"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
