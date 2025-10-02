import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LayoutGrid, 
  Calendar, 
  BarChart3,
  List
} from "lucide-react";

const ViewToggle = ({ currentView, onViewChange }) => {
  const views = [
    {
      id: "cards",
      label: "Cards",
      icon: LayoutGrid,
      description: "Visualização em cards"
    },
    {
      id: "calendar",
      label: "Calendário",
      icon: Calendar,
      description: "Visualização em calendário"
    },
    {
      id: "gantt",
      label: "Gantt",
      icon: BarChart3,
      description: "Gráfico de Gantt"
    }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Visualização</h3>
          <div className="text-sm text-gray-500">
            Escolha como visualizar os agendamentos
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = currentView === view.id;
            
            return (
              <Button
                key={view.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange(view.id)}
                className={`
                  flex items-center space-x-2 transition-all duration-200
                  ${isActive 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' 
                    : 'hover:bg-gray-50 border-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewToggle;

