import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, PanResponder, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTwinStore } from '../../state/twinStore';
import * as Haptics from 'expo-haptics';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface MazeError {
  position: TouchPoint;
  correctionTime: number;
  correctionType: 'immediate' | 'backtrack';
}

interface CognitiveInsight {
  type: string;
  message: string;
  data: any;
}

const { width, height } = Dimensions.get('window');
const MAZE_SIZE = width * 0.85;
const CELL_SIZE = MAZE_SIZE / 10;

export const CognitiveSyncMaze = ({ navigation }: any) => {
  const { themeColor, twinProfile, addGameResult } = useTwinStore();
  const [gamePhase, setGamePhase] = useState<'intro' | 'playing' | 'analyzing' | 'result'>('intro');
  const [touchPath, setTouchPath] = useState<TouchPoint[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState<MazeError[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  
  // Simple maze layout (0 = wall, 1 = path)
  const maze = [
    [1,1,1,0,0,0,1,1,1,0],
    [0,0,1,1,1,0,1,0,1,0],
    [0,1,1,0,1,0,1,0,1,0],
    [0,1,0,0,1,1,1,0,1,0],
    [0,1,1,1,1,0,0,0,1,0],
    [0,0,0,0,1,0,1,1,1,0],
    [1,1,1,0,1,0,1,0,0,0],
    [1,0,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1],
  ];
  
  const startPoint = { x: 0, y: 0 };
  const endPoint = { x: 9, y: 9 };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const touch = evt.nativeEvent;
      const point = {
        x: touch.locationX,
        y: touch.locationY,
        timestamp: Date.now()
      };
      
      // Check if starting at the correct position
      if (isNearStart(point) && gamePhase === 'playing') {
        setIsDrawing(true);
        setStartTime(Date.now());
        setTouchPath([point]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onPanResponderMove: (evt) => {
      if (!isDrawing || gamePhase !== 'playing') return;
      
      const touch = evt.nativeEvent;
      const point = {
        x: touch.locationX,
        y: touch.locationY,
        timestamp: Date.now()
      };
      
      setCurrentPosition(point);
      setTouchPath(prev => [...prev, point]);
      
      // Check if on valid path
      if (!isValidPath(point)) {
        recordMistake(point);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      // Check if reached end
      if (isNearEnd(point)) {
        completeMaze();
      }
    },
    onPanResponderRelease: () => {
      if (isDrawing && !isNearEnd(currentPosition)) {
        // Lifted finger before completing
        setIsDrawing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  });

  const isNearStart = (point: TouchPoint) => {
    const startX = startPoint.x * CELL_SIZE + CELL_SIZE / 2;
    const startY = startPoint.y * CELL_SIZE + CELL_SIZE / 2;
    const distance = Math.sqrt(Math.pow(point.x - startX, 2) + Math.pow(point.y - startY, 2));
    return distance < CELL_SIZE;
  };

  const isNearEnd = (point: TouchPoint) => {
    const endX = endPoint.x * CELL_SIZE + CELL_SIZE / 2;
    const endY = endPoint.y * CELL_SIZE + CELL_SIZE / 2;
    const distance = Math.sqrt(Math.pow(point.x - endX, 2) + Math.pow(point.y - endY, 2));
    return distance < CELL_SIZE;
  };

  const isValidPath = (point: TouchPoint) => {
    const cellX = Math.floor(point.x / CELL_SIZE);
    const cellY = Math.floor(point.y / CELL_SIZE);
    
    if (cellX < 0 || cellX >= 10 || cellY < 0 || cellY >= 10) return false;
    return maze[cellY][cellX] === 1;
  };

  const recordMistake = (point: TouchPoint) => {
    const lastMistake = mistakes[mistakes.length - 1];
    const timeSinceLastMistake = lastMistake ? Date.now() - lastMistake.position.timestamp : Infinity;
    
    setMistakes(prev => [...prev, {
      position: point,
      correctionTime: timeSinceLastMistake,
      correctionType: timeSinceLastMistake < 500 ? 'immediate' : 'backtrack'
    }]);
  };

  const completeMaze = () => {
    setEndTime(Date.now());
    setIsDrawing(false);
    setGamePhase('analyzing');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Analyze the cognitive patterns
    setTimeout(() => {
      const insights = analyzeCognitivePath();
      saveResults(insights);
    }, 2000);
  };

  const analyzeCognitivePath = (): CognitiveInsight[] => {
    const insights: CognitiveInsight[] = [];
    const totalTime = (endTime! - startTime!) / 1000;
    
    // Analyze directional preferences
    let rightTurns = 0;
    let leftTurns = 0;
    
    for (let i = 2; i < touchPath.length; i++) {
      const prev = touchPath[i - 2];
      const curr = touchPath[i - 1];
      const next = touchPath[i];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let turnAngle = angle2 - angle1;
      
      if (turnAngle > Math.PI) turnAngle -= 2 * Math.PI;
      if (turnAngle < -Math.PI) turnAngle += 2 * Math.PI;
      
      if (turnAngle > 0.1) rightTurns++;
      else if (turnAngle < -0.1) leftTurns++;
    }
    
    const totalTurns = rightTurns + leftTurns;
    const rightTurnPercentage = totalTurns > 0 ? (rightTurns / totalTurns) * 100 : 50;
    
    insights.push({
      type: 'directional_bias',
      message: `You favor ${rightTurnPercentage > 55 ? 'right' : rightTurnPercentage < 45 ? 'left' : 'balanced'} turns (${Math.round(rightTurnPercentage)}% right)`,
      data: { rightTurns, leftTurns, percentage: rightTurnPercentage }
    });
    
    // Analyze error correction style
    const immediateCorrectionRate = mistakes.filter(m => m.correctionType === 'immediate').length / mistakes.length;
    
    insights.push({
      type: 'correction_style',
      message: `Your error correction is ${immediateCorrectionRate > 0.7 ? 'immediate' : 'deliberate'} (${Math.round(immediateCorrectionRate * 100)}% instant corrections)`,
      data: { immediateCorrectionRate, totalMistakes: mistakes.length }
    });
    
    // Analyze solving speed
    const optimalTime = 15; // seconds
    const speedRatio = totalTime / optimalTime;
    
    insights.push({
      type: 'solving_speed',
      message: `Completion time: ${totalTime.toFixed(1)}s (${speedRatio < 0.8 ? 'fast' : speedRatio < 1.2 ? 'moderate' : 'methodical'} solver)`,
      data: { totalTime, speedRatio }
    });
    
    return insights;
  };

  const saveResults = (insights: CognitiveInsight[]) => {
    const score = calculateScore();
    
    addGameResult({
      gameType: 'cognitive_sync_maze',
      score,
      twinScore: 0, // Will be compared when both complete
      insights,
      cognitiveData: {
        touchPath,
        mistakes,
        totalTime: (endTime! - startTime!) / 1000,
        rightTurnBias: insights[0].data.percentage
      }
    });
    
    setGamePhase('result');
  };

  const calculateScore = () => {
    const timeScore = Math.max(0, 100 - ((endTime! - startTime!) / 1000 - 15) * 5);
    const accuracyScore = Math.max(0, 100 - mistakes.length * 10);
    return Math.round((timeScore + accuracyScore) / 2);
  };

  const renderMaze = () => {
    return (
      <Svg width={MAZE_SIZE} height={MAZE_SIZE}>
        {/* Draw maze cells */}
        {maze.map((row, y) => 
          row.map((cell, x) => (
            <View key={`${x}-${y}`}>
              {cell === 0 && (
                <Path
                  d={`M ${x * CELL_SIZE} ${y * CELL_SIZE} h ${CELL_SIZE} v ${CELL_SIZE} h -${CELL_SIZE} z`}
                  fill="#1a1a2e"
                  stroke="#16213e"
                  strokeWidth={1}
                />
              )}
            </View>
          ))
        )}
        
        {/* Start point */}
        <Circle
          cx={startPoint.x * CELL_SIZE + CELL_SIZE / 2}
          cy={startPoint.y * CELL_SIZE + CELL_SIZE / 2}
          r={CELL_SIZE / 3}
          fill="#10b981"
        />
        
        {/* End point */}
        <Circle
          cx={endPoint.x * CELL_SIZE + CELL_SIZE / 2}
          cy={endPoint.y * CELL_SIZE + CELL_SIZE / 2}
          r={CELL_SIZE / 3}
          fill="#f59e0b"
        />
        
        {/* Draw path */}
        {touchPath.length > 1 && (
          <Path
            d={`M ${touchPath[0].x} ${touchPath[0].y} ${touchPath.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
            stroke="#8b5cf6"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    );
  };

  if (gamePhase === 'intro') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Games</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4 justify-center items-center">
            <Ionicons name="git-branch" size={80} color="#8b5cf6" />
            <Text className="text-white text-3xl font-bold text-center mt-6 mb-4">
              Cognitive Synchrony Maze
            </Text>
            <Text className="text-white/70 text-lg text-center mb-8 max-w-sm">
              Draw a path from the green start to the orange end. We'll analyze your cognitive patterns and compare them with {twinProfile?.name}.
            </Text>
            <Pressable
              onPress={() => setGamePhase('playing')}
              className="bg-purple-500 px-8 py-4 rounded-xl"
            >
              <Text className="text-white text-lg font-semibold">Start Maze</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'result') {
    const insights = analyzeCognitivePath();
    
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6 py-4">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Cognitive Analysis Complete
            </Text>
            
            <View className="bg-white/10 rounded-2xl p-6 mb-6">
              <Text className="text-white text-xl font-semibold mb-4">Your Cognitive Patterns</Text>
              {insights.map((insight, index) => (
                <View key={index} className="mb-4">
                  <Text className="text-white/60 text-sm mb-1">
                    {insight.type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text className="text-white text-base">
                    {insight.message}
                  </Text>
                </View>
              ))}
            </View>
            
            <View className="bg-yellow-500/20 rounded-xl p-4 mb-6">
              <Text className="text-white text-center">
                Waiting for {twinProfile?.name} to complete their maze for comparison...
              </Text>
            </View>
            
            <View className="flex-row space-x-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="flex-1 bg-white/20 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Back to Games</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setGamePhase('intro');
                  setTouchPath([]);
                  setMistakes([]);
                }}
                className="flex-1 bg-purple-500 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Try Again</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 py-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-semibold">
              {gamePhase === 'analyzing' ? 'Analyzing...' : 'Draw Your Path'}
            </Text>
            <View className="w-6" />
          </View>
          
          {/* Game Area */}
          <View className="flex-1 justify-center items-center">
            {gamePhase === 'analyzing' ? (
              <View className="items-center">
                <View className="w-20 h-20 border-4 border-purple-500 rounded-full animate-spin" />
                <Text className="text-white text-xl mt-6">Analyzing your cognitive patterns...</Text>
              </View>
            ) : (
              <View 
                className="bg-white/10 rounded-2xl p-4"
                {...panResponder.panHandlers}
              >
                {renderMaze()}
              </View>
            )}
          </View>
          
          {/* Instructions */}
          {gamePhase === 'playing' && (
            <View className="bg-white/10 rounded-xl p-4">
              <Text className="text-white text-center">
                Place your finger on the green circle and draw to the orange circle without lifting
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};