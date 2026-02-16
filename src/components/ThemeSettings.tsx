"use client";

import { useTheme, Theme, FontSize } from "@/contexts/ThemeContext";

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  if (!isOpen) return null;

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: "dark", label: "Dark", description: "Easy on the eyes" },
    { value: "light", label: "Light", description: "Bright and clear" },
    { value: "sepia", label: "Sepia", description: "Reading-friendly" },
  ];

  const fontSizes: { value: FontSize; label: string; description: string }[] = [
    { value: "small", label: "Small", description: "Compact" },
    { value: "medium", label: "Medium", description: "Default" },
    { value: "large", label: "Large", description: "Comfortable" },
    { value: "xlarge", label: "Extra Large", description: "Accessibility" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-muted"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Theme</h3>
            <div className="space-y-2">
              {themes.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    theme === value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-border-hover bg-surface-hover/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{label}</div>
                      <div className="text-sm text-muted">{description}</div>
                    </div>
                    {theme === value && (
                      <svg
                        className="w-5 h-5 text-accent"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Font Size</h3>
            <div className="space-y-2">
              {fontSizes.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setFontSize(value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    fontSize === value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-border-hover bg-surface-hover/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{label}</div>
                      <div className="text-sm text-muted">{description}</div>
                    </div>
                    {fontSize === value && (
                      <svg
                        className="w-5 h-5 text-accent"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
