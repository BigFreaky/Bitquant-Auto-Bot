import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import ora from 'ora';
import chalk from 'chalk';
import moment from 'moment-timezone';
import { createInterface } from 'readline/promises';
import { promises as fs } from 'fs';
import path from 'path';

const colors = {
    primary: '\x1b[38;5;39m',   
    secondary: '\x1b[38;5;198m',  
    accent: '\x1b[38;5;118m',    
    warning: '\x1b[38;5;220m',   
    error: '\x1b[38;5;196m',     
    success: '\x1b[38;5;46m',   

    white: '\x1b[97m',
    gray: '\x1b[38;5;245m',
    darkGray: '\x1b[38;5;238m',

    bold: '\x1b[1m',
    italic: '\x1b[3m',
    reset: '\x1b[0m' 
};

const c = (color, text) => `${color}${text}${colors.reset}`;
const b = (color, text) => `${color}${colors.bold}${text}${colors.reset}`;
const i = (color, text) => `${color}${colors.italic}${text}${colors.reset}`;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 OPR/119.0.0.0 (Edition cdf)',
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203',
];

const API_KEY = 'AIzaSyBDdwO2O_Ose7LICa-A78qKJUCEE3nAwsM';
const DOMAIN = 'bitquant.io';
const URI = 'https://bitquant.io';
const VERSION = '1';
const CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const DAILY_CHAT_LIMIT = 20;

/**
 * Gets the current timestamp formatted for the 'Asia/Dhaka' timezone.
 * @returns {string} The formatted timestamp.
 */
function getTimestamp() {
    return moment().tz('Asia/Dhaka').format('D/M/YYYY, HH:mm:ss');
}

/**
 * Displays the main banner.
 */
function displayBanner() {
    const width = 70;
    const title = 'BITQUANT AUTO BOT';
    const subtitle = 'AUTOMATED BOT DESIGNED FOR DAILY CHATTING';
    const version = 'Telegram: https://t.me/earningdropshub';

    const borderColor = colors.secondary;
    const borderLine = '-'.repeat(width);

    console.log();
    console.log(c(borderColor, borderLine));

    const titlePadding = Math.floor((width - title.length) / 2);
    console.log(' '.repeat(titlePadding) + b(colors.accent, title));

    const subtitlePadding = Math.floor((width - subtitle.length) / 2);
    console.log(' '.repeat(subtitlePadding) + c(colors.primary, subtitle));

    console.log();

    const versionPadding = Math.floor((width - version.length) / 2);
    console.log(' '.repeat(versionPadding) + i(colors.gray, version));
    
    console.log(c(borderColor, borderLine));
    console.log();
}


const rl = createInterface({ input: process.stdin, output: process.stdout });

/**
 * Prompts the user with a question and returns the answer.
 * @param {string} question - The question to ask the user.
 * @returns {Promise<string>} The user's trimmed answer.
 */
async function promptUser(question) {
    const answer = await rl.question(question);
    return answer.trim();
}

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Displays text with a typing effect in the console.
 * @param {string} text - The text to display.
 * @param {boolean} [noType=false] - If true, display text instantly without the typing effect.
 */
async function typeText(text, noType = false) {
    const maxLength = 80;
    const displayText = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    
    const prefix = c(colors.gray, '  └ ');
    const responsePrefix = b(colors.secondary, 'AI: ');

    if (noType) {
        console.log(`${prefix}${responsePrefix}${c(colors.secondary, displayText)}`);
        return;
    }
    
    process.stdout.write(`${prefix}${responsePrefix}`);
    for (const char of displayText) {
        process.stdout.write(c(colors.secondary, char));
        await sleep(200 / displayText.length);
    }
    process.stdout.write('\n');
}

/**
 * Creates a string representation of a beautiful progress bar.
 * @param {number} current - The current progress value.
 * @param {number} total - The total value.
 * @returns {string} The progress bar string.
 */
function createProgressBar(current, total) {
    const barLength = 25;
    const progress = current / total;
    const filled = Math.round(progress * barLength);
    const empty = barLength - filled;
    
    const filledStr = '■'.repeat(filled);
    const emptyStr = ' '.repeat(empty);

    const percentage = Math.floor(progress * 100);
    return `${chalk.bgHex('#4A4A4A').hex('#6CFFB4')(filledStr)}${chalk.bgHex('#4A4A4A')(emptyStr)} ${c(colors.success, `${percentage}%`)}`;
}

/**
 * Clears the current line in the console.
 */
async function clearConsoleLine() {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
}

let isSpinnerActive = false;

/**
 * A wrapper function to retry an async operation with a spinner.
 * It now retries on 5xx server errors.
 * @param {function} fn - The async function to execute.
 * @param {number} [maxRetries=5] - The maximum number of retries.
 * @param {string} [actionText='Operation'] - The text to display for the action.
 * @returns {Promise<any>} The result of the async function.
 */
async function withRetry(fn, maxRetries = 5, actionText = 'Operation') {
    const spinner = ora({ 
        text: c(colors.gray, `${actionText}...`), 
        spinner: {
            interval: 80,
            frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        },
        color: 'gray'
    }).start();
    isSpinnerActive = true;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await fn();
            spinner.succeed(c(colors.success, `${actionText} successful`));
            await sleep(200);
            return result;
        } catch (err) {
            if (i < maxRetries - 1) {
                let errorMessage = err.message;
                if (err.response) {
                    if (err.response.status === 403) {
                        errorMessage = 'Error 403 Forbidden';
                    } else if (err.response.status >= 500) {
                        errorMessage = `Server Error ${err.response.status}`;
                    }
                }
                spinner.text = c(colors.warning, ` ${actionText} failed. [Retry ${i + 1}/${maxRetries} | ${errorMessage}]`);
                await sleep(5000);
                continue;
            }
            spinner.fail(c(colors.error, `Failed to ${actionText.toLowerCase()}: ${err.response?.status || err.message}`));
            if (err.response?.data) {
                 console.log(c(colors.darkGray, `   └─ Server Response: ${JSON.stringify(err.response.data)}`));
            }
            throw err;
        } finally {
            isSpinnerActive = false;
        }
    }
}


/**
 * Generates the message to be signed for authentication.
 * @param {string} address - The Solana public key address.
 * @returns {string} The formatted message for signing.
 */
function generateMessage(address) {
    const nonce = Date.now();
    const issuedAt = new Date().toISOString();
    return `${DOMAIN} wants you to sign in with your **blockchain** account:\n${address}\n\nURI: ${URI}\nVersion: ${VERSION}\nChain ID: ${CHAIN_ID}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
}

/**
 * Signs a message using the provided secret key.
 * @param {string} message - The message to sign.
 * @param {Uint8Array} secretKey - The secret key for signing.
 * @returns {string} The base58 encoded signature.
 */
function signMessage(message, secretKey) {
    const messageBytes = Buffer.from(message, 'utf8');
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return bs58.encode(signature);
}

/**
 * Returns a base set of HTTP headers.
 * @param {string} userAgent - The User-Agent string to use.
 * @returns {object} The headers object.
 */
function getBaseHeaders(userAgent) {
    return {
        'accept': '*/*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'origin': 'https://www.bitquant.io',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://www.bitquant.io/',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Opera";v="119"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': userAgent,
    };
}

/**
 * Verifies the signature with the backend API to get an auth token.
 * @param {string} address - The Solana address.
 * @param {string} message - The signed message.
 * @param {string} signature - The signature.
 * @param {string|null} proxy - The proxy URL.
 * @param {object} baseHeaders - The base HTTP headers.
 * @returns {Promise<string>} The verification token.
 */
async function verifySignature(address, message, signature, proxy, baseHeaders) {
    const payload = { address, message, signature };
    const config = {
        headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    };
    if (proxy) {
        config.httpAgent = new HttpsProxyAgent(proxy);
        config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.post('https://quant-api.opengradient.ai/api/verify/solana', payload, config);
    return response.data.token;
}

/**
 * Exchanges the verification token for a Firebase ID and refresh token.
 * @param {string} token - The verification token.
 * @param {string|null} proxy - The proxy URL.
 * @param {object} baseHeaders - The base HTTP headers.
 * @returns {Promise<{idToken: string, refreshToken: string}>} The ID and refresh tokens.
 */
async function getIdToken(token, proxy, baseHeaders) {
    const payload = { token, returnSecureToken: true };
    const config = {
        headers: {
            ...baseHeaders,
            'Content-Type': 'application/json',
            'x-client-data': 'CJz7ygE=',
            'x-client-version': 'Opera/JsCore/11.6.0/FirebaseCore-web',
            'x-firebase-gmpid': '1:976084784386:web:bb57c2b7c2642ce85b1e1b',
        },
    };
    if (proxy) {
        config.httpAgent = new HttpsProxyAgent(proxy);
        config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, payload, config);
    return { idToken: response.data.idToken, refreshToken: response.data.refreshToken };
}

/**
 * Uses a refresh token to get a new access token.
 * @param {string} refreshToken - The refresh token.
 * @param {string|null} proxy - The proxy URL.
 * @param {object} baseHeaders - The base HTTP headers.
 * @returns {Promise<{accessToken: string, refreshToken: string}>} The new access and refresh tokens.
 */
async function refreshAccessToken(refreshToken, proxy, baseHeaders) {
    const payload = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;
    const config = {
        headers: {
            ...baseHeaders,
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-client-data': 'CJz7ygE=',
            'x-client-version': 'Opera/JsCore/11.6.0/FirebaseCore-web',
            'x-firebase-gmpid': '1:976084784386:web:bb57c2b7c2642ce85b1e1b',
        },
    };
    if (proxy) {
        config.httpAgent = new HttpsProxyAgent(proxy);
        config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.post(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, payload, config);
    return { accessToken: response.data.access_token, refreshToken: response.data.refresh_token };
}

/**
 * Sends a chat message to the API.
 * @param {string} accessToken - The access token for authorization.
 * @param {object} context - The conversation context.
 * @param {string} message - The message to send.
 * @param {string|null} proxy - The proxy URL.
 * @param {object} baseHeaders - The base HTTP headers.
 * @returns {Promise<string>} The API's response message.
 */
async function sendChat(accessToken, context, message, proxy, baseHeaders) {
    const payload = { context, message: { type: 'user', message } };
    const config = {
        headers: {
            ...baseHeaders,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
    };
    if (proxy) {
        config.httpAgent = new HttpsProxyAgent(proxy);
        config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.post('https://quant-api.opengradient.ai/api/agent/run', payload, config);
    return response.data.message;
}

/**
 * Fetches user activity stats from the API.
 * @param {string} accessToken - The access token for authorization.
 * @param {string} address - The user's Solana address.
 * @param {string|null} proxy - The proxy URL.
 * @param {object} baseHeaders - The base HTTP headers.
 * @returns {Promise<object>} The user's stats.
 */
async function getStats(accessToken, address, proxy, baseHeaders) {
    const config = {
        headers: {
            ...baseHeaders,
            'Authorization': `Bearer ${accessToken}`,
        },
    };
    if (proxy) {
        config.httpAgent = new HttpsProxyAgent(proxy);
        config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get(`https://quant-api.opengradient.ai/api/activity/stats?address=${address}`, config);
    return response.data;
}

/**
 * Handles the full authentication flow for a single account.
 * @param {string} address - The Solana address.
 * @param {Uint8Array} secretKey - The secret key.
 * @param {string|null} proxy - The proxy URL.
 * @param {string} userAgent - The User-Agent string.
 * @returns {Promise<{idToken: string, refreshToken: string, baseHeaders: object}>} Auth tokens and headers.
 */
async function authenticate(address, secretKey, proxy, userAgent) {
    const baseHeaders = getBaseHeaders(userAgent);
    return withRetry(async () => {
        const message = generateMessage(address);
        const signature = signMessage(message, secretKey);
        const token = await verifySignature(address, message, signature, proxy, baseHeaders);
        const { idToken, refreshToken } = await getIdToken(token, proxy, baseHeaders);
        return { idToken, refreshToken, baseHeaders };
    }, 5, 'Authenticating');
}

/**
 * Main logic to process all accounts from the private keys file.
 * @param {string[]} privateKeys - Array of private keys.
 * @param {string[]} messages - Array of chat messages.
 * @param {(string|null)[]} accountProxies - Array of proxy URLs.
 * @param {number} chatCount - Number of chats to send per account.
 * @param {boolean} noType - Whether to disable the typing effect.
 * @returns {Promise<{successCount: number, failCount: number}>} The count of successes and failures.
 */
async function processAccounts(privateKeys, messages, accountProxies, chatCount, noType) {
    let successCount = 0;
    let failCount = 0;

    console.log(b(colors.white, `\n Starting process for ${privateKeys.length} accounts at ${getTimestamp()}`));
    console.log(c(colors.darkGray, '-'.repeat(70)));


    for (let i = 0; i < privateKeys.length; i++) {
        const privateKey = privateKeys[i].trim();
        const proxy = accountProxies[i];
        let keypair;
        
        const accountHeader = `\n Account ${i + 1}/${privateKeys.length} `;
        console.log(b(colors.secondary, accountHeader));

        try {
            const decodedKey = bs58.decode(privateKey);
            if (decodedKey.length !== 64) {
                throw new Error(`Invalid private key length: ${decodedKey.length} bytes, expected 64 bytes`);
            }
            keypair = Keypair.fromSecretKey(decodedKey);
        } catch (err) {
            console.log(c(colors.error, `  ❌ Invalid private key: ${err.message}`));
            failCount++;
            continue;
        }

        const address = keypair.publicKey.toBase58();
        const shortAddress = `${address.slice(0, 5)}...${address.slice(-5)}`;
        console.log(c(colors.gray, `  Address: ${shortAddress} | Proxy: ${proxy ? c(colors.success, 'Yes') : c(colors.warning, 'No')}`));

        let userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        let sessionState = { idToken: null, refreshToken: null, baseHeaders: null, history: [], retry403Count: 0 };
        const max403Retries = 3;

        async function resetSession() {
            userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const authResult = await authenticate(address, keypair.secretKey, proxy, userAgent);
            sessionState = { ...sessionState, ...authResult, history: [], retry403Count: 0 };
        }

        try {
            await resetSession();
            
            for (let j = 0; j < chatCount; j++) {
                console.log(`\n  ${c(colors.gray, `💬 Chat ${j + 1} of ${chatCount}`)} ${createProgressBar(j+1, chatCount)}`);
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                console.log(c(colors.gray, `  ┌ ${b(colors.white, 'You:')} ${c(colors.white, randomMessage)}`));

                let accessToken;
                try {
                    const refreshResult = await withRetry(() => refreshAccessToken(sessionState.refreshToken, proxy, sessionState.baseHeaders), 5, 'Refreshing token');
                    accessToken = refreshResult.accessToken;
                    sessionState.refreshToken = refreshResult.refreshToken;
                } catch (err) {
                    console.log(c(colors.warning, `  ⚠️ Token refresh failed. Re-authenticating...`));
                    await resetSession();
                    accessToken = sessionState.idToken;
                    j--;
                    continue;
                }

                const stats = await getStats(accessToken, address, proxy, sessionState.baseHeaders);
                if (stats.daily_message_count >= stats.daily_message_limit) {
                    console.log(c(colors.warning, `  ⚠️ Daily chat limit reached. Moving to next account.`));
                    break;
                }

                const context = { conversationHistory: sessionState.history, address, poolPositions: [], availablePools: [] };

                try {
                    const response = await sendChat(accessToken, context, randomMessage, proxy, sessionState.baseHeaders);
                    await typeText(response, noType);
                    sessionState.history.push({ type: 'user', message: randomMessage });
                    sessionState.history.push({ type: 'assistant', message: response });
                } catch (err) {
                     if (err.response && err.response.status === 403 && sessionState.retry403Count < max403Retries) {
                        sessionState.retry403Count++;
                        console.log(c(colors.warning, `  ⚠️ Auth error (403). Re-authenticating (Attempt ${sessionState.retry403Count}/${max403Retries})...`));
                        await sleep(5000);
                        await resetSession();
                        j--;
                    } else {
                        throw err;                    }
                }
                await sleep(5000);
            }
            
            console.log(c(colors.gray, '\n  Fetching final statistics...'));
            const { accessToken } = await withRetry(() => refreshAccessToken(sessionState.refreshToken, proxy, sessionState.baseHeaders), 5, 'Refreshing token');
            const finalStats = await getStats(accessToken, address, proxy, sessionState.baseHeaders);
            
            console.log(b(colors.success, '  📊 Account Stats:'));
            console.log(c(colors.white, `    - Daily Chats: ${finalStats.daily_message_count}/${finalStats.daily_message_limit}`));
            console.log(c(colors.white, `    - Total Chats: ${finalStats.message_count}`));
            console.log(c(colors.white, `    - Total Points: ${finalStats.points}`));
            
            successCount++;

        } catch (err) {
            console.log(c(colors.error, `\n  ❌ An unrecoverable error occurred: ${err.message}`));
            failCount++;
        }
    }
    
    console.log(c(colors.darkGray, '\n' + '-'.repeat(70)));
    console.log(b(colors.white, `\n ✅ All processes finished. Success: ${successCount}, Failed: ${failCount} \n`));
    return { successCount, failCount };
}


/**
 * Starts a countdown timer in the console.
 * @param {moment.Moment} nextRunTime - The time for the next run.
 */
function startCountdown(nextRunTime) {
    return new Promise(resolve => {
        const countdownInterval = setInterval(() => {
            const now = moment();
            const timeLeft = moment.duration(nextRunTime.diff(now));
            if (timeLeft.asSeconds() <= 0) {
                clearInterval(countdownInterval);
                clearConsoleLine();
                resolve();
                return;
            }
            clearConsoleLine();
            const hours = Math.floor(timeLeft.asHours()).toString().padStart(2, '0');
            const minutes = Math.floor(timeLeft.asMinutes() % 60).toString().padStart(2, '0');
            const seconds = Math.floor(timeLeft.asSeconds() % 60).toString().padStart(2, '0');
            process.stdout.write(c(colors.primary, ` ⏳ Next run in: ${hours}:${minutes}:${seconds} `));
        }, 1000);
    });
}

let isProcessing = false;

/**
 * Schedules the bot to run every 24 hours.
 */
async function scheduleNextRun(privateKeys, messages, accountProxies, chatCount, noType) {
    while (true) {
        if (isProcessing) {
            await sleep(1000);
            continue;
        }
        isProcessing = true;
        try {
            const nextRunTime = moment().add(24, 'hours');
            await startCountdown(nextRunTime);
            await processAccounts(privateKeys, messages, accountProxies, chatCount, noType);
        } catch (err) {
            console.log(c(colors.error, `\n ❌ Scheduler Error: ${err.message}`));
            await sleep(5000);
        } finally {
            isProcessing = false;
        }
    }
}

/**
 * The main function to start the bot.
 */
async function main() {
    console.clear();
    
    displayBanner();

    const noType = process.argv.includes('--no-type');

    let privateKeys;
    try {
        const data = await fs.readFile('private_keys.txt', 'utf8');
        privateKeys = data.split('\n').filter(line => line.trim() !== '');
    } catch (err) {
        console.log(c(colors.error, ' ❌ Error: File private_keys.txt not found!'));
        console.log(c(colors.warning, '   Please create "private_keys.txt" and add your Solana private keys, one per line.'));
        rl.close();
        return;
    }
    if (privateKeys.length === 0) {
        console.log(c(colors.error, ' ❌ Error: No valid private keys found in private_keys.txt!'));
        rl.close();
        return;
    }

    let messages;
    try {
        const data = await fs.readFile('messages.txt', 'utf8');
        messages = data.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/\r/g, ''));
    } catch (err) {
        console.log(c(colors.error, ' ❌ Error: File messages.txt not found!'));
        console.log(c(colors.warning, '   Please create "messages.txt" and add chat messages, one per line.'));
        rl.close();
        return;
    }
    if (messages.length === 0) {
        console.log(c(colors.error, ' ❌ Error: File messages.txt is empty!'));
        rl.close();
        return;
    }

    let chatCount;
    while (true) {
        const input = await promptUser(c(colors.primary, '? ') + c(colors.white, 'How many chats for each account: '));
        chatCount = parseInt(input, 10);
        if (!isNaN(chatCount) && chatCount > 0) {
            if (chatCount > DAILY_CHAT_LIMIT) {
                console.log(c(colors.warning, `  ⚠️ Chat count exceeds the daily limit (${DAILY_CHAT_LIMIT}). Setting it to ${DAILY_CHAT_LIMIT}.`));
                chatCount = DAILY_CHAT_LIMIT;
            }
            break;
        }
        console.log(c(colors.error, '  ❌ Please enter a valid number!'));
    }

    let useProxy;
    while (true) {
        const input = await promptUser(c(colors.primary, '? ') + c(colors.white, 'Do you want to use a proxy? (y/n) '));
        if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
            useProxy = input.toLowerCase() === 'y';
            break;
        }
        console.log(c(colors.error, '  ❌ Please enter "y" or "n"!'));
    }

    let proxies = [];
    if (useProxy) {
        try {
            const data = await fs.readFile('proxies.txt', 'utf8');
            proxies = data.split('\n').filter(line => line.trim() !== '');
            if (proxies.length === 0) {
                console.log(c(colors.warning, '  ⚠️ File proxies.txt is empty. Continuing without proxies.'));
            } else {
                 console.log(c(colors.success, `  ✔️ Loaded ${proxies.length} proxies.`));
            }
        } catch (err) {
            console.log(c(colors.warning, '  ⚠️ File proxies.txt not found. Continuing without proxies.'));
        }
    }

    const accountProxies = privateKeys.map((_, index) => (proxies.length > 0 ? proxies[index % proxies.length] : null));

    await processAccounts(privateKeys, messages, accountProxies, chatCount, noType);
    
    scheduleNextRun(privateKeys, messages, accountProxies, chatCount, noType);
}

main();
