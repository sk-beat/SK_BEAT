import React from 'react';
import { ChevronRight, CheckCircle2, Calendar } from 'lucide-react';
import type { SurveyData, EventData } from './types';

export const SurveyItem: React.FC<Omit<SurveyData, 'id'>> = ({ title, meta, status }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors last:border-0">
    <div>
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      <p className={`text-xs mt-1 flex items-center gap-1 ${
        status === 'completed' ? 'text-emerald-600' : 
        status === 'urgent' ? 'text-orange-500' : 'text-slate-500'
      }`}>
        {status === 'completed' && 'Completed '}
        {status === 'completed' && <CheckCircle2 size={12} />}
        {status !== 'completed' && meta}
      </p>
    </div>
    <ChevronRight size={16} className="text-slate-400" />
  </div>
);

export const InteractiveEventCard: React.FC<Omit<EventData, 'id'>> = ({ title, date, status, image }) => (
  <div className="group relative flex gap-4 bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer overflow-hidden">
    <img 
      src={image} 
      alt={title} 
      className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
    />
    <div className="flex flex-col justify-center flex-1">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
        <Calendar size={12} className="mb-[1px]" /> {date}
      </p>
      <div className="mt-3">
        {status === 'registered' ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 size={12} /> Registered
          </span>
        ) : (
          <button className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full transition-colors active:scale-95 shadow-sm">
            Register Now
          </button>
        )}
      </div>
    </div>
  </div>
);