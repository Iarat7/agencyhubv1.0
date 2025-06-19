import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  const { isCollapsed, isMobile } = useSidebar();

  const getLayoutClass = () => {
    if (isMobile) {
      return "sidebar-collapsed"; // Use collapsed layout on mobile
    }
    
    return isCollapsed ? "sidebar-collapsed" : "sidebar-expanded";
  };

  return (
    <main className={cn(
      "content-area",
      getLayoutClass(),
      // Add proper mobile spacing
      isMobile ? "pt-16" : "",
      className
    )}>
      <div className="content-wrapper">
        {children}
      </div>
    </main>
  );
}