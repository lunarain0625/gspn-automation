import {clickUntil, fillVisibleInputById} from "../utils/ui-helper.js";

export async function updateJobRepairInfo(businessPage, data) {
    console.log('🔧 Updating repair info:', data);

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({ state: 'visible' });


    throw new Error('updateJobRepairInfo is not implemented yet');
}
