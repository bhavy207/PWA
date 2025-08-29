import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, cacheAPI } from '../utils/api';
import toast from 'react-hot-toast';
import notificationService from '../utils/notificationService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  token: localStorage.getItem('token'),
};

// Action types
const AuthActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.LOGIN_START:
    case AuthActionTypes.REGISTER_START:
      return {
        ...state,
        loading: true,
      };

    case AuthActionTypes.LOGIN_SUCCESS:
    case AuthActionTypes.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      cacheAPI.cacheUser(action.payload.user);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };

    case AuthActionTypes.LOGIN_FAILURE:
    case AuthActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
      };

    case AuthActionTypes.LOAD_USER_SUCCESS:
      cacheAPI.cacheUser(action.payload);
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };

    case AuthActionTypes.LOAD_USER_FAILURE:
      localStorage.removeItem('token');
      cacheAPI.clearCache();
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };

    case AuthActionTypes.UPDATE_USER:
      const updatedUser = { ...state.user, ...action.payload };
      cacheAPI.cacheUser(updatedUser);
      return {
        ...state,
        user: updatedUser,
      };

    case AuthActionTypes.LOGOUT:
      localStorage.removeItem('token');
      cacheAPI.clearCache();
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };

    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await authAPI.getMe();
          dispatch({
            type: AuthActionTypes.LOAD_USER_SUCCESS,
            payload: response.data.user,
          });
        } catch (error) {
          console.error('Failed to load user:', error);
          dispatch({ type: AuthActionTypes.LOAD_USER_FAILURE });
        }
      } else {
        // Check for cached user
        const cachedUser = cacheAPI.getCachedUser();
        if (cachedUser) {
          dispatch({
            type: AuthActionTypes.LOAD_USER_SUCCESS,
            payload: cachedUser,
          });
        } else {
          dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
        }
      }
    };

    loadUser();
  }, [state.token]);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AuthActionTypes.LOGIN_START });
      const response = await authAPI.login(credentials);
      
      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      toast.success(`Welcome back, ${response.data.user.name}!`);
      
      // Initialize notification service for authenticated user
      if (notificationService.isSupported()) {
        await notificationService.init();
      }
      
      return { success: true };
    } catch (error) {
      dispatch({ type: AuthActionTypes.LOGIN_FAILURE });
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActionTypes.REGISTER_START });
      const response = await authAPI.register(userData);
      
      dispatch({
        type: AuthActionTypes.REGISTER_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      toast.success(`Welcome to PWA Shop, ${response.data.user.name}!`);
      
      // Initialize notification service for new user
      if (notificationService.isSupported()) {
        await notificationService.init();
      }
      
      return { success: true };
    } catch (error) {
      dispatch({ type: AuthActionTypes.REGISTER_FAILURE });
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: AuthActionTypes.LOGOUT });
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      
      dispatch({
        type: AuthActionTypes.UPDATE_USER,
        payload: response.data.user,
      });

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (passwords) => {
    try {
      await authAPI.changePassword(passwords);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
