import { JsonLd } from './JsonLd';

interface VideoObjectSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl: string;
  /** ISO 8601 date, e.g. '2026-09-16'. */
  uploadDate: string;
  /** ISO 8601 duration, e.g. 'PT4S'. */
  duration?: string;
  embedUrl?: string;
}

export function VideoObjectSchema({
  name,
  description,
  thumbnailUrl,
  contentUrl,
  uploadDate,
  duration,
  embedUrl,
}: VideoObjectSchemaProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name,
        description,
        thumbnailUrl: [thumbnailUrl],
        contentUrl,
        uploadDate,
        ...(duration ? { duration } : {}),
        ...(embedUrl ? { embedUrl } : {}),
      }}
    />
  );
}
