export async function testSearchPart(client) {
    console.log('🔍 Testing searchPart...\n');

    const partNo = 'GH82-38875A'; // 👉 你常用测试值

    const result = await client.searchPart(partNo);

    console.log('Result:', result);

    if (!result?.price) {
        throw new Error('❌ searchPart failed: no price returned');
    }

    console.log('✅ searchPart passed\n');
}

export async function testCreateJob(client) {
    console.log('🛠️ Testing createJob...\n');

    const data =
        {
            "source": "MANUAL",
            "solvupId": "WI31013271",
            "purchaseDate": null,
            "warrantyType": "IW",

            "customerFirstName": "HANXIAO",
            "customerLastName": "WANG",
            "customerEmail": "lunarain@live.com",
            "customerPhone": "0420790625",

            "customerAddress": "17 Larne Avenue",
            "customerSuburb": "Bayswater",
            "customerState": "Victoria",
            "customerPostCode": "3153",

            "productSerialNumber": "351541631013271"
        }

    const testData = {}

    const result = await client.createJob(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ createJob failed');
    }

    console.log('✅ createJob passed\n');
}

export async function testUpdateJob(client) {

    const data =
        {
            "source": "MANUAL",
            "solvupId": "WI31013271",
            "vendorRa": "4437780046",
            "irisSympt": "111",
            "repairCode": "SRC500",
            "faultReport": "fold 5 IW",
            "symptomCat1": "L2",
            "symptomCat2": "01",
            "symptomCat3": "02",
            "symptomName": "NO POWER",
            "purchaseDate": null,
            "warrantyType": "IW",
            "diagnosisNote": "no power change battery",
            "irisSymptQcode": "SRC504",
            "productSerialNumber": "351541631013271"
        }
    ;

    const result = await client.updateJob('repair_info', data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}

export async function testCompleteJob(client) {

    const data = {
        source: 'SOLVUP',
        solvupId: '00000003',
        vendorRa: '4435728249',
        warrantyType: 'OW',
        repairCode: 'SRC038',
    };
    const result = await client.completeJob(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}

export async function testAddParts(client) {

    const data = {
        source: 'SOLVUP',
        partNos: ['GH02-22977A'],
        solvupId: '10084951',
        vendorRa: '4437721941',
        repairCode: 'SRC500',
        warrantyType: 'OW',
    };
    const result = await client.addParts(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ testAddParts failed');
    }

    console.log('✅ searchJobBySo passed\n');
}

export async function testGetDeviceInfo(client) {
    const sn = 'RF2Y80CJM1P';
    const dop = '03/12/2023';
    const result = await client.getDeviceInfoBySn(sn, dop);
    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}
