import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { useLoader } from "@react-three/fiber";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";

function GltfModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ObjModel({ url }) {
  const obj = useLoader(OBJLoader, url);
  return <primitive object={obj} />;
}

function ModelScene({ url }) {
  const isObj = useMemo(() => /\.obj(\?|$)/i.test(url), [url]);

  return (
    <Stage adjustCamera intensity={0.5} environment="city">
      {isObj ? <ObjModel url={url} /> : <GltfModel url={url} />}
    </Stage>
  );
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ModelViewer({ url, className = "" }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-primary/5 text-secondary ${className}`}>
        Chưa có mô hình 3D cho phòng này.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <LoadingFallback />
      <Canvas camera={{ fov: 50 }} style={{ width: "100%", height: "100%" }}>
        <Suspense fallback={null}>
          <ModelScene url={url} />
          <OrbitControls enablePan enableZoom enableRotate />
        </Suspense>
      </Canvas>
    </div>
  );
}
