import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useBreakpoint } from "../../hooks/use-breakpoint";
import {
  CalendarCheck,
  LogOut,
  Crown,
  Menu,
  X,
} from "lucide-react";

const Header = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useBreakpoint(640);

  const navLinks = [
    { id: "dashboard", label: "Dashboard" },
    { id: "servicos", label: "Serviços" },
    { id: "horarios", label: "Horários" },
    { id: "agendamentos", label: "Agendamentos" },
    { id: "minha-assinatura", label: "Minha Assinatura" },
    { id: "conta", label: "Minha Conta" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md">
                <CalendarCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AgendaPro</h1>
                <p className="text-white/80 text-sm">
                  Bem-vindo,{" "}
                  <span className="font-medium">
                    {user?.name || "Utilizador"}
                  </span>{" "}
                  -
                  <span className="font-medium">
                    {user?.businessName || "Empresa"}
                  </span>
                </p>
              </div>
            </div>

            {isMobile ? (
              <div className="flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-white"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate("/planos")}
                  className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Planos
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Renderização condicional de toda a navegação */}
      {isMobile ? (
        mobileMenuOpen && (
          <div className="bg-white shadow-lg">
            <nav className="flex flex-col space-y-1 px-2 py-3">
              {navLinks.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2 rounded-md text-base font-medium text-left ${
                    activeTab === tab.id
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  navigate("/planos");
                  setMobileMenuOpen(false);
                }}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 text-left"
              >
                Planos
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 text-left"
              >
                Sair
              </button>
            </nav>
          </div>
        )
      ) : (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {navLinks.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
