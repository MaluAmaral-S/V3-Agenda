const parseLimit = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
};

const sanitizeResetDay = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const clamped = Math.floor(parsed);
  if (clamped < 1) {
    return 1;
  }
  if (clamped > 28) {
    return 28;
  }
  return clamped;
};

export const getPlanLimits = () => {
  const env = import.meta?.env ?? {};
  return {
    bronze: parseLimit(env.VITE_PLAN_LIMIT_BRONZE, 50),
    prata: parseLimit(env.VITE_PLAN_LIMIT_PRATA, 200),
    ouro: parseLimit(env.VITE_PLAN_LIMIT_OURO, 1000),
  };
};

export const getPlanLimitById = (planId) => {
  const limits = getPlanLimits();
  return limits[planId] ?? null;
};

export const getPlanResetDay = () => {
  const env = import.meta?.env ?? {};
  return sanitizeResetDay(env.VITE_PLAN_RESET_DAY, 1);
};
