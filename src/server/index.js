import express from 'express';
import gspnRoutes from './routes/gspn.routes.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use('/internal', gspnRoutes);

app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'gspn-automation' });
});

app.listen(PORT, () => {
    console.log(`🚀 GSPN automation API running on http://localhost:${PORT}`);
});
