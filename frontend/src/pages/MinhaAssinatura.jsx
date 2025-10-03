import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Crown, Star, Zap, AlertTriangle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  fetchMySubscription,
  cancelSubscriptionRenewal,
  updateSubscriptionPaymentMethod,
} from '@/services/subscriptionService';
import { MERCADO_PAGO_PUBLIC_KEY, IS_MERCADO_PAGO_SANDBOX } from '@/utils/constants';
import { cn } from '@/lib/utils';

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return '-';
  }
};

const MinhaAssinatura = () => {
  const navigate = useNavigate();

  const isSandboxEnv = IS_MERCADO_PAGO_SANDBOX;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const cardFormRef = useRef(null);

  const PLAN_VISUALS = {
    bronze: {
      gradient: 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,217,182,0.85),rgba(136,84,24,0.95)_45%,rgba(58,33,10,0.98))]',
      icon: Zap,
    },
    silver: {
      gradient: 'bg-[radial-gradient(circle_at_20%_20%,rgba(245,245,247,0.9),rgba(168,174,186,0.95)_45%,rgba(82,88,99,0.98))]',
      icon: Star,
    },
    gold: {
      gradient: 'bg-[radial-gradient(circle_at_20%_20%,rgba(252,244,195,0.9),rgba(214,175,38,0.95)_45%,rgba(104,78,23,0.98))]',
      icon: Crown,
    },
    default: {
      gradient: 'bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.85),rgba(71,85,105,0.95)_45%,rgba(30,41,59,0.98))]',
      icon: Star,
    },
  };

  const ensureMercadoPagoScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve(window.MercadoPago);
        return;
      }

      const handleResolve = () => resolve(window.MercadoPago);
      const handleReject = () => reject(new Error('Nao foi possivel carregar o Mercado Pago.'));

      const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
      if (existingScript) {
        const onLoad = () => {
          existingScript.removeEventListener('load', onLoad);
          existingScript.removeEventListener('error', onError);
          handleResolve();
        };
        const onError = () => {
          existingScript.removeEventListener('load', onLoad);
          existingScript.removeEventListener('error', onError);
          handleReject();
        };
        existingScript.addEventListener('load', onLoad);
        existingScript.addEventListener('error', onError);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;

      const onLoad = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        handleResolve();
      };
      const onError = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        handleReject();
      };

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      document.body.appendChild(script);
    });
  }, []);

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMySubscription();
      setData(response);
    } catch (err) {
      const message = err.message || 'Nao foi possivel carregar sua assinatura.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const usageInfo = useMemo(() => {
    if (!data?.hasActive) {
      return {
        limit: 0,
        used: 0,
        remaining: 0,
        limitReached: false,
        percentage: 0,
      };
    }

    const limit = Number(data?.usage?.limit) || 0;
    const used = Number(data?.usage?.used) || 0;
    const remaining = Number.isFinite(data?.usage?.remaining)
      ? data.usage.remaining
      : limit > 0
        ? Math.max(limit - used, 0)
        : null;

    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const limitReached = limit > 0 && used >= limit;

    return {
      limit,
      used,
      remaining,
      limitReached,
      percentage,
    };
  }, [data]);

  const hasActiveSubscription = Boolean(data?.hasActive);
  const subscriptionPending = Boolean(data?.pending);
  const renewalCancelled = Boolean(data?.renewalCancelled);
  const isLegacySubscription = Boolean(data?.legacySubscription);
  const mpSubscriptionId = data?.subscription?.mpSubscriptionId || null;
  const daysLeft = data?.subscription?.daysLeft ?? null;
  const canManagePayment = hasActiveSubscription && !subscriptionPending;
  const canCancelRenewal = hasActiveSubscription && !subscriptionPending && !renewalCancelled;

  const planVisualKey = (data?.plan?.key || '').toLowerCase();
  const planVisual = PLAN_VISUALS[planVisualKey] || PLAN_VISUALS.default;
  const PlanIcon = planVisual.icon;

  const planAmountValue = typeof data?.plan?.amount === 'number' ? data.plan.amount : null;
  const planCurrency = data?.plan?.currency || 'BRL';
  const planFrequencyValue = data?.plan?.frequency || 1;
  const planFrequencyType = data?.plan?.frequencyType || 'months';
  const planAmountLabel = planAmountValue !== null
    ? planAmountValue.toLocaleString('pt-BR', { style: 'currency', currency: planCurrency })
    : null;
  const planBillingLabel = (() => {
    if (!planAmountLabel) return null;
    if (!planFrequencyValue || !planFrequencyType) return planAmountLabel;
    if (planFrequencyType === 'days') {
      const suffix = planFrequencyValue === 1 ? 'dia' : 'dias';
      const prefix = planFrequencyValue === 1 ? '' : `${planFrequencyValue} `;
      return `${planAmountLabel} / ${prefix}${suffix}`;
    }
    const suffix = planFrequencyValue === 1 ? 'mes' : 'meses';
    const prefix = planFrequencyValue === 1 ? '' : `${planFrequencyValue} `;
    return `${planAmountLabel} / ${prefix}${suffix}`;
  })();

  const handleCancelRenewal = async () => {
    if (!canCancelRenewal) {
      toast.info('Aguarde a confirmacao do pagamento para gerenciar a renovacao.');
      return;
    }
    setCancelLoading(true);
    try {
      await cancelSubscriptionRenewal();
      toast.success('Renovacao automatica cancelada. Seu acesso continua ate o fim do ciclo.');
      await loadSubscription();
    } catch (err) {
      const message = err.message || 'Nao foi possivel cancelar a renovacao.';
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePaymentDialogChange = (open) => {
    if (!open && cardFormRef.current) {
      cardFormRef.current.unmount();
      cardFormRef.current = null;
    }
    if (!open) {
      setPaymentError(null);
      setPaymentUpdating(false);
    }
    setUpdatePaymentOpen(open);
  };

  const handlePaymentFormSubmit = () => {
    if (!cardFormRef.current) {
      setPaymentError('O formulario do Mercado Pago ainda nao esta pronto.');
      return;
    }
    setPaymentError(null);
    cardFormRef.current.submit();
  };

  useEffect(() => {
    if (!updatePaymentOpen) {
      return;
    }

    if (!MERCADO_PAGO_PUBLIC_KEY) {
      setPaymentError('Configure a variavel VITE_MERCADO_PAGO_PUBLIC_KEY para atualizar a forma de pagamento.');
      return;
    }

    let isMounted = true;

    ensureMercadoPagoScript()
      .then((MercadoPago) => {
        if (!isMounted) return;
        const mp = new MercadoPago(MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
        const cardForm = mp.cardForm({
          amount: '0',
          iframe: true,
          form: {
            id: 'mp-card-form',
            cardNumber: { id: 'mp-card-number', placeholder: 'Numero do cartao' },
            expirationDate: { id: 'mp-card-expiration', placeholder: 'MM/AA' },
            securityCode: { id: 'mp-card-cvv', placeholder: 'CVV' },
            cardholderName: { id: 'mp-card-holder', placeholder: 'Nome do titular' },
            cardholderEmail: { id: 'mp-card-email', placeholder: 'email@exemplo.com' },
            identificationType: { id: 'mp-identification-type', placeholder: 'Tipo de documento' },
            identificationNumber: { id: 'mp-identification-number', placeholder: 'Numero do documento' },
          },
          callbacks: {
            onFormMounted: (formError) => {
              if (formError) {
                setPaymentError('Nao foi possivel carregar o formulario do Mercado Pago.');
              }
            },
            onSubmit: async (event) => {
              event.preventDefault();
              const formData = cardForm.getCardFormData();
              if (!formData.token) {
                setPaymentError('Nao foi possivel gerar o token do cartao.');
                return;
              }
              setPaymentUpdating(true);
              try {
                await updateSubscriptionPaymentMethod(formData.token);
                toast.success('Forma de pagamento atualizada com sucesso!');
                setUpdatePaymentOpen(false);
                await loadSubscription();
              } catch (err) {
                const message = err.message || 'Nao foi possivel atualizar a forma de pagamento.';
                setPaymentError(message);
              } finally {
                setPaymentUpdating(false);
              }
            },
            onError: (errors) => {
              const message = Array.isArray(errors) && errors.length ? errors[0].message : null;
              setPaymentError(message || 'Verifique os dados do cartao e tente novamente.');
              setPaymentUpdating(false);
            },
          },
        });
        cardFormRef.current = cardForm;
      })
      .catch((err) => {
        setPaymentError(err.message || 'Nao foi possivel carregar o Mercado Pago.');
      });

    return () => {
      isMounted = false;
      if (cardFormRef.current) {
        cardFormRef.current.unmount();
        cardFormRef.current = null;
      }
    };
  }, [updatePaymentOpen, ensureMercadoPagoScript, loadSubscription]);

  const planLimitLabel = usageInfo.limit > 0
    ? `${usageInfo.limit} agendamentos por ciclo`
    : 'Agendamentos ilimitados durante o ciclo atual';

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Painel de assinatura</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Minha assinatura</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            Consulte o status do plano, acompanhe o uso do ciclo atual e gerencie pagamentos pelo Mercado Pago.
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando assinatura...</span>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Falha ao carregar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && data && !hasActiveSubscription && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              {isLegacySubscription ? 'Vincule sua assinatura ao Mercado Pago' : 'Voce ainda nao possui uma assinatura ativa.'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isLegacySubscription
                ? 'Sua assinatura anterior nao esta integrada ao Mercado Pago. Selecione um plano para realizar o novo checkout e habilitar os recursos.'
                : 'Escolha um plano para liberar novos agendamentos. A cobranca e processada com seguranca pelo Mercado Pago.'}
            </p>
            <Button className="mt-6 bg-[#704abf] text-white hover:bg-[#5a3a9f]" onClick={() => navigate('/planos')}>
              {isLegacySubscription ? 'Migrar assinatura' : 'Assinar um plano'}
            </Button>
          </div>
        )}

        {!loading && !error && data && hasActiveSubscription && (
          <div className="space-y-6">
            {subscriptionPending && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Assinatura pendente</AlertTitle>
                <AlertDescription>
                  Conclua o pagamento no Mercado Pago para liberar todos os recursos do plano.
                </AlertDescription>
              </Alert>
            )}

            <section
              className={cn(
                'relative overflow-hidden rounded-3xl border border-white/60 shadow-lg transition-colors',
                planVisual.gradient,
              )}
            >
              <div className="absolute inset-0 bg-slate-950/30" />
              <div className="relative z-10 flex flex-col gap-6 p-6 text-white sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                        <PlanIcon className="h-6 w-6 text-amber-200 drop-shadow" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/80">Plano atual</p>
                        <h2 className="text-2xl font-semibold drop-shadow-md">
                          {data.plan?.name || 'Plano ativo'}
                        </h2>
                        {planBillingLabel && (
                          <p className="text-sm text-white/70">{planBillingLabel}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-white/80">{planLimitLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm text-white/80">
                    <span>Renovacao prevista em {formatDate(data.subscription?.expiresAt)}</span>
                    {mpSubscriptionId && (
                      <span className="text-xs uppercase tracking-[0.2em]">ID Mercado Pago: {mpSubscriptionId}</span>
                    )}
                    {renewalCancelled && (
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                        Renovacao cancelada
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Inicio</p>
                    <p className="mt-2 text-base font-semibold text-white">{formatDate(data.subscription?.startsAt)}</p>
                  </div>
                  <div className="rounded-xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Expira em</p>
                    <p className="mt-2 text-base font-semibold text-white">{formatDate(data.subscription?.expiresAt)}</p>
                  </div>
                  <div className="rounded-xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Dias restantes</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {typeof daysLeft === 'number' ? `${daysLeft} dia${daysLeft === 1 ? '' : 's'}` : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => canManagePayment && setUpdatePaymentOpen(true)}
                    className="gap-2 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    disabled={!canManagePayment}
                  >
                    <CreditCard className="h-4 w-4" /> Atualizar forma de pagamento
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-200 hover:text-red-100 hover:bg-white/10"
                    onClick={handleCancelRenewal}
                    disabled={cancelLoading || !canCancelRenewal}
                  >
                    {cancelLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cancelando...
                      </span>
                    ) : !canCancelRenewal ? (
                      renewalCancelled ? 'Renovacao ja cancelada' : 'Aguarde confirmacao do pagamento'
                    ) : (
                      'Cancelar renovacao automatica'
                    )}
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Uso do ciclo atual</h3>
                  <p className="text-sm text-slate-600">
                    Voce ja fez {usageInfo.used} de {usageInfo.limit || 'sem limite definido'} agendamentos neste ciclo.
                  </p>
                </div>
                <Button variant="ghost" className="text-[#704abf] hover:bg-[#704abf] hover:text-white" onClick={loadSubscription}>
                  Atualizar dados
                </Button>
              </div>

              <div className="mt-6">
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${usageInfo.limitReached ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${usageInfo.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{usageInfo.used} realizados</span>
                  {usageInfo.limit > 0 && <span>{usageInfo.remaining} restantes</span>}
                </div>

                {usageInfo.limitReached && (
                  <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                    Voce atingiu o limite de agendamentos deste ciclo. Novos agendamentos serao liberados na proxima renovacao ou apos atualizar o plano.
                  </div>
                )}
              </div>
            </section>

            <Separator />

            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-sm">
              <p>Precisa de mais capacidade? Escolha outro plano e conclua o pagamento pelo Mercado Pago.</p>
              <Button className="mt-4 bg-[#704abf] text-white hover:bg-[#5a3a9f]" onClick={() => navigate('/planos')}>
                Ver planos disponiveis
              </Button>
            </section>
          </div>
        )}
      </div>

      <Dialog open={updatePaymentOpen} onOpenChange={handlePaymentDialogChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar forma de pagamento</DialogTitle>
            <DialogDescription>
              Os dados sao criptografados e enviados diretamente ao Mercado Pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isSandboxEnv && (
              <Alert className="border-slate-200 bg-slate-50 text-slate-700">
                <AlertTitle>Ambiente de teste do Mercado Pago</AlertTitle>
                <AlertDescription>Use os cartoes de teste fornecidos pelo Mercado Pago ao atualizar a forma de pagamento.</AlertDescription>
              </Alert>
            )}
            {!MERCADO_PAGO_PUBLIC_KEY && (
              <Alert variant="destructive">
                <AlertTitle>Configuracao necessaria</AlertTitle>
                <AlertDescription>
                  Defina a variavel VITE_MERCADO_PAGO_PUBLIC_KEY no frontend para habilitar a atualizacao da forma de pagamento.
                </AlertDescription>
              </Alert>
            )}
            {paymentError && (
              <Alert variant="destructive">
                <AlertTitle>Ops, algo deu errado</AlertTitle>
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}
            <form id="mp-card-form" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="mp-card-number" className="text-sm font-medium text-slate-600">
                    Numero do cartao
                  </label>
                  <div id="mp-card-number" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="mp-card-expiration" className="text-sm font-medium text-slate-600">
                    Validade (MM/AA)
                  </label>
                  <div id="mp-card-expiration" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="mp-card-cvv" className="text-sm font-medium text-slate-600">
                    CVV
                  </label>
                  <div id="mp-card-cvv" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="mp-card-holder" className="text-sm font-medium text-slate-600">
                    Nome do titular
                  </label>
                  <div id="mp-card-holder" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="mp-card-email" className="text-sm font-medium text-slate-600">
                    E-mail
                  </label>
                  <div id="mp-card-email" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="mp-identification-type" className="text-sm font-medium text-slate-600">
                    Tipo de documento
                  </label>
                  <div id="mp-identification-type" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="mp-identification-number" className="text-sm font-medium text-slate-600">
                  Numero do documento
                </label>
                <div id="mp-identification-number" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3" />
              </div>
            </form>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handlePaymentDialogChange(false)} disabled={paymentUpdating}>
              Fechar
            </Button>
            <Button
              type="button"
              onClick={handlePaymentFormSubmit}
              disabled={paymentUpdating || !MERCADO_PAGO_PUBLIC_KEY}
              className="bg-[#704abf] text-white hover:bg-[#5a3a9f]"
            >
              {paymentUpdating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Atualizando...
                </span>
              ) : (
                'Salvar nova forma de pagamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhaAssinatura;
