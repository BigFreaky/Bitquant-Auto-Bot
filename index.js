require('dotenv').config();
const axios = require('axios');
const nacl = require('tweetnacl');
const Base58 = require('base-58');
const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { TextEncoder } = require('util');

// Enhanced color palette from your provided code
const colors = {
    // Primary colors
    primary: '\x1b[38;5;39m',     // Bright blue
    secondary: '\x1b[38;5;198m',    // Pink
    accent: '\x1b[38;5;118m',      // Bright green
    warning: '\x1b[38;5;220m',      // Gold
    error: '\x1b[38;5;196m',        // Bright red
    success: '\x1b[38;5;46m',      // Neon green

    // Text colors
    white: '\x1b[97m',
    gray: '\x1b[38;5;245m',
    darkGray: '\x1b[38;5;238m',
    lightGray: '\x1b[38;5;252m',

    // Special effects
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    strikethrough: '\x1b[9m',

    // Background colors
    bgBlack: '\x1b[40m',
    bgPrimary: '\x1b[48;5;39m',
    bgSuccess: '\x1b[48;5;46m',
    bgWarning: '\x1b[48;5;220m',
    bgError: '\x1b[48;5;196m',

    // Reset
    reset: '\x1b[0m'
};

// Box drawing characters from your provided code
const box = {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    cross: '+',
    tee: {
        down: '+',
        up: '+',
        right: '+',
        left: '+'
    }
};

// Spinner and new logger from your provided code
const spinner = {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    current: 0,
    interval: null,

    start(message) {
        this.stop();
        process.stdout.write('\x1b[?25l'); // Hide cursor
        this.interval = setInterval(() => {
            process.stdout.write(`\r${colors.primary}${this.frames[this.current]} ${colors.white}${message}${colors.reset}      `);
            this.current = (this.current + 1) % this.frames.length;
        }, 100);
    },

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            process.stdout.write('\r\x1b[K'); // Clear line
            process.stdout.write('\x1b[?25h'); // Show cursor
        }
    }
};

const logger = {
    info: (msg) => {
        spinner.stop();
        // ICON ADDED
        console.log(`${colors.primary}✔️  ${colors.white}${msg}${colors.reset}`);
    },
    wallet: (msg) => {
        spinner.stop();
        // ICON ADDED
        console.log(`${colors.warning}👛  ${colors.white}${msg}${colors.reset}`);
    },
    chain: (msg) => {
        spinner.stop();
        // ICON ADDED
        console.log(`${colors.secondary}🔗  ${colors.white}${msg}${colors.reset}`);
    },
    star: (msg) => {
        spinner.stop();
        console.log(`${colors.warning}⭐  ${colors.white}${msg}${colors.reset}`);
    },
    warn: (msg) => {
        spinner.stop();
        console.log(`${colors.warning}⚠️  ${msg}${colors.reset}`);
    },
    error: (msg) => {
        spinner.stop();
        console.log(`${colors.error}❌  ${msg}${colors.reset}`);
    },
    success: (msg) => {
        spinner.stop();
        console.log(`${colors.success}✅  ${msg}${colors.reset}`);
    },
    loading: (msg) => {
        spinner.start(msg);
    },
    step: (msg) => {
        spinner.stop();
        console.log(`${colors.secondary}➡️  ${msg}${colors.reset}`);
    },
    userInfo: (msg) => {
        spinner.stop();
        console.log(`${colors.lightGray}🔎  ${msg}${colors.reset}`);
    },
    processing: (msg) => {
        spinner.start(msg);
    },
    banner: () => {
        spinner.stop();
        const width = 70;
        const title = 'BITQUANT AUTO BOT';
        const subtitle = 'AUTOMATED BOT FOR DAILY AI INTERACTIONS';
        const version = 'Telegram: https://t.me/earningdropshub';
        const author = 'CREATED BY BIGFREAKY WITH ❤️';

        console.log();
        console.log(`${colors.primary}${box.topLeft}${box.horizontal.repeat(width - 2)}${box.topRight}${colors.reset}`);
        console.log(`${colors.primary}${box.vertical}${' '.repeat(width - 2)}${box.vertical}${colors.reset}`);

        const titlePadding = Math.floor((width - 2 - title.length) / 2);
        const titleSpace = width - 2 - titlePadding - title.length;
        console.log(`${colors.primary}${box.vertical}${' '.repeat(titlePadding)}${colors.accent}${colors.bold}${title}${colors.reset}${' '.repeat(titleSpace)}${colors.primary}${box.vertical}${colors.reset}`);

        const subtitlePadding = Math.floor((width - 2 - subtitle.length) / 2);
        const subtitleSpace = width - 2 - subtitlePadding - subtitle.length;
        console.log(`${colors.primary}${box.vertical}${' '.repeat(subtitlePadding)}${colors.secondary}${subtitle}${colors.reset}${' '.repeat(subtitleSpace)}${colors.primary}${box.vertical}${colors.reset}`);

        console.log(`${colors.primary}${box.vertical}${' '.repeat(width - 2)}${box.vertical}${colors.reset}`);

        const authorPadding = Math.floor((width - 2 - author.length) / 2);
        const authorSpace = width - 2 - authorPadding - author.length;
        console.log(`${colors.primary}${box.vertical}${' '.repeat(authorPadding)}${colors.warning}${author}${colors.reset}${' '.repeat(authorSpace)}${colors.primary}${box.vertical}${colors.reset}`);

        const versionPadding = Math.floor((width - 2 - version.length) / 2);
        const versionSpace = width - 2 - versionPadding - version.length;
        console.log(`${colors.primary}${box.vertical}${' '.repeat(versionPadding)}${colors.gray}${version}${colors.reset}${' '.repeat(versionSpace)}${colors.primary}${box.vertical}${colors.reset}`);

        console.log(`${colors.primary}${box.vertical}${' '.repeat(width - 2)}${box.vertical}${colors.reset}`);
        console.log(`${colors.primary}${box.bottomLeft}${box.horizontal.repeat(width - 2)}${box.bottomRight}${colors.reset}`);
        console.log();
    }
};

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const getHeaders = () => {
    const randomUA = getRandomUserAgent();
    return {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUA.includes('Chrome') ? `"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"` : `"Firefox";v="132", "Not A(Brand";v="99"`,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': randomUA.includes('Windows') ? '"Windows"' : randomUA.includes('Mac') ? '"macOS"' : '"Linux"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': randomUA,
        'origin': 'https://www.bitquant.io',
        'referer': 'https://www.bitquant.io/',
        'referrer-policy': 'strict-origin-when-cross-origin'
    };
};

async function loadChatPrompts() {
    try {
        const data = await fs.readFile('questions.txt', 'utf8');
        const prompts = data.split('\n').map(line => line.trim()).filter(line => line);
        if (prompts.length === 0) {
            logger.error('questions.txt is empty. Please add prompts to the file, one per line.');
            return [];
        }
        logger.info(`Successfully loaded ${prompts.length} chat prompts from questions.txt`);
        return prompts;
    } catch (error) {
        logger.error(`Failed to load questions.txt: ${error.message}`);
        logger.error('Please ensure a file named questions.txt exists in the same directory and contains prompts.');
        return [];
    }
}

async function loadProxies() {
    try {
        const data = await fs.readFile('proxies.txt', 'utf8');
        return data.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    } catch (error) {
        logger.warn('Could not find or read proxies.txt. Continuing without proxies.');
        return [];
    }
}

function parseProxy(proxy) {
    proxy = proxy.trim();
    if (!proxy.startsWith('http://') && !proxy.startsWith('https://') &&
        !proxy.startsWith('socks4://') && !proxy.startsWith('socks5://')) {
        proxy = `http://${proxy}`;
    }
    const proxyRegex = /^(https?|socks4|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
    if (!proxy.match(proxyRegex)) {
        logger.warn(`Invalid proxy format: ${proxy}`);
        return null;
    }
    return proxy;
}

function createAxiosInstance(proxy) {
    const axiosConfig = {
        headers: getHeaders(),
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
    };

    if (proxy) {
        try {
            if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
                axiosConfig.httpAgent = new HttpProxyAgent(proxy);
                axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);
            } else if (proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) {
                const socksAgent = new SocksProxyAgent(proxy);
                axiosConfig.httpAgent = socksAgent;
                axiosConfig.httpsAgent = socksAgent;
            }
            logger.info(`Using proxy: ${proxy.split('@').pop()}`);
        } catch (error) {
            logger.error(`Failed to create proxy agent for ${proxy}: ${error.message}`);
            return axios.create({
                headers: getHeaders(),
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: (status) => status < 500
            });
        }
    }
    return axios.create(axiosConfig);
}

async function getRandomProxy() {
    const proxies = await loadProxies();
    if (proxies.length === 0) {
        return null;
    }
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    return parseProxy(randomProxy);
}

function loadPrivateKeys() {
    const privateKeys = [];
    for (let i = 1; process.env[`PRIVATE_KEY_${i}`]; i++) {
        privateKeys.push(process.env[`PRIVATE_KEY_${i}`]);
    }
    return privateKeys;
}

function signMessage(message, secretKey) {
    try {
        const encodedMessage = new TextEncoder().encode(message);
        const decodedSecretKey = Base58.decode(secretKey);
        if (!decodedSecretKey || decodedSecretKey.length !== 64) {
            throw new Error('Invalid private key length');
        }
        const signature = nacl.sign.detached(encodedMessage, decodedSecretKey);

        return Base58.encode(signature);
    } catch (error) {
        logger.error(`Failed to sign message: ${error.message}`);
        throw error;
    }
}

async function makeRequest(axiosInstance, method, url, data = null, additionalHeaders = {}) {
    const headers = { ...getHeaders(), ...additionalHeaders };
    try {
        const config = { method, url, headers, ...(data && { data }) };
        const response = await axiosInstance(config);
        return response;
    } catch (error) {
        throw error;
    }
}

async function getUserInfo(idToken, axiosInstance, address) {
    try {
        const response = await makeRequest(
            axiosInstance,
            'post',
            'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyBDdwO2O_Ose7LICa-A78qKJUCEE3nAwsM', { idToken }
        );
        logger.userInfo(`User Info: ${address}`);
        return response.data.users[0];
    } catch (error) {
        logger.error(`Failed to fetch user info: ${error.message}`);
        throw error;
    }
}

async function getActivityStats(address, idToken, axiosInstance) {
    try {
        const response = await makeRequest(
            axiosInstance,
            'get',
            `https://quant-api.opengradient.ai/api/activity/stats?address=${address}`,
            null, { authorization: `Bearer ${idToken}` }
        );
        const stats = response.data;
        logger.star(`Activity Stats: Messages: ${stats.message_count}, Points: ${stats.points}, Daily Messages: ${stats.daily_message_count}/${stats.daily_message_limit}`);
        return stats;
    } catch (error) {
        logger.error(`Failed to fetch activity stats: ${error.message}`);
        throw error;
    }
}

async function performChats(address, idToken, axiosInstance, chatPrompts) {
    logger.loading(`Performing 20 chat interactions for ${address}`);
    const chatHeaders = { ...getHeaders(), Authorization: `Bearer ${idToken}` };

    for (let i = 0; i < 20; i++) {
        const prompt = chatPrompts[Math.floor(Math.random() * chatPrompts.length)];
        logger.step(`Chat ${i + 1}/20: Sending prompt "${prompt}"`);
        try {
            const response = await makeRequest(
                axiosInstance, 'post', 'https://quant-api.opengradient.ai/api/agent/run', {
                    context: {
                        conversationHistory: [{ type: "user", message: prompt }],
                        address,
                        poolPositions: [],
                        availablePools: []
                    },
                    message: { type: "user", message: prompt }
                },
                chatHeaders
            );
            logger.success(`Chat ${i + 1} completed: ${response.data.message.slice(0, 50)}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            logger.error(`Chat ${i + 1} error: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    }
    logger.success(`Completed 20 chat interactions for ${address}`);
}

function randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

function startCountdown() {
    const oneDayInSeconds = 24 * 60 * 60;
    let timeLeft = oneDayInSeconds;
    const interval = setInterval(() => {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        process.stdout.write(`\r${colors.white}Countdown to next cycle: ${hours}h ${minutes}m ${seconds}s${colors.reset}`);
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(interval);
            console.log('\n');
            logger.success('Countdown finished! Ready for next cycle.');
        }
    }, 1000);
}

async function main() {
    logger.banner();
    const privateKeys = loadPrivateKeys();
    if (privateKeys.length === 0) {
        logger.error('No private keys found in .env');
        return;
    }
    const chatPrompts = await loadChatPrompts();
    if (chatPrompts.length === 0) {
        logger.error('No chat prompts were loaded. Please check questions.txt. Exiting.');
        return;
    }
    logger.info(`Found ${privateKeys.length} private keys`);
    console.log();
    for (const [index, privateKey] of privateKeys.entries()) {
        try {
            logger.wallet(`Processing wallet ${index + 1}/${privateKeys.length}`);
            const proxy = await getRandomProxy();
            const axiosInstance = createAxiosInstance(proxy);
            const decodedKey = Base58.decode(privateKey);
            if (!decodedKey || decodedKey.length !== 64) {
                logger.error('Invalid private key format');
                continue;
            }
            const keypair = nacl.sign.keyPair.fromSecretKey(decodedKey);
            const publicKey = Base58.encode(keypair.publicKey);
            logger.chain(`Processing wallet Address: ${publicKey}`);
            const whitelistResponse = await makeRequest(axiosInstance, 'get', `https://quant-api.opengradient.ai/api/whitelisted?address=${publicKey}`);
            if (!whitelistResponse.data.allowed) {
                logger.warn(`Wallet ${publicKey} is not whitelisted`);
                continue;
            }
            logger.success(`Wallet ${publicKey} is whitelisted`);
            const nonce = Date.now();
            const issuedAt = new Date().toISOString();
            const message = `bitquant.io wants you to sign in with your **blockchain** account:\n${publicKey}\n\nURI: https://bitquant.io\nVersion: 1\nChain ID: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
            const signature = signMessage(message, privateKey);
            const verifyResponse = await makeRequest(axiosInstance, 'post', 'https://quant-api.opengradient.ai/api/verify/solana', { address: publicKey, message, signature });
            const token = verifyResponse.data.token;
            logger.success('Signature verified, token received');
            const signInResponse = await makeRequest(axiosInstance, 'post', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyBDdwO2O_Ose7LICa-A78qKJUCEE3nAwsM', { token, returnSecureToken: true });
            const idToken = signInResponse.data.idToken;
            logger.success('Signed in successfully');
            console.log();
            await getUserInfo(idToken, axiosInstance, publicKey);
            logger.loading('Fetching Activity Stats...');
            const stats = await getActivityStats(publicKey, idToken, axiosInstance);
            const remainingMessages = stats.daily_message_limit - stats.daily_message_count;
            console.log();
            if (remainingMessages <= 0) {
                logger.warn(`Daily message limit reached for ${publicKey}`);
                continue;
            }
            await performChats(publicKey, idToken, axiosInstance, chatPrompts);
            logger.loading(`Completed chats for ${publicKey}`);
            console.log();
            if (index < privateKeys.length - 1) {
                await randomDelay(3000, 7000);
            }
        } catch (error) {
            logger.error(`Error processing wallet: ${error.message}`);
            if (index < privateKeys.length - 1) {
                await randomDelay(5000, 10000);
            }
        }
    }
    logger.step('All wallets processed. Starting countdown...\n');
    startCountdown();
}

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});

main().catch(error => {
    logger.error(`Main error: ${error.message}`);
    process.exit(1);
});