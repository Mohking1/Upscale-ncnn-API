const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { subscribeToProgressUpdates } = require('./progress');
const { upscaleImage } = require('./upscale');
const { sendImage } = require('./sendImages');
const multer = require('multer');
const path = require('path');
const requestIp = require('request-ip');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use((req, res, next) => {
  const clientIp = requestIp.getClientIp(req);
  const isLocalAddress = clientIp === '::1' || clientIp === '127.0.0.1';

  if (isLocalAddress) {
    console.log('Local client detected');
    req.clientIp = '127.0.0.1';
  } else {
    console.log('Client IP:', clientIp);
    req.clientIp = clientIp;
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up storage engine with multer
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

// Endpoint to handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  const { model_name, scale } = req.body;
  const height = req.body.height || null;
  const width = req.body.width || null;
  const imagePath = req.file.path;

  if (!imagePath || !model_name || !scale) {
    return res.status(400).send({ error: 'Image, model_name, and scale are required' });
  }

  try {
    const requestId = path.basename(req.file.path, path.extname(req.file.path));

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