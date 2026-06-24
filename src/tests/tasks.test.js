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
        source: 'MANUAL',
        solvupId: '00000014',
        productSerialNumber: '353809892619930',
        warrantyType: 'OW',
        customerFirstName: 'HARRY8',
        customerLastName: 'WANG8',
        customerEmail: '',
        customerPhone: '0420790625',

        customerAddress: '',
        customerSuburb: '',
        customerState: '',
        customerPostCode: '',

        purchaseDate: '',
    };

    const testData = {
    }

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
        vendorRa: '4437697898',
        warrantyType: 'OW',
        repairCode: 'SRC500',
        symptomName: 'NO CHARGING',
        symptomCat1: 'L2',
        symptomCat2: '02',
        symptomCat3: '02',
        irisSymptQcode: 'SRC505',
        irisSympt: '120',
        diagnosisNote: 'Device no power on. Tested with known good charger. No current draw detected.',
        purchaseDate: '03/03/2023',
        productSerialNumber: '353137850013999',
        faultReport: "no power no charging",
    };

    const testData = {
        source: 'SOLVUP',
        solvupId: '10093714',
        vendorRa: '4437303234',
        irisSympt: '160',
        repairCode: 'SRC500',
        faultReport: '1.2345678909876543e+25',
        symptomCat1: 'L7',
        symptomCat2: '10',
        symptomCat3: '01',
        symptomName: 'BROKEN SCREEN',
        purchaseDate: '01/06/2026',
        warrantyType: 'OW',
        diagnosisNote: 'REPLACE REWORK KIT',
        irisSymptQcode: 'SRC509',
        productSerialNumber: '350145974237462',
    }
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
        partNos: [ 'GH82-39267A' ],
        solvupId: '10093714',
        vendorRa: '4437707465',
        repairCode: 'SRC500',
        warrantyType: 'OW'
    };
    const result = await client.addParts(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ testAddParts failed');
    }

    console.log('✅ searchJobBySo passed\n');
}

export async function testGetDeviceInfo(client) {
    const sn = '356737570411071';
    const result = await client.getDeviceInfoBySn(sn);
    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}
