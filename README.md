# GPT-4o House Image Enhancer

This project lets users upload a photo of their home and generates a photorealistic rendering with limewashed brick and satin black trim using GPT-4o and DALL·E.

## Setup Instructions

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Visit `http://localhost:3000` to try the uploader.

## Deployment on Render

- Choose "Web Service"
- Use this repo
- Set `OPENAI_API_KEY` in environment variables
- Start command: `npm start`

## License
MIT
