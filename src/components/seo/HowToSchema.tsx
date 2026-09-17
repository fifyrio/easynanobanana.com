import { JsonLd } from './JsonLd';

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: ReadonlyArray<{
    name: string;
    text: string;
  }>;
  /** ISO 8601 duration, e.g. 'PT2M' for two minutes. */
  totalTime?: string;
  image?: string;
}

export function HowToSchema({ name, description, steps, totalTime, image }: HowToSchemaProps) {
  if (steps.length === 0) return null;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description,
        ...(totalTime ? { totalTime } : {}),
        ...(image ? { image } : {}),
        step: steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      }}
    />
  );
}
