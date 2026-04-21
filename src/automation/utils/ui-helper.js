export async function clickUntilEditable({
                                             trigger,          // 要点击的元素
                                             targetInput,      // 用来判断是否成功的 input
                                             page,
                                             maxAttempts = 3
                                         }) {
    await trigger.waitFor({state: 'visible'});
    await trigger.scrollIntoViewIfNeeded();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔁 click attempt ${attempt}`);

        await trigger.click({delay: 100});
        await page.waitForLoadState('networkidle').catch(() => {
        });
        await page.waitForTimeout(500);

        const isEditable = await targetInput.evaluate((el) => {
            const input = /** @type {HTMLInputElement} */ (el);
            return !input.disabled && !input.readOnly;
        }).catch(() => false);

        if (isEditable) {
            console.log('✅ click effective');
            return;
        }
    }

    throw new Error('❌ Click did not activate target input');
}

export async function clickUntil({
    trigger,
    page,
    isReady,
    maxAttempts = 10,
    clickDelay = 100,
    settleTimeoutMs = 500,
    actionLabel = 'trigger',
    loadingOverlay = page.locator('#progressloading'),
    readyTimeoutMs = 4000
}) {
    await trigger.waitFor({ state: 'visible' });
    await trigger.scrollIntoViewIfNeeded();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔁 ${actionLabel} click attempt ${attempt}`);

        // Before clicking, wait for any loading overlay to disappear.
        await loadingOverlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        try {
            await trigger.click({ delay: clickDelay, timeout: 3000 });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            // Legacy pages sometimes leave a loading mask over the page.
            // Wait once more for it to disappear, then retry the click loop.
            if (message.includes('intercepts pointer events')) {
                console.log(`⚠️ ${actionLabel} click intercepted by overlay, waiting and retrying...`);
                await loadingOverlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
                await page.waitForTimeout(settleTimeoutMs);
                continue;
            }

            throw error;
        }

        await page.waitForLoadState('networkidle').catch(() => {});

        try {
            await page.waitForFunction(async () => {
                return await Promise.resolve(true);
            }, { timeout: 50 }).catch(() => {});
        } catch {}

        // After clicking, allow legacy UI time to finish loading and reveal the next state.
        const startedAt = Date.now();
        while (Date.now() - startedAt < readyTimeoutMs) {
            await loadingOverlay.waitFor({ state: 'hidden', timeout: 1000 }).catch(() => {});

            const ready = await isReady().catch(() => false);
            if (ready) {
                console.log(`✅ ${actionLabel} click effective`);
                return;
            }

            await page.waitForTimeout(settleTimeoutMs);
        }
    }

    throw new Error(`❌ Clicking ${actionLabel} did not reach expected state`);
}

export async function clickUntilVisible({
    trigger,
    target,
    page,
    maxAttempts = 3,
    clickDelay = 100,
    settleTimeoutMs = 500,
    actionLabel = 'trigger',
    loadingOverlay,
    readyTimeoutMs = 4000
}) {
    return clickUntil({
        trigger,
        page,
        maxAttempts,
        clickDelay,
        settleTimeoutMs,
        actionLabel,
        loadingOverlay,
        readyTimeoutMs,
        isReady: async () => await target.isVisible().catch(() => false)
    });
}

export async function clickUntilEnabled({
    trigger,
    target,
    page,
    maxAttempts = 3,
    clickDelay = 100,
    settleTimeoutMs = 500,
    actionLabel = 'trigger',
    loadingOverlay,
    readyTimeoutMs = 4000
}) {
    return clickUntil({
        trigger,
        page,
        maxAttempts,
        clickDelay,
        settleTimeoutMs,
        actionLabel,
        loadingOverlay,
        readyTimeoutMs,
        isReady: async () => {
            return await target.evaluate((el) => {
                const element = /** @type {HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement} */ (el);
                return !element.disabled && !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true';
            }).catch(() => false);
        }
    });
}

export async function findFirstVisible(locator) {
    const count = await locator.count();

    for (let i = 0; i < count; i++) {
        const candidate = locator.nth(i);
        const visible = await candidate.isVisible().catch(() => false);
        if (visible) {
            return candidate;
        }
    }

    return null;
}

export async function getVisibleElementById(page, id, elementLabel = id) {
    const matches = page.locator(`#${id}`);
    const element = await findFirstVisible(matches);

    if (!element) {
        throw new Error(`Visible ${elementLabel} not found`);
    }

    return element;
}

export async function fillVisibleInputById(page, id, value, elementLabel = id) {
    const element = await getVisibleElementById(page, id, elementLabel);
    await element.fill(value);
    return element;
}

export async function selectVisibleOptionById(page, id, value, elementLabel = id) {
    const element = await getVisibleElementById(page, id, elementLabel);
    await element.selectOption(value);
    return element;
}
