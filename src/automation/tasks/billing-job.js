export async function billingJob(businessPage, data) {
    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});
    console.log('✅ Repair info updated, proceeding to billing...');

    const billingButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Billing', exact: true});

    if (!await billingButton.isVisible()) {
        return {
            success: true,
            message: 'Billing not required'
        }
    }

    const billingSuccess = await handleBilling(businessPage, rightFrame);
    if (!billingSuccess) {
        throw new Error('Billing failed');
    }

    return {
        success: true,
        message: 'Job completed successfully'
    };

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

export async function handleBillingCancel(businessPage, rightFrame) {

    try {
        const billingCancelButton = rightFrame
            .locator('#divButtons')
            .getByRole('button', {name: 'Billing Cancel', exact: true});

        let page2;

        for (let i = 0; i < 5; i++) {

            console.log(`🔄 Billing popup attempt ${i + 1}`);

            try {

                const existingPages = businessPage.context().pages().length;

                await billingCancelButton.click();

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
                    console.log(`✅ Billing Cancel popup opened on attempt ${i + 1}`);
                    break;
                }

                console.log(`⚠️ No popup detected on attempt ${i + 1}`);

            } catch (err) {

                console.log(`⚠️ Billing Cancel click failed on attempt ${i + 1}: ${err.message}`);

            }
        }

        if (!page2) {
            throw new Error('Billing popup did not open');
        }
        page2.once('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.accept().catch(() => {
            });
        });
        await page2.getByRole('link', {name: 'Cancel'}).click();
        // wait billing complete
        const billingButton = rightFrame
            .locator('#divButtons')
            .getByRole('button', {name: 'Billing', exact: true});
        await billingButton.waitFor({
            state: 'visible',
            timeout: 10000
        });
        console.log('✅ Billing Cancel success');
        return true;
    } catch (err) {
        console.log('❌ Billing Cancel failed:', err.message);
        return false;
    }
}
