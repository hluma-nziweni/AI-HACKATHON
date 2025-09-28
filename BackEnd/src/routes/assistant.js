const { Router } = require('express');
const { getSummary, analyzeContext } = require('../controllers/assistantController');

const router = Router();

router.get('/summary', getSummary);
router.post('/analyze', analyzeContext);

module.exports = router;
