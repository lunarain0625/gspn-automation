import {clickUntil} from "../utils/ui-helper.js";
import {formatGspnDate} from "../utils/gspn-helper.js";

export async function getDeviceInfoBySn(page, serialNumber, purchaseDate, checkWarranty) {
    console.log('🔎 Get device info by serialNumber:', serialNumber);
    console.log('🔎 Get device info by purchaseDate:', purchaseDate);
    console.log('🔎 Get device info by checkWarranty:', checkWarranty);
    // 创建一个新的独立 page
    const menuFrame = page.locator('frame[name="menu"]').contentFrame();
    const popupPromise = page.waitForEvent('popup');
    await menuFrame.getByText('Business').click();

    const newBusinessPage = await popupPromise;
    await newBusinessPage.waitForSelector('iframe[name="leftMenus"]');

    try {

        const rightFrame = newBusinessPage.locator('iframe[name="rightContents"]').contentFrame();

        const leftMenuFrame = newBusinessPage
            .locator('iframe[name="leftMenus"]')
            .contentFrame()
            .locator('iframe[name="b2BLeftMenuScroll"]')
            .contentFrame();

        const display = await leftMenuFrame
            .locator('[id="Service Tracking"]')
            .evaluate(el => getComputedStyle(el).display);

        if (display !== 'block') {
            await leftMenuFrame
                .getByRole('cell', {name: 'Service Tracking'})
                .click();
        }

        await leftMenuFrame.getByRole('cell', {
            name: 'Create New Service Order',
            exact: true
        }).click();
        const imeiInput = rightFrame
            .getByRole('cell', {name: 'Service Tracking > Create New Service Order CREATE NEW SERVICE ORDER     Save'})
            .locator('#IMEI');

        await imeiInput.fill(serialNumber || '');
        await imeiInput.press('Enter');
        await rightFrame.locator('#progressloading').waitFor({state: 'hidden'}).catch(() => {
        });

        const deviceModel = await rightFrame.locator('#searchFrmModel #MODEL').inputValue();
        const productName = await rightFrame.locator('#model_desc').inputValue();

        // If device model is not found, return an error message
        if (!deviceModel) {
            return {
                success: false,
                message: '❌ Failed to get device info. Please check the serial number or try again.'
            }
        }

        if (checkWarranty !== 'true') {
            return {
                success: true,
                serialNumber,
                deviceModel,
                productName
            };
        }
        //Warranty Check -  Fill in the Date of Purchase (DOP) if provided
        const warrantyCheckButton = rightFrame.getByRole('link', {name: 'Warranty Check'});
        if (purchaseDate) {
            await rightFrame.locator('#PURCHASE_DATE').fill(formatGspnDate(purchaseDate));
            await rightFrame.locator('#PURCHASE_DATE').press('Tab');
        } else {
            await warrantyCheckButton.click();
        }
        await clickUntil({
            trigger: warrantyCheckButton,
            page: newBusinessPage,
            actionLabel: 'Warranty Check',
            readyTimeoutMs: 10000,
            isReady: async () => {
                return await rightFrame.locator('#WTY_in_out').inputValue().catch(() => '');
            }
        });
        const warrantyType = await rightFrame.locator('#WTY_in_out').inputValue().catch(() => '');
        const warranty = warrantyType === 'LP';
        const productDate = await rightFrame.locator('#PRODUCT_DATE').inputValue().catch(() => '');
        const warrantyDate = await rightFrame.locator('#NEW_LABOR_WT_D').inputValue().catch(() => '');
        const currentException = await rightFrame.locator('#WTY_EXCEPTION').inputValue().catch(() => '');
        const overseasModel = currentException === 'VOID4';

        console.log('🛡️ Warranty Type:', warrantyType);
        console.log('🛡️ Warranty:', warranty);
        console.log('🛡️ Product Date:', productDate);
        console.log('🛡️ Warranty Date:', warrantyDate);
        console.log('🛡️ Current Exception:', currentException);
        console.log('🛡️ Overseas Model:', overseasModel);
        console.log('📱 Device Model:', deviceModel?.trim());
        console.log('📦 Product Name:', productName?.trim());


        return {
            success: true,
            serialNumber,
            deviceModel,
            productName,
            warranty,
            productDate,
            warrantyDate,
            overseasModel
        };
    } finally {
        await newBusinessPage.close();
    }
}
