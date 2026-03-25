const pool = require('../db');
const logger = require('../utils/logger');

async function handleCallback(callbackData) {
    const stkCallback = callbackData.Body?.stkCallback;
    if (!stkCallback) {
        logger.error('Invalid callback structure');
        return;
    }

    const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
    } = stkCallback;

    let amount = null;
    let receiptNumber = null;
    let phoneNumber = null;
    let transactionDate = null;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
        const metadata = {};
        CallbackMetadata.Item.forEach(item => {
            metadata[item.Name] = item.Value;
        });
        amount = metadata.Amount;
        receiptNumber = metadata.MpesaReceiptNumber;
        phoneNumber = metadata.PhoneNumber;
        transactionDate = metadata.TransactionDate;
        logger.info(`✅ Payment SUCCESS - Receipt: ${receiptNumber}, Amount: ${amount}`);
    } else {
        logger.warn(`❌ Payment FAILED - Code: ${ResultCode}, Description: ${ResultDesc}`);
    }

    const sql = `
        INSERT INTO transactions (
            checkout_request_id,
            merchant_request_id,
            result_code,
            result_desc,
            amount,
            receipt_number,
            phone_number,
            transaction_date,
            status,
            updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (checkout_request_id) DO UPDATE SET
            result_code = EXCLUDED.result_code,
            result_desc = EXCLUDED.result_desc,
            amount = EXCLUDED.amount,
            receipt_number = EXCLUDED.receipt_number,
            phone_number = EXCLUDED.phone_number,
            transaction_date = EXCLUDED.transaction_date,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
    `;

    const params = [
        CheckoutRequestID,
        MerchantRequestID,
        ResultCode,
        ResultDesc,
        amount,
        receiptNumber,
        phoneNumber,
        transactionDate,
        ResultCode === 0 ? 'COMPLETED' : 'FAILED'
    ];

    try {
        await pool.query(sql, params);
        logger.debug('Transaction saved to database');
    } catch (err) {
        logger.error('Database error:', err);
    }

    return {
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        success: ResultCode === 0,
        receiptNumber,
        amount
    };
}

async function getTransactionByCheckoutId(checkoutRequestId) {
    try {
        const res = await pool.query(
            'SELECT * FROM transactions WHERE checkout_request_id = $1',
            [checkoutRequestId]
        );
        return res.rows[0] || null;
    } catch (err) {
        logger.error('Error fetching transaction:', err);
        throw err;
    }
}

module.exports = { handleCallback, getTransactionByCheckoutId };