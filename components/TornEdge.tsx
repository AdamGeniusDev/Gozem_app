import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View, useWindowDimensions } from "react-native";

interface TornEdgeProps {
  backgroundColor?: string;
  circleColor?: string;
  height?: number;
  circleSpacing?: number;
  circleRadius?: number;
}

const TornEdge: React.FC<TornEdgeProps> = ({
  backgroundColor = "white",
  circleColor = "#f5f5f5",
  height = 16,
  circleSpacing = 20,
  circleRadius = 6,
}) => {
  const { width } = useWindowDimensions();
  
  const numberOfCircles = Math.ceil(width / circleSpacing) + 1;
  const circles = Array.from({ length: numberOfCircles });

  return (
    <View style={{ backgroundColor }}>
      <Svg height={height} width="100%">
        {circles.map((_, i) => (
          <Circle
            key={i}
            cx={i * circleSpacing + circleRadius}
            cy={height / 2}
            r={circleRadius}
            fill={circleColor}
          />
        ))}
      </Svg>
    </View>
  );
};

export default TornEdge;