import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * @desc Custom hook to consume the AuthContext easily.
 */
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;