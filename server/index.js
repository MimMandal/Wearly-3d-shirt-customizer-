import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import imageRoutes from './routes/image.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/dalle', imageRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello from AI image API' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
