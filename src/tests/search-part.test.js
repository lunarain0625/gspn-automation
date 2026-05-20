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
        solvupId: '00000003',
        productSerialNumber: '350852990546988',
        warrantyType: 'OW',
        customerFirstName: 'HARRY',
        customerLastName: 'WANG',
        customerEmail: 'lunarain@live.com',
        customerPhone: '0420790625',

        customerAddress: '12 street st',
        customerSuburb: 'Donvale',
        customerState: 'VIC',
        customerPostCode: '3111',

        purchaseDate: '01.01.2023',
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
        solvupId: '00000003',
        vendorRa: '4435641915',
        warrantyType: 'OW',
        repairCode: 'SRC038',
        symptomName: 'NO CHARGING',
        symptomCode1: 'L2',
        symptomCode2: '02',
        symptomCode3: '02',
        irisSymptQcode: 'SRC505',
        irisSympt: '120',
        diagnosisNote: 'Device no power on. Tested with known good charger. No current draw detected.',
        purchaseDate: '14.10.2022',
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
