import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingBusinessHours from '../components/onboarding/OnboardingBusinessHours';
import OnboardingServices from '../components/onboarding/OnboardingServices';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from '../services/api';
import { Clock, Calendar, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PrimeirosPassos = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user, checkAuth, updateUser } = useAuth();
  const [businessHours, setBusinessHours] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [headerText, setHeaderText] = useState({
    title: `Bem-vindo(a), ${user?.name || 'Empreendedor(a)'}!`,
    subtitle: 'Vamos configurar sua conta. Siga os passos para deixar tudo pronto para seus clientes.'
  });

  useEffect(() => {
    if (step === 1) {
      setHeaderText({
        title: 'Configure seus Horários',
        subtitle: 'Defina os dias e horários em que seu negócio estará aberto para agendamentos.'
      });
    } else if (step === 2) {
      setHeaderText({
        title: 'Adicione seus Serviços',
        subtitle: 'Cadastre os serviços que você oferece para que seus clientes possam agendar.'
      });
    }
  }, [step, user]);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/painel', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadBusinessHours = async () => {
      try {
        const response = await apiRequest.get('/business-hours');
        if (response && response.businessHours && Object.keys(response.businessHours).length > 0) {
          setBusinessHours(response.businessHours);
        } else {
          const defaultHours = {
            "1": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
            "2": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
            "3": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
            "4": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
            "5": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
          };
          setBusinessHours(defaultHours);
        }
      } catch (error) {
        console.warn('Erro ao carregar horários, usando padrão:', error.message);
      }
    };
    loadBusinessHours();
  }, []);

  const handleNext = async () => {
    if (step === 1) {
      setIsSaving(true);
      try {
        await apiRequest.post('/business-hours', { businessHours });
        toast.success('Horários salvos com sucesso!');
        setStep(2);
      } catch (error) {
        toast.error('Não foi possível salvar os horários. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      await apiRequest.post('/auth/onboarding/complete');
      updateUser({ onboardingCompleted: true });
      // A navegação será tratada pelo useEffect que observa user.onboardingCompleted
    } catch (error) {
      console.error('Erro ao finalizar o onboarding:', error);
      toast.error('Não foi possível finalizar a configuração.');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleFinish = async () => {
    setIsSaving(true);
    await completeOnboarding();
    setIsSaving(false);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <p className="mb-4 text-gray-600 text-center">Defina aqui os dias e horários em que você está disponível para receber agendamentos. <br /> Seus clientes só conseguirão marcar horários dentro dos intervalos que você selecionar.</p>
            <OnboardingBusinessHours businessHours={businessHours} setBusinessHours={setBusinessHours} />
          </div>
        );
      case 2:
        return (
            <div>
                <p className="mb-4 text-gray-600">Adicione os serviços que você oferece. A 'duração' é muito importante, pois nosso sistema a usará para evitar que clientes marquem horários conflitantes.</p>
                <OnboardingServices />
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-white text-center">Configuração Inicial da Conta</h1>
        </div>
      </header>

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-center items-center">
            {[
              { step: 1, icon: <Clock className="w-5 h-5" />, label: 'Horários' },
              { step: 2, icon: <Calendar className="w-5 h-5" />, label: 'Serviços' },
            ].map(({ step: s, icon, label }) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                    <motion.div
                      className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 ${
                        step > s ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                        step === s ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' :
                        'bg-gray-200 text-gray-500'
                      }`}
                      animate={{ scale: step === s ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    >
                      {step > s ? <Check className="w-6 h-6" /> : icon}
                    </motion.div>
                    <p className={`mt-2 text-sm font-medium ${step === s ? 'text-purple-600' : 'text-gray-500'}`}>{label}</p>
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={headerText.title} className="text-3xl font-bold text-gray-800">{headerText.title}</motion.h2>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} key={headerText.subtitle} className="text-lg text-gray-600 mt-2">{headerText.subtitle}</motion.p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full">
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-12">
          <div>
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                    Pular e ir para o Painel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você pode concluir as configurações mais tarde no seu painel.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSkip} className="bg-purple-600 hover:bg-purple-700 text-white">Pular</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div>
            {step < 2 && (
              <Button onClick={handleNext} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? "Salvando..." : "Próximo"}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleFinish} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? "Finalizando..." : "Finalizar e ir para o Painel"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrimeirosPassos;
