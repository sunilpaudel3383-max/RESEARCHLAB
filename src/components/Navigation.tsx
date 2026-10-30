import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Users,
  Home,
  FolderKanban,
  Edit3,
  LogIn,
  LogOut,
  ChevronDown,
  Shield,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Collaborator, DocumentRole } from '../lib/types';

export type PageId = 'landing' | 'dashboard' | 'editor' | 'references' | 'team' | 'login';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  currentUser: Collaborator | null;
  platformType: 'admin' | 'member' | 'guest';
  onSignOut: () => void;
  activeDocTitle?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  platformType,
  onSignOut,
  activeDocTitle,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-stone-200 select-none shrink-0 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-6">
        {/* Zone 1: Brand Wordmark + Platform Tag */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-2 text-left group cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-serif font-bold text-base flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
              CE
            </span>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight whitespace-nowrap leading-tight">
                CivilLab
              </span>
              <span className="text-[10px] text-stone-400 font-sans tracking-wide">
                Civil Engineering Research
              </span>
            </div>
          </button>

          {/* Active Platform Identifier Pill */}
          {platformType === 'admin' && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-200 font-mono">
              <Shield className="w-3 h-3 text-purple-700" />
              <span>Admin / PI Platform</span>
            </span>
          )}
          {platformType === 'member' && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono">
              <Users className="w-3 h-3 text-emerald-700" />
              <span>Member Platform</span>
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 text-xs font-medium text-stone-600">
          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentPage === 'landing' ? 'text-indigo-900 font-semibold bg-stone-100' : 'hover:text-stone-900'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentPage === 'dashboard' ? 'text-indigo-900 font-semibold bg-stone-100' : 'hover:text-stone-900'
            }`}
          >
            {platformType === 'admin' ? 'Lab Manuscripts' : 'My Manuscripts'}
          </button>

          <button
            onClick={() => onNavigate('editor')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              currentPage === 'editor' ? 'text-indigo-900 font-semibold bg-indigo-50 text-indigo-700' : 'hover:text-stone-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Paper Editor</span>
            {activeDocTitle && (
              <span className="text-[10px] text-stone-400 font-mono truncate max-w-[110px]">
                ({activeDocTitle.split(' ')[0]}...)
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('references')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentPage === 'references' ? 'text-indigo-900 font-semibold bg-stone-100' : 'hover:text-stone-900'
            }`}
          >
            References
          </button>

          <button
            onClick={() => onNavigate('team')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentPage === 'team' ? 'text-indigo-900 font-semibold bg-stone-100' : 'hover:text-stone-900'
            }`}
          >
            {platformType === 'admin' ? 'Lab Team & Access' : 'Lab Members'}
          </button>
        </nav>

        {/* Zone 3: User Status / Auth Action */}
        <div className="flex items-center space-x-3 shrink-0">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-1 pl-2 pr-2.5 rounded-lg border border-stone-200 hover:border-stone-300 bg-stone-50 transition-colors text-xs text-stone-800"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border"
                  style={{ borderColor: currentUser.color }}
                />
                <span className="font-semibold truncate max-w-[100px]">{currentUser.name.split(' ')[0]}</span>
                <span className={`text-[10px] uppercase font-mono px-1 py-0.2 rounded font-semibold ${
                  platformType === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {platformType === 'admin' ? 'Admin' : 'Member'}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-1 w-60 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="font-semibold text-stone-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                      Role: {currentUser.role.toUpperCase()}
                    </span>
                    {platformType === 'member' && (
                      <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center space-x-1.5 text-[10px] text-stone-500">
                        <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>Password locked after initial setup</span>
                      </div>
                    )}
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 rounded-md"
                    >
                      {platformType === 'admin' ? 'Admin Dashboard' : 'Member Dashboard'}
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigate('editor');
                      }}
                      className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 rounded-md"
                    >
                      Active Manuscript
                    </button>
                  </div>

                  <div className="border-t border-stone-100 mt-1 pt-1 p-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onSignOut();
                      }}
                      className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 rounded-md flex items-center space-x-1.5 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
