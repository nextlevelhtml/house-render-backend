// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.static('public'));

app.post('/api/gpt4o-image-enhance', async (req, res) => {
  try {
    const { image, userPrompt } = req.body;
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Step 1: Analyze the image using GPT-4o
    const analysisMessages = [
      {
        role: 'system',
        content: `You are a professional architectural visual analyst. Describe the visible features of the house image, including roof style, garage layout, window count, trim color, brick pattern, entry style, and landscaping. Do NOT speculate or hallucinate. Only describe what you can clearly see.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this home in precise architectural detail.'
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

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: analysisMessages
    });

    const houseDescription = analysisResponse.choices[0]?.message?.content?.trim();
    if (!houseDescription) throw new Error('Failed to generate house description');

    // 🔒 Step 2: Build a stricter DALL·E prompt
    const visualConstraints = `
Do NOT alter or redesign the house.
Do NOT change the shape, elevation, layout, structure, window count, roof pitch, dormers, or trim layout.
Do NOT add decorative features, shutters, chimneys, dormers, or architectural enhancements.
This is NOT a fantasy edit or style render.
Only apply color and material changes as instructed.`;

    const promptMessages = [
      {
        role: 'system',
        content: `You are a prompt engineer for photorealistic architectural visualizations. You will create an extremely strict DALL·E 3 prompt based on a description of a real house, applying specific visual edits without changing structure or design.`
      },
      {
        role: 'user',
        content: `${visualConstraints}

Here is the architectural description of the house:
${houseDescription}

Now, generate a DALL·E 3 prompt that applies the following transformation:
${userPrompt}`
      }
    ];

    const promptResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: promptMessages
    });

    const improvedPrompt = promptResponse.choices[0]?.message?.content?.trim();
    if (!improvedPrompt) throw new Error('Failed to generate DALL·E prompt');

    // Step 3: Generate the image using DALL·E
    const imageResp = await openai.images.generate({
      model: 'dall-e-3',
      prompt: improvedPrompt,
      n: 1,
      size: '1024x1024'
    });

    const imageUrl = imageResp.data[0].url;

    // ✅ Send response with debug info
    res.json({
      success: true,
      imageUrl,
      houseDescription,
      dallePrompt: improvedPrompt
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
