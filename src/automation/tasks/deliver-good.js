import {clickUntilVisible} from "../utils/ui-helper.js";

export async function deliverGood(businessPage, data) {

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});

    const saveButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Save'});

    //good delivered
    await rightFrame.locator('#STATUS').selectOption('ST040');
    await rightFrame.locator('select[name="REASON"]').selectOption('HG005');
    await rightFrame.locator('#SERVICE_IMG').click();

    const viewClaimButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'View Claim'});

    await clickUntilVisible(
        {
            trigger: saveButton,
            page: businessPage,
            actionLabel: 'Save Goods Delivered',
            target: viewClaimButton
        }
    )

    return {
        success: true,
        message: 'Good delivered successfully'
    };

}
