import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios'; // Using axios for better error handling

dotenv.config();

const router = express.Router();

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log('Loaded API Key:', process.env.LIMEWIRE_API_KEY); // Debugging line

    if (!process.env.LIMEWIRE_API_KEY) {
      return res.status(500).json({ message: 'API key is missing' });
    }

    const response = await axios.post(
      'https://api.limewire.com/v1/images/generate',
      { prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.LIMEWIRE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const image = response.data.data[0].b64_json;
    res.status(200).json({ photo: image });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Something went wrong', error: error.response?.data });
  }
});

export default router;
