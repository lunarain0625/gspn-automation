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

export async function testLogin(client) {
    console.log('🔑 Testing login...\n');

    const result = await client.login("harry0625", "mnbvcxz12???");

    console.log('Result:', result);
}

export async function testCreateJob(client) {
    console.log('🛠️ Testing createJob...\n');

    const data =
        {
            "source": "MANUAL",
            "solvupId": "WI51528365",
            "purchaseDate": "12/12/2022",
            "warrantyType": "OW",
            "customerEmail": "harry@geekrepublic.com.au",
            "customerPhone": "0420790625",
            "customerState": "Victoria",
            "customerSuburb": "Hawthorn East",
            "customerAddress": "Unit 4, 61-63 Camberwell Rd",
            "customerLastName": "Wang",
            "customerPostCode": "3123",
            "customerFirstName": "Harry",
            "productSerialNumber": "352233851528365"
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
            "solvupId": "WIX302SR0K",
            "vendorRa": "4438048650",
            "irisSympt": "111",
            "repairCode": "SRC500",
            "faultReport": "Battery Swollen",
            "symptomCat1": "L2",
            "symptomCat2": "01",
            "symptomCat3": "02",
            "symptomName": "NO POWER",
            "purchaseDate": "24/11/2025",
            "warrantyType": "IW",
            "diagnosisNote": "Battery swollen, no physical damage found. device cannot turn on. \nreplace battery, sub pba",
            "irisSymptQcode": "SRC504",
            "productSerialNumber": "R92X302SR0K"
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
        "source": "MANUAL",
        "solvupId": "WI31013271",
        "vendorRa": "4437780046",
        "repairCode": "SRC038",
        "warrantyType": "OW"
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
        "source": "MANUAL",
        "partNos": ["GH81-24467A", "GH81-24672A", "GH81-24537A", "GH81-24538A", "GH81-24539A", "GH81-24540A"],
        "solvupId": "WIX302SR0K",
        "vendorRa": "4438048650",
        "repairCode": "SRC500",
        "warrantyType": "IW"
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
