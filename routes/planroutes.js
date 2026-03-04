import express from 'express';
import { getplans } from '../controllers/plancontroller.js';

const router = express.Router();

// Get all active plans
router.get('/', getplans);

export default router;
