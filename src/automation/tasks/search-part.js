export async function searchPart(context, config, keyword) {
    console.log('🔎 Searching part:', keyword);

    // 创建一个新的独立 page
    const page = await context.newPage();

    try {
        await page.goto(config.partsSearchUrl + `?dataMode=D&partNo=${keyword}`);

        // 等价格元素出现
        const priceLocator = page.locator('#unitPrice');
        await priceLocator.waitFor({state: 'visible'});

        // 获取价格文本，例如 "230.70 [AUD]"
        const rawPrice = (await priceLocator.textContent())?.trim() || '';

        // 只保留数字部分
        const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));

        if (Number.isNaN(price)) {
            throw new Error(`Failed to parse price for part ${keyword}: ${rawPrice}`);
        }

        console.log('💰 Price:', price);

        return {
            success: true,
            partNo: keyword,
            rawPrice,
            price
        };
    } finally {
        await page.close();
    }
}
