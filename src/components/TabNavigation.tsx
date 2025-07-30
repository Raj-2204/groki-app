import { Package, ChefHat } from 'lucide-react';
import { clsx } from 'clsx';

export type TabType = 'inventory' | 'recipes';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  itemCount: number;
}

export function TabNavigation({ activeTab, onTabChange, itemCount }: TabNavigationProps) {
  const tabs = [
    {
      id: 'inventory' as TabType,
      label: 'Inventory',
      icon: Package,
      description: `${itemCount} items`,
      color: 'from-primary-500 to-accent-500',
    },
    {
      id: 'recipes' as TabType,
      label: 'Recipes',
      icon: ChefHat,
      description: 'AI suggestions',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="flex bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-1 mb-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group',
              {
                [`bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`]: isActive,
                'text-gray-600 hover:text-gray-800 hover:bg-gray-50': !isActive,
              }
            )}
          >
            <div className={clsx('p-2 rounded-lg transition-all duration-300', {
              'bg-white/20': isActive,
              'bg-gray-100 group-hover:bg-gray-200': !isActive,
            })}>
              <Icon className={clsx('w-5 h-5 transition-all duration-300', {
                'text-white': isActive,
                'text-gray-600 group-hover:text-gray-800': !isActive,
              })} />
            </div>
            <div className="text-left">
              <div className={clsx('font-semibold text-sm transition-all duration-300', {
                'text-white': isActive,
                'text-gray-800 group-hover:text-gray-900': !isActive,
              })}>
                {tab.label}
              </div>
              <div className={clsx('text-xs transition-all duration-300', {
                'text-white/80': isActive,
                'text-gray-500 group-hover:text-gray-600': !isActive,
              })}>
                {tab.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}