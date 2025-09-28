import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import config from '../config';
import { AssistantScenario, AssistantState } from '../types/assistant';

interface AssistantContextValue {
  data: AssistantState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  analyze: (payload: unknown) => Promise<AssistantState>;
  setData: React.Dispatch<React.SetStateAction<AssistantState | null>>;
  scenarios: AssistantScenario[];
  runScenario: (key: string) => Promise<AssistantState>;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const backendBaseUrl = useMemo(() => config.BACKEND_URL.replace(/\/$/, ''), []);
  const [data, setData] = useState<AssistantState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<AssistantScenario[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendBaseUrl}/api/assistant/summary`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Unable to fetch assistant summary');
      }

      const json = await response.json();
      setData(json.data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [backendBaseUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/api/assistant/scenarios`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Unable to load demo scenarios');
        }

        const json = await response.json();
        setScenarios(json.data || []);
      } catch (err) {
        console.error('Scenario fetch error:', err);
      }
    };

    fetchScenarios();
  }, [backendBaseUrl]);

  const analyze = useCallback(
    async (payload: unknown) => {
      try {
        const response = await fetch(`${backendBaseUrl}/api/assistant/analyze`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          try {
            const parsed = JSON.parse(text);
            const message =
              parsed?.error?.message || parsed?.message || parsed?.error || text;
            throw new Error(message || 'Unable to generate recommendations');
          } catch (parseError) {
            throw new Error(text || 'Unable to generate recommendations');
          }
        }

        const json = await response.json();
        setData(json.data);
        setError(null);
        return json.data as AssistantState;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    [backendBaseUrl]
  );

  const runScenario = useCallback(
    async (key: string) => {
      try {
        const response = await fetch(`${backendBaseUrl}/api/assistant/scenario/${key}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Unable to load scenario');
        }

        const json = await response.json();
        setData(json.data);
        setError(null);
        return json.data as AssistantState;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    [backendBaseUrl]
  );

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      analyze,
      setData,
      scenarios,
      runScenario
    }),
    [data, loading, error, refresh, analyze, scenarios, runScenario]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistantData = (): AssistantContextValue => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantData must be used within an AssistantProvider');
  }
  return context;
};
