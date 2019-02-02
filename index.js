const fs = require('fs');
const path = require('path');
const gm = require('gm');
const program = require('commander');

const colors = require('./colors');
const { ROLES, DUNGEONS, DUNGEON_NAMES } = require('./constants');

const DUNGEON_PATH = path.resolve(path.join(__dirname, 'dungeons'));
const ROLE_PATH = path.resolve(path.join(__dirname, 'roles'));
const output = path.resolve(path.join(__dirname, 'output.png'));

program
  .version('0.1.0')
  .option('-l, --level [level]', 'Mythic + Level')
  .option('-d, --dungeon [dungeon]', 'Dungeon name')
  .option('-r, --role [role]', 'Role', 'healer')
  .option('-f, --font [path]', 'Use the specified font', '/Library/Fonts//Arial Bold.ttf')
  .parse(process.argv);

if (!program.level) {
  throw new TypeError('"--level" must be provided');
}

if (!program.dungeon) {
  throw new TypeError('"--dungeon" must be provided');
}

function ensureImage(fileName) {
  return fileName.endsWith('jpg') || fileName.endsWith('png');
}

function mapImage(basePath) {
  return (baseName) => {
    return {
      fullPath: path.join(basePath, baseName),
      filename: baseName,
      name: path.basename(baseName),
    };
  };
}

const dungeonAssets = fs.readdirSync(DUNGEON_PATH).filter(ensureImage).map(mapImage(DUNGEON_PATH));
const roleAssets = fs.readdirSync(ROLE_PATH).filter(ensureImage).map(mapImage(ROLE_PATH));

// Get aliased value

const providedDungeon = DUNGEONS[program.dungeon] || program.dungeon;
const providedRole = ROLES[program.role] || program.role;

function getDungeon() {
  let result = dungeonAssets.filter(dungeon => {
    if (dungeon.name.toLowerCase().startsWith(providedDungeon)) {
      return true;
    }
  });

  result = result && result[0];

  return result;
}

function getRole() {
  let result = roleAssets.filter(role => {
    if (role.name.toLowerCase().startsWith(providedRole)) {
      return true;
    }
  });

  result = result && result[0];

  return result;
}

const image = getDungeon();
const role = getRole();

if (!role || !image) {
  throw new TypeError('Invalid role or dungeon');
}

let povText;

switch (providedRole) {
  case 'heal':
    povText = 'Healer PoV';
    break;
  case 'tank':
    povText = 'Tank PoV';
    break;
  case 'dps':
    povText = 'DPS PoV';
    break;
}

gm(image.fullPath)
  .font(program.font)
  .stroke("#000000")
  .strokeWidth(2)
  .fontSize(150)
  .fill(colors.HEALER)
  .drawText(0, 110, '+' + program.level, 'center')
  .fill('#ffffff')
  .fontSize(100)
  .drawText(0, 240, povText, 'center')
  .write(output, function (err) {
    gm(output)
//       .gravity('center')
      .composite(role.fullPath)
      .geometry('+922+502')
      .write(output, function (err) {
        if (!err) console.log('done');
        console.log(err);
      });
  });

