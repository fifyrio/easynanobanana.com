import AiToolsShowcase from '@/components/AiToolsShowcase';

export default function AiImageEffectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AiToolsShowcase />
    </>
  );
}
