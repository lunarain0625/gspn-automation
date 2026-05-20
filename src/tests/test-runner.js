import {gspnClient} from '../automation/gspn-client.js';
import {testCreateJob, testUpdateJob, testSearchPart} from './search-part.test.js';
import {testUpdateRepairInfo} from "./update-job-repair-info.test.js";

async function run() {
    try {
        console.log('🚀 Starting GSPN test runner...\n');

        await gspnClient.init();

        // 👉 在这里控制要跑哪个测试
        // await testSearchPart(gspnClient);
        // await testCreateJob(gspnClient);
        await testUpdateJob(gspnClient);
        // await testUpdateRepairInfo();
        // await testCloseJob(gspnClient);

        console.log('\n✅ All tests done');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        // await gspnClient.close();
    }
}


run();


async function testCloseJob(client) {

    const data = {
        source: 'SOLVUP',
        solvupId: '00000003',
        vendorRa: '4435641915',
        warrantyType: 'OW',
        repairCode: 'SRC038',
        symptomName: 'NO CHARGING',
        symptomCode1: 'L2',
        symptomCode2: '02',
        symptomCode3: '02',
        irisSymptQcode: 'SRC505',
        irisSympt: '120',
        diagnosisNote: 'Device no power on. Tested with known good charger. No current draw detected.',
        purchaseDate: '14.10.2022',
        productSerialNumber: '350956651025131',
        faultReport: "no power no charging",
    };
    const result = await client.closeJob(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}
