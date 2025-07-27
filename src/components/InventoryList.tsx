import React from 'react';
import { Trash2, Package, AlertTriangle, Apple, Beef, Milk, Wheat, Salad } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';

const categoryIcons: Record<string, React.ComponentType<any>> = {
  'Fruits': Apple,
  'Vegetables': Salad,
  'Dairy': Milk,
  'Meat': Beef,
  'Grains': Wheat,
  'Other': Package,
};

const categoryColors: Record<string, string> = {
  'Fruits': 'from-red-400 to-orange-400',
  'Vegetables': 'from-green-400 to-emerald-400',
  'Dairy': 'from-blue-400 to-cyan-400',
  'Meat': 'from-red-500 to-red-600',
  'Grains': 'from-yellow-400 to-amber-400',
  'Other': 'from-gray-400 to-gray-500',
};

export function InventoryList() {
  const { items, removeItem, getItemCount } = useInventoryStore();

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const categories = Object.keys(groupedItems).sort();

  if (items.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 text-center hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl mb-6 inline-block">
          <Package className="w-16 h-16 text-gray-400 mx-auto animate-float" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-3">Your inventory is empty</h3>
        <p className="text-gray-500 leading-relaxed">
          Start building your grocery list by using voice commands!<br />
          <span className="text-sm text-primary-600 font-medium">Try saying "Add 3 apples"</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white px-8 py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">My Inventory</h2>
            <p className="text-primary-100 text-sm">{getItemCount()} items in your pantry</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <Package className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Enhanced Item List */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {categories.map((category, categoryIndex) => {
          const IconComponent = categoryIcons[category] || Package;
          const colorClass = categoryColors[category] || categoryColors['Other'];
          
          return (
            <div 
              key={category} 
              className="border-b border-gray-100 last:border-b-0 animate-fade-in"
              style={{ animationDelay: `${categoryIndex * 0.1}s` }}
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4">
                <div className="flex items-center space-x-3">
                  <div className={`bg-gradient-to-r ${colorClass} p-2 rounded-xl shadow-md`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">{category}</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {groupedItems[category].length}
                  </span>
                </div>
              </div>
              
              {/* Items */}
              <div className="divide-y divide-gray-50">
                {groupedItems[category].map((item, itemIndex) => (
                  <div 
                    key={item.id} 
                    className="group px-8 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${(categoryIndex * 0.1) + (itemIndex * 0.05)}s` }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Low Stock Warning */}
                      {item.isLowStock && (
                        <div className="bg-yellow-100 p-1.5 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                        </div>
                      )}
                      
                      {/* Item Info */}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 capitalize group-hover:text-primary-700 transition-colors">
                          {item.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {item.quantity} {item.unit}
                          </span>
                          {item.isLowStock && (
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full font-medium">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 p-2 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}