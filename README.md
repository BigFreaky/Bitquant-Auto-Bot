# Bitquant Auto Bot

An automated Node.js script designed to perform daily interactions on the Bitquant platform to farm points. It cycles through multiple wallets, uses proxies, and simulates chat activity.

## ✨ Features

-   **Multi-Wallet Support**: Automatically cycles through all private keys listed in your configuration.
-   **Proxy Integration**: Uses proxies from a `proxies.txt` file to avoid IP-based rate limiting. Supports HTTP, HTTPS, and SOCKS protocols.
-   **Automated Chat**: Performs a set number of daily chat interactions using customizable prompts from `messages.txt`.
-   **Detailed Logging**: Provides rich, colorful console output with status icons and a loading spinner for a clear view of the bot's operations.
-   **24-Hour Cooldown**: After processing all wallets, a 24-hour countdown timer begins for the next cycle.
-   **Robust Error Handling**: Gracefully handles common errors and continues processing the next wallet.

## 📋 Prerequisites

- Node.js v16 or higher
- npm or yarn package manager
- Solana private keys (Base58 encoded)
- Proxy list (optional)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/BigFreaky/Bitquant-Auto-Bot.git
cd Bitquant-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Open `private_keys.txt` file and paste your solana wallet private key:
```env
nano private_keys.txt
```

4. Create a `proxies.txt` file in the root directory (optional):
```
http://username:password@proxy1.com:8080
https://username:password@proxy2.com:8080
socks5://username:password@proxy3.com:1080
# Add more proxies as needed
```

## 🚀 How to Run the Bot

Run the bot:
```bash
node index.js
```
## ⚠️ IMPORTANT SECURITY WARNING

Your `private_keys.txt` file contains sensitive private keys. NEVER share this file or commit it to GitHub.
It is highly recommended to add `private_keys.txt` to your `.gitignore` file to prevent accidental uploads.

## Disclaimer
This script is provided for educational purposes only. The user assumes all responsibility for the use of this bot and for the security of their private keys. The developers are not responsible for any financial loss or account restrictions that may occur. Use at your own risk.






