import React from 'react';
import { Trash2, Package, AlertTriangle, Apple, Beef, Milk, Wheat, Salad, Edit3, Calendar, Hash } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';

const categoryIcons: Record<string, React.ComponentType<any>> = {
  'Fruits': Apple,
  'Vegetables': Salad,
  'Dairy': Milk,
  'Meat': Beef,
  'Grains': Wheat,
  'Pantry': Package,
  'Other': Package,
};

const categoryColors: Record<string, string> = {
  'Fruits': 'bg-green-100 text-green-800 border-green-200',
  'Vegetables': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Dairy': 'bg-blue-100 text-blue-800 border-blue-200',
  'Meat': 'bg-red-100 text-red-800 border-red-200',
  'Grains': 'bg-amber-100 text-amber-800 border-amber-200',
  'Pantry': 'bg-purple-100 text-purple-800 border-purple-200',
  'Other': 'bg-gray-100 text-gray-800 border-gray-200',
};

export function InventoryList() {
  const { items, removeItem, loading } = useInventoryStore();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await removeItem(id);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded-lg">
              <Package className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Grocery Inventory</h3>
              <p className="text-primary-100 text-xs">
                {items.length} {items.length === 1 ? 'item' : 'items'} in pantry
              </p>
            </div>
          </div>
          <div className="bg-white/20 px-2 py-0.5 rounded-full">
            <span className="text-xs font-medium">{items.length}</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading inventory...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 px-8">
            <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No items yet</h4>
            <p className="text-gray-600 mb-4">
              Start adding items to your inventory using voice commands
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <p className="text-primary-700 text-sm font-medium">
                💡 Try saying: "Hey Google, add 3 apples to my list"
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => {
                  const IconComponent = categoryIcons[item.category || 'Other'];
                  const categoryColor = categoryColors[item.category || 'Other'];
                  const isLowStock = item.isLowStock || item.quantity <= 1;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 transition-colors duration-200 group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Item Name & Icon */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${categoryColor.split(' ')[0]} ${categoryColor.split(' ')[0].replace('100', '200')}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 capitalize">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColor}`}>
                          {item.category || 'Other'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity}
                          </span>
                        </div>
                      </td>

                      {/* Date Added */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Low Stock
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            title="Edit item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Statistics */}
      {items.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  {items.filter(item => !item.isLowStock && item.quantity > 1).length} In Stock
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-gray-600">
                  {items.filter(item => item.isLowStock || item.quantity <= 1).length} Low Stock
                </span>
              </div>
            </div>
            <div className="text-gray-500">
              Total Items: {items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}