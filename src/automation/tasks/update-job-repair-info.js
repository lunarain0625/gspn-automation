import {clickUntil, handleConfirmNotice, waitForLoadingOverlay} from "../utils/ui-helper.js";
import {formatGspnDate, normalizeWarrantyResult} from "../utils/gspn-helper.js";
import {handleBilling, handleBillingCancel} from "./billing-job.js";
import {updateJobStatus} from "./update-job-status.js";

export async function updateJobRepairInfo(businessPage, data) {
    console.log('🔧 Updating job:', data);

    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();
    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});


    // check billing status
    const billingCancelButton = rightFrame
        .locator('#divButtons')
        .getByRole('button', {name: 'Billing Cancel', exact: true});
    if (await billingCancelButton.isVisible()) {
        await handleBillingCancel(businessPage, rightFrame);
        await updateJobStatus(businessPage, 'ST030', 'HP005');
    }

    //warranty check
    const display = await rightFrame
        .locator('[id="divProduct"]')
        .evaluate(el => getComputedStyle(el).display);

    if (display !== 'block') {
        await rightFrame.getByRole('cell', {name: 'Product Information'}).click();
    }

    const productDate = await rightFrame.locator('#PRODUCT_DATE').inputValue().catch(() => '');

    await rightFrame.locator('#PURCHASE_DATE').fill(formatGspnDate(data.purchaseDate));
    await rightFrame.locator('#PURCHASE_DATE').press('Tab');

    if (data.warrantyType === 'OW') {
        if (data.repairCode === 'SRC038') {
            await rightFrame.locator('#WTY_EXCEPTION').selectOption('VOID9')
        } else {
            await rightFrame.locator('#WTY_EXCEPTION').selectOption('VOID1');
        }
    }
    if (data.warrantyType === 'IW') {
        const currentException = await rightFrame.locator('#WTY_EXCEPTION').inputValue().catch(() => '');
        if (currentException === 'VOID4') {
            throw new Error('❌ Overseas model cannot be processed as IW');
        }
        await rightFrame.locator('#WTY_EXCEPTION').selectOption('');
    }

    const warrantyCheckButton = rightFrame.locator('#wtyCheckBtn');

    // await clickUntil({
    //     trigger: warrantyCheckButton,
    //     page: businessPage,
    //     actionLabel: 'Warranty Check',
    //     isReady: async () => {
    //         return await rightFrame.locator('#IN_OUT_WTY').inputValue().catch(() => '');
    //     }
    // });


    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            console.log(`Attempting click for warranty check ${attempt}/5`);
            await warrantyCheckButton.click();
            await waitForLoadingOverlay(businessPage);

            if (await rightFrame.locator('#IN_OUT_WTY').inputValue().catch(() => '')) {
                break;
            }
        } catch (error) {
            console.log(`warranty check failed, retry ${attempt}/5`);
        }
    }


    const checkResult = await rightFrame.locator('#IN_OUT_WTY').inputValue().catch(() => '');
    console.log('Warranty Check Result:', checkResult);

    if (normalizeWarrantyResult(checkResult) !== data.warrantyType) {
        throw new Error('❌ Warranty check failed');
    }

    //select type
    if (data.repairCode === 'SRC038' || data.quoteRejected) {
        await rightFrame.locator('#SERVICE_TYPE').selectOption('IS');
    } else if (data.source === 'SOLVUP') {
        await rightFrame.locator('#SERVICE_TYPE').selectOption('PS');
    } else {
        await rightFrame.locator('#SERVICE_TYPE').selectOption('CI');
    }

    //select engineer
    // await rightFrame.locator('#ENGINEER').click();
    //选小强
    // await rightFrame.locator('#sENGINEER').selectOption('8286036813');

    //change status to ST030
    await rightFrame.locator('#STATUS').selectOption('ST025');
    await rightFrame.locator('#STATUS').selectOption('ST030');
    await businessPage.waitForTimeout(1000);
    await rightFrame.locator('select[name="REASON"]').selectOption('HP005');

    // await rightFrame.locator('#STATUS').selectOption('ST025');
    // await rightFrame.locator('select[name="REASON"]').selectOption('HE005');
    // await rightFrame.locator('#SERVICE_IMG').click();

    //fill description
    await rightFrame.locator('#DEFECTDESC_L').fill(data.faultReport);
    await rightFrame.locator('#REPAIRDESC_L').fill(data.diagnosisNote);
    await rightFrame.locator('#LAB_TYPE').selectOption(data.labType || 'FL');
    await rightFrame.locator('#IRIS_CONDI').selectOption(data.conditionCode || '1');
    await rightFrame.locator('#IRIS_DEFECT').selectOption((data.repairCode === 'SRC038' && !data.quoteRejected) ? '4' : 'N');
    await rightFrame.locator('#IRIS_SYMPT_QCODE').selectOption(data.irisSymptQcode);
    await rightFrame.locator('#IRIS_SYMPT').selectOption(data.irisSympt);

    await rightFrame.locator('#IRIS_REPAIR_QCODE').selectOption(data.repairCode);
    await rightFrame.locator('#IRIS_REPAIR').selectOption(data.irisRepair);
    if (data.repairCode === 'SRC500') {
        await rightFrame.locator('#LAB_TYPE').selectOption('FL');
        await rightFrame.locator('#IRIS_REPAIR_QCODE').selectOption('SRC038');
        await rightFrame.locator('#IRIS_REPAIR').selectOption('Y');
    }


    await rightFrame.locator('select[name="SYMPTOM_CAT1"]').selectOption(data.symptomCat1);
    await rightFrame.locator('select[name="SYMPTOM_CAT2"]').selectOption(data.symptomCat2);
    await rightFrame.locator('select[name="SYMPTOM_CAT3"]').selectOption(data.symptomCat3);

    //click unit receive time icon
    const receiveTimeIcon = rightFrame.locator('#ICO_UNIT_RECV_TIME');
    if (await receiveTimeIcon.isVisible()) {
        await receiveTimeIcon.click().catch(() => {
        });
    }

    const successDialogPromise = businessPage.waitForEvent('dialog', {
        timeout: 30000,
        predicate: dialog => dialog.message().includes('[GCIC] Success update.')
    });

    const failureDialogPromise = businessPage.waitForEvent('dialog', {
        timeout: 30000,
        predicate: dialog => dialog.message().includes('[GD] No IQC result found. Please run IQC.')
    });

    let failureMessage = null;

    businessPage.on('dialog', async dialog => {
        console.log('📦 Dialog:', dialog.message());

        try {
            await dialog.accept();
        } catch {
        }
    });

    await clickUntil({
        trigger: rightFrame.locator('#divButtons').getByRole('button', {name: 'Save'}),
        page: businessPage,
        actionLabel: 'Update Job Save',
        readyTimeoutMs: 10000,
        isReady: async () => {
            // 先处理 Confirm Notice
            await handleConfirmNotice(businessPage);

            // 再检查成功或失败弹窗
            try {
                const dialog = await Promise.race([successDialogPromise, failureDialogPromise]);
                const msg = dialog.message();
                if (msg.includes('[GD] No IQC result found. Please run IQC.')) {
                    failureMessage = msg;
                    return true;
                }
                return msg.includes('[GCIC] Success update.');
            } catch {
                return false;
            }
        }
    });
    if (failureMessage) {
        console.log(`❌ job update failed: ${failureMessage}`);
        return {
            success: false,
            message: failureMessage
        };
    }

    console.log('✅ job update success confirmed');

    // await businessPage.pause();
    return {
        success: true,
        message: 'job repair info updated successfully'
    };
}
