import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import BusinessHours from "./BusinessHours";
import Servicos from "./Services";
import Appointments from "./Appointments";
import Account from "./Account";
import MinhaAssinatura from "./MinhaAssinatura";
import Header from "../components/layout/Header"; // Import the new Header
import { apiRequest } from "../services/api";
import {
  Calendar,
  CalendarCheck,
  LayoutGrid,
  DollarSign,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


const TAB_IDS = [
  "dashboard",
  "servicos",
  "horarios",
  "agendamentos",
  "minha-assinatura",
  "conta",
];

const DEFAULT_TAB = "dashboard";

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    return tabParam && TAB_IDS.includes(tabParam) ? tabParam : DEFAULT_TAB;
  }, [searchParams]);
  const [stats, setStats] = useState({
    todayBookings: 0,
    monthBookings: 0,
    activeServices: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [publicLink, setPublicLink] = useState("");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!tabParam || !TAB_IDS.includes(tabParam)) {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", DEFAULT_TAB);
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = useCallback((tab) => {
    if (!TAB_IDS.includes(tab)) {
      return;
    }
    if (searchParams.get("tab") === tab) {
      return;
    }
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", tab);
      return params;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    generatePublicLink();

    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await apiRequest.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const generatePublicLink = () => {
    if (user?.businessName) {
      const businessSlug = user.businessName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setPublicLink(`${window.location.origin}/agendamento/${businessSlug}`);
    }
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success("Link copiado para a área de transferência!", {
      duration: 3000,
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8">
        {activeTab === "dashboard" && (
          <div className="px-4 sm:px-6 lg:px-8 space-y-8">
            {/* --- AQUI ESTÁ A GRELHA RESPONSIVA --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Agendamentos Hoje
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.todayBookings}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CalendarCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Este Mês
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.monthBookings}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <LayoutGrid className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Serviços Ativos
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activeServices}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Receita Mensal
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {stats.monthlyRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sua Página de Agendamento
              </h3>
              <p className="text-gray-600 text-sm">
                Compartilhe este link com seus clientes para que possam agendar
                online.
              </p>
              <div className="mt-3 flex items-center space-x-3">
                <Input type="text" readOnly value={publicLink} />
                <Button onClick={copyPublicLink} className="bg-purple-600 hover:bg-purple-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "servicos" && <Servicos />}
        {activeTab === "horarios" && <BusinessHours />}
        {activeTab === "agendamentos" && <Appointments />}
        {activeTab === "minha-assinatura" && <MinhaAssinatura />}
        {activeTab === "conta" && <Account />}
      </main>
    </div>
  );
};

export default Dashboard;
