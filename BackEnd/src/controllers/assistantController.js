const {
  buildAssistantState,
  getDemoScenarios,
  getDemoScenarioContext
} = require('../services/assistantService');

const getSummary = async (req, res) => {
  try {
    const state = await buildAssistantState();
    res.json({ success: true, data: state });
  } catch (error) {
    console.error('Assistant summary error:', error);
    res.status(500).json({ success: false, error: 'Assistant unavailable' });
  }
};

const analyzeContext = async (req, res) => {
  try {
    const state = await buildAssistantState(req.body || {});
    res.json({ success: true, data: state });
  } catch (error) {
    console.error('Assistant analysis error:', error);
    res.status(400).json({
      success: false,
      error: 'Unable to analyse context payload',
      details: error.message
    });
  }
};

const listScenarios = (req, res) => {
  try {
    const scenarios = getDemoScenarios();
    res.json({ success: true, data: scenarios });
  } catch (error) {
    console.error('Assistant scenario list error:', error);
    res.status(500).json({ success: false, error: 'Unable to load scenarios' });
  }
};

const runScenario = async (req, res) => {
  try {
    const { key } = req.params;
    const scenarioContext = getDemoScenarioContext(key);

    if (!scenarioContext) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }

    const state = await buildAssistantState({ context: scenarioContext });
    res.json({ success: true, data: state, meta: { scenario: key } });
  } catch (error) {
    console.error('Assistant scenario error:', error);
    res.status(500).json({ success: false, error: 'Unable to build scenario state' });
  }
};

module.exports = {
  getSummary,
  analyzeContext,
  listScenarios,
  runScenario
};
