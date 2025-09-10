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

export const getNeonAccentColorWithOpacity = (theme: ThemeColor, opacity: number = 0.3): string => {
  const color = getNeonAccentColor(theme);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
