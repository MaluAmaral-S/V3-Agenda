const { Plan } = require('../models');

const listPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [['id', 'ASC']],
      attributes: ['key', 'name', 'price', 'frequency', 'frequencyType', 'monthlyLimit'],
    });

    // The payload now directly maps the relevant fields from the model.
    const payload = plans.map((plan) => ({
      key: plan.key,
      name: plan.name,
      price: plan.price ? Number(plan.price) : null,
      frequency: plan.frequency,
      frequencyType: plan.frequencyType,
      monthlyLimit: plan.monthlyLimit,
    }));

    return res.json(payload);
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    return res.status(500).json({ error: 'Erro ao listar planos.' });
  }
};

module.exports = {
  listPlans,
};