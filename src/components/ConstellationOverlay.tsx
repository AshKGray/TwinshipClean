import React, { useEffect } from "react";
import { Dimensions } from "react-native";
import { Canvas, Circle, Line, useValue, useTiming } from "@shopify/react-native-skia";
import { constellations } from "../utils/constellations";

const { width, height } = Dimensions.get("window");

export const ConstellationOverlay = ({ sign }: { sign: keyof typeof constellations }) => {
  const constellation = constellations[sign];
  if (!constellation) return null;

  return (
    <Canvas style={{ position: "absolute", width, height }}>
      {/* Stars */}
      {constellation.stars.map((star, i) => {
        const progress = useValue(0);
        useEffect(() => {
          const duration = 2000 + Math.random() * 4000;
          const delay = Math.random() * 2000;
          useTiming(progress, { to: 1, loop: true, yoyo: true, duration, delay });
        }, []);

        const cx = star.x * width;
        const cy = star.y * height;
        const baseRadius = 3;
        const radius = baseRadius + progress.current * 1.5;

        return <Circle key={i} cx={cx} cy={cy} r={radius} color="white" />;
      })}

      {/* Lines */}
      {constellation.lines.map(([a, b], i) => (
        <Line
          key={i}
          p1={{ x: constellation.stars[a].x * width, y: constellation.stars[a].y * height }}
          p2={{ x: constellation.stars[b].x * width, y: constellation.stars[b].y * height }}
          color="rgba(255,255,255,0.6)"
          strokeWidth={1.5}
        />
      ))}
    </Canvas>
  );
};