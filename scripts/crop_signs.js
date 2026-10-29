import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MASTER_IMG = 'public/assets/aistudio/image_e9a5ac5e.png';
const OUT_DIR = 'public/signs/real';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Helper to crop
function crop(outName, w, h, x, y) {
  const outPath = path.join(OUT_DIR, outName);
  const cmd = `convert "${MASTER_IMG}" -crop ${w}x${h}+${x}+${y} +repage "${outPath}"`;
  try {
    execSync(cmd);
    console.log(`Generated: ${outName}`);
  } catch (err) {
    console.error(`Failed ${outName}:`, err.message);
  }
}

console.log('--- Cropping Section F: Common Words ---');
// Section F has 6 columns: Yes, No, Please, Thank you, Sorry, Hello
// Width ~ 86 each, height ~ 110, y=730
const row1F = [
  { name: 'yes.png', x: 10 },
  { name: 'no.png', x: 100 },
  { name: 'please.png', x: 191 },
  { name: 'thank_you.png', x: 282 },
  { name: 'sorry.png', x: 373 },
  { name: 'hello.png', x: 464 }
];
for (const item of row1F) {
  crop(item.name, 86, 110, item.x, 730);
}
// Also alias namaste to hello
crop('namaste.png', 86, 110, 464, 730);

// Row 2: y=850 (Good, Bad, Help, Stop, Come, Go)
const row2F = [
  { name: 'good.png', x: 10 },
  { name: 'bad.png', x: 100 },
  { name: 'help.png', x: 191 },
  { name: 'stop.png', x: 282 },
  { name: 'come.png', x: 373 },
  { name: 'go.png', x: 464 }
];
for (const item of row2F) {
  crop(item.name, 86, 110, item.x, 850);
}

console.log('--- Cropping Section H: Everyday Needs ---');
// Section H: Eat, Drink, Water, Food / Toilet, Sleep, House, School
// Width ~ 116 each, height ~ 110, y=730
const row1H = [
  { name: 'eat.png', x: 1052 },
  { name: 'drink.png', x: 1174 },
  { name: 'water.png', x: 1296 },
  { name: 'food.png', x: 1418 }
];
for (const item of row1H) {
  crop(item.name, 114, 110, item.x, 730);
}

// Row 2: y=850
const row2H = [
  { name: 'toilet.png', x: 1052 },
  { name: 'sleep.png', x: 1174 },
  { name: 'house.png', x: 1296 },
  { name: 'school.png', x: 1418 }
];
for (const item of row2H) {
  crop(item.name, 114, 110, item.x, 850);
}
// Alias restroom to toilet
crop('restroom.png', 114, 110, 1052, 850);

console.log('--- Cropping Section G: Useful Phrases ---');
// Section G: How are you?, I am fine, What is your name?, My name is...
// Row 1: y=730
const row1G = [
  { name: 'how_are_you.png', x: 560 },
  { name: 'i_am_fine.png', x: 682 },
  { name: 'what_is_your_name.png', x: 804 },
  { name: 'my_name_is.png', x: 926 }
];
for (const item of row1G) {
  crop(item.name, 116, 110, item.x, 730);
}
crop('i_me.png', 116, 110, 926, 730);

// Row 2: y=850: Where?, When?, Why?, Because
const row2G = [
  { name: 'where.png', x: 560 },
  { name: 'when.png', x: 682 },
  { name: 'why.png', x: 804 },
  { name: 'because.png', x: 926 }
];
for (const item of row2G) {
  crop(item.name, 116, 110, item.x, 850);
}

console.log('--- Cropping Section B: Numbers (0-10) ---');
// Numbers Row 1: 0 to 5
const numRow1 = ['0', '1', '2', '3', '4', '5'];
numRow1.forEach((num, idx) => {
  crop(`num_${num}.png`, 70, 126, 606 + idx * 77, 126);
});
// Numbers Row 2: 6 to 10
const numRow2 = ['6', '7', '8', '9', '10'];
numRow2.forEach((num, idx) => {
  crop(`num_${num}.png`, 84, 126, 606 + idx * 92, 268);
});

// Map Peace/Victory to num_2 (index + middle)
crop('peace.png', 70, 126, 606 + 2 * 77, 126);
// Map OK to num_0
crop('ok.png', 70, 126, 606 + 0 * 77, 126);

console.log('--- Cropping Section A: Alphabet (A-Z) ---');
// Row 1: A-G, y=118
const row1A = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
row1A.forEach((letter, idx) => {
  crop(`letter_${letter.toLowerCase()}.png`, 76, 118, 12 + idx * 82, 118);
});
// Row 2: H-N, y=248
const row2A = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
row2A.forEach((letter, idx) => {
  crop(`letter_${letter.toLowerCase()}.png`, 76, 118, 12 + idx * 82, 248);
});
// Row 3: O-U, y=378
const row3A = ['O', 'P', 'Q', 'R', 'S', 'T', 'U'];
row3A.forEach((letter, idx) => {
  crop(`letter_${letter.toLowerCase()}.png`, 76, 118, 12 + idx * 82, 378);
});
// Row 4: V-Z, y=508
const row4A = ['V', 'W', 'X', 'Y', 'Z'];
row4A.forEach((letter, idx) => {
  crop(`letter_${letter.toLowerCase()}.png`, 76, 118, 12 + idx * 82, 508);
});

// Aliases for general gestures:
// Call (Hand phone sign: letter Y has thumb and pinky extended)
crop('call.png', 76, 118, 12 + 3 * 82, 508);
// I Love You (letter Y shape in ISL alphabet)
crop('i_love_you.png', 76, 118, 12 + 3 * 82, 508);
// Friend (linked hands / letter G)
crop('friend.png', 76, 118, 12 + 6 * 82, 118);

console.log('All crops finished successfully!');
