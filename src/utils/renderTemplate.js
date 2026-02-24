import Path from 'path';
import FileService from '../services/File.js';
import config from '../../config/config.js';

const renderTemplate = async (templateName, variables = {}) => {
  const filePath = Path.resolve(config.absoutePath, 'src', 'templates', templateName);
  let template = await FileService.readOneFile(filePath);

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  }

  return template;
};

export default renderTemplate;
