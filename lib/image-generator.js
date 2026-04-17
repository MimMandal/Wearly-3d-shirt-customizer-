const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';

export const buildImagePrompt = (prompt, type) => {
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

export const generatePollinationsImage = async (prompt, type = 'full') => {
  if (!prompt || prompt.trim() === '') {
    const error = new Error('Prompt is required');
    error.status = 400;
    throw error;
  }

  const finalPrompt = buildImagePrompt(prompt, type);
  const imageUrl =
    `${POLLINATIONS_BASE_URL}/${encodeURIComponent(finalPrompt)}` +
    '?width=1024&height=1024&model=flux&nologo=true&private=true&enhance=true&safe=true';

  const response = await fetch(imageUrl);

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error('Failed to generate image from free provider');
    error.status = response.status;
    error.details = errorText;
    throw error;
  }

  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  return {
    photo: `data:${mimeType};base64,${imageBuffer.toString('base64')}`,
  };
};
