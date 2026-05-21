import {clickUntilVisible} from "../utils/ui-helper.js";

export async function closeJob(businessPage, data) {
    console.log('🔧 Updating repair info:', data);

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

    //change status to closed
    await rightFrame.locator('#STATUS').selectOption('ST035');
    await rightFrame.locator('select[name="REASON"]').selectOption('HL005');
    await rightFrame.locator('#SERVICE_IMG').click().catch(() => {
    });

    const saveButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Save'});

    const billingButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Billing'});
    // await clickUntilLoadingCycle({
    //     trigger: firstSaveButton,
    //     page: businessPage,
    //     actionLabel: 'Save Repair Completed'
    // });
    await clickUntilVisible(
        {
            trigger: saveButton,
            page: businessPage,
            actionLabel: 'Save Repair Completed',
            target: billingButton
        }
    )
    console.log('✅ Repair info updated, proceeding to billing...');
    const billingSuccess = await handleBilling(businessPage, rightFrame);
    if (!billingSuccess) {
        throw new Error('Billing failed');
    }

    //good delivered
    await rightFrame.locator('#STATUS').selectOption('ST040');
    await rightFrame.locator('select[name="REASON"]').selectOption('HG005');
    await rightFrame.locator('#SERVICE_IMG').click();

    const viewClaimButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'View Claim'});

    await clickUntilVisible(
        {
            trigger: saveButton,
            page: businessPage,
            actionLabel: 'Save Goods Delivered',
            target: viewClaimButton
        }
    )

    await businessPage.pause();

    throw new Error('updateJobRepairInfo is not implemented yet');
}


export async function handleBilling(businessPage, rightFrame) {

    try {
        const billingButton = rightFrame
            .locator('#divButtons')
            .getByRole('button', {name: 'Billing'});

        let page2;

        for (let i = 0; i < 5; i++) {

            console.log(`🔄 Billing popup attempt ${i + 1}`);

            try {

                const existingPages = businessPage.context().pages().length;

                await billingButton.click();

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
                    console.log(`✅ Billing popup opened on attempt ${i + 1}`);
                    break;
                }

                console.log(`⚠️ No popup detected on attempt ${i + 1}`);

            } catch (err) {

                console.log(`⚠️ Billing click failed on attempt ${i + 1}: ${err.message}`);

            }
        }

        if (!page2) {
            throw new Error('Billing popup did not open');
        }
        page2.once('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.dismiss().catch(() => {
            });
        });
        await page2.getByRole('link', {name: 'Save'}).click();
        // wait billing complete
        const billingCancel = rightFrame
            .locator('#divButtons')
            .getByRole('button', {name: 'Billing Cancel'});
        await billingCancel.waitFor({
            state: 'visible',
            timeout: 10000
        });
        console.log('✅ Billing success');
        return true;
    } catch (err) {
        console.log('❌ Billing failed:', err.message);
        return false;
    }
}
