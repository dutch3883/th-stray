import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from './firebase';
import { useAuth } from './hooks/useAuth';
import { getUserRole, isAdmin, isRescuer } from './services/roleService';
import { ModeProvider, useMode, AppMode } from './contexts/ModeContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import './index.css';
import CatPawWatermark from './components/CatPawWatermark';
import { MapView } from './components/MapView';
import { AllReports } from './components/AllReports';

type ViewType = 'home' | 'report' | 'list' | 'map' | 'all-reports';

function AppContent() {
  const { user, loading: authLoading, signIn, logOut, cachedProfileUrl, imageError, setImageError } = useAuth();
  const { mode, setMode } = useMode();
  const { colors, isRescueMode } = useTheme();
  const [view, setView] = useState<ViewType>('home');
  const [recentCount, setRecentCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | undefined>();

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const role = await getUserRole();
        setUserRole(role);
      }
    };
    fetchUserRole();
  }, [user]);

  // Fetch counts for the home page
  useEffect(() => {
    if (user && view === 'home') {
      setLoading(true);
      const fetchCounts = async () => {
        try {
          const q = query(
            collection(firestore, 'reports'),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);
          const reports = snapshot.docs.map(doc => doc.data());
          
          setRecentCount(reports.length);
          setPendingCount(reports.filter(r => r.status === 'pending').length);
          setCompletedCount(reports.filter(r => r.status === 'completed').length);
        } catch (error) {
          console.error('Error fetching reports:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchCounts();
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
          <div className={`absolute inset-0 bg-gradient-to-br ${isRescueMode ? 'from-emerald-50 to-green-50' : 'from-blue-50 to-indigo-50'} opacity-60 z-[-1]`}></div>
          
          {/* Main content card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100 transform transition-all duration-300 hover:shadow-xl">
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
              className={`w-full bg-gradient-to-r ${isRescueMode ? 'from-emerald-500 to-green-600' : 'from-blue-500 to-blue-600'} text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1 flex items-center justify-center`}
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
                      className={`w-16 h-16 rounded-full object-cover border-2 ${isRescueMode ? 'border-emerald-100' : 'border-blue-100'}`}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`}>
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
                  {userRole && (
                    <p className={`text-sm font-medium ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {userRole === 'admin' ? 'ผู้ดูแลระบบ' :
                       userRole === 'rescuer' ? 'ผู้ช่วยเหลือ' :
                       'ผู้แจ้งข้อมูล'}
                    </p>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  ออกจากระบบ 
                  <span className="hidden sm:inline ml-1">/ Logout</span>
                </button>
              </div>

              {/* Mode Toggle for Admin/Rescuer */}
              {(userRole === 'admin' || userRole === 'rescuer') && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button
                      onClick={() => setMode('report')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mode === 'report'
                          ? `${isRescueMode ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} shadow-sm`
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      โหมดแจ้งข้อมูล
                    </button>
                    <button
                      onClick={() => setMode('rescue')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mode === 'rescue'
                          ? `${isRescueMode ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} shadow-sm`
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      โหมดช่วยเหลือ
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hero section */}
            <div className={`bg-gradient-to-r ${isRescueMode ? 'from-emerald-500 to-green-600' : 'from-blue-500 to-blue-600'} text-white p-6 rounded-xl shadow-md`}>
              <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับ / Welcome</h1>
              <p className={`${isRescueMode ? 'text-emerald-100' : 'text-blue-100'}`}>
                {mode === 'rescue' ? 'ขอบคุณที่ช่วยเหลือแมวจรในชุมชนของเรา ♥' : 'ขอบคุณที่แจ้งข้อมูลแมวจรในชุมชนของเรา ♥'}
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium text-gray-700 mb-3">สถิติล่าสุด / Recent Activity</h2>
              {mode === 'rescue' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ช่วยเหลือสำเร็จ / Completed</p>
                      <p className="text-xl font-semibold">{completedCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">รอช่วยเหลือ / Pending</p>
                      <p className="text-xl font-semibold">{pendingCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                    <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              )}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              {mode === 'rescue' ? (
                <>
                  <div 
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setView('map')}
                  >
                    <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">แผนที่รายงาน</h3>
                      <p className="text-sm text-gray-600">View reports on map</p>
                    </div>
                    <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  <div 
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setView('all-reports')}
                  >
                    <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">รายการทั้งหมด</h3>
                      <p className="text-sm text-gray-600">View all reports</p>
                    </div>
                    <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setView('report')}
                  >
                    <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <div className={`w-12 h-12 ${isRescueMode ? 'bg-emerald-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${isRescueMode ? 'text-emerald-600' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                </>
              )}
            </div>

            {/* Tips section */}
            <div className={`${isRescueMode ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'} p-5 rounded-xl border`}>
              <h3 className={`font-medium ${isRescueMode ? 'text-emerald-800' : 'text-blue-800'} flex items-center`}>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                เกร็ดความรู้ / Tips
              </h3>
              <p className={`text-sm ${isRescueMode ? 'text-emerald-700' : 'text-blue-700'} mt-2`}>
                การถ่ายภาพแมวจรควรถ่ายให้เห็นลักษณะเด่นของแมว เช่น สี ลาย หรือความผิดปกติ เพื่อประโยชน์ในการติดตาม
              </p>
              <p className={`text-sm ${isRescueMode ? 'text-emerald-700' : 'text-blue-700'} mt-1`}>
                When taking photos of stray cats, capture distinctive features like color, patterns or abnormalities to help with identification.
              </p>
            </div>
          </div>
        );
      case 'report':
        return <ReportForm user={user} />;
      case 'list':
        return <ReportList user={user} />;
      case 'map':
        return <MapView />;
      case 'all-reports':
        return <AllReports/>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${isRescueMode ? 'bg-emerald-50/30' : 'bg-blue-50/30'} relative`}>
      {/* Watermark as background */}
      <CatPawWatermark opacity={0.05} color={isRescueMode ? '#10B981' : '#3B82F6'} density="medium" />
      
      {/* Main content */}
      <main className="flex-1 relative z-10 flex-col flex pb-bottom-bar">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-md ${isRescueMode ? 'bg-emerald-50/80' : 'bg-blue-50/80'} border-t z-20`}>
        <div className="flex justify-around items-center h-16">
          <button 
            className={`flex flex-col items-center ${view === 'home' ? (isRescueMode ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'} flex-1`}
            onClick={() => setView('home')}
          >
            <img 
              src="/images/home-logo.svg" 
              alt="Home" 
              className={`w-6 h-6 ${view === 'home' ? (isRescueMode ? 'filter-emerald' : 'filter-blue') : 'filter-gray'}`}
            />
            <span className="text-xs mt-1">หน้าหลัก</span>
          </button>

          {mode === 'rescue' ? (
            <>
              <button 
                className={`flex flex-col items-center ${view === 'map' ? (isRescueMode ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'} flex-1`}
                onClick={() => setView('map')}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-xs mt-1">แผนที่</span>
              </button>

              <button 
                className={`flex flex-col items-center ${view === 'all-reports' ? (isRescueMode ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'} flex-1`}
                onClick={() => setView('all-reports')}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs mt-1">รายการทั้งหมด</span>
              </button>
            </>
          ) : (
            <>
              <button 
                className={`flex flex-col items-center ${view === 'report' ? (isRescueMode ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'} flex-1`}
                onClick={() => setView('report')}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs mt-1">แจ้งข้อมูล</span>
              </button>

              <button 
                className={`flex flex-col items-center ${view === 'list' ? (isRescueMode ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'} flex-1`}
                onClick={() => setView('list')}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs mt-1">รายการของฉัน</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ModeProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ModeProvider>
  );
} 