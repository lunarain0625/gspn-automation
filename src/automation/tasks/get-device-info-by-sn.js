export async function getDeviceInfoBySn(page, config, sn) {
    console.log('🔎 Get device info by SN:', sn);

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

        await leftMenuFrame.getByRole('cell', {name: 'Service Tracking'}).click();
        await leftMenuFrame.getByRole('cell', {
            name: 'Create New Service Order',
            exact: true
        }).click();
        const imeiInput = rightFrame
            .getByRole('cell', {name: 'Service Tracking > Create New Service Order CREATE NEW SERVICE ORDER     Save'})
            .locator('#IMEI');

        await imeiInput.fill(sn || '');
        await imeiInput.press('Enter');
        await rightFrame.locator('#progressloading').waitFor({state: 'hidden'});
        const deviceModel = await rightFrame.locator('#searchFrmModel #MODEL').inputValue();
        const productName = await rightFrame.locator('#model_desc').inputValue();

        console.log('📱 Device Model:', deviceModel?.trim());
        console.log('📦 Product Name:', productName?.trim());

        return {
            success: true,
            sn,
            deviceModel,
            productName
        };
    } finally {
        await page.close();
    }
}
