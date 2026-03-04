import crypto from 'crypto';
import Order from '../models/order.js';
import User from '../models/user.js';
import Plan from '../models/plan.js';

export const handlePaymentWebhook = async (req, res) => {
    try {
        const razorpaySignature = req.headers['x-razorpay-signature'];
        const body = req.rawBody || JSON.stringify(req.body);

        if (!razorpaySignature) {
            return res.status(400).json({ success: false, message: 'Missing signature' });
        }

        // Verify webhook signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const signatureBuffer = Buffer.from(razorpaySignature, "utf8");
        const generatedBuffer = Buffer.from(generatedSignature, "utf8");
        const isValidSignature = signatureBuffer.length === generatedBuffer.length &&
            crypto.timingSafeEqual(signatureBuffer, generatedBuffer);

        if (!isValidSignature) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const { event, payload } = req.body;

        if (event === 'payment.authorized') {
            return handlePaymentAuthorized(payload.payment, res);
        } else if (event === 'payment.failed') {
            return handlePaymentFailed(payload.payment, res);
        } else if (event === 'payment.captured') {
            return handlePaymentCaptured(payload.payment, res);
        }

        res.status(200).json({ success: true, message: 'Webhook received' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handlePaymentAuthorized = async (payment, res) => {
    try {
        const { order_id, id: paymentId } = payment;

        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order with payment details
        order.razorpayPaymentId = paymentId;
        order.status = 'paid';
        await order.save();

        // Update user tokens
        const plan = await Plan.findById(order.plan);
        if (plan) {
            await User.findByIdAndUpdate(
                order.user,
                { $inc: { tokens: plan.tokens + (plan.bonustokens || 0) } }
            );
        }

        res.status(200).json({ 
            success: true, 
            message: 'Payment authorized successfully' 
        });
    } catch (error) {
        console.error('Error handling payment authorized:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handlePaymentCaptured = async (payment, res) => {
    try {
        const { order_id, id: paymentId } = payment;

        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order with payment details
        order.razorpayPaymentId = paymentId;
        order.status = 'paid';
        await order.save();

        // Update user tokens
        const plan = await Plan.findById(order.plan);
        if (plan) {
            const bonusTokens = plan.bonustokens || 0;
            await User.findByIdAndUpdate(
                order.user,
                { $inc: { tokens: plan.tokens + bonusTokens } }
            );
        }

        res.status(200).json({ 
            success: true, 
            message: 'Payment captured successfully' 
        });
    } catch (error) {
        console.error('Error handling payment captured:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const handlePaymentFailed = async (payment, res) => {
    try {
        const { order_id } = payment;

        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order status to failed
        order.status = 'failed';
        await order.save();

        res.status(200).json({ 
            success: true, 
            message: 'Payment failure recorded' 
        });
    } catch (error) {
        console.error('Error handling payment failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWebhookStatus = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Webhook endpoint is active',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
