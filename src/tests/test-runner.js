import {gspnClient} from '../automation/gspn-client.js';
import {
    testCreateJob,
    testUpdateJob,
    testSearchPart,
    testCompleteJob,
    testAddParts,
    testGetDeviceInfo
} from './tasks.test.js';

async function run() {
    try {
        console.log('🚀 Starting GSPN test runner...\n');
        await gspnClient.init();
        // 👉 在这里控制要跑哪个测试
        // await testSearchPart(gspnClient);

        // await testCreateJob(gspnClient);
        // await testUpdateJob(gspnClient);
        // await testCompleteJob(gspnClient);
        // await testAddParts(gspnClient);
        await testGetDeviceInfo(gspnClient);
        console.log('\n✅ All tests done');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        // await gspnClient.close();
    }
}


run();


