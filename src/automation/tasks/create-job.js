import {
    clickUntil,
    clickUntilVisible,
    fillVisibleInputById,
    findFirstVisible,
    selectVisibleOptionById
} from "../utils/ui-helper.js";

const STATE_MAPPING = {
    ACT: 'Aust Capital Terr',
    'AUSTRALIAN CAPITAL TERRITORY': 'Aust Capital Terr',
    'AUST CAPITAL TERR': 'Aust Capital Terr',

    NSW: 'New South Wales',
    'NEW SOUTH WALES': 'New South Wales',

    NT: 'Northern Territory',
    'NORTHERN TERRITORY': 'Northern Territory',

    QLD: 'Queensland',
    QUEENSLAND: 'Queensland',

    SA: 'South Australia',
    'SOUTH AUSTRALIA': 'South Australia',

    TAS: 'Tasmania',
    TASMANIA: 'Tasmania',

    VIC: 'Victoria',
    VICTORIA: 'Victoria',

    WA: 'Western Australia',
    'WESTERN AUSTRALIA': 'Western Australia',

    NZ: 'NEW ZEALAND',
    'NEW ZEALAND': 'NEW ZEALAND'
};

function normalizeState(state) {
    if (!state) {
        return '';
    }

    const normalized = state
        .toString()
        .trim()
        .toUpperCase();

    return STATE_MAPPING[normalized] || state;
}

function normalizePhone(phone) {
    if (!phone) {
        return '';
    }

    let normalized = phone.toString().replace(/\D/g, '');

    // Convert Australian mobile international format to local format.
    if (normalized.startsWith('61')) {
        normalized = `0${normalized.slice(2)}`;
    }

    // Ensure local mobile numbers start with 0.
    if (normalized.length === 9 && !normalized.startsWith('0')) {
        normalized = `0${normalized}`;
    }

    return normalized;
}

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

    await leftMenuScrollFrame.getByRole('cell', {name: 'Service Tracking'}).click();
    await leftMenuScrollFrame.getByRole('cell', {
        name: 'Create New Service Order',
        exact: true
    }).click();
}

async function fillBaseOrderInfo(rightContentsFrame, data) {
    const ascJobNo = data.ascJobNo || (
        data.source === 'SOLVUP'
            ? `TESTS${data.solvupId}`
            : `TESTW${String(data.productSerialNumber || '').slice(-8)}`
    );

    await rightContentsFrame.locator('#ASC_JOB_NO').fill(ascJobNo);

    const imeiInput = rightContentsFrame
        .getByRole('cell', {name: 'Service Tracking > Create New Service Order CREATE NEW SERVICE ORDER     Save'})
        .locator('#IMEI');

    await imeiInput.fill(data.productSerialNumber || '');
    await imeiInput.press('Enter');

    await rightContentsFrame.locator('select[name="SYMPTOM_CAT1"]').selectOption('L2');
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT2"]').selectOption('02');
    await rightContentsFrame.locator('select[name="SYMPTOM_CAT3"]').selectOption('02');
    await rightContentsFrame.getByRole('textbox', {name: 'FIRST'}).fill(data.customerFirstName || '');
    await rightContentsFrame.getByRole('textbox', {name: 'LAST'}).fill(data.customerLastName || '');
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
    const mobilePhoneInput = page2
        .getByRole('row', {name: 'TEL (Mobile/Fax)', exact: true})
        .locator('#MOBILE_PHONE');

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

    await page2.getByRole('row', {
        name: 'TEL (Mobile/Fax)',
        exact: true
    }).locator('#MOBILE_PHONE').fill(normalizePhone(data.customerPhone));
    await page2.getByRole('cell', {
        name: 'Check Permission',
        exact: true
    }).locator('#EMAIL').fill(data.customerEmail || '');
    await page2.getByRole('row', {
        name: 'Street 1,2,3',
        exact: true
    }).locator('#STREET1').fill(data.customerAddress || '');
    await page2.getByRole('row', {
        name: 'District/City',
        exact: true
    }).locator('#DISTRICT').fill(data.customerSuburb || '');

    if (!data.customerState && !data.customerPostCode) {
        return;
    }
    await selectVisibleOptionById(
        page2,
        'REGION_CODE',
        normalizeState(data.customerState),
        'REGION_CODE select'
    );
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
    console.log(`purchaseDate: ${data.purchaseDate}, warrantyType: ${data.warrantyType}`)
    await rightContentsFrame.locator('#PURCHASE_DATE').fill(data.purchaseDate || '');
    if (data.warrantyType === 'OW') {
        await rightContentsFrame.locator('#WTY_EXCEPTION').selectOption('VOID1');
    }

    function normalizeWarrantyResult(raw) {
        const value = (raw || '').toString().trim().toUpperCase();
        if (value === 'LP') return 'IW'; // Legacy: LP = IW
        if (value === 'OW') return 'OW';
        return '';
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

    await clickUntil({
        trigger: rightContentsFrame.getByRole('link', {name: 'Warranty Check'}),
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

    if (data.warrantyType === 'IW') {
        const currentException = await rightContentsFrame.locator('#WTY_EXCEPTION').inputValue().catch(() => '');
        if (currentException === 'VOID4') {
            throw new Error('❌ Overseas model cannot be processed as IW');
        }
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
        dialog.dismiss().catch(() => {
        });
    });

    await openCreateServiceOrderPage(businessPage);
    await fillBaseOrderInfo(rightContentsFrame, data);

    const page2 = await openCustomerPopup(businessPage, rightContentsFrame);
    await fillCustomerPopup(page2, data);
    await saveCustomerPopup(page2);

    const checkResult = await runWarrantyCheck(businessPage, rightContentsFrame, data);
    console.log('Warranty Check Result:', checkResult);
    if (checkResult !== data.warrantyType) {
        throw new Error('❌ Warranty check failed');
    }

    //Finally, save the service order and extract the service number from the confirmation message
    const saveLink = rightContentsFrame.getByRole('row', {
        name: 'CREATE NEW SERVICE ORDER     Save',
        exact: true
    }).getByRole('link')

    console.log('saveLink count: ', await saveLink.count());
    const saveButton = rightContentsFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Save'});
    await clickUntilVisible({
        trigger: saveLink,
        page: businessPage,
        actionLabel: 'Save New Job',
        target: saveButton
    })


    const serviceTextLocator = rightContentsFrame.locator(
        'span[title="Object ID // Wty Bill No // ASC Job No // Create Date"]'
    );
    await serviceTextLocator.waitFor();
    const serviceText = await serviceTextLocator.textContent();

    // Example:
    // [ 4435721718 // // TESTS00000010 // 21.05.2026 15:53:49 ]
    const serviceNo = serviceText
        ?.replace(/\u00a0/g, ' ')
        .match(/\[\s*(\d+)/)?.[1];
    console.log('Extracted service number:', serviceNo);
    if (!serviceNo) {
        throw new Error('Service number not found in confirmation message');
    }

    return {
        success: true,
        checkResult,
        serviceNo
    };
}
