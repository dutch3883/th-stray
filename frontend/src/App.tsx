import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from './firebase';
import { useAuth } from './hooks/useAuth';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import './index.css';
import CatPawWatermark from './components/CatPawWatermark';

type ViewType = 'home' | 'report' | 'list';

export default function App() {
  const { user, loading: authLoading, signIn, logOut, cachedProfileUrl, imageError, setImageError } = useAuth();
  const [view, setView] = useState<ViewType>('home');
  const [recentCount, setRecentCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch count of recent reports for the home page
  useEffect(() => {
    if (user && view === 'home') {
      setLoading(true);
      const fetchRecentCount = async () => {
        try {
          const q = query(
            collection(firestore, 'reports'),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          const snapshot = await getDocs(q);
          setRecentCount(snapshot.size);
        } catch (error) {
          console.error('Error fetching recent reports:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchRecentCount();
    }
  }, [user, view]);

  const handleLogout = async (): Promise<void> => {
    await logOut();
    setView('home');
  };

  const renderContent = () => {
    if (!user) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 -mt-16 relative">
          
          {/* Soft background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-60 z-[-1]"></div>
          
          {/* Main content card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-blue-100 transform transition-all duration-300 hover:shadow-xl">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
              แจ้งข้อมูลแมวจร
            </h1>
            
            {/* Animated illustration */}
            <div className="w-48 h-48 mx-auto mb-8 transform transition-all duration-500 hover:scale-105">
              <img 
                src="/images/login_image.png" 
                alt="แจ้งข้อมูลแมวจร" 
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-base text-gray-600 mb-6 text-center">
              ลงชื่อเข้าใช้เพื่อแจ้งข้อมูล
            </p>

            {/* Enhanced button */}
            <button 
              onClick={signIn} 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#fff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </div>
          
          {/* Subtle footer note */}
          <p className="text-xs text-gray-500 mt-8 text-center">
            ร่วมกันช่วยเหลือแมวจรในชุมชนของเรา ♥
          </p>
        </div>
      );
    }

    switch (view) {
      case 'home':
        return (
          <div className="p-4 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="mr-4">
                  {cachedProfileUrl && !imageError ? (
                    <img 
                      src={cachedProfileUrl}
                      alt={user.displayName || 'User'} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg text-gray-800">
                    {user.displayName || 'User'}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  ออกจากระบบ 
                  <span className="hidden sm:inline ml-1">/ Logout</span>
                </button>
              </div>
            </div>
            
            {/* Hero section */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-md">
              <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับ / Welcome</h1>
              <p className="text-blue-100">
                ขอบคุณที่ช่วยเหลือแมวจรในชุมชนของเรา ♥
              </p>
              <p className="text-blue-100">
                Thank you for helping stray cats in our community
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium text-gray-700 mb-3">สถิติล่าสุด / Recent Activity</h2>
              <div className="flex items-center mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">จำนวนรายงานล่าสุด / Recent Reports</p>
                  <p className="text-xl font-semibold">
                    {loading ? 
                      <span className="text-gray-400">กำลังโหลด / Loading...</span> : 
                      recentCount
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div 
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setView('report')}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">แจ้งข้อมูลแมวจร</h3>
                  <p className="text-sm text-gray-600">Report stray cat information</p>
                </div>
                <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div 
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setView('list')}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">รายการของฉัน</h3>
                  <p className="text-sm text-gray-600">View your reported cats</p>
                </div>
                <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Tips section */}
            <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
              <h3 className="font-medium text-yellow-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                เกร็ดความรู้ / Tips
              </h3>
              <p className="text-sm text-yellow-700 mt-2">
                การถ่ายภาพแมวจรควรถ่ายให้เห็นลักษณะเด่นของแมว เช่น สี ลาย หรือความผิดปกติ เพื่อประโยชน์ในการติดตาม
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                When taking photos of stray cats, capture distinctive features like color, patterns or abnormalities to help with identification.
              </p>
            </div>
          </div>
        );
      case 'report':
        return <ReportForm user={user} />;
      case 'list':
        return <ReportList user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      {/* Watermark as background */}
      <CatPawWatermark opacity={0.05} color="#3B82F6" density="medium" />
      
      {/* Main content */}
      <main className="flex-1 relative z-10 flex-col flex pb-bottom-bar">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
        <div className="flex justify-around items-center h-16">
          <button 
            className={`flex flex-col items-center ${view === 'home' ? 'text-blue-600' : 'text-gray-400'} flex-1`}
            onClick={() => setView('home')}
          >
            <img 
              src="/images/home-logo.svg" 
              alt="Home" 
              className={`w-6 h-6 ${view === 'home' ? 'filter-blue' : 'filter-gray'}`}
            />
            <span className="text-xs mt-1">หน้าหลัก</span>
          </button>

          <button 
            className={`flex flex-col items-center ${view === 'report' ? 'text-blue-600' : 'text-gray-400'} flex-1`}
            onClick={() => user ? setView('report') : signIn()}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">แจ้งข้อมูล</span>
          </button>

          <button 
            className={`flex flex-col items-center ${view === 'list' ? 'text-blue-600' : 'text-gray-400'} flex-1`}
            onClick={() => user ? setView('list') : signIn()}
          >
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