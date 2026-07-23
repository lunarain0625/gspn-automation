import {handleBillingCancel} from "./billing-job.js";
import {updateJobStatus} from "./update-job-status.js";
import {waitForLoadingOverlay} from "../utils/ui-helper.js";

export async function resetJob(businessPage, data) {
    console.log('🔧 Checking if job need to be reset...');

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();
    // 1️⃣ 确保在正确页面（非常关键）
    const status = rightFrame.locator('#STATUS')
    await status.waitFor({state: 'visible'});
    const statusValue = await status.inputValue().catch(() => '');
    if (statusValue === 'ST015') {
        console.log('new job, skipping reset...');
        return;
    }

    // check billing status
    const billingCancelButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Billing Cancel', exact: true});
    if (await billingCancelButton.isVisible()) {
        console.log('Already Billing, canceling...');
        await handleBillingCancel(businessPage, rightFrame);
    }

    // check parts status
    if (data.partNos?.length === 0) {
        console.log('Parts not provided, checking existing parts...');
        const addedPartNos = await rightFrame
            .locator('#partsTableBody [name="PARTS_CODE"]')
            .evaluateAll(inputs =>
                inputs.map(input => input.value.trim()).filter(Boolean)
            );

        if (addedPartNos.length > 0) {
            console.log(`🗑️ Parts detected, removing ${addedPartNos.length} existing parts`);
            while (await rightFrame.locator('#partsTableBody tr').count() > 0) {
                const lastRow = rightFrame.locator('#partsTableBody tr').last();
                const deleteBtn = lastRow.locator('a[name="partsDeleteBtn"]');
                if (await deleteBtn.count() === 0) {
                    break;
                }
                businessPage.once('dialog', async dialog => {
                    console.log(dialog.message());
                    await dialog.accept(); // 点确定
                });
                await deleteBtn.click();
                await businessPage.waitForTimeout(1000);
                await lastRow.waitFor({state: 'detached', timeout: 10000}).catch(() => {
                });
                await waitForLoadingOverlay(businessPage);
            }
        }
    }

    console.log("resetting job to pending status...")
    await updateJobStatus(businessPage, 'ST030', 'HP005');

}
