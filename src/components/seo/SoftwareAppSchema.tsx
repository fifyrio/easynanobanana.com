import { JsonLd } from './JsonLd';

interface SoftwareAppSchemaProps {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

export function SoftwareAppSchema({
  name,
  description,
  url,
  applicationCategory = 'Photo & Video',
  operatingSystem = 'Web',
  offers = { price: '0', priceCurrency: 'USD' },
}: SoftwareAppSchemaProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name,
        description,
        url,
        applicationCategory,
        operatingSystem,
        offers: {
          '@type': 'Offer',
          price: offers.price,
          priceCurrency: offers.priceCurrency,
        },
      }}
    />
  );
}
