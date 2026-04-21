import express from 'express';
import {
    searchPartController,
    createJobController
} from '../controllers/gspn.controller.js';
import { requireApiKey } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireApiKey);
router.post('/search-part', searchPartController);
router.post('/create-job', createJobController);

export default router;
