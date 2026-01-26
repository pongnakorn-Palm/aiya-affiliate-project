import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`page-transition-enter ${className}`}>
      {children}
    </div>
  );
}
