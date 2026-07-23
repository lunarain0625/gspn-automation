import {clickUntil, fillVisibleInputById, handleConfirmNotice} from "../utils/ui-helper.js";

export async function getJobSheet(businessPage) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    await rightFrame.locator('#STATUS').waitFor({state: 'visible'}).catch(() => {
    });


    const sendDocumentPagePromise = businessPage.waitForEvent('popup');
    await rightFrame.locator('#divButtons').getByRole('button', {name: 'Send Document'}).click();
    const sendDocumentPage = await sendDocumentPagePromise;
    await sendDocumentPage.locator('#progressloading').waitFor({state: 'hidden'});

    const sheetPagePromise = sendDocumentPage.waitForEvent('popup');
    const printButton = sendDocumentPage.locator('input[onclick="openSvcRequestPrintPop()"]');
    await printButton.click();
    const sheetPage = await sheetPagePromise;
    await sheetPage.locator('#progressloading').waitFor({state: 'hidden'});

    await sheetPage.waitForLoadState('networkidle', {timeout: 30000}).catch(() => {
    });
    await sheetPage.waitForTimeout(1000);

    const pdfBuffer = await sheetPage.pdf({
        format: 'A4',
        printBackground: true,
    });

    await sheetPage.close();
    await sendDocumentPage.close();

    return {
        success: true,
        pdf: pdfBuffer.toString('base64'),
    };
}
