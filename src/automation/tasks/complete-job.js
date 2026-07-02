import {clickUntil, handleConfirmNotice} from "../utils/ui-helper.js";

export async function completeJob(businessPage, data) {
    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});

    //check warranty status
    await rightFrame.getByRole('cell', {name: 'Product Information'}).click();
    const checkResult = await rightFrame.locator('#IN_OUT_WTY').inputValue().catch(() => '');
    console.log('Warranty Check Result:', checkResult);
    if (checkResult !== data.warrantyType) {
        throw new Error('❌ Warranty check failed');
    }
    //check service type
    const type = await rightFrame.locator('#SERVICE_TYPE').inputValue().catch(() => '');
    console.log('Service Type:', type);

    //select engineer
    await rightFrame.locator('#ENGINEER').click();
    await rightFrame.locator('#sENGINEER').selectOption('8286036813');

    //change status to closed
    await rightFrame.locator('#STATUS').selectOption('ST035');
    await rightFrame.locator('select[name="REASON"]').selectOption('HL005');

    const serviceImg = rightFrame.locator('#SERVICE_IMG');
    if (await serviceImg.isVisible().catch(() => false)) {
        await serviceImg.click();
    }

    const saveButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Save'});

    //success dialog
    const successDialogPromise = businessPage.waitForEvent('dialog', {
        timeout: 15000,
        predicate: dialog => dialog.message().includes('[GCIC] Success update.')
    });

    businessPage.on('dialog', async dialog => {
        console.log('📦 Dialog:', dialog.message());

        try {
            await dialog.accept();
        } catch {
        }
    });

    await clickUntil({
        trigger: saveButton,
        page: businessPage,
        actionLabel: '[Save Repair Completed]',
        readyTimeoutMs: 15000,
        isReady: async () => {
            // 先处理 Confirm Notice
            await handleConfirmNotice(businessPage);

            // 再检查成功弹窗
            try {

                const dialog = await successDialogPromise;
                console.log('dialog checked in isReady:', dialog.message());
                return dialog.message().includes('[GCIC] Success update.');
            } catch {
                return false;
            }
        }
    });

    return {
        success: true,
        message: 'Job completed successfully'
    };

}
