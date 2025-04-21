const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all budget routes

router.get('/user/:userId', budgetController.getBudgets);
router.get('/summary/:userId', budgetController.getBudgetSummary);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;