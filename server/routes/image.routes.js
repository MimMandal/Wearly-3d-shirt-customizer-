import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = express.Router();
const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';

const buildImagePrompt = (prompt, type) => {
  const cleanedPrompt = prompt.trim();

  if (type === 'logo') {
    return [
      'Create a clean apparel logo design.',
      'Centered composition.',
      'Bold vector style.',
      'Transparent background look.',
      'Isolated logo only.',
      'No square background.',
      'No poster layout.',
      'No colored backdrop.',
      'High contrast.',
      'No mockup.',
      'No t-shirt.',
      'No watermark.',
      `Concept: ${cleanedPrompt}.`,
    ].join(' ');
  }

  return [
    'Create a premium front-of-shirt graphic design.',
    'Large centered apparel print.',
    'Isolated artwork only.',
    'Transparent background look.',
    'No square background.',
    'No poster layout.',
    'No mockup.',
    'No mannequin.',
    'No watermark.',
    `Concept: ${cleanedPrompt}.`,
  ].join(' ');
};

router.route('/').post(async (req, res) => {
  try {
    const { prompt, type = 'full' } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const finalPrompt = buildImagePrompt(prompt, type);
    const imageUrl =
      `${POLLINATIONS_BASE_URL}/${encodeURIComponent(finalPrompt)}` +
      '?width=1024&height=1024&model=flux&nologo=true&private=true&enhance=true&safe=true';

    console.log('Generating free AI image with Pollinations for:', prompt);
    console.log('Image type:', type);

    const response = await fetch(imageUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API Error:', errorText);
      return res.status(response.status).json({ message: 'Failed to generate image from free provider' });
    }

    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const photo = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    res.status(200).json({ photo });
  } catch (error) {
    console.error('Error generating image:', error.message);
    res.status(500).json({ message: error.message || 'Failed to generate image' });
  }
});

export default router;
