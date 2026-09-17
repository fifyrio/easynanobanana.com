import { JsonLd } from './JsonLd';

interface ItemListSchemaProps {
  name: string;
  items: ReadonlyArray<{
    name: string;
    description?: string;
    url?: string;
    image?: string;
  }>;
}

export function ItemListSchema({ name, items }: ItemListSchemaProps) {
  if (items.length === 0) return null;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(item.url ? { url: item.url } : {}),
          ...(item.image ? { image: item.image } : {}),
        })),
      }}
    />
  );
}
