import {clickUntil, fillVisibleInputById, handleConfirmNotice} from "../utils/ui-helper.js";

export async function getJobInfo(businessPage) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    await rightFrame.locator('#STATUS').waitFor({state: 'visible'}).catch(() => {
    });

    //get general info
    //extract vendorRa and ASC Job No from span
    const jobInfoText = await rightFrame
        .locator('span[title*="Object ID // Wty Bill No // ASC Job No // Create Date"]')
        .textContent() || '';

    const cleanedJobInfoText = jobInfoText
        .replace('[', '')
        .replace(']', '')
        .replace(/&nbsp;/g, ' ') // 如果读取的是 innerHTML 才需要，textContent 通常不用
        .trim();

    const [vendorRa, warrantyBillNo, ascJobNo] = cleanedJobInfoText
        .split('//')
        .map(v => v.trim());

    // await businessPage.waitForTimeout(3000);

    //get customer info
    const customerFirstName = await rightFrame.locator('#divCustomer').locator('#NAME_FIRST').inputValue();
    const customerLastName = await rightFrame.locator('#divCustomer').locator('#NAME_LAST').inputValue();
    const customerName = `${customerFirstName} ${customerLastName}`;
    const customerPhone = await rightFrame.locator('#divCustomer').locator('#HOMEPHON_NUMBER').inputValue();
    const customerEmail = await rightFrame.locator('#divCustomer').locator('#EMAIL').inputValue();
    const customerAddress = await rightFrame.locator('#divCustomer').locator('#STREET').inputValue();
    const customerSuburb = await rightFrame.locator('#divCustomer').locator('#CITY').inputValue();
    const customerPostCode = await rightFrame.locator('#divCustomer').locator('#POST_CODE').inputValue();
    const customerState = await rightFrame.locator('#divCustomer').locator('#REGION').inputValue();

    //get device info
    const divMainDisplay = await rightFrame
        .locator('[id="divProduct"]')
        .evaluate(el => getComputedStyle(el).display);

    if (divMainDisplay !== 'block') {
        await rightFrame.getByRole('cell', {name: 'Product Information'}).click();
    }
    const productName = await rightFrame.locator('input[name="MODEL_DESC"]').inputValue();
    const deviceModel = await rightFrame.locator('#divProduct').locator('#MODEL').inputValue();
    const productSerialNumber = await rightFrame.locator('#divProduct').locator('#IMEI').inputValue();

    //get warranty info
    const warrantyType = await rightFrame.locator('#divProduct').locator('#IN_OUT_WTY').inputValue().catch(() => '');
    const purchaseDate = await rightFrame.locator('#divProduct').locator('#PURCHASE_DATE').inputValue().catch(() => '');

    //get diagnosis info
    const faultReport = await rightFrame.locator('#divRepair').locator('#DEFECTDESC_L').inputValue();
    const diagnosisNote = await rightFrame.locator('#divRepair').locator('#REPAIRDESC_L').inputValue();
    const repairCode = await rightFrame.locator('#divRepair').locator('#SAVED_IRIS_REPAIR_QCODE').inputValue();


    //get parts info
    const partNos = await rightFrame
        .locator('#partsTableBody [name="PARTS_CODE"]')
        .evaluateAll(inputs =>
            inputs.map(input => input.value.trim()).filter(Boolean)
        );

    //change status
    const status = await rightFrame.locator('#STATUS').inputValue();
    const reason = await rightFrame.locator('select[name="REASON"]').inputValue();


    return {
        success: true,
        vendorRa,
        ascJobNo,
        customerFirstName,
        customerLastName,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        customerSuburb,
        customerPostCode,
        customerState,
        productName,
        deviceModel,
        productSerialNumber,
        warrantyType,
        purchaseDate,
        faultReport,
        diagnosisNote,
        repairCode,
        partNos,
        status,
        reason
    };
}
