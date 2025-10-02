import { apiRequest } from './api';
import { API_ROUTES } from '@/utils/constants';

export const fetchPlans = () => apiRequest.get(API_ROUTES.SUBSCRIPTIONS.PLANS);

export const createSubscription = (planKey) =>
  apiRequest.post(API_ROUTES.SUBSCRIPTIONS.CREATE, { planKey });

export const fetchMySubscription = () =>
  apiRequest.get(API_ROUTES.SUBSCRIPTIONS.ME);
