import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useState, useEffect } from "react";
import { 
  Rocket, 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Target, 
  DollarSign, 
  Brain, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  UserCog,
  FileText,
  FileCheck,
  Package,
  Calendar,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { isCollapsed, toggle, isMobile, setMobile } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect mobile and update state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setMobile(mobile);
      if (mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setMobile]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const menuItems = [
    {
      section: "PRINCIPAL",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/" },
        { icon: Users, label: "Clientes (CRM)", path: "/clients" },
        { icon: CheckSquare, label: "Tarefas", path: "/tasks" },
        { icon: Target, label: "Pipeline Comercial", path: "/pipeline" },
        { icon: DollarSign, label: "Financeiro", path: "/financial" },
        { icon: FileCheck, label: "Contratos", path: "/contracts" },
        { icon: Package, label: "Produtos & Serviços", path: "/products" },
        { icon: Calendar, label: "Calendário", path: "/calendar" },
      ]
    },
    {
      section: "AUTOMAÇÃO",
      items: [
        { icon: Brain, label: "Estratégias IA", path: "/ai-strategies" },
        { icon: FileText, label: "Relatórios", path: "/reports" },
      ]
    },
    {
      section: "GESTÃO",
      items: [
        { icon: UserCog, label: "Equipe", path: "/team" },
        { icon: BarChart3, label: "Integrações", path: "/integrations" },
      ]
    },
    {
      section: "CONFIGURAÇÃO",
      items: [
        { icon: Settings, label: "Configurações", path: "/settings" },
      ]
    }
  ];

  const isActivePath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Clear any client-side state and redirect to login
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: redirect anyway
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Rocket className="text-white text-sm" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">AgencyHub</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`${isMobile ? 'w-80' : (isCollapsed ? 'w-16' : 'w-64')} bg-white border-r border-gray-200 h-full z-50 flex flex-col fixed ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-all duration-300 ease-in-out`}>
        {/* Mobile Header in Sidebar */}
        <div className="lg:hidden p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <Rocket className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AgencyHub</h1>
                <p className="text-sm text-gray-600">Gestão Digital</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Desktop Logo */}
        <div className="hidden lg:block p-6 border-b border-gray-200">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div 
                className={`w-10 h-10 gradient-primary rounded-lg flex items-center justify-center ${isCollapsed ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                onClick={isCollapsed ? toggle : undefined}
              >
                <Rocket className="text-white text-lg" />
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">AgencyHub</h1>
                  <p className="text-sm text-gray-600">Gestão Digital</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 lg:py-6">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className={(isCollapsed && !isMobile) ? "mb-2" : "mb-6"}>
            {!(isCollapsed && !isMobile) && (
              <div className="px-4 lg:px-6 mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {section.section}
                </h3>
              </div>
            )}
            <ul className={`space-y-1 ${(isCollapsed && !isMobile) ? 'px-1' : 'px-2 lg:px-3'}`}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);

                return (
                  <li key={itemIndex}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${(isCollapsed && !isMobile) ? 'justify-center px-2' : 'space-x-3 px-3'} py-3 lg:py-2 rounded-lg text-left transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={(isCollapsed && !isMobile) ? item.label : undefined}
                    >
                      <Icon className={`h-5 w-5 lg:h-4 lg:w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {!(isCollapsed && !isMobile) && (
                        <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 w-full p-6 border-t border-sidebar-border bg-[#f9fafb]">
        <div className={`flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
            <User className="text-sidebar-accent-foreground text-sm" />
          </div>
          {!(isCollapsed && !isMobile) && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Admin User
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  admin@agencyhub.com
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}