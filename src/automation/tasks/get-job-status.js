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
    //extract create date
    const jobInfoText = await rightFrame
        .locator('span[title*="Object ID // Wty Bill No // ASC Job No // Create Date"]')
        .textContent() || '';

    const cleanedJobInfoText = jobInfoText
        .replace('[', '')
        .replace(']', '')
        .replace(/&nbsp;/g, ' ') // 如果读取的是 innerHTML 才需要，textContent 通常不用
        .trim();

    const values = cleanedJobInfoText
        .split('//')
        .map(v => v.trim());

    const createDate = values[3];
    return {
        success: true,
        status,
        reason,
        createDate
    };
}
