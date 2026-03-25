const axios = require('axios');
const { generateTimestamp, generatePassword } = require('../utils/helpers');
const logger = require('../utils/logger');

async function initiateSTKPush({ accessToken, amount, phoneNumber, accountReference, transactionDesc }) {
    const shortcode = process.env.BUSINESS_SHORT_CODE;
    const passkey = process.env.PASS_KEY;
    const environment = process.env.ENVIRONMENT || 'sandbox';
    const callbackURL = process.env.CALLBACK_URL;
    const baseURL = environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke'
        : 'https://api.safaricom.co.ke';

    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    const requestBody = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(parseFloat(amount)),
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackURL,
        AccountReference: accountReference.slice(0, 12),
        TransactionDesc: transactionDesc.slice(0, 13)
    };

    try {
        const response = await axios.post(
            `${baseURL}/mpesa/stkpush/v1/processrequest`,
            requestBody,
            { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );
        logger.info(`STK Push initiated for ${phoneNumber} - CheckoutRequestID: ${response.data.CheckoutRequestID}`);
        return {
            merchantRequestId: response.data.MerchantRequestID,
            checkoutRequestId: response.data.CheckoutRequestID,
            responseCode: response.data.ResponseCode,
            responseDescription: response.data.ResponseDescription,
            customerMessage: response.data.CustomerMessage
        };
    } catch (error) {
        logger.error('STK Push API error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.errorMessage || 'Failed to initiate STK push');
    }
}

module.exports = { initiateSTKPush };