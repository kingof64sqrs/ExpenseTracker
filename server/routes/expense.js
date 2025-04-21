const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getBudgetInsights,
  reanalyzeAnomalies,
} = require('../controllers/expenseController');

router.post('/', createExpense);
router.get('/user/:userId', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/insights/:userId', getBudgetInsights);
router.post('/reanalyze/:userId', reanalyzeAnomalies);

module.exports = router;
