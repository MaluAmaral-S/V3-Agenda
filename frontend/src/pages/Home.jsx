import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck, 
  CalendarDays, 
  Smartphone, 
  BarChart3, 
  Users, 
  CreditCard, 
  Settings, 
  Rocket, 
  PlayCircle, 
  Phone, 
  Check 
} from 'lucide-react';
import { PLANS } from '../utils/constants';

const Home = () => {
  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#704abf] rounded-lg">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#704abf]">AgendaPro</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-[#704abf] font-medium">Início</a>
              <a href="#recursos" className="text-gray-700 hover:text-[#704abf] font-medium">Recursos</a>
              <a href="#planos" className="text-gray-700 hover:text-[#704abf] font-medium">Planos</a>
              <a href="#contato" className="text-gray-700 hover:text-[#704abf] font-medium">Contato</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-[#704abf] font-medium">
                Entrar
              </Link>
              <Link 
                to="/login" 
                className="bg-[#704abf] hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Transforme seu negócio com
              <span className="text-yellow-300"> agendamentos online</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Simplifique a gestão de horários, aumente suas vendas e ofereça uma experiência incrível para seus clientes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="bg-white text-[#704abf] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Começar Agora - Grátis
              </Link>
              <a 
                href="#recursos" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-[#704abf] transition-colors flex items-center justify-center"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Ver Como Funciona
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Recursos poderosos para automatizar seu negócio e conquistar mais clientes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-hover bg-white rounded-xl p-8 border border-gray-200 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <CalendarDays className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Agendamento Online 24/7</h3>
              <p className="text-gray-600">Seus clientes podem agendar a qualquer hora, de qualquer lugar. Sem ligações, sem complicações.</p>
            </div>
            
            <div className="card-hover bg-white rounded-xl p-8 border border-gray-200 transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Notificações Automáticas</h3>
              <p className="text-gray-600">Lembretes por WhatsApp e email reduzem faltas e mantêm seus clientes sempre informados.</p>
            </div>
            
            <div className="card-hover bg-white rounded-xl p-8 border border-gray-200 transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relatórios Inteligentes</h3>
              <p className="text-gray-600">Acompanhe seu faturamento, horários mais procurados e performance do seu negócio.</p>
            </div>
            
            <div className="card-hover bg-white rounded-xl p-8 border border-gray-200 transition-all duration-300">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestão de Clientes</h3>
              <p className="text-gray-600">Histórico completo, preferências e dados de contato organizados em um só lugar.</p>
            </div>
            
            <div className="card-hover bg-white rounded-xl p-8 border border-gray-200 transition-all duration-300">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Pagamentos Online</h3>
              <p className="text-gray-600">Receba pagamentos antecipados e reduza cancelamentos de última hora.</p>
            </div>
            
            <div className="card-hover bg-white rounded-xl p-8 border border-gray-200 transition-all duration-300">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Settings className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personalização Total</h3>
              <p className="text-gray-600">Configure horários, serviços, preços e regras do seu jeito. Sua marca, suas regras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Escolha o plano ideal para seu negócio</h2>
            <p className="text-xl text-gray-600">Comece grátis e escale conforme sua empresa cresce</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-2xl p-8 card-hover transition-all duration-300 relative ${
                  plan.popular 
                    ? 'bg-[#704abf] text-white' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={plan.popular ? 'text-white/80' : 'text-gray-600'}>
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      R$ {plan.price}
                    </span>
                    <span className={plan.popular ? 'text-white/80' : 'text-gray-600'}>/mês</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className={`w-5 h-5 mr-3 ${plan.popular ? 'text-white' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-white' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/login" 
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors block text-center ${
                    plan.popular
                      ? 'bg-white text-[#704abf] hover:bg-gray-50'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  Começar Grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para revolucionar seu negócio?</h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se a milhares de empresas que já transformaram seus agendamentos com o AgendaPro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="bg-white text-[#704abf] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Começar Teste Grátis
            </Link>
            <a 
              href="#contato" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-[#704abf] transition-colors flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Falar com Especialista
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[#704abf] rounded-lg">
                  <CalendarCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">AgendaPro</h3>
              </div>
              <p className="text-gray-400">
                A solução completa para gestão de agendamentos online.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Começar</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AgendaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

