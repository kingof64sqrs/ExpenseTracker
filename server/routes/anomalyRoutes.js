const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');

// Get all anomalies for a user
router.get('/user/:userId', anomalyController.getAnomalies);

// Get anomaly statistics for a user
router.get('/stats/user/:userId', anomalyController.getAnomalyStats);

// Get detailed analysis for a specific anomaly
router.get('/details/:id', anomalyController.getAnomalyDetails);

// Get time-based anomaly analysis
router.get('/time-based/:userId', anomalyController.getTimeBasedAnomalies);

module.exports = router;
