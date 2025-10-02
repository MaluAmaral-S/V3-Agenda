import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { LayoutGrid, PlusCircle, List, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const formatarMinutosParaDuracao = (minutos) => {
    if (!minutos || minutos < 1) return '00:00';
    const hours = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const timeToMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
};

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const data = await apiRequest.get('/servicos');
            setServices(data);
        } catch (err) {
            toast.error(err.message || 'Não foi possível carregar os serviços.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreateService = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.target);
        const duracaoEmTempo = formData.get('duracao');

        const serviceData = {
            nome: formData.get('nome'),
            descricao: formData.get('descricao'),
            duracao_minutos: timeToMinutes(duracaoEmTempo),
            preco: parseFloat(formData.get('preco')) || 0
        };

        if (!serviceData.nome || serviceData.duracao_minutos <= 0) {
            toast.error("Nome do serviço e duração são obrigatórios.");
            setSubmitting(false);
            return;
        }

        try {
            await apiRequest.post('/servicos', serviceData);
            toast.success('Serviço adicionado com sucesso!');
            e.target.reset();
            loadServices();
        } catch (err) {
            toast.error(err.message || 'Erro ao adicionar serviço.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Tem a certeza de que deseja apagar este serviço?')) return;

        try {
            await apiRequest.delete(`/servicos/${serviceId}`);
            toast.success('Serviço apagado com sucesso!');
            loadServices();
        } catch (err) {
            toast.error(err.message || 'Erro ao apagar serviço.');
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <PlusCircle className="w-5 h-5 mr-3 text-purple-600" />
                        Adicionar Novo Serviço
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleCreateService} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <Label htmlFor="nome" className="mb-2 block">Nome do Serviço *</Label>
                                <Input id="nome" name="nome" required placeholder="Ex: Corte de Cabelo" />
                            </div>
                            <div>
                                <Label htmlFor="descricao" className="mb-2 block">Descrição</Label>
                                <Input id="descricao" name="descricao" placeholder="Opcional" />
                            </div>
                            <div>
                                <Label htmlFor="duracao" className="mb-2 block">Duração *</Label>
                                <Input 
                                    id="duracao" 
                                    name="duracao"
                                    type="time"
                                    required 
                                    defaultValue="00:30"
                                    step="300"
                                />
                            </div>
                            <div>
                                <Label htmlFor="preco" className="mb-2 block">Preço (R$)</Label>
                                <Input id="preco" name="preco" type="number" step="0.01" min="0" placeholder="25.00" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'A adicionar...' : 'Adicionar Serviço'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <List className="w-5 h-5 mr-3 text-purple-600" />
                        Meus Serviços
                    </h3>
                </div>
                <div className="p-6">
                    {loading ? (
                        <LoadingSpinner text="A carregar serviços..." />
                    ) : services.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhum serviço registado ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* --- CORREÇÃO APLICADA AQUI --- */}
                            {services.map((service) => (
                                <div key={service.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-gray-800">{service.nome}</p>
                                        <p className="text-sm text-gray-500">
                                            Duração: {formatarMinutosParaDuracao(service.duracao_minutos)} - R$ {parseFloat(service.preco || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteService(service.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Services;