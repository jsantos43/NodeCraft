import Path from 'path';
import { readFile } from 'node:fs/promises';
import config from '../../config/config.js';
import logger from '../../config/logger.js';

const renderTemplate = async (templateName, variables = {}) => {
  try {
    const filePath = Path.resolve(config.absoutePath, 'src', 'templates', templateName);
    let template = await readFile(filePath, 'utf8');

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    }

    return template;
  } catch (err) {
    logger.error({ err }, 'Error to read template');

    return '';
  }
};

export default renderTemplate;
