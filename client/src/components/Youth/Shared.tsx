import React from 'react';
import type { SectionWrapperProps, HeaderProps, StatData } from './types';

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ 
  icon, 
  title, 
  subtitle, 
  iconColor, 
  bgColor, 
  children 
}) => (
  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      {/* Note: Ensure the bgColor and iconColor props being passed are light-theme friendly (e.g., bg-blue-50 text-blue-600) */}
      <div className={`p-2 rounded-lg ${bgColor} ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h2 className="font-medium text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

export const Header: React.FC<HeaderProps> = ({ title, subtitle, userInitial }) => (
  <header className="bg-white border-b border-slate-200 pt-12 pb-6 px-6 shadow-sm">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-wide">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-700 font-medium shadow-sm">
        {userInitial}
      </div>
    </div>
  </header>
);

export const StatCard: React.FC<StatData> = ({ label, count, subtext }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
    <span className="text-sm text-slate-500 mb-1">{label}</span>
    <span className="text-3xl font-bold text-slate-900 mb-1">{count}</span>
    <span className="text-xs text-slate-400">{subtext}</span>
  </div>
);