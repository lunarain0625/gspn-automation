import {handleConfirmNotice, waitForLoadingOverlay} from "../utils/ui-helper.js";

export async function addParts(businessPage, data) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});

    const addedPartNos = await rightFrame
        .locator('#partsTableBody [name="PARTS_CODE"]')
        .evaluateAll(inputs =>
            inputs.map(input => input.value.trim()).filter(Boolean)
        );

    const toAddPartNos = data.partNos.filter(
        partNo => !addedPartNos.includes(partNo)
    );
    console.log('Existing parts:', addedPartNos);
    console.log('Parts to add:', toAddPartNos);

    if (toAddPartNos.length === 0) {
        return {
            success: true,
            message: 'No parts to add'
        };
    }
    await rightFrame.locator('#LAB_TYPE').selectOption('L2');
    await rightFrame.locator('#IRIS_REPAIR_QCODE').selectOption('SRC500');
    await rightFrame.locator('#IRIS_REPAIR').selectOption('A');

    const partPagePromise = businessPage.waitForEvent('popup');
    await rightFrame.getByRole('link', {name: 'Parts & Repair Tips'}).click();
    const partPage = await partPagePromise;
    await partPage.locator('#progressloading').waitFor({state: 'hidden'});
    for (const partNo of toAddPartNos) {
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

    await waitForLoadingOverlay(businessPage);
    // await rightFrame.locator('#progressloading').waitFor({
    //     state: 'hidden',
    //     timeout: 60000,
    // });

    return {
        success: true,
        message: 'Parts added to job successfully'
    };

}
