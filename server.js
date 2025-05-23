// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CORS configuration to support local file:// testing and frontend deployments
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
    'null',
    '*'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.static('public'));

app.post('/api/gpt4o-image-enhance', async (req, res) => {
  try {
    const { image, userPrompt } = req.body;
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Step 1: Use GPT-4o to analyze the image and produce an architectural description
    const analysisMessages = [
      {
        role: 'system',
        content: `You are a professional architectural visual analyst. Analyze the uploaded photo of a house and describe its features in detail, including shape, roof style, garage count and layout, brick type, trim color, window layout, and landscaping. Do not speculate or hallucinate. Focus only on what is clearly visible in the image.`
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

    // Step 2: Ask GPT-4o to rewrite the transformation prompt for DALL·E
    const promptMessages = [
      {
        role: 'system',
        content: `You are a strict prompt engineer tasked with transforming house photos while preserving their architecture. Generate a DALL·E 3 prompt based on the provided home description. Absolutely DO NOT alter the layout, proportions, shape, window count, roof lines, or structure. DO NOT redesign the house or change materials. Only apply enhancements as instructed. Do NOT include text, annotations, callouts, diagram labels, or fantasy edits. Prioritize realism, fidelity to the original house, and accurate transformations only.`
      },
      {
        role: 'user',
        content: `Based on the following house description, write a DALL·E 3 prompt that transforms the house by applying a white limewash (with red bleed-through) and converting all trim, gutters, fascia, soffits, and doors to satin black. Here is the house description:

${houseDescription}`
      }
    ];

    const promptResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: promptMessages
    });

    const improvedPrompt = promptResponse.choices[0]?.message?.content?.trim();
    if (!improvedPrompt) throw new Error('Failed to generate DALL·E prompt');

    // Step 3: Generate image from DALL·E
    const imageResp = await openai.images.generate({
      model: 'dall-e-3',
      prompt: improvedPrompt,
      n: 1,
      size: '1024x1024'
    });

    const imageUrl = imageResp.data[0].url;
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
