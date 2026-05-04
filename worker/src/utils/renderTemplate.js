import Path from 'path';
import FileService from '../services/File.js';
import env from '../../config/env.js';

const renderTemplate = async (templateName, variables = {}) => {
  const filePath = Path.resolve(env.ABSOLUTE_PATH, 'src', 'templates', templateName);
  let template = await FileService.readOneFile(filePath);

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  }

  return template;
};

export default renderTemplate;
