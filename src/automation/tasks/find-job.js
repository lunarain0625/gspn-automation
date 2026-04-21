import {clickUntilVisible} from "../utils/ui-helper.js";

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

export async function findJob(businessPage, config, data) {

    await businessPage.waitForLoadState('domcontentloaded');
    await businessPage.waitForSelector('iframe[name="leftMenus"]');

    const rightContentsFrame = getRightContentsFrame(businessPage);
    const leftMenuScrollFrame = getLeftMenuScrollFrame(businessPage);
    await leftMenuScrollFrame.getByRole('cell', {name: 'Service Tracking'}).click();
    await leftMenuScrollFrame.getByRole('cell', {
        name: 'Service Order Management Light',
        exact: true
    }).click();

    await rightContentsFrame.locator('#service_order_no').fill(`4432348828`);

    const searchLink = rightContentsFrame.getByRole('link', {name: 'Unique Search'});
    const editLink = rightContentsFrame.getByRole('link', {name: 'Edit'});

    await clickUntilVisible({
        trigger: searchLink,
        target: editLink,
        page: businessPage,
        actionLabel: 'Search',
        readyTimeoutMs: 5000
    })

    await editLink.click();

    const title = rightContentsFrame.getByText('SERVICE ORDER DETAIL INFORMATION');
    businessPage.pause();
    try {
        await title.waitFor({ state: 'visible', timeout: 8000 });

        return {
            success: true,
        };
    } catch (e) {
        return {
            success: false,
            error: 'SERVICE ORDER DETAIL INFORMATION did not appear (page may not have refreshed)',
        };
    }
}
