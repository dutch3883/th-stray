import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from './firebase';
import { useAuth } from './hooks/useAuth';
import { getUserRole, isAdmin, isRescuer } from './services/roleService';
import { ModeProvider, useMode, AppMode } from './contexts/ModeContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { 
  getThemeColor, 
  getThemeBg, 
  getThemeGradient, 
  getThemeFilter, 
  getButtonGradient,
  getBgGradient,
  getThemeBgLight,
  getTheme
} from './utils/themeUtils';
import './index.css';
import CatPawWatermark from './components/CatPawWatermark';
import { NavigationBar, NavItem } from './components/NavigationBar';
import { LoginView } from './components/LoginView';
import { WelcomeCard } from './components/home-card/WelcomeCard';
import { ReportStatsCard } from './components/home-card/ReportStatsCard';
import { RescueStatsCard } from './components/home-card/RescueStatsCard';
import { MapCard } from './components/home-card/MapCard';
import { AllReportsCard } from './components/home-card/AllReportsCard';
import { MyReportsCard } from './components/home-card/MyReportsCard';
import { NewReportCard } from './components/home-card/NewReportCard';
import { TipsCard } from './components/home-card/TipsCard';
import ReportForm from './views/ReportForm';
import ReportList from './views/ReportList';
import { MapView } from './views/MapView';
import { AllReports } from './views/AllReports';

function AppContent() {
  const { user, loading: authLoading, signIn, logOut, cachedProfileUrl, imageError, setImageError } = useAuth();
  const { mode, setMode } = useMode();
  const { isRescueMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentCount, setRecentCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | undefined>();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  // Update navigation items based on mode
  useEffect(() => {
    const homeItem: NavItem = {
      id: 'home',
      text: 'หน้าหลัก',
      icon: '/images/home-logo.svg'
    };

    if (mode === 'rescue') {
      setNavItems([
        homeItem,
        {
          id: 'map',
          text: 'แผนที่',
          iconComponent: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          )
        },
        {
          id: 'all-reports',
          text: 'รายการทั้งหมด',
          iconComponent: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        }
      ]);
    } else {
      setNavItems([
        homeItem,
        {
          id: 'report',
          text: 'แจ้งข้อมูล',
          iconComponent: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )
        },
        {
          id: 'list',
          text: 'รายการของฉัน',
          iconComponent: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        }
      ]);
    }
  }, [mode]);

  // Update handleNavSelect function
  const handleNavSelect = (id: string) => {
    switch (id) {
      case 'home':
        navigate('/home');
        break;
      case 'report':
        navigate('/submit');
        break;
      case 'list':
        navigate('/my-reports');
        break;
      case 'map':
        navigate('/map');
        break;
      case 'all-reports':
        navigate('/reports');
        break;
    }
  };

  // Update getCurrentView function
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/home') return 'home';
    if (path === '/submit') return 'report';
    if (path === '/my-reports') return 'list';
    if (path === '/map') return 'map';
    if (path === '/reports') return 'all-reports';
    return 'home';
  };

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const role = await getUserRole();
        setUserRole(role);
        
        // If user is not admin or rescuer, force report mode
        if (role !== 'admin' && role !== 'rescuer') {
          console.log('set mode to report because of user role:', role);
          setMode('report');
        }
      }
    };
    fetchUserRole();
  }, [user]);

  // Fetch counts for the home page
  useEffect(() => {
    if (user && getCurrentView() === 'home') {
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
  }, [user]);

  const handleLogout = async (): Promise<void> => {
    await logOut();
    navigate('/');
  };

  const renderContent = () => {
    if (!user) {
      return <LoginView />;
    }

    switch (getCurrentView()) {
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
                      className={`w-16 h-16 rounded-full object-cover border-2 ${getThemeBgLight(isRescueMode)}`}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full ${getThemeBgLight(isRescueMode)} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${getThemeColor(true, isRescueMode)}`}>
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
                    <p className={`text-sm font-medium ${getThemeColor(true, isRescueMode)}`}>
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
                          ? `${getThemeBgLight(isRescueMode)} ${getThemeColor(true, isRescueMode)} shadow-sm`
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      โหมดแจ้งข้อมูล
                    </button>
                    <button
                      onClick={() => setMode('rescue')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mode === 'rescue'
                          ? `${getThemeBgLight(isRescueMode)} ${getThemeColor(true, isRescueMode)} shadow-sm`
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      โหมดช่วยเหลือ
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Welcome Card */}
            <WelcomeCard isRescueMode={isRescueMode} mode={mode} />

            {/* Stats Card */}
            {mode === 'rescue' ? (
              <RescueStatsCard 
                isRescueMode={isRescueMode}
                pendingCount={pendingCount}
                completedCount={completedCount}
              />
            ) : (
              <ReportStatsCard 
                isRescueMode={isRescueMode}
                loading={loading}
                recentCount={recentCount}
              />
            )}

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              {mode === 'rescue' ? (
                <>
                  <MapCard 
                    isRescueMode={isRescueMode}
                    onClick={() => navigate('/map')}
                  />
                  <AllReportsCard 
                    isRescueMode={isRescueMode}
                    onClick={() => navigate('/reports')}
                  />
                </>
              ) : (
                <>
                  <NewReportCard 
                    isRescueMode={isRescueMode}
                    onClick={() => navigate('/submit')}
                  />
                  <MyReportsCard 
                    isRescueMode={isRescueMode}
                    onClick={() => navigate('/my-reports')}
                  />
                </>
              )}
            </div>

            {/* Tips Card */}
            <TipsCard isRescueMode={isRescueMode} />
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
    <div className={`flex flex-col min-h-screen ${getThemeBg(isRescueMode)}/30 relative`}>
      {/* Watermark as background */}
      <CatPawWatermark opacity={0.05} color={isRescueMode ? '#10B981' : '#3B82F6'} density="medium" />
      
      {/* Main content */}
      <main className="flex-1 relative z-10 flex-col flex pb-bottom-bar">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={renderContent()} />
          <Route path="/submit" element={renderContent()} />
          <Route path="/my-reports" element={renderContent()} />
          <Route path="/map" element={renderContent()} />
          <Route path="/reports" element={renderContent()} />
        </Routes>
      </main>

      {/* Navigation Bar */}
      {user && (
        <NavigationBar
          items={navItems}
          selectedId={getCurrentView()}
          onSelect={handleNavSelect}
          isRescueMode={isRescueMode}
        />
      )}
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