import { gspnClient } from '../../automation/gspn-client.js';

export async function searchPartController(req, res) {
    try {
        const { partNo } = req.body;

        if (!partNo) {
            return res.status(400).json({
                success: false,
                message: 'partNo is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.searchPart(partNo);

        return res.json(result);
    } catch (error) {
        console.error('searchPartController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function createJobController(req, res) {
    try {
        const data = req.body;

        if (!data?.solvupId) {
            return res.status(400).json({
                success: false,
                message: 'solvupId is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.createJob(data);

        return res.json(result);
    } catch (error) {
        console.error('createJobController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
