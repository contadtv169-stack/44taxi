import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext({});

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.id),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, quantity: Math.max(0, action.quantity) } : i
        ).filter(i => i.quantity > 0),
      };
    case 'CLEAR':
      return { ...state, items: [], restaurant: null };
    case 'SET_RESTAURANT':
      return { ...state, restaurant: action.restaurant };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], restaurant: null });

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR' });
  const setRestaurant = (restaurant) => dispatch({ type: 'SET_RESTAURANT', restaurant });

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      restaurant: state.restaurant,
      subtotal,
      totalItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setRestaurant,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
