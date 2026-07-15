import {chromium} from 'playwright';
import fs from 'fs';
import {searchPart} from './tasks/search-part.js';
import {createJob} from './tasks/create-job.js';
import {findJob} from './tasks/find-job.js';
import {updateJobRepairInfo} from './tasks/update-job-repair-info.js';
import {completeJob} from "./tasks/complete-job.js";
import {deliverGood} from "./tasks/deliver-good.js";
import {addParts} from "./tasks/add-parts.js";
import {createPo} from "./tasks/create-po.js";
import {getDeviceInfoBySn} from "./tasks/get-device-info-by-sn.js";
import {updateJobStatus} from "./tasks/update-job-status.js";
import {billingJob} from "./tasks/billing-job.js";
import {getJobStatus} from "./tasks/get-job-status.js";

const CONFIG = {
    baseUrl: 'https://gspn2.samsungcsportal.com',
    loginUrl: 'https://gspn2.samsungcsportal.com/index.jsp',
    dashboardUrl: 'https://gspn2.samsungcsportal.com/main.jsp',
    partsSearchUrl: 'https://biz2.samsungcsportal.com/master/part/GeneralPartInfo.jsp',
    storagePath: 'state.json',
    sessionCheckIntervalMs: 5 * 60 * 1000,
    loginTimeoutMs: 180000,
    defaultTimeoutMs: 30000,
    credentials: {
        username: process.env.GSPN_USERNAME,
        password: process.env.GSPN_PASSWORD
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
        this.isLoggedIn = false;
        this.currentCredentials = {
            username: this.config.credentials.username,
            password: this.config.credentials.password
        };
    }

    async initBrowser() {
        if (this.browser) return;
        this.browser = await chromium.launch({
            headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
        });
    }

    async createContext(storageState = undefined) {
        this.context = await this.browser.newContext({storageState});
        this.page = await this.context.newPage();
        this.page.setDefaultTimeout(this.config.defaultTimeoutMs);
    }

    async init() {
        if (this.page && !this.page.isClosed()) {
            console.log('🚀 Already initialized');
            return;
        }

        this.businessPage = null;
        this.page = null;
        this.context = null;

        await this.initBrowser();

        const storageState = fs.existsSync(this.config.storagePath)
            ? this.config.storagePath
            : undefined;

        await this.createContext(storageState);

        await this.ensureLoggedIn();
        this.startKeepAlive();
    }

    async ensureLoggedIn() {
        const alive = await this.checkSessionAlive();
        if (!alive) {
            this.isLoggedIn = false;
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
                const rightFrame = this.businessPage
                    .locator('iframe[name="rightFrame"]')
                    .contentFrame();
                const isSystemError = await rightFrame
                    .locator('text=System Error')
                    .isVisible()
                    .catch(() => false);
                if (isSystemError) {
                    console.warn('⚠️ Business page is on System Error page, reopening...');
                    this.businessPage = null;
                } else {
                    return this.businessPage;
                }
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
            return await this.withBusinessPage(async () => {
                return await searchPart(this.context, this.config, keyword);
            });
        } finally {
            this.isBusy = false;
            // await this.keepAliveOnce();
        }
    }

    async getDeviceInfoBySn(serialNumber, purchaseDate = null, checkWarranty = false) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async () => {
                return await getDeviceInfoBySn(this.page, serialNumber, purchaseDate, checkWarranty);
            });
        } finally {
            this.isBusy = false;
            // await this.keepAliveOnce();
        }
    }

    async getJobStatus(data) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                await findJob(businessPage, data);
                return await getJobStatus(businessPage);
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
                return await createJob(businessPage, data, false);
            });
        } finally {
            this.isBusy = false;
            console.log('✅ Job creation completed, keeping session alive...');
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

    async addParts(data) {
        this.isBusy = true;

        try {
            return await this.withBusinessPage(async (businessPage) => {
                await findJob(businessPage, data);
                const addPartResult = await addParts(businessPage, data);
                console.log("partsPoPrefix:",data.partsPoPrefix)
                if (!data.partsPoPrefix) {
                    return addPartResult;
                }
                const po = await createPo(businessPage, data);
                await findJob(businessPage, data);
                await updateJobStatus(businessPage, 'ST030', 'HP045');
                return po;
            });

        } finally {
            this.isBusy = false;
            await this.keepAliveOnce();
        }
    }


    async completeJob(data) {
        this.isBusy = true;

        try {
            return await this.withBusinessPage(async (businessPage) => {

                await findJob(businessPage, data);
                await completeJob(businessPage, data);
                await findJob(businessPage, data);
                return await billingJob(businessPage, data);
            });

        } finally {
            this.isBusy = false;
            await this.keepAliveOnce();
        }
    }

    async deliverGood(data) {
        this.isBusy = true;

        try {
            return await this.withBusinessPage(async (businessPage) => {

                // 1️⃣ 先找到 job
                await findJob(businessPage, data);
                return await deliverGood(businessPage, data);
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
        const loginIdInput = this.page.locator('#login_form_all input[name="LOGIN_ID"]');
        const isLoginPage = await loginIdInput.isVisible().catch(() => false);
        const currentUrl = this.page.url();

        const alive = !isLoginPage && /main\.jsp/.test(currentUrl);

        if (!alive) {
            this.businessPage = null;
        }

        return alive;
    }

    async performLogin(username = null, password = null) {
        console.log('🔐 Need to login...');
        let loginUsername;
        let loginPassword;

        if (arguments.length === 0) {
            // 自动续登录，使用当前账号
            loginUsername = this.currentCredentials.username;
            loginPassword = this.currentCredentials.password;
        } else {
            // 指定账号登录
            loginUsername = username;
            loginPassword = password;
            this.currentCredentials = {
                username,
                password,
            };
        }

        await this.page.goto(this.config.loginUrl, {
            waitUntil: 'domcontentloaded'
        });

        await this.page.locator('#login_form_all input[name="LOGIN_ID"]').fill(loginUsername);
        await this.page.locator('input[type="password"]').fill(loginPassword);

        const dialogPromise = this.page.waitForEvent('dialog', {timeout: 3000});
        await this.page.getByRole('img', {name: 'Login'}).click();
        const dialog = await dialogPromise.catch(() => null);

        if (dialog) {
            const message = dialog.message();
            await dialog.accept();
            if (message.includes('GSPN ID or password is not matched')) {
                return {
                    success: false,
                    message
                };
            }
            throw new Error(`Unexpected login dialog: ${message}`);
        }

        await this.page.getByRole('link', {name: 'MFA (Multi-Factor'}).click();
        await this.page.getByText('SingleID Authenticator - PIN').click();

        console.log('⏳ Waiting for MFA...');

        await this.page.waitForURL('**/main.jsp', {
            timeout: this.config.loginTimeoutMs
        });
        this.isLoggedIn = true;
        console.log('✅ Login success');
        await this.context.storageState({path: this.config.storagePath});
        return {
            success: true,
            message: 'Login success'
        };
    }

    async keepAliveOnce() {
        console.log("isBusy:", this.isBusy, "page alive:", this.page && !this.page.isClosed());
        if (this.isBusy || !this.page || this.page.isClosed()) return;

        try {
            await this.page.goto(this.config.dashboardUrl, {
                waitUntil: 'domcontentloaded'
            });
            console.log('🫀 keep alive: dashboard refreshed');

            if (this.businessPage && !this.businessPage.isClosed()) {
                try {
                    await this.businessPage.close();
                    console.log('🔄 keep alive: old business page closed');
                } catch (closeError) {
                    console.warn('⚠️ keep alive: failed to close business page:', closeError.message);
                }
            }
            this.businessPage = null;
            await this.ensureBusinessPage();
            console.log('🚀 keep alive: fresh business page opened');
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

    async logout() {
        console.log('🚪 Logging out...');

        this.isLoggedIn = false;
        this.isBusy = false;

        // 停止 keep alive
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }

        // 删除持久化登录状态
        if (fs.existsSync(this.config.storagePath)) {
            fs.unlinkSync(this.config.storagePath);
        }

        // 关闭旧的 popup
        if (this.businessPage && !this.businessPage.isClosed()) {
            await this.businessPage.close().catch(() => {
            });
        }
        this.businessPage = null;

        // 重建 BrowserContext，彻底清除 Cookie / Storage
        if (this.context) {
            await this.context.close().catch(() => {
            });
        }

        await this.initBrowser();

        await this.createContext();

        console.log('✅ Logout complete');
    }

    async login(usePersonalAccount = false, username = null, password = null) {
        await this.initBrowser();
        await this.logout();
        if (!usePersonalAccount) {
            // 默认账号
            this.currentCredentials = {
                username: this.config.credentials.username,
                password: this.config.credentials.password,
            };
        }
        const result = usePersonalAccount
            ? await this.performLogin(username, password)
            : await this.performLogin();

        console.log('Login result:', result);
        if (!result.success) {
            return result;
        }

        this.startKeepAlive();
        return result;
    }
}

export const gspnClient = new GspnClient();
export const gspnQueryClient = new GspnClient();
export {GspnClient};
