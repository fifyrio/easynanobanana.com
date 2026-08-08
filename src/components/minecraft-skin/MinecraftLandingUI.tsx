import type { Step } from '@/lib/minecraft-skin';

// Server components — pure presentational.

export function StepList({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FFD84D] text-slate-900 font-bold text-sm flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{s.title}</p>
              <p className="text-slate-600 text-sm mt-0.5 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FeatureGrid({ title, features }: { title: string; features: Step[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{f.title}</p>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingFaq({ title, items }: { title: string; items: { q: string; a: string }[] }) {
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
