import {clickUntil} from "../utils/ui-helper.js";
import {formatGspnDate} from "../utils/gspn-helper.js";

const REPAIR_CODE_CONFIG = {
    //NDF
    SRC038: {
        LAB_TYPE: 'L1',
        IRIS_DEFECT: '4',
        IRIS_REPAIR: 'Y',
    },
    //PARTS REPLACEMENT
    SRC500: {
        LAB_TYPE: 'L2',
        IRIS_DEFECT: 'N',
        IRIS_REPAIR: 'A'
    },
};

export async function updateJobRepairInfo(businessPage, data) {
    console.log('🔧 Updating job:', data);
    const config = REPAIR_CODE_CONFIG[data.repairCode];
    const rightFrame = businessPage
        .locator('iframe[name="rightContents"]')
        .contentFrame();
    // 1️⃣ 确保在正确页面（非常关键）
    await rightFrame.locator('#STATUS').waitFor({state: 'visible'});


    //warranty check
    await rightFrame.getByRole('cell', {name: 'Product Information'}).click();
    await rightFrame.locator('#PURCHASE_DATE').fill(formatGspnDate(data.purchaseDate));
    if (data.warrantyType === 'OW') {
        await rightFrame.locator('#WTY_EXCEPTION').selectOption('VOID1');
    }
    if (data.warrantyType === 'IW') {
        const currentException = await rightFrame.locator('#WTY_EXCEPTION').inputValue().catch(() => '');
        if (currentException === 'VOID4') {
            throw new Error('❌ Overseas model cannot be processed as IW');
        }
        await rightFrame.locator('#WTY_EXCEPTION').selectOption('');
    }
    await rightFrame.getByRole('button', {
        name: 'Warranty Check',
    }).click();
    //wait for warranty check to complete (legacy pages may have a loading mask that needs to disappear)
    await rightFrame.locator('#progressloading').waitFor({state: 'hidden', timeout: 10000}).catch(() => {
    });

    const checkResult = await rightFrame.locator('#IN_OUT_WTY').inputValue().catch(() => '');
    console.log('Warranty Check Result:', checkResult);
    if (checkResult !== data.warrantyType) {
        throw new Error('❌ Warranty check failed');
    }

    //select type
    if (data.repairCode === 'SRC038') {
        await rightFrame.locator('#SERVICE_TYPE').selectOption('IS');
    } else if (data.source === 'SOLVUP') {
        await rightFrame.locator('#SERVICE_TYPE').selectOption('PS');
    } else {
        await rightFrame.locator('#SERVICE_TYPE').selectOption('CI');
    }

    //select engineer
    await rightFrame.locator('#ENGINEER').click();
    await rightFrame.locator('#sENGINEER').selectOption('8286037301');

    //change status to ST030
    await rightFrame.locator('#STATUS').selectOption('ST030');
    await rightFrame.locator('select[name="REASON"]').selectOption('HP005');

    //fill description
    await rightFrame.locator('#DEFECTDESC_L').fill(data.faultReport);
    await rightFrame.locator('#REPAIRDESC_L').fill(data.diagnosisNote);
    await rightFrame.locator('#LAB_TYPE').selectOption(config.LAB_TYPE);
    await rightFrame.locator('#IRIS_CONDI').selectOption('1');
    await rightFrame.locator('#IRIS_DEFECT').selectOption(config.IRIS_DEFECT);
    await rightFrame.locator('#IRIS_SYMPT_QCODE').selectOption(data.irisSymptQcode);
    await rightFrame.locator('#IRIS_SYMPT').selectOption(data.irisSympt);
    await rightFrame.locator('#IRIS_REPAIR_QCODE').selectOption(data.repairCode);
    await rightFrame.locator('#IRIS_REPAIR').selectOption(config.IRIS_REPAIR);
    await rightFrame.locator('select[name="SYMPTOM_CAT1"]').selectOption(data.symptomCat1);
    await rightFrame.locator('select[name="SYMPTOM_CAT2"]').selectOption(data.symptomCat2);
    await rightFrame.locator('select[name="SYMPTOM_CAT3"]').selectOption(data.symptomCat3);
    const successDialogPromise = businessPage.waitForEvent('dialog', {
        timeout: 15000,
        predicate: dialog => dialog.message().includes('[GCIC] Success update.')
    });

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
        actionLabel: 'Inspection Save',
        readyTimeoutMs: 15000,
        isReady: async () => {
            try {
                const dialog = await successDialogPromise;
                return dialog.message().includes('[GCIC] Success update.');
            } catch {
                return false;
            }
        }
    });

    console.log('✅ Inspection update success confirmed');


    // await businessPage.pause();
    return {
        success: true,
        message: 'job repair info updated successfully'
    };
}
