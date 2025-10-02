const { Plan } = require('../models');
const { getPlanLimit } = require('../config/planConfig');

const listPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [['id', 'ASC']],
    });

    const payload = plans.map((plan) => ({
      key: plan.key,
      name: plan.name,
      monthlyLimit: getPlanLimit(plan.key, plan.monthlyLimit),
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
