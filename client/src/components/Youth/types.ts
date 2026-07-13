import type { ReactNode } from 'react';

// Data Models
export interface StatData {
  label: string;
  count: number;
  subtext: string;
}

export interface SurveyData {
  id: number;
  title: string;
  meta: string;
  status: 'pending' | 'completed' | 'urgent';
}

export interface EventData {
  id: number;
  title: string;
  date: string;
  status: 'registered' | 'available';
  image: string;
}


export interface SectionWrapperProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  iconColor: string;
  bgColor: string;
  children: ReactNode;
}

export interface HeaderProps {
  title: string;
  subtitle: string;
  userInitial: string;
}