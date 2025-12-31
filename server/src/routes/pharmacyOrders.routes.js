const express = require('express');
const router = express.Router();
const PharmacyOrder = require('../models/pharmacyOrder.model');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all orders for the pharmacy dashboard
router.get('/', verifyToken, async (req, res) => {
    try {
        const orders = await PharmacyOrder.find()
            .populate('userId', 'name phone email')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Complete order and payment
router.patch('/:id/complete', verifyToken, async (req, res) => {
    try {
        const order = await PharmacyOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        order.paymentStatus = 'Paid';
        order.orderStatus = 'Completed';
        await order.save();

        res.json({ success: true, message: 'Order completed successfully', order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;