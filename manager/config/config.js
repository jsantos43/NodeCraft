import fs from 'fs';
import path from 'path';

const syncWithTemplate = (template, current) => {
  // Verify if template is an object
  if (typeof template !== 'object' || template === null) {
    // If settings.json exists, keep it
    return current !== undefined ? current : template;
  }

  // Keep template array
  if (Array.isArray(template)) {
    return template;
  }

  // Objects
  const result = {};

  for (const key of Object.keys(template)) {
    result[key] = syncWithTemplate(
      template[key],
      current ? current[key] : undefined,
    );
  }

  return result;
};

// Resolve paths
const ABSOLUTE_PATH = path.resolve(process.cwd());
const SETTINGS_PATH = path.join(ABSOLUTE_PATH, 'config.json');
const TEMPLATE_PATH = path.join(ABSOLUTE_PATH, 'src', 'templates', 'settings', 'settings.json');

// Read settings.json template
const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));

// Get settings.json actual state
let currentConfig = {};
if (fs.existsSync(SETTINGS_PATH)) {
  try {
    currentConfig = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    throw new Error('settings.json is corrupt!');
  }
}

// Sync config.json with template
const config = syncWithTemplate(template, currentConfig);
fs.writeFileSync(
  SETTINGS_PATH,
  JSON.stringify(config, null, 2),
);

config.absoutePath = ABSOLUTE_PATH;
config.instance.path ??= path.join(ABSOLUTE_PATH, 'instances');

export default Object.freeze(config);
