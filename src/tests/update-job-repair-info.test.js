import { gspnClient } from '../automation/gspn-client.js';

export async function testUpdateRepairInfo() {
    await gspnClient.init();

    await gspnClient.updateJob('repair_info', {
        jobNo: 'TEST123',
        repairCode: 'ABC',
        defectCode: 'XYZ'
    });
}
