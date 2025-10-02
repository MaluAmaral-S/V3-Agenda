import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, CalendarCheck, Crown } from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { mapFeatureTemplate } from '@/utils/subscriptionPlans';

const formatNumber = (value) => value.toLocaleString('pt-BR');

const formatDate = (date) => {
  if (!date) return '--';
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(date);
};

const computeDaysUntil = (date) => {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const MySubscription = () => {
  const navigate = useNavigate();
  const { plan, usage, nextResetDate, limits, canScheduleMore } = useSubscription();

  const limit = usage.isUnlimited ? null : usage.limit ?? limits?.[plan.id];
  const features = useMemo(() => mapFeatureTemplate(plan, limit ?? usage.limit), [plan, limit, usage.limit]);

  const indicatorClass = useMemo(() => {
    if (usage.isUnlimited) {
      return '[&_[data-slot=progress-indicator]]:bg-emerald-400';
    }
    if (usage.progress >= 90) {
      return '[&_[data-slot=progress-indicator]]:bg-red-500';
    }
    if (usage.progress >= 60) {
      return '[&_[data-slot=progress-indicator]]:bg-amber-400';
    }
    return '[&_[data-slot=progress-indicator]]:bg-emerald-400';
  }, [usage.isUnlimited, usage.progress]);

  const daysUntilReset = computeDaysUntil(nextResetDate);

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Crown className="h-5 w-5 text-[#704abf]" />
              Sua assinatura: {plan.title}
            </CardTitle>
            <p className="text-sm text-slate-600">
              Acompanhe aqui o status da sua assinatura e o quanto voce ja utilizou nesse mes.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {limit ? (
                <span>
                  Limite mensal de <strong>{formatNumber(limit)}</strong> agendamentos
                </span>
              ) : (
                <span>Agendamentos ilimitados por mes</span>
              )}
              <span className="text-slate-400">•</span>
              <span>
                Renova em <strong>{formatDate(nextResetDate)}</strong>
              </span>
              {typeof daysUntilReset === 'number' && (
                <span className="text-slate-400">
                  • Faltam {daysUntilReset} dia(s)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Button
              onClick={() => navigate('/planos')}
              className="bg-[#704abf] text-white hover:bg-[#5a3a9f]"
            >
              Conhecer outros planos
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarCheck className="h-4 w-4 text-[#704abf]" />
              Ciclo atual em andamento
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Uso do mes</span>
              <span>
                {usage.isUnlimited
                  ? 'Sem limites de agendamento'
                  : `${formatNumber(usage.used)} de ${formatNumber(usage.limit)} agendamentos`}
              </span>
            </div>
            <Progress
              value={usage.isUnlimited ? 100 : Math.min(usage.progress, 100)}
              className={['bg-slate-200', indicatorClass].join(' ')}
            />
            {!usage.isUnlimited && (
              <p className="text-xs text-slate-500">
                Restam {formatNumber(Math.max(usage.remaining ?? 0, 0))} agendamentos neste ciclo.
              </p>
            )}
          </div>

          {!canScheduleMore && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Limite mensal atingido</AlertTitle>
              <AlertDescription>
                Novos agendamentos serao liberados na proxima renovacao ou ao mudar para um plano com mais capacidade.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Dicas para aproveitar melhor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Agendamentos feitos pelos seus clientes contam para o limite do mes. Se precisar de mais espaco, altere o plano a qualquer momento.
          </p>
          <p>
            O ciclo reinicia automaticamente na data indicada acima. Voce nao precisa fazer nada para renovar sua assinatura.
          </p>
          <p>
            Caso tenha duvidas, nossa equipe esta pronta para ajudar via chat ou e-mail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MySubscription;
