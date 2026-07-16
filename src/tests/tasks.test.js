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
            "source": "MANUAL",
            "solvupId": "TWI30051267",
            "vendorRa": "4438957197",
            "irisSympt": "160",
            "repairCode": "SRC500",
            "attachments": [{
                "id": "cmrn2jgh6000015kzd4jtwrv4",
                "url": "https://pub-500107de24c64d6cacb0fe46cbd795d4.r2.dev/attachments/cmrlliinm000015o21ra8zho4/1784179721095-Item_20260615T012032.pdf",
                "type": "PRODUCT_DEFECT_IMAGE",
                "caseId": "cmrlliinm000015o21ra8zho4",
                "fileSize": 73761,
                "filename": "Item_20260615T012032.pdf",
                "createdAt": "2026-07-16T05:28:42.282Z",
                "storageKey": "attachments/cmrlliinm000015o21ra8zho4/1784179721095-Item_20260615T012032.pdf"
            }, {
                "id": "cmrn2iwrr000415pijnf2huvc",
                "url": "https://pub-500107de24c64d6cacb0fe46cbd795d4.r2.dev/attachments/cmrlliinm000015o21ra8zho4/1784179695058-NanoFlow_2.png",
                "type": "OFFICIAL_DOCUMENT",
                "caseId": "cmrlliinm000015o21ra8zho4",
                "fileSize": 2582249,
                "filename": "NanoFlow_2.png",
                "createdAt": "2026-07-16T05:28:16.743Z",
                "storageKey": "attachments/cmrlliinm000015o21ra8zho4/1784179695058-NanoFlow_2.png"
            }, {
                "id": "cmrn1mook000115pikr6dt01x",
                "url": "https://pub-500107de24c64d6cacb0fe46cbd795d4.r2.dev/attachments/cmrlliinm000015o21ra8zho4/1784178192091-werribee_preview.png",
                "type": "PROOF_OF_PURCHASE",
                "caseId": "cmrlliinm000015o21ra8zho4",
                "fileSize": 33561,
                "filename": "werribee_preview.png",
                "createdAt": "2026-07-16T05:03:13.268Z",
                "storageKey": "attachments/cmrlliinm000015o21ra8zho4/1784178192091-werribee_preview.png"
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
