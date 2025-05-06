const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/generate-image', upload.single('image'), async (req, res) => {
  try {
    const prompt = "Recreate this house with a white limewash finish and satin black trim. Keep the geometry, shape, and perspective identical.";

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    res.json({ imageUrl: response.data.data[0].url });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
