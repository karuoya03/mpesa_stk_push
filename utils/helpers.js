/**
 * Format phone number to international format (254XXXXXXXXX)
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('254') && cleaned.length === 12) {
        // already good
    } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
}

/**
 * Generate timestamp in format YYYYMMDDHHMMSS (used for STK push password)
 * @returns {string} Timestamp string
 */
function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate password for STK push (Base64 encoded)
 * @param {string} shortcode - Business shortcode
 * @param {string} passkey - M-Pesa passkey
 * @param {string} timestamp - Timestamp string
 * @returns {string} Base64 encoded password
 */
function generatePassword(shortcode, passkey, timestamp) {
    const str = shortcode + passkey + timestamp;
    return Buffer.from(str).toString('base64');
}

/**
 * Sleep helper (useful for retries)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simple retry wrapper for async functions
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>}
 */
async function retry(fn, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < retries - 1) await sleep(delay);
        }
    }
    throw lastError;
}

module.exports = {
    formatPhoneNumber,
    generateTimestamp,
    generatePassword,
    sleep,
    retry
};
