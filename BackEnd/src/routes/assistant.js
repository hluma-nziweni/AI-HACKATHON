const { Router } = require('express');
const {
  getSummary,
  analyzeContext,
  listScenarios,
  runScenario
} = require('../controllers/assistantController');

const router = Router();

router.get('/summary', getSummary);
router.post('/analyze', analyzeContext);
router.get('/scenarios', listScenarios);
router.get('/scenario/:key', runScenario);

module.exports = router;
