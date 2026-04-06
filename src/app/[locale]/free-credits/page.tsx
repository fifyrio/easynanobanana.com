import { redirect } from 'next/navigation';

export default function FreeCreditsPage({ params: { locale } }: { params: { locale: string } }) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  redirect(`${prefix}/pricing`);
}