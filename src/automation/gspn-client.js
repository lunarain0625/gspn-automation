import {chromium} from 'playwright';
import fs from 'fs';
import {searchPart} from './tasks/search-part.js';
import {createJob} from './tasks/create-job.js';
import {findJob} from './tasks/find-job.js';
import {updateJobRepairInfo} from './tasks/update-job-repair-info.js';

const CONFIG = {
    baseUrl: 'https://gspn2.samsungcsportal.com',
    loginUrl: 'https://gspn2.samsungcsportal.com/index.jsp',
    dashboardUrl: 'https://gspn2.samsungcsportal.com/main.jsp',
    partsSearchUrl: 'https://biz2.samsungcsportal.com/master/part/GeneralPartInfo.jsp',
    storagePath: 'state.json',
    sessionCheckIntervalMs: 2 * 60 * 1000,
    loginTimeoutMs: 180000,
    defaultTimeoutMs: 30000,
    credentials: {
        username: process.env.GSPN_USERNAME || 'harry0625',
        password: process.env.GSPN_PASSWORD || 'mnbvcxz12!@#'
    }
};

class GspnClient {
    constructor(config = CONFIG) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.businessPage = null;
        this.keepAliveTimer = null;
        this.isBusy = false;
    }

    async init() {
        if (this.page && !this.page.isClosed()) {
            return;
        }

        this.businessPage = null;
        this.page = null;
        this.context = null;
        this.browser = null;
        this.browser = await chromium.launch({headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'});

        const storageState = fs.existsSync(this.config.storagePath)
            ? this.config.storagePath
            : undefined;

        this.context = await this.browser.newContext({storageState});
        this.page = await this.context.newPage();
        this.page.setDefaultTimeout(this.config.defaultTimeoutMs);

        await this.ensureLoggedIn();
        this.startKeepAlive();
    }

    async ensureLoggedIn() {
        const alive = await this.checkSessionAlive();
        if (!alive) {
            await this.performLogin();
        }
    }

    async ensureBusinessPage() {
        await this.ensureLoggedIn();

        const pageAlive = this.page && !this.page.isClosed();
        const businessAlive = this.businessPage && !this.businessPage.isClosed();

        if (!pageAlive) {
            this.businessPage = null;
            this.page = null;
            this.context = null;
            this.browser = null;
            await this.init();
        }

        if (businessAlive) {
            try {
                await this.businessPage.waitForLoadState('domcontentloaded');
                return this.businessPage;
            } catch (error) {
                this.businessPage = null;
            }
        }

        const menuFrame = this.page.locator('frame[name="menu"]').contentFrame();
        const popupPromise = this.page.waitForEvent('popup');

        await menuFrame.getByText('Business').click();

        const businessPage = await popupPromise;
        await businessPage.waitForLoadState('domcontentloaded');
        await businessPage.waitForSelector('iframe[name="leftMenus"]');

        this.businessPage = businessPage;
        return this.businessPage;
    }

    async withBusinessPage(task) {
        const businessPage = await this.ensureBusinessPage();
        return await task(businessPage);
    }

    async searchPart(keyword) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                return await searchPart(businessPage, this.config, keyword);
            });
        } finally {
            this.isBusy = false;
            await this.keepAliveOnce();
        }
    }


    async createJob(data) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                return await createJob(businessPage, this.config, data);
            });
        } finally {
            this.isBusy = false;
            await this.keepAliveOnce();
        }
    }

    async updateJob(action, data) {
        this.isBusy = true;

        try {
            return await this.withBusinessPage(async (businessPage) => {

                // 1️⃣ 先找到 job
                await findJob(businessPage, data);

                // 2️⃣ 根据 action 分发
                switch (action) {
                    case 'repair_info':
                        return await updateJobRepairInfo(businessPage, data);

                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            });

        } finally {
            this.isBusy = false;
            await this.keepAliveOnce();
        }
    }

    async checkSessionAlive() {
        await this.page.goto(this.config.dashboardUrl, {
            waitUntil: 'domcontentloaded'
        });

        await this.page.waitForLoadState('networkidle').catch(() => {
        });
        await this.page.waitForTimeout(1500);

        const loginIdInput = this.page.locator('#login_form_all input[name="LOGIN_ID"]');
        const isLoginPage = await loginIdInput.isVisible().catch(() => false);
        const currentUrl = this.page.url();

        const alive = !isLoginPage && /main\.jsp/.test(currentUrl);

        if (!alive) {
            this.businessPage = null;
        }

        return alive;
    }

    async performLogin() {
        console.log('🔐 Need to login...');

        await this.page.goto(this.config.loginUrl, {
            waitUntil: 'domcontentloaded'
        });

        await this.page.locator('#login_form_all input[name="LOGIN_ID"]').fill(this.config.credentials.username);
        await this.page.locator('input[type="password"]').fill(this.config.credentials.password);
        await this.page.getByRole('img', {name: 'Login'}).click();
        await this.page.getByRole('link', {name: 'MFA (Multi-Factor'}).click();
        await this.page.getByText('SingleID Authenticator - PIN').click();

        console.log('⏳ Waiting for MFA...');

        await this.page.waitForURL('**/main.jsp', {
            timeout: this.config.loginTimeoutMs
        });

        console.log('✅ Login success');

        await this.context.storageState({path: this.config.storagePath});
    }

    async keepAliveOnce() {
        if (this.isBusy || !this.page) return;

        try {
            await this.page.goto(this.config.dashboardUrl, {
                waitUntil: 'domcontentloaded'
            });
            console.log('🫀 keep alive');
        } catch (e) {
            this.businessPage = null;
            console.log('⚠️ keep alive failed');
        }
    }

    startKeepAlive() {
        if (this.keepAliveTimer) return;

        this.keepAliveTimer = setInterval(async () => {
            await this.keepAliveOnce();
        }, this.config.sessionCheckIntervalMs);
    }

    async close() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }

        if (this.businessPage) {
            await this.businessPage.close().catch(() => {
            });
            this.businessPage = null;
        }

        if (this.page) {
            await this.page.close().catch(() => {
            });
            this.page = null;
        }

        if (this.context) {
            await this.context.close().catch(() => {
            });
            this.context = null;
        }

        if (this.browser) {
            await this.browser.close().catch(() => {
            });
            this.browser = null;
        }
    }
}

export const gspnClient = new GspnClient();
export {GspnClient};
