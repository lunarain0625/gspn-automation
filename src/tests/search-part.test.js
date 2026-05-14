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
        solvupId: '00000002',
        productSerialNumber: '350852990546988',
        warrantyType:'OW',
        customerFirstName: 'HARRY',
        customerLastName: 'WANG',
        customerEmail: 'lunarain@live.com',
        customerPhone: '0420790625',

        customerAddress: '12 street st',
        customerSuburb: 'Donvale',
        customerState: 'VIC',
        customerPostCode: '3111',

        purchaseDate: '01.01.2025',
    };

    const result = await client.createJob(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ createJob failed');
    }

    console.log('✅ createJob passed\n');
}

export async function testUpdateJob(client) {
    console.log('🔍 Testing searchJobBySo...\n');

    const so = '1234567890'; // 👉 你常用测试值

    const result = await client.updateJob('test', so);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}
