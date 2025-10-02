import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '../services/api';
import { toast } from 'sonner';

const BusinessHours = () => {
  const [businessHours, setBusinessHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    'Domingo',
    'Segunda-feira', 
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  const defaultHours = {
    "0": { isOpen: false, intervals: [] },
    "1": { isOpen: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    "2": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
    "3": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
    "4": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
    "5": { isOpen: true, intervals: [{ start: '08:00', end: '18:00' }] },
    "6": { isOpen: true, intervals: [{ start: '09:00', end: '13:00' }] }
  };

  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      setLoading(true);
      const response = await apiRequest.get('/business-hours');
      
      if (response && response.businessHours && Object.keys(response.businessHours).length > 0) {
        setBusinessHours(response.businessHours);
      } else {
        setBusinessHours(defaultHours);
      }
    } catch (error) {
      console.warn('Erro ao carregar horários, usando padrão:', error.message);
      setBusinessHours(defaultHours);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        isOpen: !prev[dayIndex]?.isOpen,
        intervals: prev[dayIndex]?.isOpen ? [] : prev[dayIndex]?.intervals || []
      }
    }));
  };

  const addInterval = (dayIndex) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        intervals: [...(prev[dayIndex]?.intervals || []), { start: '09:00', end: '18:00' }]
      }
    }));
  };

  const removeInterval = (dayIndex, intervalIndex) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        intervals: prev[dayIndex]?.intervals?.filter((_, index) => index !== intervalIndex) || []
      }
    }));
  };

  const updateInterval = (dayIndex, intervalIndex, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        intervals: prev[dayIndex]?.intervals?.map((interval, index) => 
          index === intervalIndex ? { ...interval, [field]: value } : interval
        ) || []
      }
    }));
  };

  const validateHours = () => {
    for (const dayIndex in businessHours) {
      const day = businessHours[dayIndex];
      if (day.isOpen) {
        for (const interval of day.intervals || []) {
          if (!interval.start || !interval.end) {
            return `No dia ${daysOfWeek[dayIndex]}, preencha todos os campos de horário.`;
          }
          if (interval.start >= interval.end) {
            return `No dia ${daysOfWeek[dayIndex]}, o horário de término deve ser posterior ao de início.`;
          }
        }
      }
    }
    return null;
  };

  const saveBusinessHours = async () => {
    const validationError = validateHours();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      await apiRequest.post('/business-hours', { businessHours });
      toast.success('Horários de funcionamento salvos com sucesso!');
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar horários de funcionamento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-[#704abf]" />
          <p className="text-gray-600">Carregando horários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#704abf] rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Configurar Horários de Funcionamento</h1>
          </div>
          <p className="text-gray-600">Configure os horários de atendimento para cada dia da semana</p>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {daysOfWeek.map((dayName, dayIndex) => {
            const dayData = businessHours[dayIndex] || { isOpen: false, intervals: [] };
            const intervals = dayData.intervals || [];
            const isOpen = dayData.isOpen || false;

            return (
              <div key={dayIndex} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col min-h-[200px]">
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <span className="font-semibold text-md text-gray-800">{dayName}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${isOpen ? 'text-gray-800' : 'text-gray-500'}`}>
                      {isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={() => toggleDay(dayIndex)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#704abf]"></div>
                    </label>
                  </div>
                </div>

                {/* Intervals */}
                {isOpen && (
                  <div className="space-y-3 flex-grow">
                    {intervals.map((interval, intervalIndex) => (
                      <div key={intervalIndex} className="flex items-center gap-2">
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-600 w-8">De:</Label>
                            <Input
                              type="time"
                              value={interval.start}
                              onChange={(e) => updateInterval(dayIndex, intervalIndex, 'start', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#704abf] focus:border-[#704abf]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-600 w-8">Até:</Label>
                            <Input
                              type="time"
                              value={interval.end}
                              onChange={(e) => updateInterval(dayIndex, intervalIndex, 'end', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#704abf] focus:border-[#704abf]"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInterval(dayIndex, intervalIndex)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {intervals.length > 0 && (
                      <hr className="my-2 border-gray-100" />
                    )}

                    {/* Add Interval Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addInterval(dayIndex)}
                      className="w-full mt-4 px-4 py-2 text-sm bg-purple-50 text-[#704abf] font-semibold rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar intervalo
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={saveBusinessHours}
            disabled={saving}
            className="bg-[#704abf] hover:bg-purple-700 text-white px-6 py-3 text-lg font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Horários
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessHours;
