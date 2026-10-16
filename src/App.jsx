import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export default function App() {
  const pixiContainer = useRef(null);

  const gameState = useRef({
    speed: 1, 
    keys: {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    }
  });

  useEffect(() => {
    let app = new PIXI.Application();
    
    let isMounted = true; 
    let isInitialized = false; 

    const initPixi = async () => {
      try {
        await app.init({ width: 500, height: 500, backgroundColor: 0x0f141e });
        isInitialized = true;

        if (!isMounted) {
          app.destroy({ removeView: true });
          return;
        }
        
        if (pixiContainer.current) {
          pixiContainer.current.appendChild(app.canvas);
        }

        const baseTexture = await PIXI.Assets.load('/tanks_sheet.png');
        if (!isMounted) return;

        const animationFrames = [1, 2, 3, 4, 5, 6, 7, 8];
        const textures = animationFrames.map(frame => {
          const sourceX = Math.floor(frame % 8) * 32;
          const sourceY = Math.floor(frame / 8) * 32;
          const rect = new PIXI.Rectangle(sourceX, sourceY, 32, 32);
          return new PIXI.Texture({ source: baseTexture.source, frame: rect });
        });

        const fireflyLayer = new PIXI.Container(); 
        const trackLayer = new PIXI.Container();
        const shadowLayer = new PIXI.Container();
        const tankLayer = new PIXI.Container();
        const smokeLayer = new PIXI.Container(); 

        app.stage.addChild(fireflyLayer);
        app.stage.addChild(trackLayer);
        app.stage.addChild(shadowLayer);
        app.stage.addChild(tankLayer);
        app.stage.addChild(smokeLayer);

        const fireflies = [];
        const numFireflies = 70; 
        for (let i = 0; i < numFireflies; i++) {
          const firefly = new PIXI.Graphics();
          const size = Math.random() * 1.5 + 0.5; 
          firefly.circle(0, 0, size).fill({ color: 0xccff00, alpha: 1 });
          
          firefly.x = Math.random() * 500;
          firefly.y = Math.random() * 500;
          
          fireflyLayer.addChild(firefly);

          fireflies.push({
            sprite: firefly,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            offset: Math.random() * 100,
            pulseSpeed: Math.random() * 0.05 + 0.02
          });
        }

        const tankSprite = new PIXI.AnimatedSprite(textures);
        tankSprite.anchor.set(0.5);
        tankSprite.x = 250; 
        tankSprite.y = 250; 
        tankSprite.rotation = (90 * Math.PI) / 180; 
        tankSprite.animationSpeed = 0.2; 
        
        const colorFilter = new PIXI.ColorMatrixFilter();
        colorFilter.contrast(0.1); 
        tankSprite.filters = [colorFilter];
        tankLayer.addChild(tankSprite);

        const shadowSprite = new PIXI.AnimatedSprite(textures);
        shadowSprite.anchor.set(0.5);
        shadowSprite.tint = 0x000000;
        shadowSprite.alpha = 0.5;
        shadowSprite.animationSpeed = 0.2;
        shadowLayer.addChild(shadowSprite);

        const smokeParticles = [];
        const tracks = [];
        let distanceCounter = 0;
        let time = 0;

        app.ticker.add(() => {
          const state = gameState.current;
          let isMoving = false;
          time += 0.05;

          for (let i = 0; i < fireflies.length; i++) {
            const f = fireflies[i];
            f.sprite.x += f.vx + Math.sin(time + f.offset) * 0.001;
            f.sprite.y += f.vy + Math.cos(time + f.offset) * 0.001;
            f.sprite.alpha = 0.3 + Math.sin(time * f.pulseSpeed + f.offset) * 1;

            if (f.sprite.x < -10) f.sprite.x = 510;
            if (f.sprite.x > 510) f.sprite.x = -10;
            if (f.sprite.y < -10) f.sprite.y = 510;
            if (f.sprite.y > 510) f.sprite.y = -10;
          }

          if (state.keys.ArrowUp) {
            tankSprite.y -= state.speed;
            tankSprite.rotation = 0; 
            isMoving = true;
          } else if (state.keys.ArrowLeft) {
            tankSprite.x -= state.speed;
            tankSprite.rotation = (270 * Math.PI) / 180; 
            isMoving = true;
          } else if (state.keys.ArrowRight) {
            tankSprite.x += state.speed;
            tankSprite.rotation = (90 * Math.PI) / 180; 
            isMoving = true;
          } else if (state.keys.ArrowDown) {
            tankSprite.y += state.speed;
            tankSprite.rotation = Math.PI; 
            isMoving = true;
          }

          shadowSprite.x = tankSprite.x + 5;
          shadowSprite.y = tankSprite.y + 5;
          shadowSprite.rotation = tankSprite.rotation;

          if (isMoving) {
            tankSprite.play();
            shadowSprite.play();

            distanceCounter += state.speed;
            if (distanceCounter > 12) { 
              distanceCounter = 0;
              const track = new PIXI.Graphics();
              track.rect(-12, -10, 24, 4).fill({ color: 0x05070a, alpha: 0.6 }); 
              track.rect(-12, 6, 24, 4).fill({ color: 0x05070a, alpha: 0.6 });   
              
              track.x = tankSprite.x;
              track.y = tankSprite.y;
              track.rotation = tankSprite.rotation;
              
              trackLayer.addChild(track);
              tracks.push(track);
            }

            if (Math.random() > 0.5) { 
              const smoke = new PIXI.Graphics();
              const radius = Math.random() * 4 + 2;
              smoke.circle(0, 0, radius).fill({ color: 0x88929e, alpha: 0.6 });
              
              let backX = tankSprite.x;
              let backY = tankSprite.y;
              if (state.keys.ArrowUp) backY += 16;
              if (state.keys.ArrowDown) backY -= 16;
              if (state.keys.ArrowLeft) backX += 16;
              if (state.keys.ArrowRight) backX -= 16;

              smoke.x = backX + (Math.random() - 0.5) * 10;
              smoke.y = backY + (Math.random() - 0.5) * 10;
              
              smokeLayer.addChild(smoke);
              
              smokeParticles.push({
                sprite: smoke,
                life: 1, 
                vx: (Math.random() - 0.5) * 0.5, 
                vy: (Math.random() - 0.5) * 0.5  
              });
            }
          } else {
            tankSprite.stop();
            shadowSprite.stop();
          }

          for (let i = tracks.length - 1; i >= 0; i--) {
            tracks[i].alpha -= 0.002; 
            if (tracks[i].alpha <= 0) {
              tracks[i].destroy(); 
              tracks.splice(i, 1);
            }
          }

          for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const p = smokeParticles[i];
            p.life -= 0.02; 
            p.sprite.x += p.vx; 
            p.sprite.y += p.vy;
            p.sprite.scale.x += 0.04; 
            p.sprite.scale.y += 0.04;
            p.sprite.alpha = p.life * 0.5; 

            if (p.life <= 0) {
              p.sprite.destroy(); 
              smokeParticles.splice(i, 1);
            }
          }
        });
      } catch (error) {
        console.error("Error al inicializar PixiJS:", error);
      }
    };

    initPixi();

    const handleKeyDown = (e) => {
      if (gameState.current.keys.hasOwnProperty(e.code)) {
        gameState.current.keys[e.code] = true;
        e.preventDefault(); 
      }
    };

    const handleKeyUp = (e) => {
      if (gameState.current.keys.hasOwnProperty(e.code)) {
        gameState.current.keys[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (app && isInitialized) {
        app.destroy({ removeView: true });
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', fontFamily: 'sans-serif' }}>
      <h2>Misión Nocturna</h2>
      <div 
        ref={pixiContainer} 
        style={{ border: '4px solid #111', borderRadius: '8px', overflow: 'hidden', width: '500px', height: '500px', boxShadow: '0px 0px 30px rgba(204, 255, 0, 0.1)' }}
      ></div>
      <p style={{ color: '#666' }}>Usa las <strong>flechas del teclado</strong> para mover el tanque a través de la noche.</p>
    </div>
  );
}