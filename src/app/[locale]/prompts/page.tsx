import { redirect } from 'next/navigation';

export default function PromptsRedirectPage() {
  redirect('/prompt-history');
}
