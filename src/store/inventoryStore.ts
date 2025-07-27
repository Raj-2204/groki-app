import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { InventoryItem, ChatMessage } from '../types';

interface InventoryStore {
  // State
  items: InventoryItem[];
  messages: ChatMessage[];
  loading: boolean;
  user_id: string | null;
  
  // Actions
  initializeStore: (userId: string) => Promise<void>;
  loadInventory: () => Promise<void>;
  loadMessages: () => Promise<void>;
  addItem: (name: string, quantity: number, unit: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  findItemByName: (name: string) => InventoryItem | undefined;
  
  // Chat actions
  addMessage: (content: string, isUser: boolean, isVoice?: boolean) => Promise<void>;
  clearMessages: () => void;
  
  // Utility
  getItemCount: () => number;
  getLowStockItems: () => InventoryItem[];
  
  // Cleanup
  clearStore: () => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  messages: [],
  loading: false,
  user_id: null,

  initializeStore: async (userId: string) => {
    set({ user_id: userId, loading: true });
    
    try {
      await Promise.all([
        get().loadInventory(),
        get().loadMessages()
      ]);
      
      // Add welcome message if no messages exist
      const { messages } = get();
      if (messages.length === 0) {
        await get().addMessage(
          "Hello! I'm your voice-powered grocery assistant. You can say commands like 'add 3 apples' or 'show me recipes'.",
          false
        );
      }
    } catch (error) {
      console.error('Error initializing store:', error);
    } finally {
      set({ loading: false });
    }
  },

  loadInventory: async () => {
    const { user_id } = get();
    if (!user_id) return;

    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: InventoryItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        category: item.category || undefined,
        expiryDate: item.expiry_date ? new Date(item.expiry_date) : undefined,
        isLowStock: item.is_low_stock,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      set({ items });
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  },

  loadMessages: async () => {
    const { user_id } = get();
    if (!user_id) return;

    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('user_id', user_id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const messages: ChatMessage[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.timestamp),
        isVoice: msg.is_voice || false,
      }));

      set({ messages });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  },

  addItem: async (name: string, quantity: number, unit: string) => {
    const { user_id } = get();
    if (!user_id) return;

    try {
      const existingItem = get().findItemByName(name);
      
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity;
        
        const { error } = await supabase
          .from('user_inventory')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .eq('user_id', user_id);

        if (error) throw error;

        // Update local state
        set((state) => ({
          items: state.items.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: newQuantity, updatedAt: new Date() }
              : item
          ),
        }));
      } else {
        // Add new item
        const newItem = {
          user_id,
          name: name.toLowerCase(),
          quantity,
          unit,
          category: categorizeItem(name),
          is_low_stock: false,
        };

        const { data, error } = await supabase
          .from('user_inventory')
          .insert([newItem])
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        const inventoryItem: InventoryItem = {
          id: data.id,
          name: data.name,
          quantity: Number(data.quantity),
          unit: data.unit,
          category: data.category || undefined,
          expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
          isLowStock: data.is_low_stock,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        set((state) => ({
          items: [inventoryItem, ...state.items],
        }));
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  },

  removeItem: async (id: string) => {
    const { user_id } = get();
    if (!user_id) return;

    try {
      const { error } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    const { user_id } = get();
    if (!user_id) return;

    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate?.toISOString().split('T')[0];
      if (updates.isLowStock !== undefined) dbUpdates.is_low_stock = updates.isLowStock;

      const { error } = await supabase
        .from('user_inventory')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date() }
            : item
        ),
      }));
    } catch (error) {
      console.error('Error updating item:', error);
    }
  },

  findItemByName: (name: string) => {
    return get().items.find((item) =>
      item.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(item.name.toLowerCase())
    );
  },

  addMessage: async (content: string, isUser: boolean, isVoice?: boolean) => {
    const { user_id } = get();
    if (!user_id) return;

    try {
      const newMessage = {
        user_id,
        content,
        is_user: isUser,
        is_voice: isVoice || false,
      };

      const { data, error } = await supabase
        .from('user_messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const chatMessage: ChatMessage = {
        id: data.id,
        content: data.content,
        isUser: data.is_user,
        timestamp: new Date(data.timestamp),
        isVoice: data.is_voice,
      };

      set((state) => ({
        messages: [...state.messages, chatMessage],
      }));
    } catch (error) {
      console.error('Error adding message:', error);
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  getItemCount: () => {
    return get().items.length;
  },

  getLowStockItems: () => {
    return get().items.filter((item) => item.isLowStock || item.quantity <= 1);
  },

  clearStore: () => {
    set({
      items: [],
      messages: [],
      loading: false,
      user_id: null,
    });
  },
}));

// Helper function to categorize items
function categorizeItem(name: string): string {
  const categories = {
    'Fruits': ['apple', 'banana', 'orange', 'grape', 'berry', 'lemon', 'lime'],
    'Vegetables': ['carrot', 'potato', 'onion', 'tomato', 'lettuce', 'spinach', 'pepper'],
    'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream'],
    'Meat': ['chicken', 'beef', 'pork', 'fish', 'turkey'],
    'Grains': ['rice', 'bread', 'pasta', 'cereal', 'flour'],
    'Pantry': ['oil', 'salt', 'sugar', 'spice', 'sauce', 'can'],
  };

  const itemLower = name.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => itemLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}