const { Plan } = require('../models');
const { getPlanConfig } = require('../config/planConfig');

async function seedPlans() {
  const planDefinitions = getPlanConfig();

  for (const planDefinition of planDefinitions) {
    const { key, name, monthlyLimit } = planDefinition;
    const [plan, created] = await Plan.findOrCreate({
      where: { key },
      defaults: {
        name,
        monthlyLimit,
        isActive: true,
      },
    });

    if (!created) {
      const updates = {};
      if (plan.name !== name) {
        updates.name = name;
      }
      if (plan.monthlyLimit !== monthlyLimit) {
        updates.monthlyLimit = monthlyLimit;
      }
      if (!plan.isActive) {
        updates.isActive = true;
      }
      if (Object.keys(updates).length > 0) {
        await plan.update(updates);
      }
    }
  }
}

module.exports = seedPlans;
