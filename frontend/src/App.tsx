import { useState } from 'react';
import { GoogleAuthProvider, User, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import './index.css';

type ViewType = 'report' | 'list';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('report');

  const signIn = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Main content */}
        <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-20">
          <h1 className="text-2xl font-bold mb-12">แจ้งข้อมูลแมวจร</h1>
          
          {/* Centered illustration */}
          <div className="w-48 h-48 mb-12">
            <img 
              src="/images/login_image.png" 
              alt="แจ้งข้อมูลแมวจร" 
              className="w-full h-full object-contain"
            />
          </div>

          <p className="text-base text-gray-600 mb-4">
            ลงชื่อเข้าใช้เพื่อแจ้งข้อมูล
          </p>

          <button 
            onClick={signIn} 
            className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="flex justify-around items-center h-16">
            <button className="flex flex-col items-center text-blue-600 flex-1">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">หน้าหลัก</span>
            </button>

            <button className="flex flex-col items-center text-gray-400 flex-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs mt-1">แจ้งข้อมูล</span>
            </button>

            <button className="flex flex-col items-center text-gray-400 flex-1">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs mt-1">รายการของฉัน</span>
            </button>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">ส่งข้อมูลแมว / Stray Cat Reporting</h1>
      <div className="space-x-2">
        <button 
          onClick={() => setView('report')} 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Report Cat
        </button>
        <button 
          onClick={() => setView('list')} 
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          View Reports
        </button>
      </div>
      {view === 'report' ? <ReportForm user={user} /> : <ReportList user={user} />}
    </div>
  );
} 