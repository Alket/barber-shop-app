"use client"

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

export const AuthStatus: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <User className="w-4 h-4" />
        <span>{user.name}</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={logout}
        className="text-slate-600 hover:text-slate-900"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
};
