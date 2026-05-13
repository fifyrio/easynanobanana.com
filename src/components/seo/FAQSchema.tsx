import { JsonLd } from './JsonLd';

interface FAQSchemaProps {
  items: ReadonlyArray<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ items }: FAQSchemaProps) {
  if (items.length === 0) return null;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }}
    />
  );
}
