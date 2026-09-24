import { createContext } from 'react';

/**
 * The context object lives in its own module so that AuthContext.jsx can
 * export nothing but the AuthProvider component. Mixing component and
 * non-component exports in one file breaks Vite's fast refresh.
 */
export const AuthContext = createContext(null);
