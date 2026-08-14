import { Metadata } from 'next';

/**
 * Referral code pages (/ref/[code]) exist to onboard invited users, not to
 * rank or attract backlinks. Emit a noindex/nofollow robots directive so
 * search engines drop them from the index and stop passing them link equity.
 *
 * Intentionally NOT blocked in robots.txt: a crawl-block there would stop
 * Google from ever reading this noindex tag, which would keep the pages
 * indexed. The meta directive is the correct tool for de-indexing.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RefLayout({ children }: { children: React.ReactNode }) {
  return children;
}
