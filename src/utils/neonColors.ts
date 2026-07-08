import { ThemeColor } from "../state/twinStore";

export const ACCENT_THEME_DETAILS: Record<ThemeColor, { name: string; description: string }> = {
  "stellar-blue": {
    name: "Stellar Blue",
    description: "Focused & Perceptive",
  },
  "aurora-teal": {
    name: "Aurora Teal",
    description: "Calm & Connected",
  },
  "celestial-indigo": {
    name: "Celestial Indigo",
    description: "Thoughtful & Visionary",
  },
  "nebula-rose": {
    name: "Nebula Rose",
    description: "Warm & Empathetic",
  },
  "solar-amber": {
    name: "Solar Amber",
    description: "Bright & Encouraging",
  },
  "comet-coral": {
    name: "Comet Coral",
    description: "Adventurous & Expressive",
  },
  "orbit-sage": {
    name: "Orbit Sage",
    description: "Grounded & Supportive",
  },
  "meteor-copper": {
    name: "Meteor Copper",
    description: "Confident & Bold",
  },
};

export const getAccentDisplayName = (theme: ThemeColor): string =>
  ACCENT_THEME_DETAILS[theme]?.name ?? "";

export const getAccentDescription = (theme: ThemeColor): string =>
  ACCENT_THEME_DETAILS[theme]?.description ?? "";

export const getNeonAccentColor = (theme: ThemeColor): string => {
  switch (theme) {
    case "stellar-blue":
      return "#2F6BB5";
    case "aurora-teal":
      return "#2BB5A0";
    case "celestial-indigo":
      return "#5D63C7";
    case "nebula-rose":
      return "#C66BC4";
    case "solar-amber":
      return "#F4C16E";
    case "comet-coral":
      return "#E8846B";
    case "orbit-sage":
      return "#6FBF92";
    case "meteor-copper":
      return "#B9825A";
    default:
      return "#5D63C7";
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

// Get contrasting text color for readability on accent backgrounds
export const getNeonContrastingTextColor = (theme: ThemeColor): string => {
  switch (theme) {
    case "stellar-blue":
    case "celestial-indigo":
      return "#ffffff";
    default:
      return "#000000";
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
    case "stellar-blue":
      return ["#2F6BB5", "#3A7BD5", "#6FA8FF"];
    case "aurora-teal":
      return ["#2BB5A0", "#3FC2AE", "#7EDFCC"];
    case "celestial-indigo":
      return ["#5D63C7", "#7A7EE0", "#A7A8F1"];
    case "nebula-rose":
      return ["#C66BC4", "#D98FD0", "#F3C0E3"];
    case "solar-amber":
      return ["#F4C16E", "#F7D38F", "#FBE9C0"];
    case "comet-coral":
      return ["#E8846B", "#F09B85", "#F7C2AF"];
    case "orbit-sage":
      return ["#6FBF92", "#86CFA5", "#B8E5C8"];
    case "meteor-copper":
      return ["#B9825A", "#C9936A", "#E2C0A0"];
    default:
      return ["#5D63C7", "#7A7EE0", "#A7A8F1"];
  }
};