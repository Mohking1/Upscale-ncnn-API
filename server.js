const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { subscribeToProgressUpdates } = require('./progress');
const { upscaleImage } = require('./upscale');
const { sendImage } = require('./sendImages');
const multer = require('multer');
const path = require('path');
const { extractPNGMetadata } = require('./png-metadata');
const fs = require('fs');
const axios = require('axios');

const app = express();

const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const requestId = uuidv4();
    cb(null, `${requestId}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

const downloadImage = async (imageUrl, requestId) => {
  const imagePath = path.join('uploads', `${requestId}.png`);
  const writer = fs.createWriteStream(imagePath);

  const response = await axios({
    url: imageUrl,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(imagePath));
    writer.on('error', err => reject(err));
  });
};

app.post('/upload', upload.single('image'), async (req, res) => {
  const { model_name, scale, imageUrl } = req.body;
  const height = req.body.height || null;
  const width = req.body.width || null;
  let imagePath = req.file ? req.file.path : null;

  if (!imagePath && !imageUrl) {
    return res.status(400).send({ error: 'Either an image file or an image URL is required' });
  }

  if (!model_name || !scale) {
    return res.status(400).send({ error: 'model_name and scale are required' });
  }

  try {
    const requestId = imageUrl ? uuidv4() : path.basename(req.file.path, path.extname(req.file.path));

    if (imageUrl) {
      imagePath = await downloadImage(imageUrl, requestId);
    }

    const { data, error } = await supabase
      .from('requests')
      .insert([{
        request_id: requestId,
        model_name,
        height,
        width,
        scale,
        current_status: 0,
        image_path: imagePath
      }]);

    if (error) throw error;

    upscaleImage(imagePath, requestId, model_name, height, width, res);
    subscribeToProgressUpdates(requestId, model_name, height, width, scale);
    extractPNGMetadata(imagePath, requestId);
    res.status(200).send({ requestId });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.get('/upscaled/:requestId', async (req, res) => {
  const { requestId } = req.params;
  sendImage(requestId, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});