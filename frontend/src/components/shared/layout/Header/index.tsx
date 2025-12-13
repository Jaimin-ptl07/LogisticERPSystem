import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAppSelector } from '@/store';
import Button from '@/components/shared/ui/Button';
import Input from '@/components/shared/ui/Input';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { user } = useAppSelector((state) => state.auth);
  const notifications = useAppSelector((state) => state.notification.notifications);
  const [searchQuery, setSearchQuery] = React.useState('');

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="lg:hidden mr-2"
            >
              <Menu size={24} />
            </Button>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search orders, customers, trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={20} />}
                  className="w-96"
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="relative">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Button>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} />}
          />
        </form>
      </div>
    </header>
  );
};

export default Header;