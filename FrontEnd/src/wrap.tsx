import { useState, useEffect, ReactNode, createContext, useContext } from "react";

// Create a context to share dark mode state
interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
const DarkModeContext = createContext<DarkModeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

export const AppWrapper = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  // Toggle and save
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", JSON.stringify(!prev));
      return !prev;
    });
  };

  // Apply class to <html> or top-level div
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark-mode");
    else root.classList.remove("dark-mode");
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
