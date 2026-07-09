import {clickUntil, fillVisibleInputById, handleConfirmNotice} from "../utils/ui-helper.js";

export async function getJobStatus(businessPage) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    await rightFrame.locator('#STATUS').waitFor({state: 'visible'}).catch(() => {
    });

    //change status
    const status = await rightFrame.locator('#STATUS').inputValue();
    await businessPage.waitForTimeout(1000);
    const reason = await rightFrame.locator('select[name="REASON"]').inputValue();


    return {
        success: true,
        status,
        reason
    };
}
