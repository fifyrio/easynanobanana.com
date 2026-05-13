import { JsonLd } from './JsonLd';

interface WebsiteSchemaProps {
  name: string;
  url: string;
  description: string;
  logoUrl?: string;
}

export function WebsiteSchema({
  name,
  url,
  description,
  logoUrl = 'https://www.easynanobanana.com/images/logo.png',
}: WebsiteSchemaProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name,
            url,
            description,
            publisher: {
              '@type': 'Organization',
              name,
              url,
              logo: {
                '@type': 'ImageObject',
                url: logoUrl,
              },
            },
          },
          {
            '@type': 'Organization',
            name,
            url,
            logo: {
              '@type': 'ImageObject',
              url: logoUrl,
            },
          },
        ],
      }}
    />
  );
}
