import es from '@/data/minecraft-skin/landing.es.json';
import pt from '@/data/minecraft-skin/landing.pt.json';
import de from '@/data/minecraft-skin/landing.de.json';
import en from '@/data/minecraft-skin/landing.en.json';

export interface Step {
  title: string;
  body: string;
}

export interface MinecraftLanding {
  locale: string;
  ogLocale: string;
  h1: string;
  lead: string;
  steps: Step[];
  features: Step[];
  faq: { q: string; a: string }[];
  seo: { title: string; description: string; keywords: string };
}

const LANDINGS: Record<string, MinecraftLanding> = {
  es: es as MinecraftLanding,
  pt: pt as MinecraftLanding,
  de: de as MinecraftLanding,
  en: en as MinecraftLanding,
};

/** Locales that have a dedicated Minecraft-skin landing page. */
export const MINECRAFT_LANDING_LOCALES = ['en', 'es', 'pt', 'de'] as const;

export function getMinecraftLanding(locale: string): MinecraftLanding | null {
  return LANDINGS[locale] ?? null;
}
