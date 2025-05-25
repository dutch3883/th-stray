import React from 'react';
import { getThemeColor, getThemeBg, getThemeFilter } from '../utils/themeUtils';

export interface NavItem {
  id: string;
  text: string;
  icon?: string;
  iconComponent?: React.ReactNode;
}

interface NavigationBarProps {
  items: NavItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  isRescueMode: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  items,
  selectedId,
  onSelect,
  isRescueMode,
}) => {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-md ${getThemeBg(isRescueMode)}/80 border-t z-20`}>
      <div className="flex justify-around items-center h-16">
        {items.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center ${getThemeColor(selectedId === item.id, isRescueMode)} flex-1`}
            onClick={() => onSelect(item.id)}
          >
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.text}
                className={`w-6 h-6 ${selectedId === item.id ? getThemeFilter(isRescueMode) : 'filter-gray'}`}
              />
            ) : item.iconComponent ? (
              <div className="w-6 h-6">
                {item.iconComponent}
              </div>
            ) : null}
            <span className="text-xs mt-1">{item.text}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}; 