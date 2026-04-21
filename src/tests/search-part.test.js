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
        partNo: 'GH82-38875A', // 👉 你常用测试值
        quantity: 1,
        solvupId: '1234567890', // 👉 你常用测试值
        device: {
            imei: '350956651025131',
        },
        customer: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'oXc5Q@example.com',
            phone: '0400000000',
            address: {street: '12 street st', city: 'Donvale', state: 'VIC', postalCode: '3111', country: 'Australia'},
        }
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
