declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: any;
      mesh: any;
      sphereGeometry: any;
      icosahedronGeometry: any;
      meshStandardMaterial: any;
      lineSegments: any;
      lineBasicMaterial: any;
      group: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      gridHelper: any;
    }
  }
}

export {};

