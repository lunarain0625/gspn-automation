import {handleConfirmNotice} from "../utils/ui-helper.js";

export async function addParts(businessPage, data) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});

    const partPagePromise = businessPage.waitForEvent('popup');
    await rightFrame.getByRole('link', {name: 'Parts & Repair Tips'}).click();
    const partPage = await partPagePromise;
    await partPage.locator('#progressloading').waitFor({state: 'hidden'});
    for (const partNo of data.partNos) {
        await partPage.getByRole('link', {name: 'Add'}).click();
        const lastRow = partPage.locator('#toInsertPartListTableBody tr').last();
        await lastRow.locator('[name="PARTS_CODE"]').fill(partNo);
        await lastRow.locator('[name="PARTS_QTY"]').fill('1');
    }
    partPage.once('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.accept(); // 点确定
    });

    await partPage.getByRole('link', {name: 'Send To Ticket'}).click();

    // 先处理 Confirm Notice
    await handleConfirmNotice(businessPage);
    await rightFrame.locator('#progressloading').waitFor({state: 'hidden'});

    return {
        success: true,
        message: 'Parts added to job successfully'
    };

}
