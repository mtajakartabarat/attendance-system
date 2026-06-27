'use client';

import { useState } from 'react';
import { AttendanceProvider } from '@/context/AttendanceContext';
import RecordAttendance from '@/components/RecordAttendance';
import Dashboard from '@/components/Dashboard';
import { ClipboardList, LayoutDashboard } from 'lucide-react';

type Tab = 'record' | 'dashboard';

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<Tab>('record');

  return (
    <AttendanceProvider>
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
        <header className="sticky top-0 z-50 border-b" style={{ borderColor: '#2a2a3a', backgroundColor: '#0a0a0f' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Attendance</h1>
              </div>
              
              <nav className="flex gap-1">
                <button
                  onClick={() => setActiveTab('record')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === 'record'
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={activeTab === 'record' ? { backgroundColor: '#6366f1', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' } : {}}
                >
                  <ClipboardList className="w-4 h-4 inline mr-2" />
                  Record
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={activeTab === 'dashboard' ? { backgroundColor: '#6366f1', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' } : {}}
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  Dashboard
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'record' ? <RecordAttendance /> : <Dashboard />}
        </main>

        <footer className="border-t py-6 text-center" style={{ borderColor: '#2a2a3a' }}>
          <p className="text-sm text-slate-500">Attendance System &copy; 2025</p>
        </footer>
      </div>
    </AttendanceProvider>
  );
}