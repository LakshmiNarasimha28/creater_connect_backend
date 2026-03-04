import Plan from '../models/plan.js';

export const getplans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true });
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};