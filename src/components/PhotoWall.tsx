import React from 'react';

interface PhotoWallProps {
  className?: string;
}

const PhotoWall: React.FC<PhotoWallProps> = ({ className = '' }) => {
  const images = [
    {
      id: 1,
      src: "https://pbs.twimg.com/media/GyQ0RDPXMAUrPv_?format=jpg&name=medium",
      alt: "AI image editing showcase - Lars_Pragmata",
      tweetUrl: "https://x.com/Lars_pragmata/status/1955745610948337888"
    },
    {
      id: 2,
      src: "https://pbs.twimg.com/media/GyQD_oqa0AA9Co-?format=jpg&name=medium",
      alt: "Creature in blizzard - nano banana result",
      tweetUrl: "https://x.com/AIWarper/status/1955692867667832874"
    },
    {
      id: 3,
      src: "https://pbs.twimg.com/media/GyaPkwrXYAAhQxd?format=jpg&name=medium",
      alt: "Portrait transformation before",
      tweetUrl: "https://x.com/fabianstelzer/status/1956408956940861652"
    },
    {
      id: 4,
      src: "https://pbs.twimg.com/media/GyaPkwxWMAAvT21?format=jpg&name=medium",
      alt: "Portrait transformation after",
      tweetUrl: "https://x.com/fabianstelzer/status/1956408956940861652"
    },
    {
      id: 5,
      src: "https://pbs.twimg.com/media/GyTBRoxa4AY1-7V?format=jpg&name=medium",
      alt: "Portrait looking straight ahead",
      tweetUrl: "https://x.com/arrakis_ai/status/1955901155726516652"
    },
    {
      id: 6,
      src: "https://pbs.twimg.com/media/GyWDzIfW4AAYd7J?format=jpg&name=medium",
      alt: "Model comparison showcase 1",
      tweetUrl: "https://x.com/00Bohr/status/1956114536676647015"
    },
    {
      id: 7,
      src: "https://pbs.twimg.com/media/GyWDzHuXQAAkcO6?format=jpg&name=medium",
      alt: "Model comparison showcase 2", 
      tweetUrl: "https://x.com/00Bohr/status/1956114536676647015"
    },
    {
      id: 8,
      src: "https://pbs.twimg.com/media/GySoBkmb0AAd9cl?format=jpg&name=medium",
      alt: "Flux Kontext vs nano banana",
      tweetUrl: "https://x.com/noahgsolomon/status/1955872891628872187"
    },
    {
      id: 9,
      src: "https://pbs.twimg.com/media/GycfVkYaMAA3iAj?format=jpg&name=medium",
      alt: "Figure generation before",
      tweetUrl: "https://x.com/shhan1211/status/1956567023221379533"
    },
    {
      id: 10,
      src: "https://pbs.twimg.com/media/GycfVkZbwAA5C83?format=jpg&name=medium",
      alt: "Figure generation after",
      tweetUrl: "https://x.com/shhan1211/status/1956567023221379533"
    },
    {
      id: 11,
      src: "https://pbs.twimg.com/media/GyVtvvfW0AIKyoB?format=jpg&name=medium",
      alt: "Facial expression editing comparison",
      tweetUrl: "https://x.com/hellorob/status/1956097058697539827"
    },
    {
      id: 12,
      src: "https://pbs.twimg.com/media/GyQ1uDBX0AEPlso?format=png&name=medium",
      alt: "Quality enhancement before",
      tweetUrl: "https://x.com/ilkerigz/status/1955747316146847896"
    },
    {
      id: 13,
      src: "https://pbs.twimg.com/media/GyQ1wBiXQAUNG7w?format=jpg&name=medium",
      alt: "Quality enhancement after",
      tweetUrl: "https://x.com/ilkerigz/status/1955747316146847896"
    },
    {
      id: 14,
      src: "https://pbs.twimg.com/media/GyQ0RE2WAAQnivt?format=jpg&name=medium",
      alt: "Advanced editing example",
      tweetUrl: "https://x.com/Lars_pragmata/status/1955745610948337888"
    },
    {
      id: 15,
      src: "https://pbs.twimg.com/media/GyQEBUmbkAAwKa8?format=jpg&name=medium",
      alt: "Kontext MAX comparison",
      tweetUrl: "https://x.com/AIWarper/status/1955692867667832874"
    }
  ];

  return (
    <div className={`mx-auto max-w-fit columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 px-4 pt-4 md:px-6 md:pt-6 ${className}`}>
      {images.map((image) => (
        <div key={image.id} className="mb-4 break-inside-avoid">
          <a 
            href={image.tweetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="relative overflow-hidden rounded-lg bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.02]">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default PhotoWall;