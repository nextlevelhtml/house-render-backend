import express from 'express';
import bodyParser from 'body-parser';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      origin === 'null' ||
      origin.startsWith('http://localhost') ||
      /^http:\/\/192\\.168\\.\\d+\\.\\d+/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST'],
  credentials: false
}));

app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.static('public'));

app.post('/api/gpt4o-image-enhance', async (req, res) => {
  try {
    const { image, userPrompt } = req.body;
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const messages = [
      {
        role: 'system',
        content: `You are a visual design assistant. Your job is to interpret images of houses and generate enhanced prompts for photorealistic renderings.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${userPrompt}\\n\\nFocus on realism, spatial consistency, and accurate visual representation. Do not hallucinate features or remove structural elements.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`
            }
          }
        ]
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const improvedPrompt = completion.choices[0]?.message?.content;

    const imageResp = await openai.images.generate({
      model: 'dall-e-3',
      prompt: improvedPrompt,
      n: 1,
      size: '1024x1024'
    });

    const imageUrl = imageResp.data[0].url;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));
