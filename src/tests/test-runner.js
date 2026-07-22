import {gspnClient} from '../automation/gspn-client.js';
import {
    testCreateJob,
    testUpdateJob,
    testSearchPart,
    testCompleteJob,
    testAddParts,
    testGetDeviceInfo, testLogin, testGetJobStatus, testGetJobInfo, testUploadJobAttachments, testSearchPartsByModel
} from './tasks.test.js';

async function run() {
    try {
        console.log('🚀 Starting GSPN test runner...\n');
        // await testLogin(gspnClient)

        await gspnClient.init();
        // await testSearchPart(gspnClient);
        await testSearchPartsByModel(gspnClient)
        // await testGetJobInfo(gspnClient);
        // await testUploadJobAttachments(gspnClient)
        // await testGetDeviceInfo(gspnClient);
        // await testCreateJob(gspnClient);
        // await testGetJobStatus(gspnClient);
        // await testUpdateJob(gspnClient);
        // await testCompleteJob(gspnClient);
        // await testAddParts(gspnClient);
        console.log('\n✅ All tests done');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        // await gspnClient.close();
    }
}


run();


