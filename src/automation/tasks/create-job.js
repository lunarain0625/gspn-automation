import {
    clickUntil,
    clickUntilVisible,
    fillVisibleInputById,
    selectVisibleOptionById
} from "../utils/ui-helper.js";

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

    await leftMenuScrollFrame.getByRole('cell', { name: 'Service Tracking' }).click();
    await leftMenuScrollFrame.getByRole('cell', {
        name: 'Create New Service Order',
        exact: true
    }).click();
}

async function fillBaseOrderInfo(rightContentsFrame, data) {
    await rightContentsFrame.locator('#ASC_JOB_NO').fill(`SOLVUP${data.solvupId}`);

    const imeiInput = rightContentsFrame
        .getByRole('cell', { name: 'Service Tracking > Create New Service Order CREATE NEW SERVICE ORDER     Save' })
        .locator('#IMEI');

    await imeiInput.fill(data.device.imei);
    await imeiInput.press('Enter');

    await rightContentsFrame.locator('select[name="SYMPTOM_CAT1"]').selectOption('L2');
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT2"]').selectOption('02');
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT3"]').selectOption('02');
    await rightContentsFrame.getByRole('textbox', { name: 'FIRST' }).fill(data.customer.firstName);
    await rightContentsFrame.getByRole('textbox', { name: 'LAST' }).fill(data.customer.lastName);
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
    const newLink = page2.getByRole('link', { name: 'New' });
    const mobilePhoneInput = page2
        .getByRole('row', { name: 'TEL (Mobile/Fax)', exact: true })
        .locator('#MOBILE_PHONE');

    await clickUntilVisible({
        trigger: newLink,
        target: mobilePhoneInput,
        page: page2,
        actionLabel: 'New (customer form)',
        readyTimeoutMs: 5000
    });
}

async function fillCustomerPopup(page2, customer) {
    await activateCustomerForm(page2);

    await page2.getByRole('row', { name: 'TEL (Mobile/Fax)', exact: true }).locator('#MOBILE_PHONE').fill(customer.phone);
    await page2.getByRole('cell', { name: 'Check Permission', exact: true }).locator('#EMAIL').fill(customer.email);
    await page2.getByRole('row', { name: 'Street 1,2,3', exact: true }).locator('#STREET1').fill(customer.address.street);
    await page2.getByRole('row', { name: 'District/City', exact: true }).locator('#DISTRICT').fill(customer.address.city);

    await selectVisibleOptionById(page2, 'REGION_CODE', customer.address.state, 'REGION_CODE select');
    await fillVisibleInputById(page2, 'POST_CODE', customer.address.postalCode, 'POST_CODE input');
}

async function saveCustomerPopup(page2) {
    const saveLink = page2.getByRole('link', { name: 'Save' });
    const confirmLink = page2.getByRole('link', { name: 'Confirm' });
    const loadingOverlay = page2.locator('#progressloading');

    await clickUntilVisible({
        trigger: saveLink,
        target: confirmLink,
        page: page2,
        actionLabel: 'Save',
        readyTimeoutMs: 5000,
        loadingOverlay
    });

    await clickUntil({
        trigger: confirmLink,
        page: page2,
        actionLabel: 'Confirm',
        readyTimeoutMs: 8000,
        loadingOverlay,
        isReady: async () => {
            if (page2.isClosed()) {
                return true;
            }

            const confirmVisible = await confirmLink.isVisible().catch(() => false);
            if (!confirmVisible) {
                return true;
            }

            return false;
        }
    });
}

async function runWarrantyCheck(businessPage) {
    const rightContentsFrame = getRightContentsFrame(businessPage);
    const warrantyResultInput = rightContentsFrame.locator('#WTY_in_out');

    function normalizeWarrantyResult(raw) {
        const value = (raw || '').toString().trim().toUpperCase();
        return value === 'IW' || value === 'OW' ? value : '';
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

    await warrantyResultInput.waitFor({ state: 'attached', timeout: 10000 });

    await clickUntil({
        trigger: rightContentsFrame.getByRole('link', { name: 'Warranty Check' }),
        page: businessPage,
        actionLabel: 'Warranty Check',
        readyTimeoutMs: 8000,
        isReady: async () => {
            const result = await readWarrantyResult();
            return result === 'IW' || result === 'OW';
        }
    });

    const checkResult = await readWarrantyResult();

    if (!checkResult) {
        throw new Error('Warranty check result not found');
    }

    return checkResult;
}

export async function createJob(businessPage, config, data) {
    console.log('🛠️ Creating Job:', data);

    await businessPage.waitForLoadState('domcontentloaded');
    await businessPage.waitForSelector('iframe[name="leftMenus"]');

    const rightContentsFrame = getRightContentsFrame(businessPage);

    businessPage.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
    });

    await openCreateServiceOrderPage(businessPage);
    await fillBaseOrderInfo(rightContentsFrame, data);

    const page2 = await openCustomerPopup(businessPage, rightContentsFrame);
    await fillCustomerPopup(page2, data.customer);
    await saveCustomerPopup(page2);

    const checkResult = await runWarrantyCheck(businessPage);
    console.log('Warranty Check Result:', checkResult);

    await businessPage.pause();

    return {
        success: true,
        checkResult
    };
}
