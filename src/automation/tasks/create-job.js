import {
    clickUntil,
    clickUntilVisible,
    fillVisibleInputById,
    findFirstVisible,
    selectVisibleOptionById
} from "../utils/ui-helper.js";
import {formatGspnDate, normalizePhone, normalizeState, normalizeWarrantyResult} from "../utils/gspn-helper.js";

function getLeftMenuScrollFrame(businessPage) {
    return businessPage
        .locator('iframe[name="leftMenus"]')
        .contentFrame()
        .locator('iframe[name="b2BLeftMenuScroll"]')
        .contentFrame();
}

function getRightContentsFrame(businessPage) {
    return businessPage.locator('iframe[name="rightContents"]').contentFrame();
}

async function openCreateServiceOrderPage(businessPage) {
    const leftMenuScrollFrame = getLeftMenuScrollFrame(businessPage);

    const display = await leftMenuScrollFrame
        .locator('[id="Service Tracking"]')
        .evaluate(el => getComputedStyle(el).display);

    if (display !== 'block') {
        await leftMenuScrollFrame
            .getByRole('cell', {name: 'Service Tracking'})
            .click();
    }

    await leftMenuScrollFrame.getByRole('cell', {
        name: 'Create New Service Order',
        exact: true
    }).click();
}

async function fillBaseOrderInfo(businessPage, rightContentsFrame, data, ascJobNo, repeat) {
    //切换到all products


    const allProduct = rightContentsFrame.locator('#rdoDisplayNonHHP')
    const inputDiv = rightContentsFrame.locator('#moretailid3')

    await clickUntilVisible({
        trigger: allProduct,
        target: inputDiv,
        page: businessPage,
        actionLabel: 'Switch to all products',
        settleTimeoutMs: 1000,
        readyTimeoutMs: 5000,
    })
    await rightContentsFrame
        .locator('#moretailid1')
        .locator('input[name="ASC_JOB_NO"]').fill(ascJobNo);
    //fill a model to activate imei checker
    const modelInput = rightContentsFrame.locator('#moretailid3')
        .locator('#MODEL');
    await modelInput.fill('SM-S948B');
    await modelInput.press('Enter');
    //fill imei input
    const serialInput = rightContentsFrame
        .locator('#moretailid3')
        .locator('input[name="SERIAL_NO"]');
    const imeiInput = rightContentsFrame
        .locator('#moretailid3')
        .locator('input[name="IMEI"]');
    await serialInput.fill(data.productSerialNumber || '');
    await serialInput.press('Enter');
    await imeiInput.fill(data.productSerialNumber || '');
    await imeiInput.press('Enter');
    await rightContentsFrame.locator('#progressloading').waitFor({
        state: 'visible'
    }).catch(() => {

    });
    await rightContentsFrame.locator('#progressloading').waitFor({
        state: 'hidden'
    });
    await businessPage.waitForTimeout(2000);

    //select service type
    await rightContentsFrame
        .locator('#moretailid3').locator('select[name="SERVICE_TYPE"]')
        .selectOption(data.source === 'SOLVUP' ? 'PS' : 'CI');

    //select collection point if solvup
    if (data.source === 'SOLVUP') {
        await rightContentsFrame.locator('#CC_CODE').selectOption('8282068226');
    }
    await businessPage.waitForTimeout(1000);
    //select symptom category
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT1"]').selectOption('L2');
    await businessPage.waitForTimeout(1000);
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT2"]').selectOption('02');
    await businessPage.waitForTimeout(1000);
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT3"]').selectOption('02');
    //fill customer info
    await rightContentsFrame
        .getByRole('textbox', {name: 'FIRST'})
        .fill(`${data.customerFirstName || ''}${repeat ? Math.floor(Math.random() * 100) : ''}`);
    await rightContentsFrame.getByRole('textbox', {name: 'LAST'}).fill(data.customerLastName || '');

    //click appointment time icon
    await rightContentsFrame.locator(
        'img[onclick*="setCurrentDateTime_AppDt"]'
    ).click();
    //click customer's request
    await rightContentsFrame.locator('#tdCustomerRequestDate > table > tbody > tr > td:nth-child(2) > div > img').click();
    //click unit received date
    await rightContentsFrame.locator('#UnitReceivedField > table > tbody > tr > td:nth-child(2) > div > img').click();
}

async function openCustomerPopup(businessPage, rightContentsFrame) {
    const page2Promise = businessPage.waitForEvent('popup');
    await rightContentsFrame.getByRole('cell', {
        name: 'Search',
        exact: true
    }).nth(4).click();

    const page2 = await page2Promise;
    await page2.waitForLoadState('domcontentloaded');

    return page2;
}

async function activateCustomerForm(page2) {
    const newLink = page2.getByRole('link', {name: 'New'});
    const mobilePhoneInput = page2.locator('#divcustomercreate').locator('#MOBILE_PHONE');

    await clickUntilVisible({
        trigger: newLink,
        target: mobilePhoneInput,
        page: page2,
        actionLabel: 'New (customer form)',
        readyTimeoutMs: 5000
    });
}

async function fillCustomerPopup(page2, data) {
    await activateCustomerForm(page2);
    await page2.waitForTimeout(1000);
    await fillVisibleInputById(page2, 'MOBILE_PHONE', normalizePhone(data.customerPhone), 'MOBILE_PHONE input');
    await page2.waitForTimeout(1000);
    await page2.locator('#divcustomercreate').locator('#EMAIL').fill(data.customerEmail || '');
    await page2.waitForTimeout(1000);
    await page2.locator('#divcustomercreate').locator('#STREET1').fill(data.customerAddress || '');
    await page2.waitForTimeout(1000);
    await page2.locator('#divcustomercreate').locator('#DISTRICT').fill(data.customerSuburb || '');

    if (!data.customerState && !data.customerPostCode) {
        return;
    }
    await selectVisibleOptionById(
        page2,
        'REGION_CODE',
        normalizeState(data.customerState || 'VIC'),
        'REGION_CODE select'
    ).catch(() => {
    });
    await fillVisibleInputById(page2, 'POST_CODE', data.customerPostCode || '', 'POST_CODE input');
}

async function saveCustomerPopup(page2) {
    const loadingOverlay = page2.locator('#progressloading');

    // GSPN legacy pages can contain duplicated or temporarily hidden Save links.
    // Pick the currently visible Save link instead of relying on a single role locator.
    await loadingOverlay.waitFor({state: 'hidden', timeout: 10000}).catch(() => {
    });

    const saveLinks = page2.getByRole('link', {name: 'Save'});
    const saveLinkCount = await saveLinks.count().catch(() => 0);
    console.log(`💾 Save links found: ${saveLinkCount}`);

    const saveLink = await findFirstVisible(saveLinks);

    if (!saveLink) {
        console.log('❌ Visible Save link not found. Current URL:', page2.url());
        throw new Error('Visible Save link not found in customer popup');
    }

    const confirmLinks = page2.getByRole('link', {name: 'Confirm'});

    await clickUntilVisible({
        trigger: saveLink,
        target: confirmLinks.first(),
        page: page2,
        actionLabel: 'Save',
        readyTimeoutMs: 8000,
        loadingOverlay
    });

    await loadingOverlay.waitFor({state: 'hidden', timeout: 10000}).catch(() => {
    });

    const confirmLink = await findFirstVisible(confirmLinks);

    if (!confirmLink) {
        console.log('❌ Visible Confirm link not found after Save. Current URL:', page2.url());
        throw new Error('Visible Confirm link not found after Save');
    }

    await clickUntil({
        trigger: confirmLink,
        page: page2,
        actionLabel: 'Confirm',
        readyTimeoutMs: 10000,
        loadingOverlay,
        isReady: async () => {
            if (page2.isClosed()) {
                return true;
            }

            const confirmStillVisible = await confirmLink.isVisible().catch(() => false);
            return !confirmStillVisible;
        }
    });
}

async function runWarrantyCheck(businessPage, rightContentsFrame, data) {
    const warrantyResultInput = rightContentsFrame.locator('#WTY_in_out');
    console.log(`purchaseDate: ${data.purchaseDate}, warrantyType: ${data.warrantyType}`);
    const purchaseDateInput = rightContentsFrame.locator('#PURCHASE_DATE');
    await purchaseDateInput.fill(formatGspnDate(data.purchaseDate));
    if (data.warrantyType === 'OW') {
        await rightContentsFrame.locator('#WTY_EXCEPTION').selectOption('VOID1');
    }

    async function readWarrantyResult() {
        const title = normalizeWarrantyResult(await warrantyResultInput.getAttribute('title').catch(() => ''));
        if (title) return title;

        const inputValue = normalizeWarrantyResult(await warrantyResultInput.inputValue().catch(() => ''));
        if (inputValue) return inputValue;

        const valueAttr = normalizeWarrantyResult(await warrantyResultInput.getAttribute('value').catch(() => ''));
        if (valueAttr) return valueAttr;

        const textContent = normalizeWarrantyResult(await warrantyResultInput.textContent().catch(() => ''));
        if (textContent) return textContent;

        return '';
    }

    await warrantyResultInput.waitFor({state: 'attached', timeout: 10000});

    //click warranty check link and wait for result to be IW or OW
    const warrantyCheckButton = rightContentsFrame.locator('#moretailid3').getByRole('link', {name: 'Warranty Check'});

    let popupPage = null;
    const handler = page => {
        popupPage = page;
    };
    businessPage.context().on('page', handler);
    await warrantyCheckButton.click();
    await clickUntil({
        trigger: warrantyCheckButton,
        page: businessPage,
        actionLabel: 'Warranty Check',
        readyTimeoutMs: 8000,
        isReady: async () => {
            const result = await readWarrantyResult();
            return result === 'IW' || result === 'OW';
        }
    });
    await businessPage.waitForTimeout(3000);
    businessPage.context().off('page', handler);
    if (popupPage) {
        const repeatSO = (await popupPage
            .locator('#searchContentTableBody tr')
            .first()
            .locator('td')
            .nth(1)
            .innerText()).trim();
        await popupPage.close();
        throw new Error('This Product has Repair history within 1 month. Please check repair history. The repeat SO is: ' + repeatSO + '.');
    }

    const checkResult = await readWarrantyResult();

    if (!checkResult) {
        throw new Error('Warranty check result not found');
    }

    if (data.warrantyType === 'IW') {
        const currentException = await rightContentsFrame.locator('#WTY_EXCEPTION').inputValue().catch(() => '');
        if (currentException === 'VOID4') {
            throw new Error('❌ Overseas model cannot be processed as IW');
        }
    }

    return checkResult;
}

export async function createJob(businessPage, data, repeat = false) {
    console.log('🛠️ Creating Job:', data);

    await businessPage.waitForLoadState('domcontentloaded');
    await businessPage.waitForSelector('iframe[name="leftMenus"]');

    const rightContentsFrame = getRightContentsFrame(businessPage);

    businessPage.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.dismiss().catch(() => {
        });
    });
    await openCreateServiceOrderPage(businessPage);

    const solvupPrefix = 'TSOLVUP';
    const walkInPrefix = 'TWI';

    const ascJobNo = data.ascJobNo || (
        data.source === 'SOLVUP'
            ? `${solvupPrefix}${data.solvupId}`
            : `${walkInPrefix}${String(data.productSerialNumber || '').slice(-8)}`
    );

    await fillBaseOrderInfo(businessPage, rightContentsFrame, data, ascJobNo, repeat);
    const checkResult = await runWarrantyCheck(businessPage, rightContentsFrame, data);
    console.log('Warranty Check Result:', checkResult);
    if (checkResult !== data.warrantyType) {
        throw new Error('❌ Warranty check failed');
    }

    const page2 = await openCustomerPopup(businessPage, rightContentsFrame);
    await fillCustomerPopup(page2, data);
    await saveCustomerPopup(page2);

    //Finally, save the service order and extract the service number from the confirmation message
    const saveLink = rightContentsFrame.getByRole('row', {
        name: 'CREATE NEW SERVICE ORDER     Save',
        exact: true
    }).getByRole('link')
    console.log('saveLink count: ', await saveLink.count());
    const orderCreatedMessage = rightContentsFrame.locator('#errTable');
    try {
        await clickUntilVisible({
            trigger: saveLink,
            page: businessPage,
            maxAttempts: 3,
            settleTimeoutMs: 1000,
            readyTimeoutMs: 3000,
            actionLabel: 'Save New Job',
            target: orderCreatedMessage
        })
    } catch (e) {
        const tableCaptcha = rightContentsFrame.locator('#tableCaptcha');
        if (await tableCaptcha.isVisible()) {
            console.log('Captcha detected, retrying job creation...');
            await createJob(businessPage, data, true);
        } else {
            throw e;
        }
    }
    const errorText = await rightContentsFrame
        .locator('#errBody')
        .textContent();
    if (errorText?.includes('[G-DD008 : ASC Job No already exists.]')) {
        throw new Error('[G-DD008 : ASC Job No already exists.]');
    }
    const serviceNo = errorText
        ?.match(/Order\s+was\s+created\s+by\s+No\.(\d+)/i)?.[1];
    console.log('Extracted service number:', serviceNo);
    if (!serviceNo) {
        throw new Error('Service number not found in confirmation message');
    }
    return {
        success: true,
        checkResult,
        ascJobNo,
        serviceNo
    };
}
