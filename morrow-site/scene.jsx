import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const COLORS = [
  "#fa603d",
  "#a2c873",
  "#bdafe6",
  "#f6c348",
  "#7db9d2",
  "#e79ab5",
];

function physical(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.24,
    metalness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.13,
    ...options,
  });
}

function part(geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  return mesh;
}

function character(index = 0, color = COLORS[index % COLORS.length]) {
  const group = new THREE.Group();
  const material = physical(color);
  const dark = physical("#212c25", { roughness: 0.36 });
  const cream = physical("#fffdf0", { roughness: 0.4 });
  let body;
  if (index % 6 === 0) {
    body = part(new RoundedBoxGeometry(1.7, 1.75, 1.35, 5, 0.42), material);
  } else if (index % 6 === 1) {
    body = part(new THREE.TorusGeometry(0.78, 0.4, 24, 64), material);
  } else if (index % 6 === 2) {
    body = part(
      new THREE.SphereGeometry(1, 40, 32),
      material,
      [0, 0, 0],
      [0.94, 1.13, 0.76],
    );
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = part(new THREE.SphereGeometry(0.55, 24, 20), material, [
        Math.sin(angle) * 0.83,
        Math.cos(angle) * 0.83,
        -0.12,
      ]);
      group.add(petal);
    }
  } else if (index % 6 === 3) {
    body = part(new THREE.CapsuleGeometry(0.62, 0.8, 12, 32), material);
    body.rotation.z = -0.2;
  } else if (index % 6 === 4) {
    const shape = new THREE.Shape();
    for (let i = 0; i <= 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const radius = i % 2 === 0 ? 1.18 : 0.62;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    body = part(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.6,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: 0.16,
        bevelThickness: 0.16,
      }),
      material,
      [0, 0, -0.3],
    );
  } else {
    body = part(
      new THREE.SphereGeometry(1, 48, 36),
      material,
      [0, 0, 0],
      [1.07, 0.94, 0.79],
    );
  }
  group.add(body);
  const eyes = new THREE.Group();
  const faceDepth = index % 6 === 1 ? 0.49 : 0.74;
  for (const side of [-1, 1]) {
    eyes.add(
      part(
        new THREE.SphereGeometry(0.245, 24, 20),
        cream,
        [side * 0.3, 0.23, faceDepth],
        [0.9, 1.15, 0.65],
      ),
    );
    eyes.add(
      part(
        new THREE.SphereGeometry(0.105, 20, 16),
        dark,
        [side * 0.3 + 0.025, 0.24, faceDepth + 0.14],
        [1, 1.15, 0.55],
      ),
    );
    eyes.add(
      part(new THREE.SphereGeometry(0.027, 12, 10), cream, [
        side * 0.3 + 0.055,
        0.278,
        faceDepth + 0.19,
      ]),
    );
    const foot = part(new THREE.CapsuleGeometry(0.16, 0.3, 6, 12), dark, [
      side * 0.4,
      -1.12,
      0.13,
    ]);
    foot.rotation.z = side * -0.22;
    group.add(foot);
    const hand = part(new THREE.CapsuleGeometry(0.105, 0.39, 6, 12), material, [
      side * 0.95,
      -0.35,
      0,
    ]);
    hand.rotation.z = side * 0.48;
    group.add(hand);
  }
  const smile = new THREE.TorusGeometry(0.16, 0.036, 8, 24, Math.PI);
  const mouth = part(smile, dark, [0, -0.15, faceDepth + 0.015]);
  mouth.rotation.z = Math.PI;
  group.add(mouth, eyes);
  group.userData = { eyes, body };
  return group;
}

function cube() {
  const group = new THREE.Group();
  const materials = [
    "#b7d69f",
    "#f6c27e",
    "#bdd6e7",
    "#f8d9b6",
    "#c7b9e8",
    "#f09b82",
  ].map((color) => physical(color));
  const box = part(new RoundedBoxGeometry(2.1, 2.1, 2.1, 6, 0.23), materials);
  group.add(box);
  const ink = physical("#203327");
  const eyes = new THREE.Group();
  for (const side of [-1, 1])
    eyes.add(
      part(
        new THREE.SphereGeometry(0.11, 20, 16),
        ink,
        [side * 0.34, 0.11, 1.05],
        [1, 1.1, 0.35],
      ),
    );
  const mouth = part(
    new THREE.TorusGeometry(0.15, 0.035, 8, 24, Math.PI),
    ink,
    [0, -0.17, 1.06],
  );
  mouth.rotation.z = Math.PI;
  group.add(eyes, mouth);
  return group;
}

export function Scene({
  variant = "hero",
  selected = 0,
  party = false,
  className = "",
}) {
  const host = useRef(null);
  const state = useRef({ selected, party });
  state.current = { selected, party };
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(
      0,
      0,
      variant === "hero" ? 16 : variant === "footer" ? 6 : 6.7,
    );
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    const light = new THREE.DirectionalLight("#fff6e5", 4.2);
    light.position.set(-4, 6, 8);
    scene.add(light, new THREE.AmbientLight("#fff8e9", 1.1));
    const fill = new THREE.DirectionalLight("#d7ddff", 2.5);
    fill.position.set(5, 0, 4);
    scene.add(fill);

    const objects = [];
    let active = null;
    let selectedIndex = state.current.selected;
    let footerBase = null;
    if (variant === "hero") {
      const layout = [
        [-5.15, 2.3, 0, 0.99],
        [5.08, 2.06, -0.8, 0.93],
        [-4.95, -2.65, 1, 0.81],
        [5.15, -2.7, -0.3, 0.97],
        [-2.38, 4.2, -2, 0.55],
        [2.48, 4.6, -1.5, 0.56],
      ];
      for (let i = 0; i < layout.length; i++) {
        const object = character(i);
        const [x, y, z, scale] = layout[i];
        object.position.set(x, y, z);
        object.scale.setScalar(scale);
        object.rotation.set(-0.06, i % 2 ? -0.3 : 0.3, i % 2 ? 0.15 : -0.14);
        object.userData.base = object.position.clone();
        object.userData.tilt = object.rotation.z;
        objects.push(object);
        scene.add(object);
      }
    } else if (variant === "cube") {
      active = cube();
      active.rotation.set(-0.25, -0.55, -0.08);
      scene.add(active);
    } else if (variant === "footer") {
      active = character(5, "#fa603d");
      active.scale.setScalar(2.25);
      active.position.y = -0.55;
      active.userData.body.geometry = active.userData.body.geometry.clone();
      footerBase =
        active.userData.body.geometry.attributes.position.array.slice();
      scene.add(active);
    } else {
      active = character(selectedIndex);
      active.rotation.y = -0.16;
      active.position.y = 0.08;
      scene.add(active);
    }

    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();
    let drag = false;
    let dragX = 0;
    let manualRotation = 0;
    let frame = 0;
    let visible = true;
    let disposed = false;
    const started = performance.now();
    const move = (event) => {
      const rect = element.getBoundingClientRect();
      target.set(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        -((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
      if (drag && variant === "cube") {
        manualRotation += (event.clientX - dragX) * 0.012;
        dragX = event.clientX;
      }
    };
    const down = (event) => {
      drag = true;
      dragX = event.clientX;
      element.setPointerCapture(event.pointerId);
    };
    const up = () => {
      drag = false;
    };
    const leave = () => {
      if (!drag) target.set(0, 0);
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("pointerleave", leave);
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (variant === "hero") {
        const spread = Math.max(0.58, Math.min(1, width / 1150));
        objects.forEach((object) => {
          object.position.x = object.userData.base.x * spread;
        });
      }
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    resize();
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frame && !disposed)
          frame = requestAnimationFrame(animate);
      },
      { rootMargin: "100px" },
    );
    visibilityObserver.observe(element);

    function animate(now) {
      frame = 0;
      if (disposed || !visible) return;
      const t = reducedMotion.matches ? 0 : (now - started) / 1000;
      pointer.lerp(target, 0.065);
      const speed = state.current.party ? 3 : 1;
      objects.forEach((object, i) => {
        object.position.y =
          object.userData.base.y +
          Math.sin(t * speed + i * 1.4) * (state.current.party ? 0.65 : 0.21);
        object.rotation.z =
          object.userData.tilt + Math.sin(t * 0.7 * speed + i) * 0.12;
        object.rotation.y = pointer.x * 0.12 + Math.sin(t * 0.45 + i) * 0.18;
      });
      if (variant === "crew" || variant === "art") {
        if (selectedIndex !== state.current.selected) {
          scene.remove(active);
          disposeObject(active);
          selectedIndex = state.current.selected;
          active = character(selectedIndex);
          scene.add(active);
        }
        active.rotation.y = -0.18 + Math.sin(t * 0.5) * 0.2 + pointer.x * 0.3;
        active.rotation.z = Math.sin(t * 0.8) * 0.06;
        active.position.y = Math.sin(t * 1.5) * 0.09;
        const blink = reducedMotion.matches
          ? 1
          : Math.sin(t * 1.2) > 0.997
            ? 0.12
            : 1;
        active.userData.eyes.scale.y +=
          (blink - active.userData.eyes.scale.y) * 0.32;
      }
      if (variant === "cube") {
        active.rotation.y = -0.55 + t * 0.19 + manualRotation;
        active.rotation.x = -0.24 + pointer.y * 0.18;
        active.position.y = Math.sin(t * 1.1) * 0.1;
      }
      if (variant === "footer") {
        active.rotation.y = pointer.x * 0.23;
        active.rotation.x = pointer.y * -0.12;
        const positions = active.userData.body.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = footerBase[i * 3];
          const y = footerBase[i * 3 + 1];
          const z = footerBase[i * 3 + 2];
          const influence = Math.exp(
            -((x - pointer.x * 0.8) ** 2 + (y - pointer.y * 0.8) ** 2) * 3,
          );
          const wobble = reducedMotion.matches
            ? 0
            : Math.sin(t * 1.8 + y * 4 + x * 3) * 0.035;
          positions.setXYZ(
            i,
            x + pointer.x * influence * (drag ? 0.6 : 0.16),
            y + pointer.y * influence * (drag ? 0.5 : 0.1),
            z + wobble + influence * (drag ? 0.2 : 0.02),
          );
        }
        positions.needsUpdate = true;
        active.userData.body.geometry.computeVertexNormals();
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("pointerleave", leave);
      disposeObject(scene);
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);

  return (
    <div ref={host} className={`three-scene ${className}`}>
      {failed && (
        <div
          className="scene-fallback"
          role="img"
          aria-label="Decorative character illustration"
        >
          <span>●</span>
          <span>●</span>
          <i />
        </div>
      )}
    </div>
  );
}

function disposeObject(object) {
  const geometries = new Set();
  const materials = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (child.material)
      for (const material of Array.isArray(child.material)
        ? child.material
        : [child.material])
        materials.add(material);
  });
  geometries.forEach((geometry) => {
    geometry.dispose();
  });
  materials.forEach((material) => {
    material.dispose();
  });
}
