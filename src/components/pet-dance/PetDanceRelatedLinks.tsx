import Link from 'next/link';

export interface RelatedLink {
  href: string;
  emoji: string;
  title: string;
  description: string;
}

export interface RelatedSection {
  badge: string;
  title: string;
  links: RelatedLink[];
}

interface PetDanceRelatedLinksProps {
  section: RelatedSection;
}

/**
 * Internal-link matrix to sibling pages in the /ai-pet-video cluster.
 * Distributes link equity and keeps each keyword on its own dedicated page —
 * the opposite of pointing every keyword at one homepage.
 */
export default function PetDanceRelatedLinks({ section }: PetDanceRelatedLinksProps) {
  if (section.links.length === 0) return null;

  return (
    <section className="bg-white text-slate-900">
      <div className="mx-auto max-w-6xl space-y-3 px-4 pt-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{section.badge}</p>
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{section.title}</h2>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-4 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {section.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start gap-4 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-[0_15px_40px_rgba(247,201,72,0.15)] transition hover:-translate-y-1 hover:border-[#F0A202]"
          >
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-[#FFD84D] text-xl shadow">
              {link.emoji}
            </span>
            <span>
              <span className="flex items-center gap-1 text-base font-semibold text-slate-900">
                {link.title}
                <span className="text-[#C69312] transition group-hover:translate-x-0.5">→</span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-600">{link.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
