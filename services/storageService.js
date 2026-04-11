const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const getFilePath = (filename) => {
  return path.join(UPLOADS_DIR, filename);
};

const deleteFile = (filename) => {
  const filePath = getFilePath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getFileUrl = (filename) => {
  return `/api/documents/file/${filename}`;
};

module.exports = { getFilePath, deleteFile, getFileUrl, UPLOADS_DIR };
