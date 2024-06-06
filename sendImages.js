const fs = require('fs');
const path = require('path');

const sendImage = (requestId, res) => {
  const imagePath = path.join(__dirname, 'upscaled', `${requestId}.png`);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send({ error: 'Image not found' });
  }
};

module.exports = { sendImage };
