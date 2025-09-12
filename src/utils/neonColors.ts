import { ThemeColor } from "../state/twinStore";

export const getNeonAccentColor = (theme: ThemeColor): string => {
  switch (theme) {
    case "neon-pink":
      return "#ff1493";
    case "neon-blue":
      return "#00bfff";
    case "neon-green":
      return "#00ff7f";
    case "neon-yellow":
      return "#ffff00";
    case "neon-purple":
      return "#8a2be2";
    case "neon-orange":
      return "#ff4500";
    case "neon-cyan":
      return "#00ffff";
    case "neon-red":
      return "#ff0000";
    default:
      return "#8a2be2";
  }
};

// Enhanced opacity function with better readability
export const getNeonAccentColorWithOpacity = (theme: ThemeColor, opacity: number = 0.3): string => {
  const color = getNeonAccentColor(theme);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Get contrasting text color for readability on neon backgrounds
export const getNeonContrastingTextColor = (theme: ThemeColor): string => {
  switch (theme) {
    case "neon-yellow":
      return "#000000"; // Black text on bright yellow
    case "neon-cyan":
      return "#000000"; // Black text on bright cyan
    case "neon-green":
      return "#000000"; // Black text on bright green
    default:
      return "#ffffff"; // White text for most neon colors
  }
};

// Get background color with optimal opacity for UI elements
export const getNeonBackgroundColor = (theme: ThemeColor, opacity: number = 0.15): string => {
  return getNeonAccentColorWithOpacity(theme, opacity);
};

// Get card background color with stronger presence
export const getNeonCardBackground = (theme: ThemeColor, opacity: number = 0.2): string => {
  return getNeonAccentColorWithOpacity(theme, opacity);
};

// Get button background color with strong visibility
export const getNeonButtonBackground = (theme: ThemeColor, opacity: number = 0.3): string => {
  return getNeonAccentColorWithOpacity(theme, opacity);
};

// Get glow/shadow effect for neon elements
export const getNeonGlowEffect = (theme: ThemeColor) => {
  const color = getNeonAccentColor(theme);
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  };
};

// Get subtle glow for smaller elements
export const getNeonSubtleGlow = (theme: ThemeColor) => {
  const color = getNeonAccentColor(theme);
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  };
};

// Get icon tint color with proper contrast
export const getNeonIconColor = (theme: ThemeColor): string => {
  return getNeonAccentColor(theme);
};

// Get border color for outlined elements
export const getNeonBorderColor = (theme: ThemeColor): string => {
  return getNeonAccentColor(theme);
};

export const getNeonGradientColors = (theme: ThemeColor): [string, string, string] => {
  switch (theme) {
    case "neon-pink":
      return ["#ff1493", "#ff69b4", "#ffb6c1"];
    case "neon-blue":
      return ["#00bfff", "#1e90ff", "#87cefa"];
    case "neon-green":
      return ["#00ff7f", "#32cd32", "#90ee90"];
    case "neon-yellow":
      return ["#ffff00", "#ffd700", "#ffffe0"];
    case "neon-purple":
      return ["#8a2be2", "#9370db", "#dda0dd"];
    case "neon-orange":
      return ["#ff4500", "#ff8c00", "#ffa500"];
    case "neon-cyan":
      return ["#00ffff", "#40e0d0", "#afeeee"];
    case "neon-red":
      return ["#ff0000", "#dc143c", "#ffa07a"];
    default:
      return ["#8a2be2", "#9370db", "#dda0dd"];
  }
};