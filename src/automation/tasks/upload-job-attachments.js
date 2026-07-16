const TYPE_MAPPING = {
    "PROOF_OF_PURCHASE": "ATT02",
    "OFFICIAL_DOCUMENT": "ATT03",
    "JOB_SHEET": "ATT06",
    "PRODUCT_DEFECT_IMAGE": "ATT13",
    "OTHERS": "ATT99"
}


export async function uploadJobAttachments(businessPage, data) {
    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    await rightFrame.locator('#STATUS').waitFor({state: 'visible'}).catch(() => {
    });

    const attachments = data.attachments || [];


    for (const attachment of attachments) {
        const file = await fetch(attachment.url);

        const attachPopupPromise = businessPage.waitForEvent('popup');
        await rightFrame.getByRole('link', {name: 'Insert(Single)'}).click();
        const attachPopup = await attachPopupPromise;
        await attachPopup.locator('#IV_DESC').selectOption(TYPE_MAPPING[attachment.type]); //pop
        await attachPopup.getByRole('button', {name: 'Choose File'}).setInputFiles({
            name: attachment.filename,
            buffer: Buffer.from(await file.arrayBuffer()),
        });
        attachPopup.once('dialog', dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            dialog.dismiss().catch(() => {
            });
        });
        await attachPopup.getByRole('link', {name: 'Attach'}).click();
        const loadingOverlay = attachPopup.locator('#progressloading');
        await loadingOverlay.waitFor({state: 'visible', timeout: 3000}).catch(() => {
        });
        await loadingOverlay.waitFor({state: 'hidden', timeout: 15000}).catch(() => {
        });
        await attachPopup.close();
    }

    return {
        success: true,
    };
}
