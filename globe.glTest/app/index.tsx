import * as React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useRef } from 'react';
import Globe from 'three-globe';
import { Asset } from 'expo-asset';
import { THREE, TextureLoader } from 'expo-three';

const baseballImage = require('../assets/images/baseball.jpeg');

// Globe component using three-globe with R3F
function GlobeComponent({ 
  onTextureLoaded,
}: { 
  onTextureLoaded?: () => void;
}) {
  const globeRef = useRef<Globe | null>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [globeInstance, setGlobeInstance] = React.useState<Globe | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Load texture FIRST - start immediately, before globe setup
  React.useEffect(() => {
    const loadTexture = async () => {
      try {
        // Preload asset immediately
        const textureAsset = await Asset.loadAsync(baseballImage);
        const loader = new TextureLoader();
        // Load texture
        const tex = await loader.loadAsync(textureAsset[0].localUri!);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.flipY = false; // Important for expo-three
        tex.needsUpdate = true; // Force texture update
        setTexture(tex);
        console.log('Texture loaded');
        onTextureLoaded?.();
      } catch (error) {
        console.error('Error loading texture:', error);
      }
    };
    // Start loading immediately
    loadTexture();
  }, []);

  // Create globe instance
  React.useEffect(() => {
    const globe = new Globe();
    globeRef.current = globe;
    
    const N = 688;
    const heatmapData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 160,
      lng: (Math.random() - 0.5) * 360,
      weight: Math.random()
    }));

    globe
      .showGlobe(false)
      .heatmapsData([heatmapData])
      .heatmapPointLat((d: any) => d.lat)
      .heatmapPointLng((d: any) => d.lng)
      .heatmapPointWeight((d: any) => d.weight)
      .heatmapTopAltitude(0.7) // Top altitude
    console.log('Globe created');
    // Make heatmap materials transparent after globe is created
    setTimeout(() => {
      console.log('Making heatmap transparent...');
      console.log('Globe children count:', globe.children.length);
      
      // // Find and make heatmap materials transparent
      globe.traverse((child: any) => {
        if (child.material) {
          const materials = Array.isArray(child.material) 
            ? child.material 
            : [child.material];
          
          materials.forEach((mat: any) => {
            if (mat && mat.type && mat.type.includes('Shader')) {
              // This is likely a heatmap material
              mat.transparent = false;
              mat.opacity = 0.6; // Very transparent
              mat.depthWrite = true; 
              mat.needsUpdate = true;
            }
          });
        }
      });
    }, 1000); // Longer delay to ensure globe is fully initialized

    setGlobeInstance(globe);
  }, []);

  return (
    <group ref={groupRef}>
      {/* Baseball texture sphere - only render when texture is loaded to avoid red flash */}
      {texture &&(
        <mesh ref={sphereRef}>
          <sphereGeometry args={[100, 32, 32]} />
          <meshPhongMaterial 
            map={texture}
            color="#ffffff" // White color so texture shows properly
          />
        </mesh>
      )}
      
      {/* Globe with points and heatmap - render on top */}
      {globeInstance && <primitive object={globeInstance} />}
    </group>
  );
}

export default function App() {
  const [textureLoaded, setTextureLoaded] = React.useState(false);
  
  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [0, 0, 400], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 3, 5]} intensity={1.0} />
        <GlobeComponent 
          onTextureLoaded={() => setTextureLoaded(true)}
        />
      </Canvas>
      {!textureLoaded && (
        <View style={styles.loadingOverlay}>
          <RNText style={styles.loadingText}>Loading texture...</RNText>
        </View>
      )}
    </View>
  );
}

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
  },
  canvasContainer: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 17, 0.8)',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
