import fs from 'fs';
import path from 'path';
import {gspnClient, gspnQueryClient} from '../../automation/gspn-client.js';

const DEBUG_DIR = 'debug';
// 文件名由我们自己生成（时间戳_任务名），这里再挡一次目录穿越
const DEBUG_FILE_PATTERN = /^[A-Za-z0-9_-]+\.(png|html)$/;

const LOGIN_CLIENTS = {
    workflow: gspnClient,
    query: gspnQueryClient
};

const LOGIN_ORDER = ['workflow', 'query'];

// 两个 client 依次登录，中途可能被 captcha 打断然后由 /login/captcha 接着往下走，
// 所以凭据要跨请求留着。单机部署（fly.io min_machines_running=1），放内存够用。
let pendingCredentials = null;

function clientState(client) {
    return {
        isLoggedIn: client.isLoggedIn,
        isBusy: client.isBusy,
        username: client.currentCredentials.username,
        awaitingCaptcha: Boolean(client.pendingLogin)
    };
}

async function loginOneClient(name) {
    const client = LOGIN_CLIENTS[name];

    // 已经登上的不要再 login()，因为 login() 会先 logout() 把会话清掉
    if (client.isLoggedIn) {
        return {success: true, message: 'Already logged in'};
    }

    const {usePersonalAccount, username, password} = pendingCredentials ?? {};
    return await client.login(usePersonalAccount, username, password);
}

async function runLoginSequence() {
    for (const name of LOGIN_ORDER) {
        const result = await loginOneClient(name);

        if (!result.success) {
            return {
                success: false,
                code: result.code ?? 'LOGIN_FAILED',
                message: result.message,
                failedClient: name,
                captchaImage: result.captchaImage ?? null
            };
        }
    }

    pendingCredentials = null;
    return {
        success: true,
        message: 'Both clients logged in successfully'
    };
}

function loginResponse(result) {
    return {
        ...result,
        workflowClient: clientState(gspnClient),
        queryClient: clientState(gspnQueryClient)
    };
}

//query client controller
export async function searchPartController(req, res) {
    try {
        const {partNo} = req.body;

        if (!partNo) {
            return res.status(400).json({
                success: false,
                message: 'partNo is required'
            });
        }
        await gspnQueryClient.init();
        const result = await gspnQueryClient.searchPart(partNo);

        return res.json(result);
    } catch (error) {
        console.error('searchPartController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function searchPartsByModelController(req, res) {
    try {
        const data = req.body;

        if (!data?.modelName) {
            return res.status(400).json({
                success: false,
                message: 'modelName is required'
            });
        }
        await gspnQueryClient.init();
        const result = await gspnQueryClient.searchPartsByModel(data);

        return res.json(result);
    } catch (error) {
        console.error('searchPartsByModelController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getDeviceController(req, res) {
    try {
        const {serialNumber, purchaseDate, checkWarranty} = req.query;
        if (!serialNumber) {
            return res.status(400).json({
                success: false,
                message: 'serialNumber is required'
            });
        }

        await gspnQueryClient.init();
        const result = await gspnQueryClient.getDeviceInfoBySn(serialNumber, purchaseDate, checkWarranty);

        return res.json(result);
    } catch (error) {
        console.error('getDeviceController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getJobStatusController(req, res) {
    try {
        const {vendorRa} = req.query;

        const data = {vendorRa};

        if (!vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            })
        }
        await gspnQueryClient.init();
        const result = await gspnQueryClient.getJobStatus(data);

        return res.json(result);
    } catch (error) {
        console.error('getJobStatusController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

export async function getJobInfoController(req, res) {
    try {
        const {vendorRa} = req.query;

        const data = {vendorRa};

        if (!vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            })
        }
        await gspnQueryClient.init();
        const result = await gspnQueryClient.getJobInfo(data);
        return res.json(result);

    } catch (error) {
        console.error('getJobInfoController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

export async function getJobSheetController(req, res) {
    try {
        const {vendorRa} = req.query;

        if (!vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnQueryClient.init();
        const result = await gspnQueryClient.getJobSheet({vendorRa});

        if (!result.success) {
            return res.status(500).json(result);
        }

        const pdfBuffer = Buffer.from(result.pdf, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="job-sheet-${vendorRa}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('getJobSheetController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//workflow client controller
export async function createJobController(req, res) {
    try {
        const data = req.body;

        if (!data?.solvupId) {
            return res.status(400).json({
                success: false,
                message: 'solvupId is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.createJob(data);

        return res.json(result);
    } catch (error) {
        console.error('createJobController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateJobController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.updateJob("repair_info", data);

        return res.json(result);
    } catch (error) {
        console.error('updateJobController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function addPartsController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        if (!data?.partNos?.length) {
            return res.status(400).json({
                success: false,
                message: 'partNos is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.addParts(data);

        return res.json(result);
    } catch (error) {
        console.error('addPartsController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function completeJobController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.completeJob(data);

        return res.json(result);
    } catch (error) {
        console.error('completeJobController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function deliverGoodController(req, res) {
    try {
        const data = req.body;

        if (!data?.vendorRa) {
            return res.status(400).json({
                success: false,
                message: 'vendorRa is required'
            });
        }

        await gspnClient.init();
        const result = await gspnClient.deliverGood(data);

        return res.json(result);
    } catch (error) {
        console.error('deliverGoodController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//workflow client auth controller
export async function gspnStateController(req, res) {
    try {
        return res.json({
            workflowClient: {
                isLoggedIn: gspnClient.isLoggedIn,
                isBusy: gspnClient.isBusy,
                username: gspnClient.currentCredentials.username,
            },
            queryClient: {
                isLoggedIn: gspnQueryClient.isLoggedIn,
                isBusy: gspnQueryClient.isBusy,
                username: gspnQueryClient.currentCredentials.username,
            },
            success: true,
        });
    } catch (error) {
        console.error('gspnStateController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function gspnLoginController(req, res) {
    try {
        const {usePersonalAccount, username, password} = req.body;
        console.log('gspnLoginController called with username:', username);

        pendingCredentials = {usePersonalAccount, username, password};

        const result = await runLoginSequence();
        return res.json(loginResponse(result));
    } catch (error) {
        console.error('gspnLoginController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * 人工输入验证码后继续登录。
 * 该 client 过了之后自动接着登下一个 —— 下一个可能又要验证码，前端要能连着弹。
 */
export async function gspnLoginCaptchaController(req, res) {
    try {
        const {client = 'workflow', captchaText} = req.body;

        if (!captchaText) {
            return res.status(400).json({
                success: false,
                message: 'captchaText is required'
            });
        }

        const target = LOGIN_CLIENTS[client];

        if (!target) {
            return res.status(400).json({
                success: false,
                message: `Unknown client: ${client}`
            });
        }

        console.log(`gspnLoginCaptchaController: submitting captcha for ${client} client`);

        const result = await target.submitCaptcha(captchaText);

        if (!result.success) {
            return res.json(loginResponse({
                success: false,
                code: result.code ?? 'LOGIN_FAILED',
                message: result.message,
                failedClient: client,
                captchaImage: result.captchaImage ?? null
            }));
        }

        // 这个 client 过了，继续登剩下的（已登录的会被跳过）
        return res.json(loginResponse(await runLoginSequence()));
    } catch (error) {
        console.error('gspnLoginCaptchaController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function gspnLogoutController(req, res) {
    try {
        // Logout both clients
        await gspnClient.logout();
        await gspnQueryClient.logout();
        return res.json({
            success: true,
            message: 'Both clients logged out successfully'
        });
    } catch (error) {
        console.error('gspnLogoutController error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


/** 列出失败现场文件，最新在前。 */
export async function debugListController(req, res) {
    try {
        if (!fs.existsSync(DEBUG_DIR)) {
            return res.json({success: true, files: []});
        }

        const files = fs.readdirSync(DEBUG_DIR)
            .filter((name) => DEBUG_FILE_PATTERN.test(name))
            .map((name) => {
                const stat = fs.statSync(path.join(DEBUG_DIR, name));
                return {name, size: stat.size, modifiedAt: stat.mtime.toISOString()};
            })
            .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

        return res.json({success: true, files});
    } catch (error) {
        console.error('debugListController error:', error);
        return res.status(500).json({success: false, message: error.message});
    }
}

/** 下载单个失败现场文件。 */
export async function debugFileController(req, res) {
    try {
        const {file} = req.params;

        if (!DEBUG_FILE_PATTERN.test(file)) {
            return res.status(400).json({success: false, message: 'Invalid file name'});
        }

        const fullPath = path.resolve(DEBUG_DIR, file);

        if (!fullPath.startsWith(path.resolve(DEBUG_DIR) + path.sep) || !fs.existsSync(fullPath)) {
            return res.status(404).json({success: false, message: 'Not found'});
        }

        return res.sendFile(fullPath);
    } catch (error) {
        console.error('debugFileController error:', error);
        return res.status(500).json({success: false, message: error.message});
    }
}
