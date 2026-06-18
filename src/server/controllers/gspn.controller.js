import {gspnClient} from '../../automation/gspn-client.js';

export async function searchPartController(req, res) {
    try {
        const {partNo} = req.body;

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

export async function getDeviceController(req, res) {
    try {
        const {sn} = req.query;

        if (!sn) {
            return res.status(400).json({
                success: false,
                message: 'sn is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.getDeviceInfoBySn(sn);

        return res.json(result);
    } catch (error) {
        console.error('getDeviceController error:', error);
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

export async function updateJobController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.updateJob("repair_info", data);

        return res.json(result);
    } catch (error) {
        console.error('updateJobController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function addPartsController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        if (!data?.partNos?.length) {
            return res.status(400).json({
                success: false,
                message: 'partNos is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.addParts(data);

        return res.json(result);
    } catch (error) {
        console.error('addPartsController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function completeJobController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.completeJob(data);

        return res.json(result);
    } catch (error) {
        console.error('completeJobController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function deliverGoodController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.deliverGood(data);

        return res.json(result);
    } catch (error) {
        console.error('deliverGoodController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
