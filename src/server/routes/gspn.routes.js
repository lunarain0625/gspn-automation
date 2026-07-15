import express from 'express';
import {
    searchPartController,
    createJobController,
    updateJobController,
    completeJobController,
    deliverGoodController,
    addPartsController,
    getDeviceController, gspnStateController, gspnLoginController, gspnLogoutController, getJobStatusController,
    getJobInfoController
} from '../controllers/gspn.controller.js';
import {requireApiKey} from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireApiKey);
router.post('/search-part', searchPartController);
router.post('/create-job', createJobController);
router.post('/update-job', updateJobController);
router.post('/add-parts', addPartsController);
router.post('/complete-job', completeJobController);
router.post('/deliver-good', deliverGoodController);

router.get('/get-job-status', getJobStatusController);
router.get('/get-job-info', getJobInfoController);

router.get('/get-device-info', getDeviceController);
router.get('/gspn-client-state', gspnStateController);
router.post('/login', gspnLoginController)
router.post('/logout', gspnLogoutController)
export default router;
