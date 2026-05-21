import express from 'express';
import {
    searchPartController,
    createJobController, updateJobController
} from '../controllers/gspn.controller.js';
import { requireApiKey } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireApiKey);
router.post('/search-part', searchPartController);
router.post('/create-job', createJobController);
router.post('/update-job', updateJobController)
router.post('/complete-job', completeJobController)
router.post('/deliver-good', deliverGoodController)
export default router;
