import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [persons, setPersons] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPersons = async () => {
    const res = await api.get('/persons');
    setPersons(res.data);
  };

  const fetchAccounts = async () => {
    const res = await api.get('/accounts');
    setAccounts(res.data);
  };

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchPersons(), fetchAccounts()]);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <AppContext.Provider value={{ persons, accounts, loading, refresh, fetchPersons, fetchAccounts }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
