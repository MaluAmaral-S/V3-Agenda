import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '@/utils/constants';
import { getPlanLimits, getPlanResetDay } from '@/utils/planLimits';
import {
  SUBSCRIPTION_PLAN_IDS,
  SUBSCRIPTION_PLAN_LIST,
  getSubscriptionPlan,
} from '@/utils/subscriptionPlans';

const SubscriptionContext = createContext(null);

const PERIOD_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

const computePeriod = (resetDay, referenceDate = new Date()) => {
  const day = Math.min(Math.max(resetDay, 1), 28);
  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);

  const periodStart = new Date(reference);
  periodStart.setDate(day);
  if (reference < periodStart) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }
  periodStart.setHours(0, 0, 0, 0);

  const nextReset = new Date(periodStart);
  nextReset.setMonth(nextReset.getMonth() + 1);

  const periodId = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    periodId,
    start: periodStart,
    nextReset,
  };
};

const getDefaultSubscription = () => ({
  planId: SUBSCRIPTION_PLAN_IDS.BRONZE,
  activatedAt: new Date().toISOString(),
});

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Subscription] Failed to parse stored value:', error);
    return null;
  }
};

const buildKey = (baseKey, userId, fallbackKey) => {
  if (userId) {
    return `${baseKey}_${userId}`;
  }
  return fallbackKey;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const planLimits = useMemo(() => getPlanLimits(), []);
  const resetDay = useMemo(() => getPlanResetDay(), []);
  const [period, setPeriod] = useState(() => computePeriod(resetDay));

  const [subscription, setSubscription] = useState(getDefaultSubscription);
  const [usageTable, setUsageTable] = useState({});
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [usageLoaded, setUsageLoaded] = useState(false);

  const userId = user?.id ?? null;

  const subscriptionKey = useMemo(
    () => buildKey(STORAGE_KEYS.SUBSCRIPTION, userId, STORAGE_KEYS.SUBSCRIPTION_DEFAULT),
    [userId]
  );
  const usageKey = useMemo(
    () => buildKey(STORAGE_KEYS.PLAN_USAGE, userId, STORAGE_KEYS.PLAN_USAGE_DEFAULT),
    [userId]
  );

  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    const previousId = prevUserIdRef.current;
    if (!previousId && userId) {
      const userScopedSubscriptionKey = `${STORAGE_KEYS.SUBSCRIPTION}_${userId}`;
      const userScopedUsageKey = `${STORAGE_KEYS.PLAN_USAGE}_${userId}`;

      if (!localStorage.getItem(userScopedSubscriptionKey)) {
        const defaultData = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_DEFAULT);
        if (defaultData) {
          localStorage.setItem(userScopedSubscriptionKey, defaultData);
        }
      }

      if (!localStorage.getItem(userScopedUsageKey)) {
        const defaultUsage = localStorage.getItem(STORAGE_KEYS.PLAN_USAGE_DEFAULT);
        if (defaultUsage) {
          localStorage.setItem(userScopedUsageKey, defaultUsage);
        }
      }
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    const updatePeriod = () => setPeriod(computePeriod(resetDay));
    updatePeriod();
    const interval = setInterval(updatePeriod, PERIOD_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [resetDay]);

  useEffect(() => {
    const stored = safeParse(localStorage.getItem(subscriptionKey));
    if (stored && stored.planId) {
      const validated = SUBSCRIPTION_PLAN_LIST.some((plan) => plan.id === stored.planId)
        ? stored
        : { ...stored, planId: SUBSCRIPTION_PLAN_IDS.BRONZE };
      setSubscription(validated);
    } else {
      setSubscription(getDefaultSubscription());
    }
    setSubscriptionLoaded(true);
  }, [subscriptionKey]);

  useEffect(() => {
    const stored = safeParse(localStorage.getItem(usageKey));
    if (stored && typeof stored === 'object') {
      setUsageTable(stored);
    } else {
      setUsageTable({});
    }
    setUsageLoaded(true);
  }, [usageKey]);

  useEffect(() => {
    if (!subscriptionLoaded) return;
    localStorage.setItem(subscriptionKey, JSON.stringify(subscription));
  }, [subscription, subscriptionKey, subscriptionLoaded]);

  useEffect(() => {
    if (!usageLoaded) return;
    localStorage.setItem(usageKey, JSON.stringify(usageTable));
  }, [usageTable, usageKey, usageLoaded]);

  useEffect(() => {
    if (!usageLoaded) return;
    setUsageTable((prev) => {
      if (prev?.[period.periodId]) {
        return prev;
      }
      return {
        ...prev,
        [period.periodId]: { used: 0 },
      };
    });
  }, [period.periodId, usageLoaded]);

  const updateSubscription = useCallback((changes) => {
    setSubscription((prev) => ({
      ...prev,
      ...changes,
    }));
  }, []);

  const upgradePlan = useCallback((planId) => {
    const planExists = SUBSCRIPTION_PLAN_LIST.some((plan) => plan.id === planId);
    if (!planExists) {
      console.warn(`[Subscription] Unknown plan id: ${planId}`);
      return;
    }
    updateSubscription({ planId, activatedAt: new Date().toISOString() });
  }, [updateSubscription]);

  const recordUsage = useCallback((count = 1) => {
    if (count <= 0) return;
    setUsageTable((prev) => {
      const current = prev[period.periodId]?.used ?? 0;
      return {
        ...prev,
        [period.periodId]: {
          used: current + count,
        },
      };
    });
  }, [period.periodId]);

  const resetUsage = useCallback(() => {
    setUsageTable((prev) => ({
      ...prev,
      [period.periodId]: { used: 0 },
    }));
  }, [period.periodId]);

  const usage = usageTable[period.periodId]?.used ?? 0;
  const currentPlan = getSubscriptionPlan(subscription.planId);
  const limit = planLimits[currentPlan.id] ?? 0;
  const isUnlimited = !limit || limit <= 0;
  const remaining = isUnlimited ? null : Math.max(limit - usage, 0);
  const progress = isUnlimited || limit === 0 ? 0 : Math.min(100, Math.round((usage / limit) * 100));

  const canScheduleMore = isUnlimited || usage < limit;

  const value = useMemo(
    () => ({
      subscription,
      currentPlan: currentPlan.id,
      plan: currentPlan,
      plans: SUBSCRIPTION_PLAN_LIST,
      limits: planLimits,
      usage: {
        used: usage,
        limit,
        remaining,
        isUnlimited,
        progress,
        periodId: period.periodId,
      },
      nextResetDate: period.nextReset,
      upgradePlan,
      recordUsage,
      resetUsage,
      canScheduleMore,
    }),
    [
      subscription,
      currentPlan,
      planLimits,
      usage,
      limit,
      remaining,
      isUnlimited,
      progress,
      period.periodId,
      period.nextReset,
      upgradePlan,
      recordUsage,
      resetUsage,
      canScheduleMore,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
