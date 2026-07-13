import React from 'react';
import { ClipboardList, Calendar, MessageSquare, PenSquare, Eye, Home, User } from 'lucide-react';
import { statsData, surveysData, eventsData } from '../../components/Youth/data';
import { Header, StatCard, SectionWrapper } from '../../components/Youth/Shared';
import { SurveyItem, InteractiveEventCard } from '../../components/Youth/Features';

const YouthHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <Header title="SK BEAT" subtitle="Welcome back, Maria" userInitial="M" />

      <main className="px-4 mt-6 max-w-md mx-auto space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statsData.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Surveys Section */}
        <SectionWrapper 
          icon={<ClipboardList size={20} />} 
          title="Surveys" 
          subtitle="Answer youth surveys"
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        >
          <div className="space-y-0">
            {surveysData.map((survey) => (
              <SurveyItem 
                key={survey.id} 
                title={survey.title} 
                meta={survey.meta} 
                status={survey.status} 
              />
            ))}
          </div>
          <button className="w-full mt-4 py-3 border border-slate-200 rounded-lg text-sm text-blue-600 font-medium hover:bg-slate-50 transition-colors">
            View all surveys &rarr;
          </button>
        </SectionWrapper>

        {/* Events Section */}
        <SectionWrapper 
          icon={<Calendar size={20} />} 
          title="Events" 
          subtitle="Register and attend"
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        >
          <div className="space-y-4">
            {eventsData.map((event) => (
              <InteractiveEventCard 
                key={event.id} 
                title={event.title} 
                date={event.date} 
                status={event.status} 
                image={event.image} 
              />
            ))}
          </div>
          <button className="w-full mt-5 py-3 border border-slate-200 rounded-lg text-sm text-blue-600 font-medium hover:bg-slate-50 transition-colors">
            View all events &rarr;
          </button>
        </SectionWrapper>

        {/* Feedback Section */}
        <SectionWrapper 
          icon={<MessageSquare size={20} />} 
          title="Feedback" 
          subtitle="Share your thoughts"
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        >
          <div className="flex gap-3 mt-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 active:scale-[0.98]">
              <PenSquare size={16} /> Create
            </button>
            <button className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 active:scale-[0.98]">
              <Eye size={16} /> View
            </button>
          </div>
        </SectionWrapper>

      </main>


    </div>
  );
};

export default YouthHome;