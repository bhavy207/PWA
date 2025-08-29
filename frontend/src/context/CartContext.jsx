import { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false,
};

// Action types
const CartActionTypes = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  TOGGLE_CART: 'TOGGLE_CART',
  LOAD_CART: 'LOAD_CART',
};

// Helper functions
const calculateTotal = (items) => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

const calculateItemCount = (items) => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case CartActionTypes.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === product._id);
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // New item, add to cart
        const newItem = {
          id: product._id,
          name: product.name,
          price: product.price,
          images: product.images,
          quantity,
          stock: product.stock,
        };
        updatedItems = [...state.items, newItem];
      }
      
      const newTotal = calculateTotal(updatedItems);
      const newItemCount = calculateItemCount(updatedItems);
      
      return {
        ...state,
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case CartActionTypes.REMOVE_ITEM: {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const newTotal = calculateTotal(updatedItems);
      const newItemCount = calculateItemCount(updatedItems);
      
      return {
        ...state,
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case CartActionTypes.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const updatedItems = state.items.filter(item => item.id !== id);
        const newTotal = calculateTotal(updatedItems);
        const newItemCount = calculateItemCount(updatedItems);
        
        return {
          ...state,
          items: updatedItems,
          total: newTotal,
          itemCount: newItemCount,
        };
      }
      
      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      
      const newTotal = calculateTotal(updatedItems);
      const newItemCount = calculateItemCount(updatedItems);
      
      return {
        ...state,
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case CartActionTypes.CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
      };

    case CartActionTypes.TOGGLE_CART:
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case CartActionTypes.LOAD_CART: {
      const items = action.payload;
      const total = calculateTotal(items);
      const itemCount = calculateItemCount(items);
      
      return {
        ...state,
        items,
        total,
        itemCount,
      };
    }

    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: CartActionTypes.LOAD_CART, payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  // Add item to cart
  const addItem = (product, quantity = 1) => {
    // Check stock availability
    const existingItem = state.items.find(item => item.id === product._id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantity + quantity > product.stock) {
      toast.error('Not enough stock available');
      return;
    }

    dispatch({
      type: CartActionTypes.ADD_ITEM,
      payload: { product, quantity },
    });

    toast.success(`${product.name} added to cart`);
  };

  // Remove item from cart
  const removeItem = (id) => {
    const item = state.items.find(item => item.id === id);
    if (item) {
      dispatch({ type: CartActionTypes.REMOVE_ITEM, payload: id });
      toast.success(`${item.name} removed from cart`);
    }
  };

  // Update item quantity
  const updateQuantity = (id, quantity) => {
    const item = state.items.find(item => item.id === id);
    
    if (!item) return;
    
    if (quantity > item.stock) {
      toast.error('Not enough stock available');
      return;
    }

    dispatch({
      type: CartActionTypes.UPDATE_QUANTITY,
      payload: { id, quantity },
    });
  };

  // Clear entire cart
  const clearCart = () => {
    dispatch({ type: CartActionTypes.CLEAR_CART });
    toast.success('Cart cleared');
  };

  // Toggle cart visibility
  const toggleCart = () => {
    dispatch({ type: CartActionTypes.TOGGLE_CART });
  };

  // Get item quantity by id
  const getItemQuantity = (id) => {
    const item = state.items.find(item => item.id === id);
    return item ? item.quantity : 0;
  };

  // Check if item is in cart
  const isInCart = (id) => {
    return state.items.some(item => item.id === id);
  };

  // Get cart summary
  const getCartSummary = () => {
    return {
      subtotal: state.total,
      tax: state.total * 0.08, // 8% tax
      shipping: state.total > 100 ? 0 : 10, // Free shipping over $100
      total: state.total + (state.total * 0.08) + (state.total > 100 ? 0 : 10),
    };
  };

  // Prepare cart for checkout
  const prepareCheckout = () => {
    return {
      items: state.items.map(item => ({
        product: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      summary: getCartSummary(),
    };
  };

  const value = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    getItemQuantity,
    isInCart,
    getCartSummary,
    prepareCheckout,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
