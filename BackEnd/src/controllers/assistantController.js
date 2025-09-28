const { buildAssistantState } = require('../services/assistantService');

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

module.exports = {
  getSummary,
  analyzeContext
};
