import crypto from 'crypto';
import Plan from '../models/plan.js';
import Order from '../models/order.js';
import User from '../models/user.js';
import razorpay from '../config/razorpay.js';

export const createorder = async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        const razorpayOrder = await razorpay.orders.create({
            amount: plan.price * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        });
        const order = await Order.create({
            user: req.user._id,
            plan: plan._id,
            amount: plan.price,
            razorpayOrderId: razorpayOrder.id,
            status: 'pending'
        });
        res.json({ orderId: razorpayOrder.id, amount: plan.price * 100, currency: razorpayOrder.currency, key: process.env.RAZORPAY_KEY_ID });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        const order = await Order.findOne({ razorpayOrderId: orderId }).populate('plan');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + '|' + paymentId)
            .digest('hex');
        const signatureBuffer = Buffer.from(signature || "", "utf8");
        const generatedBuffer = Buffer.from(generatedSignature, "utf8");
        const isValidSignature = signatureBuffer.length === generatedBuffer.length &&
            crypto.timingSafeEqual(signatureBuffer, generatedBuffer);

        if (isValidSignature) {
            order.razorpayPaymentId = paymentId;
            order.status = 'paid';
            await order.save();

            // Update user tokens
            const user = await User.findById(req.user._id);
            if (user && order.plan) {
                const totalTokens = order.plan.tokens + (order.plan.bonustokens || 0);
                user.tokens = (user.tokens || 0) + totalTokens;
                await user.save();

                // Return updated user data
                const updatedUser = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    tokens: user.tokens,
                    role: user.role
                };

                res.json({ 
                    message: 'Payment verified successfully', 
                    user: updatedUser,
                    tokensAdded: totalTokens
                });
            } else {
                res.json({ message: 'Payment verified successfully' });
            }
        } else {
            res.status(400).json({ message: 'Invalid payment signature' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

