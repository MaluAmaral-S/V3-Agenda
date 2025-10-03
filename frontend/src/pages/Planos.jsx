import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { fetchPlans, createSubscription, fetchMySubscription } from '@/services/subscriptionService';
import { getAuthToken } from '@/services/api';
import { IS_MERCADO_PAGO_SANDBOX, MERCADO_PAGO_MODE } from '@/utils/constants';
import { Loader2, Check, CheckCircle2, Crown, Star, Zap, AlertTriangle } from 'lucide-react';

const ICONS = {
  zap: Zap,
  star: Star,
  crown: Crown,
};

const PLAN_ORDER = ['bronze', 'silver', 'gold'];

const PLAN_UI_DATA = {
  bronze: {
    key: 'bronze',
    name: 'Bronze',
    title: 'Plano Bronze',
    description: 'Recursos essenciais para comecar a usar o AgendaPro.',
    priceLabel: 'R$ 39,90',
    price: 39.9,
    currency: 'BRL',
    frequency: 1,
    frequencyType: 'months',
    icon: 'zap',
    badge: null,
    gradientClass:
      'bg-[radial-gradient(circle_at_20%_20%,rgba(255,217,182,0.85),rgba(136,84,24,0.95)_45%,rgba(58,33,10,0.98))]',
    featureTemplate: [
      'Ate {{limit}} agendamentos mensais',
      '1 agenda de profissional',
      'Confirmacoes por e-mail',
    ],
    ctaLabel: 'Assinar Bronze',
    defaultLimit: 20,
  },
  silver: {
    key: 'silver',
    name: 'Prata',
    title: 'Plano Prata',
    description: 'O equilibrio ideal entre capacidade e autonomia.',
    priceLabel: 'R$ 79,90',
    price: 79.9,
    currency: 'BRL',
    frequency: 1,
    frequencyType: 'months',
    icon: 'star',
    badge: 'Mais escolhido',
    gradientClass:
      'bg-[radial-gradient(circle_at_20%_20%,rgba(245,245,247,0.9),rgba(168,174,186,0.95)_45%,rgba(82,88,99,0.98))]',
    featureTemplate: [
      'Ate {{limit}} agendamentos mensais',
      'Ate 5 agendas de profissionais',
      'Suporte prioritario em horrio comercial',
    ],
    ctaLabel: 'Assinar Prata',
    defaultLimit: 60,
  },
  gold: {
    key: 'gold',
    name: 'Ouro',
    title: 'Plano Ouro',
    description: 'Para equipes que precisam operar sem limites.',
    priceLabel: 'Fale com o time',
    price: null,
    currency: 'BRL',
    frequency: 1,
    frequencyType: 'months',
    requiresContact: true,
    icon: 'crown',
    badge: 'Experiencia premium',
    gradientClass:
      'bg-[radial-gradient(circle_at_20%_20%,rgba(252,244,195,0.9),rgba(214,175,38,0.95)_45%,rgba(104,78,23,0.98))]',
    featureTemplate: [
      'Ate {{limit}} agendamentos mensais',
      'Usuarios ilimitados',
      'Suporte dedicado com SLA customizado',
    ],
    ctaLabel: 'Solicitar contato',
    defaultLimit: 200,
  },
};

const buildFeatures = (planKey, limit) => {
  const template = PLAN_UI_DATA[planKey]?.featureTemplate ?? [];
  const normalizedLimit = limit && limit > 0 ? limit.toLocaleString('pt-BR') : 'agendamentos ilimitados';
  return template.map((feature) => feature.replace('{{limit}}', normalizedLimit));
};

const formatLimitLabel = (limit) => {
  if (!limit || limit <= 0) {
    return 'Agendamentos ilimitados por mes';
  }
  return `${limit.toLocaleString('pt-BR')} agendamentos por ms`;
};

const composePlanList = (plansMap = new Map()) =>
  PLAN_ORDER.map((key) => {
    const uiPlan = PLAN_UI_DATA[key];
    const backendPlan = plansMap.get ? plansMap.get(key) ?? {} : {};
    const monthlyLimit = backendPlan.monthlyLimit ?? uiPlan.defaultLimit;
    const displayName = backendPlan.name ?? uiPlan.name;

    return {
      ...uiPlan,
      key,
      name: displayName,
      monthlyLimit,
      features: buildFeatures(key, monthlyLimit),
    };
  });

const Planos = () => {
  const navigate = useNavigate();
  const [planData, setPlanData] = useState([]);
  const [currentPlanKey, setCurrentPlanKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [legacySubscription, setLegacySubscription] = useState(false);
  const [subscriptionPending, setSubscriptionPending] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const isSandboxEnv = IS_MERCADO_PAGO_SANDBOX;

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const hasToken = Boolean(getAuthToken && getAuthToken());
        const subscriptionPromise = hasToken
          ? fetchMySubscription().catch((subscriptionError) => subscriptionError)
          : Promise.resolve(null);

        const [plansResponse, subscriptionResponseRaw] = await Promise.all([
          fetchPlans(),
          subscriptionPromise,
        ]);

        if (!mounted) return;

        const plansMap = new Map();
        plansResponse?.forEach((plan) => {
          plansMap.set(plan.key, plan);
        });

        setPlanData(composePlanList(plansMap));

        const isSubscriptionPayload =
          subscriptionResponseRaw && !(subscriptionResponseRaw instanceof Error);

        if (isSubscriptionPayload) {
          const subscriptionResponse = subscriptionResponseRaw;
          const hasActive = Boolean(subscriptionResponse?.hasActive);
          setLegacySubscription(Boolean(subscriptionResponse?.legacySubscription));
          setSubscriptionPending(Boolean(subscriptionResponse?.pending));
          if (hasActive) {
            setCurrentPlanKey(subscriptionResponse.plan?.key ?? null);
          } else {
            setCurrentPlanKey(null);
          }
        }
      } catch (err) {
        if (!mounted) return;
        setPlanData(composePlanList());
        setError(err.message || 'No foi possvel carregar os planos.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDialogChange = (open) => {
    if (!open && !isApplying) {
      setPendingPlan(null);
    }
    setDialogOpen(open);
  };

  const planList = useMemo(() => planData, [planData]);

  const handleSelectPlan = (plan) => {
    if (!plan) return;
    if (plan.key === currentPlanKey) {
      toast.info('Este ja e o seu plano atual.');
      return;
    }
    if (plan.requiresContact) {
      toast.info('Fale com o time comercial para contratar este plano.');
      return;
    }
    setPendingPlan(plan);
    setDialogOpen(true);
  };

  
const handleConfirmPlan = async () => {
  if (!pendingPlan) return;
  setIsApplying(true);
  try {
    if (pendingPlan.requiresContact) {
      toast.info('Fale com o time comercial para contratar este plano.');
      return;
    }

    const requestPayload = {
      planKey: pendingPlan.key,
      reason: pendingPlan.title || pendingPlan.name,
    };

    if (typeof pendingPlan.price === 'number' && pendingPlan.price > 0) {
      requestPayload.amount = pendingPlan.price;
      requestPayload.price = pendingPlan.price;
      requestPayload.currency = pendingPlan.currency || 'BRL';
      requestPayload.frequency = pendingPlan.frequency ?? 1;
      requestPayload.frequencyType = pendingPlan.frequencyType || 'months';
    }

    const response = await createSubscription(requestPayload);
    const checkoutUrl = response?.checkoutUrl;
    const responseMode = (response?.mercadoPagoMode || MERCADO_PAGO_MODE || 'production').toLowerCase();
    const sandboxCheckout = responseMode !== 'production';
    const toastDescription = checkoutUrl
      ? sandboxCheckout
        ? 'Vamos redirecionar voce para o checkout de teste do Mercado Pago.'
        : 'Vamos redirecionar voce para finalizar o pagamento no Mercado Pago.'
      : 'Plano atualizado. Confira os detalhes na aba Minha assinatura.';
    toast.success('Assinatura iniciada.', { description: toastDescription });
    setCurrentPlanKey(pendingPlan.key);
    setDialogOpen(false);
    setPendingPlan(null);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    navigate('/painel?tab=minha-assinatura');
  } catch (err) {
    toast.error(err.message || 'No foi possvel iniciar a assinatura.');
  } finally {
    setIsApplying(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f0ff] via-white to-[#eef2ff]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-purple-600">
              Planos pensados para voc
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Assinaturas que crescem junto com o seu negcio
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Compare os beneficios de cada plano e escolha a opcao ideal para atender seus clientes com mais eficiencia.
              A cobrana  processada com segurana via Mercado Pago e o ciclo dura 30 dias a partir da confirmao.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Button
              variant="ghost"
              className="border border-transparent text-purple-700 hover:border-purple-200 hover:bg-purple-50"
              onClick={() => navigate('/painel')}
            >
              Voltar ao painel
            </Button>
            <Button
              className="bg-[#704abf] text-white hover:bg-[#5a3a9f]"
              onClick={() => navigate('/painel?tab=minha-assinatura')}
            >
              Minha assinatura
            </Button>
          </div>
        </div>

        {isSandboxEnv && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mercado Pago em desenvolvimento</AlertTitle>
            <AlertDescription>
              Use os dados de teste fornecidos pelo Mercado Pago. Nenhuma cobranca real sera realizada.
            </AlertDescription>
          </Alert>
        )}

        {legacySubscription && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atualize sua assinatura</AlertTitle>
            <AlertDescription>
              Sua assinatura atual nao foi migrada para o Mercado Pago. Escolha um dos planos abaixo para iniciar um novo checkout seguro.
            </AlertDescription>
          </Alert>
        )}

        {subscriptionPending && !legacySubscription && (
          <Alert className="border-slate-200 bg-slate-50 text-slate-700">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Pagamento pendente</AlertTitle>
            <AlertDescription>
              Conclua o pagamento do checkout do Mercado Pago para liberar o plano. Enquanto isso, voce ainda pode escolher outra oferta abaixo.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-purple-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando planos...</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {planList.map((plan) => {
              const IconComponent = ICONS[plan.icon] ?? Star;
              const isCurrent = currentPlanKey === plan.key;
              const limitLabel = formatLimitLabel(plan.monthlyLimit);

              return (
                <div
                  key={plan.key}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border border-white/60 shadow-xl transition-all duration-500',
                    plan.gradientClass,
                    isCurrent ? 'ring-2 ring-[#704abf]' : 'hover:-translate-y-2 hover:border-white'
                  )}
                >
                  <div className="absolute inset-0 bg-slate-950/30" />
                  <div className="relative z-10 flex h-full flex-col gap-6 p-8 text-white">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-8 w-8 text-amber-200 drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]" />
                          <div className="text-left">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/80">Plano</p>
                            <h2 className="text-2xl font-semibold drop-shadow-md">{plan.name}</h2>
                          </div>
                        </div>
                        <p className="text-sm text-white/80">{plan.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {plan.badge && (
                          <Badge className="bg-white/25 text-xs font-semibold uppercase tracking-wide text-white">
                            {plan.badge}
                          </Badge>
                        )}
                        {isCurrent && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-400/95 px-3 py-1 text-xs font-semibold text-slate-900">
                            <Check className="h-4 w-4" /> Plano atual
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-4xl font-bold drop-shadow">{plan.priceLabel}</p>
                      <p className="text-sm uppercase tracking-[0.35em] text-white/75">{limitLabel}</p>
                    </div>

                    <div className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-300" />
                          <span className="text-sm text-white/90">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <Button
                        className={cn(
                          'w-full bg-[#704abf] text-white hover:bg-[#5a3a9f]',
                          isCurrent && 'bg-emerald-400 text-slate-900 hover:bg-emerald-400/90',
                          isApplying && 'opacity-80'
                        )}
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isCurrent || isApplying}
                      >
                        {isCurrent ? 'Plano atual' : plan.ctaLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <AlertDialogContent className="bg-white text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar assinatura</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {pendingPlan
                ? `Deseja ativar o plano ${pendingPlan.name}? Voce poder aproveitar os recursos assim que confirmar.`
                : 'Selecione um plano para continuar.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplying}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#704abf] text-white hover:bg-[#5a3a9f]"
              onClick={handleConfirmPlan}
              disabled={isApplying}
            >
              {isApplying ? 'Aplicando...' : 'Confirmar plano'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Planos;
