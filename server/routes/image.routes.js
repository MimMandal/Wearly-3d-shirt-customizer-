import express from 'express';
import * as dotenv from 'dotenv';
import { generatePollinationsImage } from '../../lib/image-generator.js';

dotenv.config();

const router = express.Router();

router.route('/').post(async (req, res) => {
  try {
    const { prompt, type = 'full' } = req.body;

    console.log('Generating free AI image with Pollinations for:', prompt);
    console.log('Image type:', type);

    const result = await generatePollinationsImage(prompt, type);

    res.status(200).json(result);
  } catch (error) {
    if (error.details) {
      console.error('Pollinations API Error:', error.details);
    } else {
      console.error('Error generating image:', error.message);
    }

    res.status(error.status || 500).json({ message: error.message || 'Failed to generate image' });
  }
});

export default router;
