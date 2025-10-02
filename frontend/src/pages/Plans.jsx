import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useSubscription } from '@/context/SubscriptionContext';
import {
  SUBSCRIPTION_PLAN_LIST,
  mapFeatureTemplate,
} from '@/utils/subscriptionPlans';
import { getPlanLimitById } from '@/utils/planLimits';
import { Check, CheckCircle2, Crown, Star, Zap } from 'lucide-react';

const ICONS = {
  zap: Zap,
  star: Star,
  crown: Crown,
};

const Plans = () => {
  const navigate = useNavigate();
  const { plans, currentPlan, limits, upgradePlan } = useSubscription();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const planList = useMemo(() => plans ?? SUBSCRIPTION_PLAN_LIST, [plans]);

  const handleDialogChange = (open) => {
    if (!open && !isApplying) {
      setPendingPlan(null);
    }
    setDialogOpen(open);
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === currentPlan) {
      toast.info('Este ja e o seu plano atual.');
      return;
    }
    setPendingPlan(plan);
    setDialogOpen(true);
  };

  const handleConfirmPlan = () => {
    if (!pendingPlan) return;
    setIsApplying(true);
    try {
      upgradePlan(pendingPlan.id);
      toast.success(`Plano ${pendingPlan.name} ativado`, {
        description: 'Veja os detalhes em Minha Assinatura.',
      });
      setPendingPlan(null);
      setDialogOpen(false);
    } catch (error) {
      console.error('Falha ao atualizar plano:', error);
      toast.error('Nao foi possivel ativar o plano. Tente novamente.');
    } finally {
      setIsApplying(false);
    }
  };

  const limitLabel = (planId) => {
    const limit = limits?.[planId] ?? getPlanLimitById(planId);
    if (!limit || limit <= 0) {
      return 'Agendamentos ilimitados por mes';
    }
    return `${limit.toLocaleString('pt-BR')} agendamentos por mes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f0ff] via-white to-[#eef2ff]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-purple-600">
              Planos pensados para voce
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Assinaturas que crescem junto com o seu negocio
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Compare os beneficios de cada plano e escolha a opcao ideal para atender seus clientes com mais eficiencia. Basta selecionar o plano, confirmar a assinatura e voce ja podera usar os recursos imediatamente.
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
              Ver minha assinatura
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {planList.map((plan) => {
            const IconComponent = ICONS[plan.icon] ?? Star;
            const limit = limits?.[plan.id] ?? getPlanLimitById(plan.id);
            const isCurrent = currentPlan === plan.id;
            const features = mapFeatureTemplate(plan, limit);

            return (
              <div
                key={plan.id}
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
                    <p className="text-sm uppercase tracking-[0.35em] text-white/75">{limitLabel(plan.id)}</p>
                  </div>

                  <div className="flex-1 space-y-3">
                    {features.map((feature) => (
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
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <AlertDialogContent className="bg-white text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar assinatura</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {pendingPlan
                ? `Deseja ativar o plano ${pendingPlan.name}? Voce podera aproveitar os recursos assim que confirmar.`
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

export default Plans;
