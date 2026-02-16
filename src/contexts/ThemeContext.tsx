"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "dark" | "light" | "sepia";
export type FontSize = "small" | "medium" | "large" | "xlarge";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("scrollxiv-theme") as Theme;
    const savedFontSize = localStorage.getItem("scrollxiv-font-size") as FontSize;

    if (savedTheme) setThemeState(savedTheme);
    if (savedFontSize) setFontSizeState(savedFontSize);
  }, []);

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.remove("dark", "light", "sepia");
    document.documentElement.classList.add(theme);

    // Apply font size class
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    const fontSizeMap = {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
      xlarge: "text-xl",
    };
    document.documentElement.classList.add(fontSizeMap[fontSize]);
  }, [theme, fontSize]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("scrollxiv-theme", newTheme);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem("scrollxiv-font-size", newSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
