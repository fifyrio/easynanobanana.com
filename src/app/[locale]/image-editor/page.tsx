import { Metadata } from 'next';
import Header from '@/components/common/Header';
import ImageEditor from '@/components/ImageEditor';
import AiToolsShowcase from '@/components/AiToolsShowcase';
import { FAQSchema } from '@/components/seo';
import brandCopy from '@/data/seo/nano-banana-brand-copy.json';

const BASE_URL = 'https://www.easynanobanana.com';

interface BrandBlock {
  h2: string;
  body: string;
  faq: { q: string; a: string }[];
}
interface BrandEntry {
  seo: { title: string; description: string; keywords: string };
  block?: BrandBlock;
}

const BRAND = brandCopy as unknown as Record<string, BrandEntry>;

function brandFor(locale: string): BrandEntry {
  return BRAND[locale] ?? BRAND.default;
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { seo } = brandFor(locale);
  const seg = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${BASE_URL}${seg}/image-editor`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: 'Easy Nano Banana',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default function ImageEditorPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { block } = brandFor(locale);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ImageEditor />
      <AiToolsShowcase />

      {block && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <FAQSchema items={block.faq.map((f) => ({ question: f.q, answer: f.a }))} />
          <h2 className="text-xl font-bold text-slate-900 mb-3">{block.h2}</h2>
          <p className="text-slate-600 leading-relaxed">{block.body}</p>
          <div className="mt-6 space-y-4">
            {block.faq.map((f) => (
              <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">{f.q}</p>
                <p className="text-slate-600 mt-1 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
