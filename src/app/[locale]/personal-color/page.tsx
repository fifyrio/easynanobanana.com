import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { FAQSchema, BreadcrumbSchema, SoftwareAppSchema } from '@/components/seo';
import { getAllSeasons, PERSONAL_COLOR_LOCALE } from '@/lib/personal-color';
import { FaqSection, ComingSoonCta } from '@/components/personal-color/PersonalColorUI';

const BASE_URL = 'https://www.easynanobanana.com';
const CANONICAL = `${BASE_URL}/${PERSONAL_COLOR_LOCALE}/personal-color`;

const HUB_FAQ = [
  { q: 'パーソナルカラー診断とは？', a: '生まれ持った肌・瞳・髪の色味から、自分に似合う色の傾向（イエベ春・イエベ秋・ブルベ夏・ブルベ冬）を知る診断です。似合う色を選ぶことで顔色が明るく、垢抜けて見えます。' },
  { q: 'イエベ・ブルベはどう違う？', a: 'イエベ（イエローベース）は黄みがかった色、ブルベ（ブルーベース）は青みがかった色が似合うタイプです。さらに明るさ・鮮やかさで4タイプに分かれます。' },
  { q: '16タイプ診断とは？', a: '4タイプをさらに細かく分類した体系で、より正確に似合う色を絞り込めます。まずは4タイプの傾向を知るところから始めるのがおすすめです。' },
  { q: '自分でセルフ診断できる？', a: '各タイプの特徴（肌・瞳・髪の色味）と似合う色パレットを見比べることで、傾向を絞り込めます。本ページの各タイプ解説を参考にしてください。' },
];

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (locale !== PERSONAL_COLOR_LOCALE) {
    return { robots: { index: false, follow: false } };
  }

  return {
    title: 'パーソナルカラー診断｜イエベ・ブルベ4タイプの似合う色ガイド',
    description: 'イエベ春・イエベ秋・ブルベ夏・ブルベ冬の4タイプ別に、似合う色・避けたい色・髪色をHEX付きで解説。自分のパーソナルカラーの傾向をセルフチェックできる無料ガイドです。',
    keywords: 'パーソナルカラー診断, イエベ ブルベ, パーソナルカラー 無料, 16タイプ, セルフ診断',
    openGraph: {
      title: 'パーソナルカラー診断｜イエベ・ブルベ4タイプの似合う色ガイド',
      description: 'イエベ・ブルベ4タイプ別の似合う色・避けたい色・髪色をHEX付きで解説する無料ガイド。',
      url: CANONICAL,
      siteName: 'Easy Nano Banana',
      locale: 'ja_JP',
      type: 'website',
    },
    alternates: {
      canonical: CANONICAL,
      languages: { ja: CANONICAL, 'x-default': CANONICAL },
    },
    robots: { index: true, follow: true },
  };
}

export default function PersonalColorHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (locale !== PERSONAL_COLOR_LOCALE) {
    notFound();
  }

  const seasons = getAllSeasons();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <SoftwareAppSchema
        name="パーソナルカラー診断ガイド"
        description="イエベ・ブルベ4タイプの似合う色ガイド"
        url={CANONICAL}
        applicationCategory="Lifestyle"
      />
      <FAQSchema items={HUB_FAQ.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: `${BASE_URL}/${PERSONAL_COLOR_LOCALE}` },
          { name: 'パーソナルカラー診断', url: CANONICAL },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
        パーソナルカラー診断｜イエベ・ブルベ4タイプの似合う色ガイド
      </h1>
      <p className="text-slate-600 mt-4 leading-relaxed">
        パーソナルカラーは、肌・瞳・髪の色味から「自分に似合う色の傾向」を知る考え方です。似合う色を選ぶだけで顔色が明るく、垢抜けて見えます。まずは4タイプの傾向を知るところから始めましょう。
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">4タイプ早見表</h2>
        <div className="grid grid-cols-2 gap-4">
          {seasons.map((s) => (
            <Link
              key={s.roman}
              href={`/personal-color/${s.roman}` as Parameters<typeof Link>[0]['href']}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#FFD84D] hover:bg-[#FFF9E6] transition"
            >
              <p className="text-lg font-bold text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-400">{s.kana}</p>
              <div className="flex gap-1 mt-3">
                {s.palette.slice(0, 5).map((c) => (
                  <span key={c.hex} className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ background: c.hex }} />
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed line-clamp-2">{s.lead}</p>
            </Link>
          ))}
        </div>
      </section>

      <ComingSoonCta />

      <FaqSection title="よくある質問" items={HUB_FAQ} />
    </main>
  );
}
