/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback if available on the device
 * @param type - Type of haptic feedback (light, medium, heavy, success, warning, error)
 */
export function triggerHaptic(type: HapticFeedbackType = 'light'): void {
  // Check if the device supports haptic feedback
  if (typeof window === 'undefined') return;

  // Modern Vibration API
  if ('vibrate' in navigator) {
    const patterns: Record<HapticFeedbackType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 100, 50],
    };

    navigator.vibrate(patterns[type]);
  }

  // iOS Haptic Feedback API (Webkit)
  // @ts-expect-error - webkit API not in TypeScript definitions
  if (window.webkit?.messageHandlers?.haptic) {
    // @ts-expect-error - webkit API not in TypeScript definitions
    window.webkit.messageHandlers.haptic.postMessage(type);
  }
}

/**
 * Check if haptic feedback is supported on this device
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'vibrate' in navigator ||
    // @ts-expect-error - webkit API not in TypeScript definitions
    !!window.webkit?.messageHandlers?.haptic
  );
}
