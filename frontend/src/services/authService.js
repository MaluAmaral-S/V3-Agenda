import { apiRequest, setAuthToken, clearAuth } from './api';
import { API_ROUTES, STORAGE_KEYS } from '../utils/constants';

class AuthService {
  /**
   * Fazer login
   */
  async login(credentials) {
    try {
      const response = await apiRequest.post(API_ROUTES.AUTH.LOGIN, credentials);
      
      // O token é enviado como cookie pelo backend, então não precisamos extraí-lo da resposta aqui.
      // A função setAuthToken já lida com a configuração do token no localStorage.
      if (response.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      }
      setAuthToken(response.token);

      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Fazer registro
   */
  async register(userData) {
    try {
      const response = await apiRequest.post(API_ROUTES.AUTH.REGISTER, userData);
      
      // O token é enviado como cookie pelo backend, então não precisamos extraí-lo da resposta aqui.
      // A função setAuthToken já lida com a configuração do token no localStorage.
      if (response.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      }
      setAuthToken(response.token);

      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Fazer logout
   */
  async logout() {
    try {
      await apiRequest.post(API_ROUTES.AUTH.LOGOUT);
    } catch (error) {
      // Mesmo se der erro na API, limpar dados locais
      console.warn('Erro ao fazer logout na API:', error.message);
    } finally {
      clearAuth();
    }
  }
  
  /**
   * Solicitar recuperação de senha
   */
  async forgotPassword(email) {
    try {
      const response = await apiRequest.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Verificar código de recuperação
   */
  async verifyCode(email, code) {
    try {
      const response = await apiRequest.post(API_ROUTES.AUTH.VERIFY_CODE, { email, code });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Redefinir senha
   */
  async resetPassword(email, code, newPassword) {
    try {
      const response = await apiRequest.post(API_ROUTES.AUTH.RESET_PASSWORD, {
        email,
        code,
        newPassword
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Obter dados do usuário atual
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }
  
  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const user = this.getCurrentUser();
    return !!(token && user);
  }
  
  /**
   * Atualizar dados do usuário no localStorage
   */
  updateUserData(userData) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  }
  
  /**
   * Obter token de autenticação
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  
  /**
   * Verificar se o token está expirado (básico)
   */
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      // Decodificar JWT básico (sem verificação de assinatura)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      // Se não conseguir decodificar, considerar expirado
      return true;
    }
  }
  
  /**
   * Renovar token se necessário
   */
  async refreshTokenIfNeeded() {
    if (this.isTokenExpired()) {
      // Se o token estiver expirado, fazer logout
      await this.logout();
      return false;
    }
    return true;
  }
}

// Exportar instância única do serviço
const authService = new AuthService();
export default authService;

