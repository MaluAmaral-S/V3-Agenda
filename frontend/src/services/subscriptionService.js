import { apiRequest } from './api';
import { API_ROUTES } from '@/utils/constants';

export const fetchPlans = () => apiRequest.get(API_ROUTES.SUBSCRIPTIONS.PLANS);

export const createSubscription = (payload) => {
  if (typeof payload === 'string') {
    return apiRequest.post(API_ROUTES.SUBSCRIPTIONS.CREATE, { planKey: payload });
  }
  if (payload && typeof payload === 'object') {
    return apiRequest.post(API_ROUTES.SUBSCRIPTIONS.CREATE, payload);
  }
  return Promise.reject(new Error('Dados invalidos para iniciar a assinatura.'));
};

export const fetchMySubscription = () =>
  apiRequest.get(API_ROUTES.SUBSCRIPTIONS.ME);

export const cancelSubscriptionRenewal = () =>
  apiRequest.put(API_ROUTES.SUBSCRIPTIONS.CANCEL_RENEWAL);

export const updateSubscriptionPaymentMethod = (cardToken) =>
  apiRequest.put(API_ROUTES.SUBSCRIPTIONS.UPDATE_PAYMENT, { cardToken });
