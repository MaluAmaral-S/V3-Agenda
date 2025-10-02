import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, List, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const timeToMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
};

const formatarMinutosParaDuracao = (minutos) => {
    if (!minutos || minutos < 1) return '00:00';
    const hours = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const OnboardingServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const formRef = React.useRef();

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const data = await apiRequest.get('/servicos');
            setServices(data);
        } catch (err) {
            setError(err.message || 'Não foi possível carregar os serviços.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const formData = new FormData(formRef.current);
        const duracaoEmTempo = formData.get('duracao');

        const serviceData = {
            nome: formData.get('nome'),
            descricao: formData.get('descricao'),
            duracao_minutos: timeToMinutes(duracaoEmTempo),
            preco: parseFloat(formData.get('preco')) || 0
        };

        if (!serviceData.nome || serviceData.duracao_minutos <= 0) {
            setError("Nome do serviço e duração são obrigatórios.");
            setSubmitting(false);
            return;
        }

        try {
            await apiRequest.post('/servicos', serviceData);
            toast.success('Serviço adicionado com sucesso!');
            formRef.current.reset();
            loadServices();
        } catch (err) {
            toast.error(err.message || 'Erro ao adicionar serviço.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        try {
            await apiRequest.delete(`/servicos/${serviceId}`);
            toast.success('Serviço apagado com sucesso!');
            loadServices();
        } catch (err) {
            toast.error(err.message || 'Erro ao apagar serviço.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <form ref={formRef} onSubmit={handleCreateService} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="nome" className="mb-1 block text-sm">Nome do Serviço *</Label>
                            <Input id="nome" name="nome" required placeholder="Ex: Corte de Cabelo" />
                        </div>
                        <div>
                            <Label htmlFor="descricao" className="mb-1 block text-sm">Descrição</Label>
                            <Input id="descricao" name="descricao" placeholder="Opcional" />
                        </div>
                        <div>
                            <Label htmlFor="duracao" className="mb-1 block text-sm">Duração *</Label>
                            <Input id="duracao" name="duracao" type="time" required defaultValue="00:30" step="300" />
                        </div>
                        <div>
                            <Label htmlFor="preco" className="mb-1 block text-sm">Preço (R$)</Label>
                            <Input id="preco" name="preco" type="number" step="0.01" min="0" placeholder="25.00" />
                        </div>
                    </div>
                    {error && <Alert variant="destructive" className="mt-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adicionando...</> : <><PlusCircle className="w-4 h-4 mr-2" /> Adicionar Serviço</>}
                        </Button>
                    </div>
                </form>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><List className="w-5 h-5 mr-2 text-purple-600" /> Serviços Adicionados</h3>
                <div className="space-y-2 p-4 border rounded-lg min-h-[100px]">
                    {loading ? (
                        <p className="text-center text-gray-500">A carregar serviços...</p>
                    ) : services.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhum serviço registado ainda.</p>
                    ) : (
                        services.map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50">
                                <div>
                                    <p className="font-semibold text-gray-800">{service.nome}</p>
                                    <p className="text-sm text-gray-500">
                                        Duração: {formatarMinutosParaDuracao(service.duracao_minutos)} | R$ {parseFloat(service.preco || 0).toFixed(2)}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteService(service.id)} className="p-2 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingServices;
