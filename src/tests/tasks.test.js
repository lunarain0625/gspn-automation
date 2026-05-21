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

    const data = {
        source: 'SOLVUP',
        solvupId: '00000012',
        productSerialNumber: '352520440777564',
        warrantyType: 'OW',
        customerFirstName: 'HARRY6',
        customerLastName: 'WANG6',
        customerEmail: 'lunarain@live.com',
        customerPhone: '0420790625',

        customerAddress: '121 street st',
        customerSuburb: 'Donvale',
        customerState: 'VIC',
        customerPostCode: '3111',

        purchaseDate: '01.01.2024',
    };

    const result = await client.createJob(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ createJob failed');
    }

    console.log('✅ createJob passed\n');
}

export async function testUpdateJob(client) {

    const data = {
        source: 'SOLVUP',
        solvupId: '00000004',
        vendorRa: '4435728249',
        warrantyType: 'OW',
        repairCode: 'SRC038',
        symptomName: 'NO CHARGING',
        symptomCat1: 'L2',
        symptomCat2: '02',
        symptomCat3: '02',
        irisSymptQcode: 'SRC505',
        irisSympt: '120',
        diagnosisNote: 'Device no power on. Tested with known good charger. No current draw detected.',
        purchaseDate: '',
        productSerialNumber: '350956651025131',
        faultReport:"no power no charging",
    };
    const result = await client.updateJob('test', data);

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
