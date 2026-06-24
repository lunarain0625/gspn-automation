import {clickUntil, fillVisibleInputById, handleConfirmNotice} from "../utils/ui-helper.js";

export async function updateJobStatus(businessPage, status, reason) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});

    //change status
    await rightFrame.locator('#STATUS').selectOption('ST025');
    await rightFrame.locator('#STATUS').selectOption(status);
    await rightFrame.locator('select[name="REASON"]').selectOption(reason);

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
        trigger: rightFrame.locator('#divButtons').getByRole('button', {name: 'Save'}),
        page: businessPage,
        actionLabel: 'Update Save',
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
        message: 'job status updated successfully'
    };
}
