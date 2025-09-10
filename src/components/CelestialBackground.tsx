import React from "react";
import { ImageBackground, StyleSheet } from "react-native";

// Renders only the galaxy background image with no overlays.
export const CelestialBackground: React.FC<React.PropsWithChildren<{ theme?: string }>> = ({ children }) => {
  return (
    <ImageBackground
      source={require("../../assets/galaxybackground.png")}
      style={styles.background}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
});