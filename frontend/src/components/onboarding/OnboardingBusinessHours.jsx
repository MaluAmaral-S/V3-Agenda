import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const OnboardingBusinessHours = ({ businessHours, setBusinessHours }) => {
  const daysOfWeek = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];

  const toggleDay = (dayIndex) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], isOpen: !prev[dayIndex]?.isOpen, intervals: prev[dayIndex]?.isOpen ? [] : (prev[dayIndex]?.intervals?.length ? prev[dayIndex].intervals : [{ start: '09:00', end: '18:00' }]) }
    }));
  };

  const addInterval = (dayIndex) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], intervals: [...(prev[dayIndex]?.intervals || []), { start: '09:00', end: '18:00' }] }
    }));
  };

  const removeInterval = (dayIndex, intervalIndex) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], intervals: prev[dayIndex]?.intervals?.filter((_, index) => index !== intervalIndex) || [] }
    }));
  };

  const updateInterval = (dayIndex, intervalIndex, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], intervals: prev[dayIndex]?.intervals?.map((interval, index) =>
          index === intervalIndex ? { ...interval, [field]: value } : interval
        ) || []
      }
    }));
  };

  // Ensure businessHours is not null or undefined before mapping
  if (!businessHours) {
    return <div>Carregando horários...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {daysOfWeek.map((dayName, dayIndex) => {
        const dayData = businessHours[dayIndex] || { isOpen: false, intervals: [] };
        const intervals = dayData.intervals || [];
        const isOpen = dayData.isOpen || false;

        return (
          <div key={dayIndex} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col min-h-[180px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <span className="font-semibold text-md text-gray-800">{dayName}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isOpen} onChange={() => toggleDay(dayIndex)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isOpen && (
              <div className="space-y-3 flex-grow flex flex-col">
                <div className="flex-grow">
                  {intervals.map((interval, intervalIndex) => (
                    <div key={intervalIndex} className="flex items-center gap-2 mb-2">
                      <Input type="time" value={interval.start} onChange={(e) => updateInterval(dayIndex, intervalIndex, 'start', e.target.value)} className="w-full" />
                      <Input type="time" value={interval.end} onChange={(e) => updateInterval(dayIndex, intervalIndex, 'end', e.target.value)} className="w-full" />
                      <Button variant="ghost" size="icon" onClick={() => removeInterval(dayIndex, intervalIndex)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => addInterval(dayIndex)} className="w-full mt-auto">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OnboardingBusinessHours;
