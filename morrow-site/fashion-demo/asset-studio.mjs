import * as T from "three";

const renderer = new T.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(800, 1100);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);
const scene = new T.Scene();
scene.background = new T.Color("#eeede7");
const camera = new T.OrthographicCamera(-1.55, 1.55, 2.13, -2.13, 0.1, 30);
camera.position.set(4, 2.8, 9);
camera.lookAt(0, 1.45, 0);
scene.add(new T.HemisphereLight(0xffffff, 0xa4a18c, 2.7));
const key = new T.DirectionalLight(0xfff7e5, 4.2);
key.position.set(-3, 7, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 5;
key.shadow.camera.bottom = -3;
key.shadow.normalBias = 0.03;
key.shadow.bias = -0.001;
key.shadow.radius = 4;
scene.add(key);
const rim = new T.DirectionalLight(0xe6eef1, 2.5);
rim.position.set(4, 3, -4);
scene.add(rim);
const ground = new T.Mesh(
  new T.PlaneGeometry(200, 200),
  new T.MeshStandardMaterial({ color: "#eeede7", roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -0.04;
scene.add(ground);
const stage = new T.Group();
scene.add(stage);

function fabric(color, roughness = 0.9) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "#888";
  context.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) {
    for (let x = 0; x < 128; x += 2) {
      const grey = 110 + ((x * 31 + y * 47) % 46);
      context.fillStyle = `rgb(${grey},${grey},${grey})`;
      context.fillRect(x, y, 1, 2);
    }
  }
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(6, 6);
  return new T.MeshPhysicalMaterial({
    color,
    roughness,
    bumpMap: texture,
    bumpScale: 0.009,
    sheen: 0.45,
    sheenRoughness: 0.85,
  });
}
const olive = fabric("#6d7d5d"),
  bone = fabric("#dcd2ba"),
  charcoal = fabric("#333c39"),
  denim = fabric("#7997a2");
const leather = new T.MeshPhysicalMaterial({
  color: "#704a35",
  roughness: 0.48,
  clearcoat: 0.25,
});
const white = new T.MeshStandardMaterial({ color: "#e9e6da", roughness: 0.6 });
const gold = new T.MeshStandardMaterial({
  color: "#af8a47",
  metalness: 0.7,
  roughness: 0.32,
});
const skin = new T.MeshStandardMaterial({ color: "#b7a087", roughness: 0.62 });

function mesh(
  group,
  geometry,
  material,
  position = [0, 0, 0],
  scale = [1, 1, 1],
) {
  const result = new T.Mesh(geometry, material);
  result.position.set(...position);
  result.scale.set(...scale);
  result.castShadow = true;
  result.receiveShadow = true;
  group.add(result);
  return result;
}
function capsule(
  group,
  material,
  width,
  length,
  position,
  angle = 0,
  depth = 1,
) {
  const result = mesh(
    group,
    new T.CapsuleGeometry(width, length, 8, 24),
    material,
    position,
    [1, 1, depth],
  );
  result.rotation.z = angle;
  return result;
}
function outline(group, points, material, depth = 0.12, position = [0, 0, 0]) {
  const shape = new T.Shape();
  shape.moveTo(...points[0]);
  for (let i = 1; i < points.length; i += 1) shape.lineTo(...points[i]);
  shape.closePath();
  return mesh(
    group,
    new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.03,
    }),
    material,
    position,
  );
}
function jacket() {
  const group = new T.Group();
  outline(
    group,
    [
      [-0.4, 0],
      [-0.44, 0.8],
      [-0.3, 0.94],
      [-0.13, 0.9],
      [-0.06, 0.68],
      [-0.03, 0],
      [-0.4, 0],
    ],
    olive,
    0.18,
  );
  outline(
    group,
    [
      [0.03, 0],
      [0.06, 0.68],
      [0.13, 0.9],
      [0.3, 0.94],
      [0.44, 0.8],
      [0.4, 0],
    ],
    olive,
    0.18,
  );
  capsule(group, olive, 0.12, 0.68, [-0.54, 0.43, 0.07], -0.23, 0.85);
  capsule(group, olive, 0.12, 0.68, [0.54, 0.43, 0.07], 0.23, 0.85);
  outline(
    group,
    [
      [-0.11, 0.84],
      [-0.26, 0.89],
      [-0.2, 0.59],
      [-0.02, 0.72],
    ],
    olive,
    0.025,
    [0, 0, 0.22],
  );
  outline(
    group,
    [
      [0.11, 0.84],
      [0.26, 0.89],
      [0.2, 0.59],
      [0.02, 0.72],
    ],
    olive,
    0.025,
    [0, 0, 0.22],
  );
  for (const side of [-1, 1]) {
    mesh(group, new T.BoxGeometry(0.17, 0.15, 0.025), olive, [
      side * 0.26,
      0.32,
      0.24,
    ]);
    mesh(
      group,
      new T.SphereGeometry(0.024, 16, 16),
      gold,
      [side * 0.25, 0.33, 0.28],
      [1, 1, 0.4],
    );
  }
  for (let i = 0; i < 4; i += 1)
    mesh(
      group,
      new T.SphereGeometry(0.018, 12, 12),
      gold,
      [0.09, 0.1 + i * 0.16, 0.245],
      [1, 1, 0.4],
    );
  return group;
}
function knit() {
  const group = new T.Group();
  outline(
    group,
    [
      [-0.31, 0],
      [-0.35, 0.65],
      [-0.44, 0.65],
      [-0.52, 0.82],
      [-0.26, 0.98],
      [-0.12, 0.86],
      [0.12, 0.86],
      [0.26, 0.98],
      [0.52, 0.82],
      [0.44, 0.65],
      [0.35, 0.65],
      [0.31, 0],
    ],
    bone,
    0.12,
  );
  const neck = mesh(
    group,
    new T.TorusGeometry(0.13, 0.028, 12, 32, Math.PI),
    bone,
    [0, 0.86, 0.18],
  );
  neck.rotation.z = Math.PI;
  for (let x = -0.28; x < 0.3; x += 0.026)
    mesh(group, new T.CylinderGeometry(0.003, 0.003, 0.61, 8), bone, [
      x,
      0.32,
      0.163,
    ]);
  return group;
}
function trousers(material = charcoal) {
  const group = new T.Group();
  for (const side of [-1, 1]) {
    const geometry = new T.CylinderGeometry(0.205, 0.185, 1.2, 32, 22);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i),
        y = position.getY(i),
        z = position.getZ(i);
      position.setXYZ(
        i,
        x + Math.sin(y * 23 + side) * 0.008,
        y,
        z * 0.78 + Math.sin(x * 32) * 0.006,
      );
    }
    geometry.computeVertexNormals();
    mesh(group, geometry, material, [side * 0.215, 0.62, 0]);
    mesh(group, new T.BoxGeometry(0.22, 0.17, 0.025), material, [
      side * 0.22,
      1.13,
      0.156,
    ]);
  }
  mesh(group, new T.BoxGeometry(0.72, 0.16, 0.23), material, [0, 1.26, 0]);
  mesh(
    group,
    new T.SphereGeometry(0.025, 16, 16),
    gold,
    [0, 1.26, 0.14],
    [1, 1, 0.4],
  );
  return group;
}
function shoes(material = white, loafers = false) {
  const group = new T.Group();
  for (const side of [-1, 1]) {
    const x = side * 0.2;
    capsule(group, material, 0.115, 0.2, [x, 0.13, 0.05], 0, 1.8);
    mesh(
      group,
      new T.SphereGeometry(0.13, 32, 24),
      material,
      [x, 0.1, 0.2],
      [1, 0.48, 1.9],
    );
    mesh(
      group,
      new T.BoxGeometry(0.245, 0.035, 0.46),
      loafers ? charcoal : bone,
      [x, 0.031, 0.11],
    );
    if (loafers)
      mesh(group, new T.BoxGeometry(0.18, 0.022, 0.055), gold, [x, 0.18, 0.2]);
    else
      for (let i = 0; i < 4; i += 1)
        mesh(group, new T.BoxGeometry(0.14, 0.013, 0.018), bone, [
          x,
          0.19,
          0.12 + i * 0.035,
        ]);
  }
  return group;
}
function tote() {
  const group = new T.Group();
  outline(
    group,
    [
      [-0.27, 0],
      [-0.3, 0.52],
      [0.3, 0.52],
      [0.27, 0],
    ],
    leather,
    0.18,
  );
  for (const z of [0.015, 0.21]) {
    const handle = mesh(
      group,
      new T.TorusGeometry(0.17, 0.022, 12, 48, Math.PI),
      leather,
      [0, 0.51, z],
    );
    handle.rotation.z = 0;
  }
  mesh(group, new T.BoxGeometry(0.18, 0.08, 0.014), gold, [0, 0.27, 0.235]);
  return group;
}
function glasses() {
  const group = new T.Group();
  const lens = new T.MeshPhysicalMaterial({
    color: "#26342b",
    roughness: 0.2,
    metalness: 0.2,
  });
  for (const side of [-1, 1]) {
    mesh(
      group,
      new T.TorusGeometry(0.13, 0.025, 12, 48),
      leather,
      [side * 0.16, 0, 0],
      [1.1, 0.85, 1],
    );
    mesh(
      group,
      new T.CircleGeometry(0.13, 48),
      lens,
      [side * 0.16, 0, 0],
      [1.05, 0.8, 1],
    );
  }
  mesh(group, new T.BoxGeometry(0.12, 0.025, 0.02), gold, [0, 0.02, 0.01]);
  return group;
}
function look() {
  const group = new T.Group();
  capsule(group, skin, 0.28, 0.35, [0, 2.22, -0.02], 0, 0.52);
  const pants = trousers();
  pants.position.y = 0.18;
  group.add(pants);
  const shirt = knit();
  shirt.position.set(0, 1.5, 0.015);
  group.add(shirt);
  const coat = jacket();
  coat.position.set(0, 1.58, 0.11);
  group.add(coat);
  const head = mesh(
    group,
    new T.SphereGeometry(1, 40, 32),
    skin,
    [0, 2.93, 0],
    [0.17, 0.235, 0.16],
  );
  head.rotation.y = -0.1;
  capsule(group, skin, 0.078, 0.15, [0, 2.63, 0]);
  capsule(group, skin, 0.07, 0.16, [-0.61, 1.47, 0.13], -0.08, 0.7);
  capsule(group, skin, 0.07, 0.16, [0.61, 1.47, 0.13], 0.08, 0.7);
  const feet = shoes();
  group.add(feet);
  const bag = tote();
  bag.scale.setScalar(0.7);
  bag.position.set(-0.65, 0.9, 0.13);
  bag.rotation.z = -0.1;
  group.add(bag);
  return group;
}
const constructors = {
  look,
  jacket,
  knit,
  trousers,
  jeans: () => trousers(denim),
  sneakers: shoes,
  loafers: () => shoes(leather, true),
  tote,
  sunglasses: glasses,
};
window.renderAsset = (name) => {
  while (stage.children.length) stage.remove(stage.children[0]);
  const object = constructors[name]();
  stage.add(object);
  const box = new T.Box3().setFromObject(object),
    center = box.getCenter(new T.Vector3()),
    size = box.getSize(new T.Vector3());
  object.position.set(-center.x, -box.min.y, -center.z);
  const half = Math.max(size.y * 0.65, size.x * 0.9, 0.65);
  camera.left = (-half * 800) / 1100;
  camera.right = (half * 800) / 1100;
  camera.top = half;
  camera.bottom = -half;
  camera.position.set(name === "look" ? 3.6 : 2.5, size.y * 0.65 + 1.5, 9);
  camera.lookAt(0, size.y * 0.47, 0);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const bounds = new T.Box3().setFromObject(object);
  const projected = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z])
        projected.push(new T.Vector3(x, y, z).project(camera));
  const left = Math.max(
    0,
    Math.floor(Math.min(...projected.map((p) => (p.x + 1) * 400)) - 35),
  );
  const right = Math.min(
    800,
    Math.ceil(Math.max(...projected.map((p) => (p.x + 1) * 400)) + 35),
  );
  const top = Math.max(
    0,
    Math.floor(Math.min(...projected.map((p) => (1 - p.y) * 550)) - 35),
  );
  const bottom = Math.min(
    1100,
    Math.ceil(Math.max(...projected.map((p) => (1 - p.y) * 550)) + 35),
  );
  return { x: left, y: top, width: right - left, height: bottom - top };
};
window.renderAsset("look");
