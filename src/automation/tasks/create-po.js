import {clickUntilVisible} from "../utils/ui-helper.js";

export async function createPo(businessPage, data) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    const createPoButton = rightFrame.getByRole('link', {name: 'Create Po'});

    let poPage = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const poPagePromise = businessPage.waitForEvent('popup', {timeout: 3000});

            await createPoButton.click();

            poPage = await poPagePromise;
            break;
        } catch (error) {
            console.log(`Create PO popup not opened, retry ${attempt}/5`);
        }
    }

    if (!poPage) {
        throw new Error('Failed to open Create PO popup after 5 attempts');
    }
    await poPage.locator('#progressloading').waitFor({state: 'hidden'});
    await poPage.locator('input[name="poNo"]').fill(`${data.vendorRa}${data.warrantyType}`);
    const verifyButton = poPage.getByRole('link', {name: 'Verify'})
    const saveButton = poPage.getByRole('link', {name: 'Save'})
    // await clickUntilVisible(
    //     {
    //         trigger: verifyButton,
    //         page: businessPage,
    //         actionLabel: 'Create PO',
    //         target: saveButton
    //     }
    // )

    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const verifyDialogPromise = poPage.waitForEvent('dialog');
            await verifyButton.click();
            const verifyDialog = await verifyDialogPromise;
            const verifyMessage = verifyDialog.message();
            console.log('Verify Dialog:', verifyMessage);
            await verifyDialog.accept();

            if (verifyMessage === 'Successed.') {
                break;
            } else if (verifyMessage.includes('Purchase order number in document number')) {
                await poPage.locator('input[name="poNo"]').fill(`${data.vendorRa}${data.warrantyType}${attempt}`);
            } else {
                return {
                    success: false,
                    message: 'Failed to verify PO: ' + verifyMessage
                };
            }

        } catch (error) {
            console.log(`saveButton not shown, retry ${attempt}/5`);
        }
    }

    const dialogPromise = poPage.waitForEvent('dialog');
    await saveButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    console.log(message);
    if (dialog.type() !== 'alert' && dialog.type() !== 'confirm') {
        await dialog.dismiss();
        return {
            success: false,
            message: `Unexpected dialog type: ${dialog.type()}`
        };
    }

    const match = message.match(/Confirmation\s+SO\s+#\s+is\s+(\d+)/i);
    const confirmationNo = match?.[1] ?? null;

    await dialog.accept();
    await poPage.close();

    if (!confirmationNo) {
        return {
            success: false,
            message: 'Failed to create PO or confirmation number not found'
        };
    }

    return {
        success: true,
        confirmationNo,
        message: `PO created successfully. Confirmation SO # ${confirmationNo}`
    };

}
