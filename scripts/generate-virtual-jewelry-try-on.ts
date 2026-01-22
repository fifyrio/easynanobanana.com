import fs from 'fs';
import path from 'path';
import { JEWELRY_STYLES } from '../src/data/jewelry/jewelry-data';

const outputPath = path.join(process.cwd(), 'src/data/virtual-jewelry-try-on.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const sortedJewelry = [...JEWELRY_STYLES].sort((a, b) => b.popularity - a.popularity);

fs.writeFileSync(outputPath, JSON.stringify(sortedJewelry, null, 2) + '\n', 'utf8');
console.log(`Generated ${outputPath}`);
