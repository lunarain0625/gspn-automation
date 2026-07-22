import {clickUntilVisible, waitForLoadingOverlay} from "../utils/ui-helper.js";

function getRightContentsFrame(businessPage) {
    return businessPage.locator('iframe[name="rightContents"]').contentFrame();
}

function getLeftMenuScrollFrame(businessPage) {
    return businessPage
        .locator('iframe[name="leftMenus"]')
        .contentFrame()
        .locator('iframe[name="b2BLeftMenuScroll"]')
        .contentFrame();
}

export async function searchPartsByModel(businessPage, data) {

    await businessPage.waitForLoadState('domcontentloaded');
    await businessPage.waitForSelector('iframe[name="leftMenus"]');

    const rightContentsFrame = getRightContentsFrame(businessPage);
    const leftMenuScrollFrame = getLeftMenuScrollFrame(businessPage);

    // await businessPage
    //     .locator('iframe[name="leftMenus"]')
    //     .contentFrame().locator('img[onclick*="goHome"]').click();

    const display = await leftMenuScrollFrame
        .locator('[id="Master Data"]')
        .evaluate(el => getComputedStyle(el).display);

    if (display !== 'block') {
        await leftMenuScrollFrame
            .getByRole('cell', {name: 'Primary Database'})
            .click();
    }
    const subDisplay = await leftMenuScrollFrame
        .locator('[id="Material Information"]')
        .evaluate(el => getComputedStyle(el).display);
    if (subDisplay !== 'block') {
        await leftMenuScrollFrame
            .locator('[id="Master Data_1"]')
            .click();
    }

    await leftMenuScrollFrame.getByRole('cell', {
        name: 'Parts Search',
        exact: true
    }).click();

    // await businessPage.pause();
    const searchLink = rightContentsFrame.getByRole('link', {name: 'Search'});
    const partDesc = rightContentsFrame.locator('#partDesc');

    // await clickUntilVisible({
    //     trigger: searchLink,
    //     target: partDesc,
    //     page: businessPage,
    //     maxAttempts: 3,
    //     actionLabel: 'Search',
    //     readyTimeoutMs: 5000
    // })

    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            await rightContentsFrame.locator('#Model').fill(data.modelName);
            await searchLink.click();
            await waitForLoadingOverlay(businessPage);
            const display = await rightContentsFrame
                .locator('#reSearchTBody')
                .evaluate(el => getComputedStyle(el).display);
            if (display !== 'none') {
                break;
            }
        } catch (error) {
            console.log(`warranty check failed, retry ${attempt}/5`);
        }
    }


    await partDesc.fill(data.keyword)

    const keyPartCheckBox = rightContentsFrame.locator('#mainParts')
    await keyPartCheckBox.uncheck();
    await waitForLoadingOverlay(businessPage)

    // await clickUntilVisible({
    //     trigger: searchLink,
    //     target: partDesc,
    //     page: businessPage,
    //     maxAttempts: 3,
    //     actionLabel: 'Search',
    //     readyTimeoutMs: 5000
    // })

    const parts = await rightContentsFrame.locator('#searchContentTableBody_part tr').evaluateAll(rows => {
        return rows
            .map(row => {
                const tds = row.querySelectorAll('td');

                const price = tds[9]?.textContent?.trim() ?? '';

                // 第10列为空，跳过
                if (!price) return null;

                return {
                    partNo: tds[2]?.textContent?.trim() ?? '',
                    partName: tds[3]?.textContent?.trim() ?? '',
                    gspnPrice: parseFloat(price),
                    stock: (tds[10]?.textContent?.trim() ?? '').toUpperCase() === 'YES',
                };
            })
            .filter(Boolean);
    });

    console.log(parts);

    return {
        success: true,
        parts
    }
}
