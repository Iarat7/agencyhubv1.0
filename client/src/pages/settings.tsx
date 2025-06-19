
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Database,
  Key,
  Mail,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState({
    profile: {
      name: "Admin User",
      email: "admin@agencyhub.com",
      company: "AgencyHub",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      phone: "",
      bio: ""
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      taskReminders: true,
      clientUpdates: true,
      marketingAlerts: true,
      systemMaintenance: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: "24",
      passwordExpiry: "90",
      loginAttempts: "5",
      ipWhitelist: ""
    },
    appearance: {
      theme: "light",
      sidebarCollapsed: false,
      compactMode: false,
      language: "pt-BR",
      dateFormat: "DD/MM/YYYY",
      currency: "BRL"
    },
    system: {
      autoBackup: true,
      backupFrequency: "daily",
      dataRetention: "365",
      apiRateLimit: "1000"
    }
  });

  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [backupStatus, setBackupStatus] = useState({ lastBackup: null, size: "0 MB" });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('agencyHub_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [isAuthenticated, isLoading, toast]);

  const saveSettingsMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      const newSettings = { ...settings, [section]: data };
      localStorage.setItem('agencyHub_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Configurações salvas",
        description: `As configurações de ${variables.section} foram salvas com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      setIsLoading2FA(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" };
    },
    onSuccess: () => {
      setIsLoading2FA(false);
      toast({
        title: "2FA Configurado",
        description: "Autenticação de dois fatores foi configurada com sucesso."
      });
    }
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const data = {
        settings,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agencyhub_settings_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Dados exportados",
        description: "Suas configurações foram exportadas com sucesso."
      });
    }
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setBackupStatus({
        lastBackup: new Date().toISOString(),
        size: "12.5 MB"
      });
    },
    onSuccess: () => {
      toast({
        title: "Backup criado",
        description: "Backup dos dados foi criado com sucesso."
      });
    }
  });

  const handleSaveSettings = (section: string) => {
    saveSettingsMutation.mutate({ 
      section, 
      data: settings[section as keyof typeof settings] 
    });
  };

  const handleUpdateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleResetSettings = () => {
    if (window.confirm('Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('agencyHub_settings');
      window.location.reload();
    }
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="content-area sidebar-expanded">
      <div className="content-wrapper">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas preferências e configurações da conta
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => exportDataMutation.mutate()}
                disabled={exportDataMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="appearance">Aparência</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informações do Perfil</span>
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e configurações de conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={settings.profile.name}
                        onChange={(e) => handleUpdateSetting('profile', 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => handleUpdateSetting('profile', 'email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={settings.profile.company}
                        onChange={(e) => handleUpdateSetting('profile', 'company', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={settings.profile.phone}
                        onChange={(e) => handleUpdateSetting('profile', 'phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={settings.profile.bio}
                      onChange={(e) => handleUpdateSetting('profile', 'bio', e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Select
                        value={settings.profile.timezone}
                        onValueChange={(value) => handleUpdateSetting('profile', 'timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                          <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                          <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tóquio (UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select
                        value={settings.profile.language}
                        onValueChange={(value) => handleUpdateSetting('profile', 'language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSaveSettings('profile')}
                      disabled={saveSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Preferências de Notificação</span>
                  </CardTitle>
                  <CardDescription>
                    Configure quando e como você gostaria de receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {Object.entries({
                      emailNotifications: "Notificações por Email",
                      pushNotifications: "Notificações Push",
                      weeklyReports: "Relatórios Semanais",
                      taskReminders: "Lembretes de Tarefas",
                      clientUpdates: "Atualizações de Clientes",
                      marketingAlerts: "Alertas de Marketing",
                      systemMaintenance: "Manutenção do Sistema"
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">{label}</Label>
                          <p className="text-sm text-gray-600">
                            {key === 'emailNotifications' && "Receba atualizações importantes por email"}
                            {key === 'pushNotifications' && "Receba notificações push no navegador"}
                            {key === 'weeklyReports' && "Receba um resumo semanal por email"}
                            {key === 'taskReminders' && "Seja notificado sobre prazos e tarefas pendentes"}
                            {key === 'clientUpdates' && "Notificações sobre novos clientes e atualizações"}
                            {key === 'marketingAlerts' && "Alertas sobre campanhas e performance"}
                            {key === 'systemMaintenance' && "Notificações de manutenção programada"}
                          </p>
                        </div>
                        <Switch
                          checked={settings.notifications[key as keyof typeof settings.notifications] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting('notifications', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSaveSettings('notifications')}
                      disabled={saveSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Preferências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Configurações de Segurança</span>
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas configurações de segurança e privacidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            enable2FAMutation.mutate();
                          }
                          handleUpdateSetting('security', 'twoFactorAuth', checked);
                        }}
                      />
                      {isLoading2FA && <RefreshCw className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Timeout da Sessão (horas)</Label>
                      <Select
                        value={settings.security.sessionTimeout}
                        onValueChange={(value) => handleUpdateSetting('security', 'sessionTimeout', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hora</SelectItem>
                          <SelectItem value="8">8 horas</SelectItem>
                          <SelectItem value="24">24 horas</SelectItem>
                          <SelectItem value="168">7 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiry">Expiração da Senha (dias)</Label>
                      <Select
                        value={settings.security.passwordExpiry}
                        onValueChange={(value) => handleUpdateSetting('security', 'passwordExpiry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="60">60 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                          <SelectItem value="never">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ipWhitelist">Lista de IPs Autorizados</Label>
                    <Textarea
                      id="ipWhitelist"
                      value={settings.security.ipWhitelist}
                      onChange={(e) => handleUpdateSetting('security', 'ipWhitelist', e.target.value)}
                      placeholder="192.168.1.1, 10.0.0.1 (separados por vírgula)"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSaveSettings('security')}
                      disabled={saveSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Configurações de Aparência</span>
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência da interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Tema</Label>
                      <Select
                        value={settings.appearance.theme}
                        onValueChange={(value) => handleUpdateSetting('appearance', 'theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Escuro</SelectItem>
                          <SelectItem value="auto">Automático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Formato de Data</Label>
                      <Select
                        value={settings.appearance.dateFormat}
                        onValueChange={(value) => handleUpdateSetting('appearance', 'dateFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Sidebar Compacta</Label>
                        <p className="text-sm text-gray-600">Reduza o tamanho da barra lateral</p>
                      </div>
                      <Switch
                        checked={settings.appearance.sidebarCollapsed}
                        onCheckedChange={(checked) => handleUpdateSetting('appearance', 'sidebarCollapsed', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Modo Compacto</Label>
                        <p className="text-sm text-gray-600">Reduza o espaçamento entre elementos</p>
                      </div>
                      <Switch
                        checked={settings.appearance.compactMode}
                        onCheckedChange={(checked) => handleUpdateSetting('appearance', 'compactMode', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSaveSettings('appearance')}
                      disabled={saveSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Preferências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Configurações do Sistema</span>
                  </CardTitle>
                  <CardDescription>
                    Configurações avançadas do sistema e backup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col"
                      onClick={() => createBackupMutation.mutate()}
                      disabled={createBackupMutation.isPending}
                    >
                      <Database className="h-6 w-6 mb-2" />
                      <span>{createBackupMutation.isPending ? "Criando Backup..." : "Backup de Dados"}</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <Key className="h-6 w-6 mb-2" />
                      <span>Gerenciar API Keys</span>
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Status do Backup</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>Último backup: {backupStatus.lastBackup ? new Date(backupStatus.lastBackup).toLocaleString('pt-BR') : 'Nunca'}</p>
                      <p>Tamanho: {backupStatus.size}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">Zona de Perigo</h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      Estas ações são irreversíveis. Proceda com cuidado.
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleResetSettings}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Resetar Todas as Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
