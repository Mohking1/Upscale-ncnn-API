const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { subscribeToProgressUpdates } = require('./Progress_update/progress');
const { upscaleImage } = require('./upscale');
const { sendImage } = require('./sendImages');
const multer = require('multer');
const path = require('path');
const { extractPNGMetadata } = require('./utils/png-metadata');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const supabaseUrl = process.env.supabaseUrl;
const supabaseKey = process.env.supabaseKey;
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

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(png|jpe?g|webp)$/i)) {
    req.fileValidationError = 'Only PNG, JPG, JPEG, and WEBP files are allowed';
    return cb(null, false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

const downloadImage = async (image, requestId) => {
  let imagePath;
  if (isURL(image)) {
    const imageUrl = new URL(image);
    const fileExtension = path.extname(imageUrl.pathname).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(fileExtension)) {
      return false;
    }

    imagePath = path.join('uploads', `${requestId}${fileExtension}`);
    const writer = fs.createWriteStream(imagePath);

    const response = await axios({
      url: imageUrl.href,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(imagePath));
      writer.on('error', err => reject(err));
    });
  } else {
    const fileExtension = path.extname(image).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(fileExtension)) {
      return false;
    }
    imagePath = path.join('uploads', `${requestId}${fileExtension}`);
    fs.copyFileSync(image, imagePath);
    return imagePath;
  }
};

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (error) {
    return false;
  }
}

app.post('/upload', upload.single('image'), async (req, res) => {
  const { model_name, scale, image, api_key } = req.body;
  let imagePath = req.file ? req.file.path : null;

  if (req.fileValidationError) {
    return res.status(400).send({ error: req.fileValidationError });
  }

  if ((imagePath && image) || (!imagePath && !image)) {
    return res.status(400).send({ error: 'Either an image file or an image URL is required, but not both' });
  }

  if (!api_key) {
    return res.status(400).send({ error: 'API key is required' });
  }

  try {
    const requestId = isURL(image) ? uuidv4() : path.basename(req.file.path, path.extname(req.file.path));

    if (isURL(image)) {
      imagePath = await downloadImage(image, requestId);
      if (!imagePath) {
        return res.status(400).send({ error: 'Only PNG, JPG, JPEG, and WEBP files are allowed' });
      }
    }

    const { data: checkData, error: checkError } = await supabase
      .rpc('check_api_key_and_quota', { api_key_param: api_key })
      .single();

    if (checkError) throw checkError;

    if (!checkData.success) {
      return res.status(403).send({ error: checkData.message });
    }

    const { data, error } = await supabase
      .from('requests')
      .insert([{
        request_id: requestId,
        model_name,
        scale,
        current_status: 0,
        image_path: imagePath,
        api: api_key
      }]);

    if (error) throw error;

    upscaleImage(imagePath, requestId, model_name, scale, res);
    subscribeToProgressUpdates(requestId, api_key);
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
