import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
}

export function PageTransition({ children, isLoading, skeleton }: PageTransitionProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setShowContent(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        {skeleton}
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}