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

export async function testSearchPartsByModel(client) {
    console.log('🔍 Testing searchPart...\n');
    const data = {
        "modelName": "SM-X526BZAAATS",
        "keyword": "LCD"
    }; // 👉 你常用测试值
    const result = await client.searchPartsByModel(data);
    console.log('Result:', result);
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
        "vendorRa": "4438957197"
    }
    const result = await client.getJobInfo(data);
    console.log('Result:', result);

}

export async function testUploadJobAttachments(client) {
    console.log('Testing Get Job Status...')
    const data = {
        "source": "MANUAL",
        "solvupId": "TWI30051267",
        "vendorRa": "4438957197",
        "irisSympt": "160",
        "repairCode": "SRC500",
        "attachments": [{
            "id": "cmrn4aowr000l15o39v77b1ep",
            "url": "https://pub-500107de24c64d6cacb0fe46cbd795d4.r2.dev/attachments/cmrlliinm000015o21ra8zho4/1784182671489-Section_2.png",
            "type": "OTHERS",
            "caseId": "cmrlliinm000015o21ra8zho4",
            "fileSize": 9326546,
            "filename": "Section 2.png",
            "createdAt": "2026-07-16T06:17:52.539Z",
            "storageKey": "attachments/cmrlliinm000015o21ra8zho4/1784182671489-Section_2.png"
        }, {
            "id": "cmrn4abfa000k15o32wlg7vvu",
            "url": "https://pub-500107de24c64d6cacb0fe46cbd795d4.r2.dev/attachments/cmrlliinm000015o21ra8zho4/1784182654085-screencapture-h2ostores-pages-pitch-2026-06-12-10_52_39.jpg",
            "type": "OFFICIAL_DOCUMENT",
            "caseId": "cmrlliinm000015o21ra8zho4",
            "fileSize": 8274670,
            "filename": "screencapture-h2ostores-pages-pitch-2026-06-12-10_52_39.jpg",
            "createdAt": "2026-07-16T06:17:35.062Z",
            "storageKey": "attachments/cmrlliinm000015o21ra8zho4/1784182654085-screencapture-h2ostores-pages-pitch-2026-06-12-10_52_39.jpg"
        }, {
            "id": "cmrn49uka000j15o3q13zptqg",
            "url": "https://pub-500107de24c64d6cacb0fe46cbd795d4.r2.dev/attachments/cmrlliinm000015o21ra8zho4/1784182631478-cascadefilterwaterpen.png",
            "type": "PROOF_OF_PURCHASE",
            "caseId": "cmrlliinm000015o21ra8zho4",
            "fileSize": 4034621,
            "filename": "cascadefilterwaterpen.png",
            "createdAt": "2026-07-16T06:17:13.210Z",
            "storageKey": "attachments/cmrlliinm000015o21ra8zho4/1784182631478-cascadefilterwaterpen.png"
        }],
        "faultReport": "nfd",
        "symptomCat1": "L7",
        "symptomCat2": "10",
        "symptomCat3": "01",
        "symptomName": "BROKEN SCREEN",
        "purchaseDate": null,
        "warrantyType": "OW",
        "diagnosisNote": "rep kit",
        "irisSymptQcode": "SRC509",
        "productSerialNumber": "350383130051267"
    }
    const result = await client.uploadJobAttachments(data);
    console.log('Result:', result);

}

export async function testCreateJob(client) {
    console.log('🛠️ Testing createJob...\n');

    const data =
        {
            "source": "SOLVUP",
            "solvupId": "12255865",
            "purchaseDate": "25/08/2024",
            "warrantyType": "IW",
            "customerEmail": "Shayne.albert@gmail.com",
            "customerPhone": "0460502151",
            "customerState": "Vic",
            "customerSuburb": "Albion",
            "customerAddress": "2a maylands street",
            "customerLastName": "Albert",
            "customerPostCode": "3020",
            "customerFirstName": "Shayne",
            "productSerialNumber": "350256190537708"
        }

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
            "labType": "L2",
            "partNos": ["GH82-29451A", "GH82-29450A", "GH82-29454A", "GH82-29456A", "GH82-29461C"],
            "solvupId": "WI30051267",
            "vendorRa": "4439420124",
            "irisSympt": "652",
            "irisRepair": "A",
            "repairCode": "SRC500",
            "attachments": [],
            "faultReport": "no display",
            "symptomCat1": "L4",
            "symptomCat2": "01",
            "symptomCat3": "02",
            "symptomName": null,
            "purchaseDate": null,
            "warrantyType": "OW",
            "conditionCode": "1",
            "diagnosisNote": "replace octa",
            "quoteRejected": false,
            "irisSymptQcode": "SRC509",
            "productSerialNumber": "350383130051267"
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
        "solvupId": "WI70329095",
        "vendorRa": "4438891971",
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

export async function testGetJobSheet(client) {
    console.log('📄 Testing getJobSheet...\n');

    const data = {
        vendorRa: '4438957197'
    };
    const result = await client.getJobSheet(data);

    console.log('Result success:', result?.success);
    console.log('PDF base64 length:', result?.pdf?.length);

    if (!result?.success) {
        throw new Error('❌ getJobSheet failed');
    }

    if (!result?.pdf) {
        throw new Error('❌ getJobSheet failed: no pdf returned');
    }

    console.log('✅ getJobSheet passed\n');
}

