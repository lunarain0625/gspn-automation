import {clickUntil} from "../utils/ui-helper.js";
import {formatGspnDate} from "../utils/gspn-helper.js";

export async function getDeviceInfoBySn(page, sn, dop) {
    console.log('🔎 Get device info by SN:', sn);
    console.log('🔎 Get device info by DOP:', dop)
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

        await imeiInput.fill(sn || '');
        await imeiInput.press('Enter');
        await rightFrame.locator('#progressloading').waitFor({state: 'hidden'}).catch(() => {
        });

        const deviceModel = await rightFrame.locator('#searchFrmModel #MODEL').inputValue();
        const productName = await rightFrame.locator('#model_desc').inputValue();

        if (dop) {
            await rightFrame.locator('#PURCHASE_DATE').fill(formatGspnDate(dop));
            await rightFrame.locator('#PURCHASE_DATE').press('Tab');
        }
        const warrantyCheckButton = rightFrame.getByRole('link', {name: 'Warranty Check'});
        await clickUntil({
            trigger: warrantyCheckButton,
            page: newBusinessPage,
            actionLabel: 'Warranty Check',
            isReady: async () => {
                return await rightFrame.locator('#WTY_in_out').inputValue().catch(() => '');
            }
        });

        await newBusinessPage.pause();


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

        if (!deviceModel) {
            return {
                success: false,
                message: '❌ Failed to get device info. Please check the SN or try again.'
            }
        }

        return {
            success: true,
            sn,
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
