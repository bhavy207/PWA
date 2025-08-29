import { useState, useEffect } from 'react';
import { networkUtils } from '../utils/pwaUtils';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(networkUtils.isOnline());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Network: Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network: Gone offline');
    };

    // Set up event listeners
    const cleanup = networkUtils.setupNetworkListeners(handleOnline, handleOffline);

    // Cleanup function
    return cleanup;
  }, []);

  return isOnline;
};
