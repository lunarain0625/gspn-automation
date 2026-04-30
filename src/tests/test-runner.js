import {gspnClient} from '../automation/gspn-client.js';
import {testCreateJob, testUpdateJob, testSearchPart} from './search-part.test.js';
import {testUpdateRepairInfo} from "./update-job-repair-info.test.js";

async function run() {
    try {
        console.log('🚀 Starting GSPN test runner...\n');

        await gspnClient.init();

        // 👉 在这里控制要跑哪个测试
        // await testSearchPart(gspnClient);
        await testCreateJob(gspnClient);
        // await testUpdateJob(gspnClient);
        // await testUpdateRepairInfo();


        console.log('\n✅ All tests done');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        // await gspnClient.close();
    }
}


run();
