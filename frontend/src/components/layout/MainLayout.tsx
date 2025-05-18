import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { Link, useLocation } from 'react-router-dom';

const reporterTabs = [
  { path: '/', label: 'Home' },
  { path: '/submit', label: 'Submit Report' },
  { path: '/my-reports', label: 'My Reports' },
];

const rescuerTabs = [
  { path: '/', label: 'Home' },
  { path: '/map', label: 'Map View' },
  { path: '/reports', label: 'Reports List' },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  
  const tabs = user?.role === UserRole.ADMIN ? rescuerTabs : reporterTabs;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {tabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                    location.pathname === tab.path
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                {user?.role === UserRole.ADMIN ? 'Rescuer' : 'Reporter'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 