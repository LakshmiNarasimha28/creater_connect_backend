import express from 'express';
import { handlePaymentWebhook, getWebhookStatus } from '../controllers/webhookcontroller.js';

const rawBodyMiddleware = (req, res, next) => {
	if (req.rawBody) {
		return next();
	}

	if (req.body && Object.keys(req.body).length > 0) {
		try {
			req.rawBody = JSON.stringify(req.body);
		} catch (error) {
			req.rawBody = "";
		}
	}

	return next();
};

const router = express.Router();

// Webhook endpoint for Razorpay payment notifications
// Raw body middleware must be applied to capture raw request body for signature verification
router.post('/razorpay', rawBodyMiddleware, handlePaymentWebhook);

// Health check endpoint for webhooks
router.get('/status', getWebhookStatus);

export default router;
