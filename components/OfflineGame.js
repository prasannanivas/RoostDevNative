import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../context/NetworkContext";

// Nokia style Snake game
const OfflineGame = () => {
  const { isConnected, hideOfflineGame } = useNetwork();
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [direction, setDirection] = useState("RIGHT");
  const [snake, setSnake] = useState([
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 },
  ]);
  const [food, setFood] = useState({ x: 12, y: 12 });
  const [speed, setSpeed] = useState(200);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gameLoopRef = useRef(null);

  // Grid settings
  const GRID_SIZE = 20;
  const CELL_SIZE = Math.floor(
    (Dimensions.get("window").width * 0.8) / GRID_SIZE
  );

  // Fade in effect on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      stopGameLoop();
    };
  }, []);

  // Handle game loop
  useEffect(() => {
    if (gameActive && !gameOver) {
      startGameLoop();
    } else {
      stopGameLoop();
    }

    return () => {
      stopGameLoop();
    };
  }, [gameActive, gameOver]);

  // Hide game when back online
  useEffect(() => {
    if (isConnected) {
      stopGameLoop();
      setGameActive(false);
    }
  }, [isConnected]);

  const startGameLoop = () => {
    stopGameLoop();
    gameLoopRef.current = setInterval(moveSnake, speed);
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const startGame = () => {
    setSnake([
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 },
    ]);
    setFood(generateFood());
    setDirection("RIGHT");
    setScore(0);
    setGameOver(false);
    setSpeed(200);
    setGameActive(true);
  };

  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
      y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
    };

    // Make sure food doesn't appear on snake
    const isOnSnake = snake.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y
    );
    if (isOnSnake) {
      return generateFood();
    }

    return newFood;
  };

  const checkCollision = (head) => {
    // Check wall collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      return true;
    }

    // Check self collision (skip the last piece since it will be removed)
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        return true;
      }
    }

    return false;
  };

  const moveSnake = () => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    // Move head based on direction
    switch (direction) {
      case "UP":
        head.y -= 1;
        break;
      case "DOWN":
        head.y += 1;
        break;
      case "LEFT":
        head.x -= 1;
        break;
      case "RIGHT":
        head.x += 1;
        break;
      default:
        break;
    }

    // Check collision
    if (checkCollision(head)) {
      setGameOver(true);
      return;
    }

    // Check if snake eats food
    const ateFood = head.x === food.x && head.y === food.y;

    // Add new head
    newSnake.unshift(head);

    if (ateFood) {
      // Don't remove tail (snake grows)
      setFood(generateFood());
      setScore((prevScore) => prevScore + 1);

      // Speed up the game every 5 points
      if (score > 0 && score % 5 === 0) {
        const newSpeed = Math.max(50, speed - 20);
        setSpeed(newSpeed);
        stopGameLoop();
        gameLoopRef.current = setInterval(moveSnake, newSpeed);
      }
    } else {
      // Remove tail
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const changeDirection = (newDirection) => {
    // Prevent 180 degree turns (snake can't turn back on itself)
    if (
      (direction === "UP" && newDirection === "DOWN") ||
      (direction === "DOWN" && newDirection === "UP") ||
      (direction === "LEFT" && newDirection === "RIGHT") ||
      (direction === "RIGHT" && newDirection === "LEFT")
    ) {
      return;
    }

    setDirection(newDirection);
  };

  // Render game grid
  const renderGrid = () => {
    return (
      <View style={styles.gameContainer}>
        {/* Render snake */}
        {snake.map((segment, index) => (
          <View
            key={`snake-${index}`}
            style={[
              styles.snakeSegment,
              {
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                backgroundColor: index === 0 ? "#006400" : "#019B8E",
              },
            ]}
          />
        ))}

        {/* Render food */}
        <View
          style={[
            styles.food,
            { left: food.x * CELL_SIZE, top: food.y * CELL_SIZE },
          ]}
        />
      </View>
    );
  };

  const renderControls = () => {
    return (
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.topButton]}
          onPress={() => gameActive && !gameOver && changeDirection("UP")}
        >
          <Ionicons name="chevron-up" size={30} color="white" />
        </TouchableOpacity>

        <View style={styles.middleControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.leftButton]}
            onPress={() => gameActive && !gameOver && changeDirection("LEFT")}
          >
            <Ionicons name="chevron-back" size={30} color="white" />
          </TouchableOpacity>

          <View style={styles.centerSpace} />

          <TouchableOpacity
            style={[styles.controlButton, styles.rightButton]}
            onPress={() => gameActive && !gameOver && changeDirection("RIGHT")}
          >
            <Ionicons name="chevron-forward" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.controlButton, styles.bottomButton]}
          onPress={() => gameActive && !gameOver && changeDirection("DOWN")}
        >
          <Ionicons name="chevron-down" size={30} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Ionicons name="cloud-offline" size={24} color="#DC3545" />
        <Text style={styles.headerText}>You're offline</Text>
      </View>

      <Text style={styles.message}>
        Please check your internet connection. While you wait, enjoy this
        classic Snake game!
      </Text>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {renderGrid()}

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
        </View>
      )}

      {renderControls()}

      {!gameActive && (
        <TouchableOpacity style={styles.actionButton} onPress={startGame}>
          <Text style={styles.actionButtonText}>
            {gameOver ? "Play Again" : "Start Game"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.hideButton} onPress={hideOfflineGame}>
        <Text style={styles.hideButtonText}>Hide Game</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 85,
    left: 20,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#DC3545",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: "#555",
  },
  scoreContainer: {
    alignSelf: "center",
    marginVertical: 5,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#019B8E",
  },
  gameContainer: {
    width: Math.floor(Dimensions.get("window").width * 0.8),
    height: Math.floor(Dimensions.get("window").width * 0.8),
    backgroundColor: "#E8E8E8",
    borderWidth: 2,
    borderColor: "#333",
    position: "relative",
    marginBottom: 10,
  },
  snakeSegment: {
    width: Math.floor((Dimensions.get("window").width * 0.8) / 20),
    height: Math.floor((Dimensions.get("window").width * 0.8) / 20),
    position: "absolute",
    borderRadius: 2,
  },
  food: {
    width: Math.floor((Dimensions.get("window").width * 0.8) / 20),
    height: Math.floor((Dimensions.get("window").width * 0.8) / 20),
    backgroundColor: "red",
    position: "absolute",
    borderRadius: 6,
  },
  controls: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  middleControls: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: "#019B8E",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  topButton: {
    marginBottom: 5,
  },
  bottomButton: {
    marginTop: 5,
  },
  leftButton: {},
  rightButton: {},
  centerSpace: {
    width: 40,
  },
  gameOverContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  finalScoreText: {
    fontSize: 18,
    color: "white",
  },
  actionButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 5,
    width: "100%",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  hideButton: {
    marginTop: 10,
    padding: 5,
  },
  hideButtonText: {
    color: "#0066CC",
  },
});

export default OfflineGame;
