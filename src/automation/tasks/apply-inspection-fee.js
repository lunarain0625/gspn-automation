import {clickUntil, fillVisibleInputById, handleConfirmNotice, waitForLoadingOverlay} from "../utils/ui-helper.js";

export async function applyInspectionFee(businessPage, data) {
    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});
    console.log('✅ Repair info updated, proceeding to applying Inspection Fee...');

    const requestSuccess = await handleRequestInspectionFee(businessPage, rightFrame, data);
    if (!requestSuccess) {
        throw new Error('Request Inspection Fee failed');
    }

    return {
        success: true,
        message: 'Request Inspection Fee successfully'
    };

}

export async function handleRequestInspectionFee(businessPage, rightFrame, data) {

    try {
        const requestButton = rightFrame
            .locator('#divButtons')
            .getByRole('button', {name: 'SAW Request', exact: true});
        let page2;
        for (let i = 0; i < 5; i++) {
            console.log(`🔄 Open SAW popup attempt ${i + 1}`);
            try {
                const existingPages = businessPage.context().pages().length;
                await requestButton.click();
                try {
                    await businessPage.context().waitForEvent('page', {
                        timeout: 3000
                    });
                } catch {
                }
                const allPages = businessPage.context().pages();
                if (allPages.length > existingPages) {
                    page2 = allPages[allPages.length - 1];
                }
                if (page2) {
                    console.log(`✅ SAW popup opened on attempt ${i + 1}`);
                    break;
                }
                console.log(`⚠️ No popup detected on attempt ${i + 1}`);
            } catch (err) {
                console.log(`⚠️ SAW click failed on attempt ${i + 1}: ${err.message}`);
            }
        }

        if (!page2) {
            throw new Error('SAW popup did not open');
        }
        page2.once('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.dismiss().catch(() => {
            });
        });

        //operations:
        await page2.locator('#REQ_CATEGORY').selectOption('SRC74');
        let comment = data.repairCode === 'SRC500' ? 'cx rejected the quote.' : 'cx rejected the inspection fee';
        await page2.locator('#REQ_COMMENT').fill(comment);

        await page2.locator('#detailForm').getByRole('link', {name: 'Save'}).click();
        // wait billing complete
        // const billingCancel = rightFrame
        //     .locator('#divButtons')
        //     .getByRole('button', {name: 'Billing Cancel'});
        // await billingCancel.waitFor({
        //     state: 'visible',
        //     timeout: 10000
        // });

        //todo: further check SAW/WER requested
        await waitForLoadingOverlay(businessPage);
        
        console.log('✅ Request Inspection Fee success');
        return true;
    } catch (err) {
        console.log('❌ Request Inspection Fee failed:', err.message);
        return false;
    }
}
