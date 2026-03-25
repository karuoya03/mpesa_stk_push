const axios = require('axios');
const logger = require('../utils/logger');

let cachedToken = null;
let tokenExpiry = null;

async function generateAccessToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        logger.debug('Using cached access token');
        return cachedToken;
    }

    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const environment = process.env.ENVIRONMENT || 'sandbox';
    const baseURL = environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke'
        : 'https://api.safaricom.co.ke';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        const response = await axios.get(
            `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
            { headers: { Authorization: `Basic ${auth}` } }
        );
        cachedToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in - 30) * 1000;
        logger.info('New access token generated');
        return cachedToken;
    } catch (error) {
        logger.error('Token generation failed:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Daraja API');
    }
}

module.exports = { generateAccessToken };