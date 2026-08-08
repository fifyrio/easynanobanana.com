import type { Swatch, Faq } from '@/lib/personal-color';

// Server components — pure presentational, no client JS needed.

export function ColorPalette({ title, swatches }: { title: string; swatches: Swatch[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {swatches.map((s) => (
          <div key={s.name} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="h-20 w-full" style={{ background: s.hex }} aria-hidden="true" />
            <div className="p-3">
              <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
              <p className="text-xs text-slate-400 font-mono">{s.hex}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-slate-700">
            <span className="text-[#f5b200] font-bold mt-0.5 shrink-0">&#10003;</span>
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqSection({ title, items }: { title: string; items: Faq[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map((f) => (
          <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{f.q}</p>
            <p className="text-slate-600 mt-1 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Coming-soon CTA. The AI diagnosis tool is offline during payment review, so
 * we deliberately do NOT link to it — we invite an email follow-up instead.
 */
export function ComingSoonCta() {
  const mailto =
    'mailto:support@easynanobanana.com' +
    '?subject=' + encodeURIComponent('パーソナルカラー診断ツールの通知希望') +
    '&body=' + encodeURIComponent('AIパーソナルカラー診断ツールが公開されたら通知してください。');

  return (
    <section className="mt-10 rounded-2xl border border-[#FFE7A1] bg-[#FFF9E6] p-6 text-center">
      <p className="inline-block text-xs font-semibold uppercase tracking-wider text-[#8C6A00] bg-white/70 rounded-full px-3 py-1 mb-3">
        近日公開
      </p>
      <h2 className="text-lg font-bold text-slate-900">
        AIパーソナルカラー診断ツールは準備中です
      </h2>
      <p className="text-slate-600 mt-2 leading-relaxed max-w-xl mx-auto">
        写真1枚でイエベ・ブルベを判定するAI診断ツールを準備しています。公開時にお知らせを受け取りたい方はご連絡ください。
      </p>
      <a
        href={mailto}
        className="inline-block mt-4 bg-[#FFD84D] text-slate-900 font-semibold rounded-full px-6 py-2.5 text-sm shadow-[0_10px_30px_rgba(255,216,77,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
      >
        公開通知を受け取る
      </a>
    </section>
  );
}
