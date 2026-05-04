import FileService from '../services/File.js';

const download = async (path, url) => {
  const response = await fetch(url);
  const blob = await response.blob();

  // Convert Blob in an Buffer before write file
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await FileService.createOneFile(path, buffer);
};

export default download;
