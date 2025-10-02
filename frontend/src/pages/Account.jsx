import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Account = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        businessName: user.businessName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await apiRequest.patch("/auth/profile", profileData);
      updateUser(response.user);
      toast.success("Informações do perfil atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      toast.error("Erro ao atualizar o perfil. Tente novamente.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (passwordData.password.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      setPasswordLoading(false);
      return;
    }

    try {
      await apiRequest.patch("/auth/profile", { password: passwordData.password });
      toast.success("Senha atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar a senha:", error);
      toast.error("Erro ao atualizar a senha. Tente novamente.");
    } finally {
      setPasswordLoading(false);
      setPasswordData({ password: "", confirmPassword: "" });
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Informações do Perfil
          </CardTitle>
          <CardDescription>
            Atualize os dados da sua empresa e contato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Responsável</Label>
                <Input
                  id="name"
                  type="text"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Nome da Empresa</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={profileData.businessName}
                  onChange={handleProfileChange}
                  placeholder="Nome do seu negócio"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={profileLoading} className="bg-purple-600 hover:bg-purple-700">
                {profileLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Alterar Senha
          </CardTitle>
           <CardDescription>
            Escolha uma senha forte para manter sua conta segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={passwordLoading} className="bg-purple-600 hover:bg-purple-700">
                {passwordLoading ? "Salvando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
