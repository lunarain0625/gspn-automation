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
import {getJobInfo} from "./tasks/get-job-info.js";
import {uploadJobAttachments} from "./tasks/upload-job-attachments.js";
import {searchPartsByModel} from "./tasks/search-parts-by-model.js";
import {getJobSheet} from "./tasks/get-job-sheet.js";
import {resetJob} from "./tasks/reset-job.js";
import {applyInspectionFee} from "./tasks/apply-inspection-fee.js";

const CONFIG = {
    baseUrl: 'https://gspn2.samsungcsportal.com',
    loginUrl: 'https://gspn2.samsungcsportal.com/index.jsp',
    dashboardUrl: 'https://gspn2.samsungcsportal.com/main.jsp',
    partsSearchUrl: 'https://biz2.samsungcsportal.com/master/part/GeneralPartInfo.jsp',
    storagePath: 'state.json',
    sessionCheckIntervalMs: 5 * 60 * 1000,
    loginTimeoutMs: 180000,
    defaultTimeoutMs: 30000,
    captchaTtlMs: 5 * 60 * 1000,
    credentials: {
        username: process.env.GSPN_USERNAME,
        password: process.env.GSPN_PASSWORD
    }
};

const LOGIN_SELECTORS = {
    loginId: '#login_form_all input[name="LOGIN_ID"]',
    password: 'input[type="password"]',
    captchaImage: '#recaptcha_challenge_image',
    captchaResponse: '#recaptcha_response_field'
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
        // 等待人工输入验证码的登录。页面必须保持存活，所以状态挂在实例上。
        this.pendingLogin = null;
        this.currentCredentials = {
            username: this.config.credentials.username,
            password: this.config.credentials.password
        };
    }

    async initBrowser() {
        if (this.browser) return;
        this.browser = await chromium.launch({
            headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        }
    }

    async searchPartsByModel(data) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                return await searchPartsByModel(businessPage, data);
            });
        } finally {
            this.isBusy = false;
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
        }
    }

    async getJobInfo(data) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                await findJob(businessPage, data);
                return await getJobInfo(businessPage);
            });
        } finally {
            this.isBusy = false;
        }
    }

    async getJobSheet(data) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                await findJob(businessPage, data);
                return await getJobSheet(businessPage);
            });
        } finally {
            this.isBusy = false;
        }
    }

    async uploadJobAttachments(data) {
        this.isBusy = true;
        try {
            return await this.withBusinessPage(async (businessPage) => {
                await findJob(businessPage, data);
                return await uploadJobAttachments(businessPage, data);
            });
        } finally {
            this.isBusy = false;
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
            await this.keepAliveOnce("[createJob]");
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
                        await resetJob(businessPage, data);
                        const result = await updateJobRepairInfo(businessPage, data);
                        if (data.attachments && data.attachments.length > 0) {
                            await findJob(businessPage, data);
                            await uploadJobAttachments(businessPage, data);
                        }

                        //报价被拒,申请inspection fee
                        if (data.quoteRejected) {
                            await findJob(businessPage, data);
                            await applyInspectionFee(businessPage, data);
                        }
                        return result
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            });

        } finally {
            this.isBusy = false;
            await this.keepAliveOnce("[updateJob]");
        }
    }

    async addParts(data) {
        this.isBusy = true;

        try {
            return await this.withBusinessPage(async (businessPage) => {
                await findJob(businessPage, data);
                const addPartResult = await addParts(businessPage, data);
                if (!data.partsPoPrefix) {
                    return addPartResult;
                }
                if (addPartResult.message === 'No parts to add') {
                    return addPartResult;
                }
                const po = await createPo(businessPage, data);
                await findJob(businessPage, data);
                await updateJobStatus(businessPage, 'ST030', 'HP045');
                return po;
            });

        } finally {
            this.isBusy = false;
            await this.keepAliveOnce("[addParts]");
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
            await this.keepAliveOnce("[completeJob]");
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
            await this.keepAliveOnce("[deliverGood]");
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

        this.pendingLogin = null;

        await this.page.goto(this.config.loginUrl, {
            waitUntil: 'domcontentloaded'
        });

        return await this.submitLoginForm(loginUsername, loginPassword);
    }

    /**
     * 填表 → 点登录 → 处理弹窗 → 等 MFA。
     * 首次登录和补交验证码后的重试都走这里，保证两条路径行为一致。
     */
    async submitLoginForm(loginUsername, loginPassword, captchaText = null) {
        await this.page.locator(LOGIN_SELECTORS.loginId).fill(loginUsername);
        await this.page.locator(LOGIN_SELECTORS.password).fill(loginPassword);

        if (captchaText !== null) {
            await this.page.locator(LOGIN_SELECTORS.captchaResponse).fill(captchaText);
        }

        const dialogPromise = this.page.waitForEvent('dialog', {timeout: 3000}).catch(() => null);
        await this.page.getByRole('img', {name: 'Login'}).click();
        const dialog = await dialogPromise;

        if (dialog) {
            const message = dialog.message();
            await dialog.accept();

            // 连错两次后 GSPN 会先要验证码，验证码通过了才去校验密码。
            // 所以这里不能当成密码错误处理，得把图捞出来交给人。
            if (/captcha/i.test(message)) {
                console.log('🖼️ GSPN is asking for a captcha');
                const captchaImage = await this.captureCaptcha();

                if (!captchaImage) {
                    return {
                        success: false,
                        code: 'CAPTCHA_UNAVAILABLE',
                        message: `${message} (captcha image could not be captured)`
                    };
                }

                this.pendingLogin = {
                    username: loginUsername,
                    password: loginPassword,
                    createdAt: Date.now()
                };

                return {
                    success: false,
                    code: 'CAPTCHA_REQUIRED',
                    message,
                    captchaImage
                };
            }

            // GSPN 用弹窗报所有登录失败原因。已知的单独归类，未知的原样透传，
            // 这样密码过期之类没见过的情况也能在 portal 上看到 Samsung 原话。
            const code = message.includes('GSPN ID or password is not matched')
                ? 'INVALID_CREDENTIALS'
                : 'LOGIN_REJECTED';

            console.error(`❌ Login rejected by GSPN [${code}]: ${message}`);
            this.pendingLogin = null;

            return {
                success: false,
                code,
                message
            };
        }

        // await this.page.getByRole('link', {name: 'MFA (Multi-Factor'}).click();
        await this.page.getByText('SingleID Authenticator - PIN').click();

        console.log('⏳ Waiting for MFA...');

        const mfaOk = await this.page.waitForURL('**/main.jsp', {
            timeout: this.config.loginTimeoutMs
        }).then(() => true).catch(() => false);

        if (!mfaOk) {
            console.error('❌ MFA verification timed out');
            this.pendingLogin = null;
            return {
                success: false,
                code: 'MFA_TIMEOUT',
                message: `MFA verification timed out after ${this.config.loginTimeoutMs / 1000}s`
            };
        }

        this.pendingLogin = null;
        this.isLoggedIn = true;
        console.log('✅ Login success');
        await this.context.storageState({path: this.config.storagePath});
        return {
            success: true,
            message: 'Login success'
        };
    }

    /** 把验证码图片截成 data URL。截图而不是读 src，因为图片地址依赖会话 cookie。 */
    async captureCaptcha() {
        const image = this.page.locator(LOGIN_SELECTORS.captchaImage);

        try {
            await image.waitFor({state: 'visible', timeout: 15000});
            const buffer = await image.screenshot();
            return `data:image/png;base64,${buffer.toString('base64')}`;
        } catch (error) {
            console.warn('⚠️ Could not capture captcha image:', error.message);
            return null;
        }
    }

    /** 人工输入验证码后继续登录。验证码错会再给一张新图，可以反复提交。 */
    async submitCaptcha(captchaText) {
        if (!this.pendingLogin) {
            return {
                success: false,
                code: 'NO_PENDING_LOGIN',
                message: 'No login is waiting for a captcha'
            };
        }

        if (Date.now() - this.pendingLogin.createdAt > this.config.captchaTtlMs) {
            this.pendingLogin = null;
            return {
                success: false,
                code: 'CAPTCHA_EXPIRED',
                message: 'The captcha expired, please start the login again'
            };
        }

        if (!this.page || this.page.isClosed()) {
            this.pendingLogin = null;
            return {
                success: false,
                code: 'LOGIN_PAGE_LOST',
                message: 'The login page was closed, please start the login again'
            };
        }

        const {username, password} = this.pendingLogin;
        const result = await this.submitLoginForm(username, password, captchaText);

        if (result.success) {
            this.startKeepAlive();
        }

        return result;
    }

    async keepAliveOnce(label = "[trigger by timer]") {
        console.log(label, "isBusy:", this.isBusy, "page alive:", this.page && !this.page.isClosed());
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
        // 页面即将销毁，等待验证码的登录也就作废了
        this.pendingLogin = null;

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
