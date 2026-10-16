import { useEffect, useRef } from "react";

export default function TankCanvas() {
  const canvasRef = useRef(null);

  const gameStateRef = useRef({
    keyPressList: [],
    playerTiles: [1, 2, 3, 4, 5, 6, 7, 8],
    player: {
      row: 1,
      col: 1,
      nextRow: 1,
      nextCol: 1,
      currentTile: 0,
      rotation: 90,
      speed: 2,
      destinationX: 32,
      destinationY: 32,
      x: 32,
      y: 32,
      dx: 0,
      dy: 0,
      isMoving: false,
    },
    tileSheetLoaded: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    const tileSheet = new Image();
    tileSheet.src = "/tanks_sheet.png";
    tileSheet.onload = () => {
      gameStateRef.current.tileSheetLoaded = true;
    };

    const handleKeyDown = (e) => {
      if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
      }
      gameStateRef.current.keyPressList[e.keyCode] = true;
    };

    const handleKeyUp = (e) => {
      gameStateRef.current.keyPressList[e.keyCode] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const checkBounds = (rowInc, colInc, object) => {
      object.nextRow = object.row + rowInc;
      object.nextCol = object.col + colInc;

      if (
        object.nextCol >= 0 &&
        object.nextCol < 15 &&
        object.nextRow >= 0 &&
        object.nextRow < 15
      ) {
        object.dx = colInc;
        object.dy = rowInc;

        if (colInc === 1) {
          object.rotation = 90;
        } else if (colInc === -1) {
          object.rotation = 270;
        } else if (rowInc === -1) {
          object.rotation = 0;
        } else if (rowInc === 1) {
          object.rotation = 180;
        }
        return true;
      } else {
        object.nextRow = object.row;
        object.nextCol = object.col;
        return false;
      }
    };

    const setPlayerDestination = (player) => {
      player.destinationX = player.nextCol * 32;
      player.destinationY = player.nextRow * 32;
      player.isMoving = true;
    };

    const checkKeys = () => {
      const { player, keyPressList } = gameStateRef.current;

      if (!player.isMoving) {
        if (keyPressList[38]) {
          if (checkBounds(-1, 0, player)) {
            setPlayerDestination(player);
          }
        } else if (keyPressList[37]) {
          if (checkBounds(0, -1, player)) {
            setPlayerDestination(player);
          }
        } else if (keyPressList[39]) {
          if (checkBounds(0, 1, player)) {
            setPlayerDestination(player);
          }
        } else if (keyPressList[40]) {
          if (checkBounds(1, 0, player)) {
            setPlayerDestination(player);
          }
        }
      }
    };

    const animatePlayer = () => {
      const { player, playerTiles } = gameStateRef.current;

      if (player.isMoving) {
        player.x += player.dx * player.speed;
        player.y += player.dy * player.speed;

        player.currentTile++;
        if (player.currentTile === playerTiles.length) {
          player.currentTile = 0;
        }

        if (player.x === player.destinationX && player.y === player.destinationY) {
          player.row = player.nextRow;
          player.col = player.nextCol;
          player.isMoving = false;
        }
      }
    };

    let animationFrameId;

    const render = () => {
      checkKeys();
      animatePlayer();

      context.fillStyle = "#aaaaaa";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (gameStateRef.current.tileSheetLoaded) {
        const { player, playerTiles } = gameStateRef.current;

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);

        const angleInRadians = (player.rotation * Math.PI) / 180;
        context.translate(player.x + 16, player.y + 16);
        context.rotate(angleInRadians);

        const sourceX =
          Math.floor(playerTiles[player.currentTile] % 8) * 32;
        const sourceY =
          Math.floor(playerTiles[player.currentTile] / 8) * 32;

        context.drawImage(
          tileSheet,
          sourceX,
          sourceY,
          32,
          32,
          -16,
          -16,
          32,
          32
        );
        context.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ border: "2px solid #333", backgroundColor: "#aaa" }}
      >
        Tu navegador no soporta HTML5 Canvas.
      </canvas>
    </div>
  );
}