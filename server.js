require('dotenv').config();
const express = require('express');
const path = require('path');
const { generateAccessToken } = require('./mpesa/auth');
const { initiateSTKPush } = require('./mpesa/stkPush');
const { handleCallback, getTransactionByCheckoutId } = require('./mpesa/callbackHandler');
const logger = require('./utils/logger');
const { formatPhoneNumber } = require('./utils/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', environment: process.env.ENVIRONMENT });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initiate STK Push
app.post('/api/mpesa/stk-push', async (req, res) => {
    try {
        let { phoneNumber, amount, accountReference, transactionDesc } = req.body;
        if (!phoneNumber || !amount) {
            return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
        }
        // Format phone number
        phoneNumber = formatPhoneNumber(phoneNumber);
        const accessToken = await generateAccessToken();
        const result = await initiateSTKPush({
            accessToken,
            amount,
            phoneNumber,
            accountReference: accountReference || 'Payment',
            transactionDesc: transactionDesc || 'M-Pesa Payment'
        });
        logger.info(`STK Push initiated: ${result.checkoutRequestId}`);
        res.json({
            success: true,
            message: 'STK Push initiated successfully',
            data: result
        });
    } catch (error) {
        logger.error('STK Push error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Callback endpoint
app.post('/api/mpesa/callback', async (req, res) => {
    logger.info('Callback received');
    // Acknowledge immediately
    res.json({ ResultCode: 0, ResultDesc: 'Received successfully' });

    try {
        await handleCallback(req.body);
    } catch (error) {
        logger.error('Error processing callback:', error);
    }
});

// Query transaction by CheckoutRequestID
app.get('/api/transaction/:checkoutRequestId', async (req, res) => {
    try {
        const transaction = await getTransactionByCheckoutId(req.params.checkoutRequestId);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.json({ success: true, data: transaction });
    } catch (error) {
        logger.error('Query error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.ENVIRONMENT}`);
    logger.info(`Callback URL: ${process.env.CALLBACK_URL}`);
});