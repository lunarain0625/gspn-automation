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

export async function testGetJobStatus(client) {
    console.log('Testing Get Job Status...')
    const data = {
        "vendorRa": "4438957197"
    }
    const result = await client.getJobStatus(data);
    console.log('Result:', result);

}

export async function testGetJobInfo(client) {
    console.log('Testing Get Job Status...')
    const data = {
        "vendorRa": "123"
    }
    const result = await client.getJobInfo(data);
    console.log('Result:', result);

}

export async function testCreateJob(client) {
    console.log('🛠️ Testing createJob...\n');

    const data =
        {
            "source": "MANUAL",
            "solvupId": "WI31229927",
            "purchaseDate": null,
            "warrantyType": "OW",
            "customerEmail": "sanjeev1732@yahoo.com",
            "customerPhone": "0430007915",
            "customerState": null,
            "customerSuburb": "SPRINGVALE",
            "customerAddress": "23/83 view road",
            "customerLastName": "Chopra",
            "customerPostCode": "3171",
            "customerFirstName": "Sanjeev",
            "productSerialNumber": "351541631229927"
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
            "source": "SOLVUP",
            "solvupId": "12071576",
            "vendorRa": "4438432338",
            "irisSympt": "210",
            "repairCode": "SRC500",
            "faultReport": "3rd time being sent for repair, previous cases: 11957699 & 11868313\nphone automatically disconnects from wifi and also cant search for any other surrounding connection, cx has sent in video",
            "symptomCat1": "L5",
            "symptomCat2": "01",
            "symptomCat3": "05",
            "symptomName": "NO SIGNAL",
            "purchaseDate": "10/09/2025",
            "warrantyType": "IW",
            "diagnosisNote": "Device returned for repair. previous repaired battery, charging port, main pba, fpcb. cx returned and reported the wifi connection issue still existed. and cx would like remedy instead.\nVOC",
            "irisSymptQcode": "SRC515",
            "productSerialNumber": "354043280008618"
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
        "source": "SOLVUP",
        "partNos": ["GH82-36327A", "GH82-36478A", "GH82-36476A"],
        "solvupId": "12203630",
        "vendorRa": "4438505306",
        "repairCode": "SRC500",
        "warrantyType": "OW"
    };
    const result = await client.addParts(data);

    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ testAddParts failed');
    }

    console.log('✅ searchJobBySo passed\n');
}

export async function testGetDeviceInfo(client) {
    const serialNumber = 'R5GL43060BA';
    const purchaseDate = '';
    const checkWarranty = 'true';
    const result = await client.getDeviceInfoBySn(serialNumber, purchaseDate, checkWarranty);
    console.log('Result:', result);

    if (!result?.success) {
        throw new Error('❌ searchJobBySo failed');
    }

    console.log('✅ searchJobBySo passed\n');
}
