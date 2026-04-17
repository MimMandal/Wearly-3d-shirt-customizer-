import { generatePollinationsImage } from '../../lib/image-generator.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ message: 'Method not allowed' }, { status: 405 });
    }

    try {
      const { prompt, type = 'full' } = await request.json();
      const result = await generatePollinationsImage(prompt, type);

      return Response.json(result, { status: 200 });
    } catch (error) {
      if (error.details) {
        console.error('Pollinations API Error:', error.details);
      } else {
        console.error('Error generating image:', error.message);
      }

      return Response.json(
        { message: error.message || 'Failed to generate image' },
        { status: error.status || 500 }
      );
    }
  },
};
