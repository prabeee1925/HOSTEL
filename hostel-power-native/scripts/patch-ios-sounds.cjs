const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const projectDir = path.join(process.cwd(), 'ios', 'App');
const projectFile = path.join(projectDir, 'App.xcodeproj', 'project.pbxproj');
const appGroupDir = path.join(projectDir, 'App');
const sourceDir = path.join(process.cwd(), 'assets', 'sounds');

if (!fs.existsSync(projectFile)) {
  console.error('Xcode project not found. Run: npm run ios:add');
  process.exit(1);
}
if (!fs.existsSync(sourceDir)) {
  console.error('Alarm sound folder not found:', sourceDir);
  process.exit(1);
}
fs.mkdirSync(appGroupDir, { recursive: true });

function stableId(kind, name) {
  return crypto.createHash('sha1').update(`hostel-power-${kind}-${name}`).digest('hex').slice(0, 24).toUpperCase();
}

function blocksIn(section) {
  const blocks = [];
  const re = /([A-F0-9]{24})\s+\/\*[^\n]*?\*\/\s*=\s*\{/g;
  let match;
  while ((match = re.exec(section))) {
    const open = section.indexOf('{', match.index);
    let depth = 0;
    let end = -1;
    for (let i = open; i < section.length; i++) {
      if (section[i] === '{') depth++;
      else if (section[i] === '}') {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    if (end > 0) blocks.push({ id: match[1], start: match.index, end, text: section.slice(match.index, end) });
    re.lastIndex = end > 0 ? end : re.lastIndex + 1;
  }
  return blocks;
}

function readSection(project, name) {
  const startMarker = `/* Begin ${name} section */`;
  const endMarker = `/* End ${name} section */`;
  const start = project.indexOf(startMarker);
  const end = project.indexOf(endMarker);
  if (start < 0 || end < 0) throw new Error(`Could not find ${name} section in project.pbxproj`);
  return { start, end: end + endMarker.length, text: project.slice(start, end + endMarker.length) };
}

function insertIntoArray(block, field, entry) {
  const marker = `${field} = (`;
  const at = block.indexOf(marker);
  if (at < 0) throw new Error(`Could not find ${field} array in Xcode project block.`);
  const close = block.indexOf(');', at);
  if (close < 0) throw new Error(`Could not close ${field} array in Xcode project block.`);
  return block.slice(0, close) + `\n\t\t\t\t${entry}\n\t\t\t` + block.slice(close);
}

let project = fs.readFileSync(projectFile, 'utf8');
const fileNames = fs.readdirSync(sourceDir).filter(name => name.toLowerCase().endsWith('.wav')).sort();
if (!fileNames.length) throw new Error('No WAV alarm tones found in assets/sounds.');

const groupSection = readSection(project, 'PBXGroup');
const groups = blocksIn(groupSection.text);
const appGroup = groups.find(block => block.text.includes('isa = PBXGroup;') && (/\bpath = App;/.test(block.text) || /\bname = App;/.test(block.text)));
if (!appGroup) throw new Error('Could not find the App group in Xcode project.pbxproj.');

const targetSection = readSection(project, 'PBXNativeTarget');
const targets = blocksIn(targetSection.text);
const appTarget = targets.find(block => block.text.includes('isa = PBXNativeTarget;') && /\bproductName = App;/.test(block.text));
if (!appTarget) throw new Error('Could not find the App native target in Xcode project.pbxproj.');
const phaseArray = appTarget.text.match(/buildPhases = \(([\s\S]*?)\);/);
if (!phaseArray) throw new Error('Could not find App target build phases.');
const phaseIds = [...phaseArray[1].matchAll(/([A-F0-9]{24})/g)].map(item => item[1]);
const resourceSection = readSection(project, 'PBXResourcesBuildPhase');
const resourceBlocks = blocksIn(resourceSection.text);
const appResources = resourceBlocks.find(block => phaseIds.includes(block.id) && block.text.includes('isa = PBXResourcesBuildPhase;'));
if (!appResources) throw new Error('Could not find the App target Copy Bundle Resources phase.');

const buildSection = readSection(project, 'PBXBuildFile');
const refSection = readSection(project, 'PBXFileReference');
let buildText = buildSection.text;
let refText = refSection.text;
let groupText = groupSection.text;
let resourceText = resourceSection.text;
let groupBlock = blocksIn(groupText).find(block => block.id === appGroup.id);
let resourceBlock = blocksIn(resourceText).find(block => block.id === appResources.id);

for (const name of fileNames) {
  const source = path.join(sourceDir, name);
  const destination = path.join(appGroupDir, name);
  fs.copyFileSync(source, destination);

  const fileId = stableId('file', name);
  const buildId = stableId('build', name);
  if (!refText.includes(fileId)) {
    refText = refText.replace('/* End PBXFileReference section */', `\t\t${fileId} /* ${name} */ = {isa = PBXFileReference; lastKnownFileType = audio.wav; path = ${name}; sourceTree = "<group>"; };\n\t/* End PBXFileReference section */`);
  }
  if (!buildText.includes(buildId)) {
    buildText = buildText.replace('/* End PBXBuildFile section */', `\t\t${buildId} /* ${name} in Resources */ = {isa = PBXBuildFile; fileRef = ${fileId} /* ${name} */; };\n\t/* End PBXBuildFile section */`);
  }
  if (!groupBlock.text.includes(fileId)) {
    groupBlock = { ...groupBlock, text: insertIntoArray(groupBlock.text, 'children', `${fileId} /* ${name} */,`) };
  }
  if (!resourceBlock.text.includes(buildId)) {
    resourceBlock = { ...resourceBlock, text: insertIntoArray(resourceBlock.text, 'files', `${buildId} /* ${name} in Resources */,`) };
  }
}

groupText = groupText.slice(0, groupBlock.start) + groupBlock.text + groupText.slice(groupBlock.end);
resourceText = resourceText.slice(0, resourceBlock.start) + resourceBlock.text + resourceText.slice(resourceBlock.end);

// Replace sections from the end backwards so earlier offsets remain valid.
const replacements = [
  { old: buildSection, value: buildText },
  { old: refSection, value: refText },
  { old: groupSection, value: groupText },
  { old: resourceSection, value: resourceText }
].sort((a, b) => b.old.start - a.old.start);
for (const item of replacements) {
  project = project.slice(0, item.old.start) + item.value + project.slice(item.old.end);
}
fs.writeFileSync(projectFile, project);
console.log(`Copied ${fileNames.length} custom notification sounds into the iOS app bundle.`);
