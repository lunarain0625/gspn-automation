export async function clickUntil({
                                     trigger,
                                     page,
                                     isReady,
                                     maxAttempts = 5,
                                     clickDelay = 100,
                                     settleTimeoutMs = 3000,
                                     actionLabel = 'trigger',
                                     loadingOverlay = page.locator('iframe[name="rightContents"]')
                                         .contentFrame().locator('#progressloading'),
                                     readyTimeoutMs = 30000
                                 }) {
    await trigger.waitFor({state: 'visible'});
    await trigger.scrollIntoViewIfNeeded();
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔁 ${actionLabel} click attempt ${attempt}`);
        await loadingOverlay.waitFor({
            state: 'hidden',
            timeout: 10000
        }).catch(() => {
        });
        try {
            await trigger.click({delay: clickDelay, force: true});
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            console.error(`⚠️ ${actionLabel} click failed on attempt ${attempt}: ${message}`);

            // Sometimes Playwright reports click failure,
            // but the UI action was actually triggered successfully.
            const readyAfterClickFailure = await isReady().catch(() => false);

            if (readyAfterClickFailure) {
                console.log(`✅ ${actionLabel} already ready after click failure`);
                return;
            }

            if (message.includes('intercepts pointer events')) {
                console.log(`⚠️ ${actionLabel} click intercepted by overlay, waiting and retrying...`);

                await loadingOverlay.waitFor({
                    state: 'hidden',
                    timeout: 10000
                }).catch(() => {
                });

                await page.waitForTimeout(settleTimeoutMs);
                continue;
            }

            throw error;
        }
        const startedAt = Date.now();
        while (Date.now() - startedAt < readyTimeoutMs) {
            await loadingOverlay.waitFor({
                state: 'hidden',
                timeout: 10000
            }).catch(() => {
            });
            const ready = await isReady().catch(() => false);
            if (ready) {
                console.log(`✅ ${actionLabel} click effective`);
                return;
            }
            await page.waitForTimeout(settleTimeoutMs);
            console.log(`settle timeout passed, re-checking ready state...`)
        }
    }

    throw new Error(`❌ Clicking ${actionLabel} did not reach expected state`);
}

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

export async function clickUntilVisible({
                                            trigger,
                                            target,
                                            page,
                                            maxAttempts = 5,
                                            clickDelay = 100,
                                            settleTimeoutMs = 3000,
                                            actionLabel = 'trigger',
                                            loadingOverlay,
                                            readyTimeoutMs = 30000
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

export async function handleConfirmNotice(page) {

    const rightFrame = page
        .locator('iframe[name="rightContents"]')
        .contentFrame();

    const confirmNotice = rightFrame.locator('#divConfirmNotice');

    if (!(await confirmNotice.isVisible().catch(() => false))) {
        return false;
    }

    const message = await confirmNotice
        .locator('#tbodyConfirmNotice')
        .innerText()
        .catch(() => '');

    console.log('⚠️ Confirm Notice:', message);

    await confirmNotice
        .getByRole('link', {name: 'Save'})
        .click();

    console.log('✅ Confirm Notice Save clicked');
    return true;
}
