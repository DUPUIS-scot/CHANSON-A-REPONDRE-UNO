(function () {
  'use strict';

  const dealers = new Map();
  const THREE = window.THREE;

  if (!THREE) {
    console.error('Three.js must load before puppet_dealer.js');
    return;
  }

  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (value) => value * value * (3 - 2 * value);
  const segment = (value, start, end) =>
    smooth(clamp((value - start) / (end - start), 0, 1));

  function setShadow(object, enabled) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = enabled;
        child.receiveShadow = enabled;
      }
    });
  }

  function mesh(geometry, material, position, scale) {
    const result = new THREE.Mesh(geometry, material);
    if (position) result.position.set(...position);
    if (scale) result.scale.set(...scale);
    return result;
  }

  function roundedBox(width, height, depth, radius, material) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height,
    );
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: radius * 0.28,
      bevelThickness: radius * 0.28,
      curveSegments: 5,
    }).center();
  }

  function makeFinger(material, length, radius) {
    const root = new THREE.Group();
    const middle = new THREE.Group();
    const tip = new THREE.Group();
    const sectionLength = length / 3;
    const geometry = new THREE.CapsuleGeometry(
      radius,
      sectionLength - radius * 1.3,
      4,
      7,
    );
    const first = mesh(geometry, material, [0, -sectionLength * 0.5, 0]);
    const second = mesh(geometry, material, [0, -sectionLength * 0.5, 0]);
    const third = mesh(geometry, material, [0, -sectionLength * 0.5, 0]);
    root.add(first, middle);
    middle.position.y = -sectionLength;
    middle.add(second, tip);
    tip.position.y = -sectionLength;
    tip.add(third);
    root.userData.joints = [root, middle, tip];
    return root;
  }

  function makeHand(material, mirrored) {
    const hand = new THREE.Group();
    const palm = mesh(
      new THREE.CapsuleGeometry(0.34, 0.62, 6, 10),
      material,
      [0, 0, 0],
      [1, 1, 0.54],
    );
    palm.rotation.z = Math.PI;
    hand.add(palm);

    const fingers = [];
    const xPositions = [-0.29, -0.1, 0.1, 0.29];
    xPositions.forEach((x, index) => {
      const finger = makeFinger(material, 0.69 - Math.abs(index - 1.5) * 0.055, 0.085);
      finger.position.set(x, -0.43, 0.02);
      finger.rotation.z = (index - 1.5) * 0.045;
      hand.add(finger);
      fingers.push(finger);
    });
    const thumb = makeFinger(material, 0.58, 0.1);
    thumb.position.set(mirrored ? -0.42 : 0.42, -0.04, 0);
    thumb.rotation.z = mirrored ? -1.0 : 1.0;
    hand.add(thumb);
    fingers.push(thumb);
    hand.userData.fingers = fingers;
    hand.userData.palm = palm;
    return hand;
  }

  function curlHand(hand, amount) {
    hand.userData.fingers.forEach((finger, index) => {
      const multiplier = index === 4 ? 0.75 : 1;
      finger.userData.joints.forEach((joint, jointIndex) => {
        joint.rotation.x = amount * multiplier * (0.45 + jointIndex * 0.22);
      });
    });
  }

  function makeArm(materials, side) {
    const shoulder = new THREE.Group();
    const upper = mesh(
      new THREE.CapsuleGeometry(0.3, 1.05, 6, 10),
      materials.fabric,
      [0, -0.7, 0],
    );
    const elbow = mesh(new THREE.SphereGeometry(0.31, 16, 12), materials.wood, [
      0,
      -1.38,
      0,
    ]);
    const forearmPivot = new THREE.Group();
    forearmPivot.position.y = -1.38;
    const forearm = mesh(
      new THREE.CapsuleGeometry(0.25, 0.95, 6, 10),
      materials.wood,
      [0, -0.63, 0],
      [1, 1, 0.9],
    );
    const wrist = mesh(new THREE.SphereGeometry(0.23, 14, 10), materials.wood, [
      0,
      -1.25,
      0,
    ]);
    const handPivot = new THREE.Group();
    handPivot.position.y = -1.34;
    const hand = makeHand(materials.wood, side < 0);
    hand.rotation.z = Math.PI;
    handPivot.add(hand);
    forearmPivot.add(forearm, wrist, handPivot);
    shoulder.add(upper, elbow, forearmPivot);
    shoulder.userData.forearm = forearmPivot;
    shoulder.userData.handPivot = handPivot;
    shoulder.userData.hand = hand;
    return shoulder;
  }

  function makeConeCap(materials) {
    const cap = new THREE.Group();
    const crown = mesh(
      new THREE.SphereGeometry(0.86, 24, 16),
      materials.fabric,
      [0, 0.02, 0],
      [1, 0.42, 0.88],
    );
    const horn = mesh(
      new THREE.ConeGeometry(0.43, 1.45, 16, 5, true),
      materials.fabric,
      [0.34, 0.61, 0],
    );
    horn.rotation.z = -0.55;
    horn.rotation.x = 0.15;
    const bell = mesh(new THREE.SphereGeometry(0.15, 14, 10), materials.gold, [
      0.72,
      1.16,
      0,
    ]);
    cap.add(crown, horn, bell);
    return cap;
  }

  function makeCompanion(materials) {
    const group = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.31, 14, 10), materials.fabricDark, [
      0,
      0,
      0,
    ], [0.8, 1.25, 0.7]);
    const head = mesh(new THREE.SphereGeometry(0.24, 14, 10), materials.wood, [
      0,
      0.48,
      0,
    ], [0.85, 1.15, 0.85]);
    const nose = mesh(new THREE.ConeGeometry(0.08, 0.28, 10), materials.wood, [
      0,
      0.46,
      0.24,
    ]);
    nose.rotation.x = Math.PI / 2;
    const cap = mesh(new THREE.ConeGeometry(0.27, 0.48, 12), materials.fabric, [
      -0.06,
      0.79,
      0,
    ]);
    cap.rotation.z = 0.25;
    const leftEye = mesh(new THREE.SphereGeometry(0.06, 10, 8), materials.eye, [
      -0.085,
      0.57,
      0.2,
    ]);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.085;
    group.add(body, head, nose, cap, leftEye, rightEye);
    group.scale.setScalar(0.9);
    return group;
  }

  function makePuppet(materials) {
    const puppet = new THREE.Group();
    const body = new THREE.Group();
    puppet.add(body);

    const torso = mesh(
      new THREE.CapsuleGeometry(1.05, 1.35, 8, 18),
      materials.fabric,
      [0, -1.16, 0],
      [1.0, 1.0, 0.62],
    );
    const ochrePanel = mesh(
      roundedBox(0.62, 1.85, 0.06, 0.12, materials.ochre),
      materials.ochre,
      [0.25, -1.08, 0.67],
    );
    const collar = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const flap = mesh(
        new THREE.ConeGeometry(0.29, 0.7, 12),
        i % 2 ? materials.fabricDark : materials.fabric,
        [(i - 2) * 0.42, -0.05, 0.2 + Math.abs(i - 2) * -0.04],
      );
      flap.rotation.z = Math.PI;
      flap.rotation.x = -0.25;
      collar.add(flap);
      const bell = mesh(new THREE.SphereGeometry(0.1, 12, 8), materials.gold, [
        (i - 2) * 0.42,
        -0.42,
        0.35,
      ]);
      collar.add(bell);
    }
    body.add(torso, ochrePanel, collar);

    const neck = mesh(new THREE.CylinderGeometry(0.4, 0.47, 0.65, 16), materials.wood, [
      0,
      0.08,
      0,
    ]);
    body.add(neck);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.02, 0);
    body.add(headPivot);
    const face = mesh(
      new THREE.CapsuleGeometry(0.69, 1.3, 8, 20),
      materials.wood,
      [0, 0.33, 0],
      [0.67, 1.26, 0.68],
    );
    face.rotation.z = Math.PI;
    const nose = mesh(
      new THREE.ConeGeometry(0.3, 1.62, 18),
      materials.woodLight,
      [0, 0.18, 0.72],
      [0.76, 1, 0.84],
    );
    nose.rotation.z = Math.PI;
    nose.rotation.x = -0.13;
    const leftEar = mesh(new THREE.ConeGeometry(0.32, 0.72, 14), materials.wood, [
      -0.72,
      0.55,
      0,
    ]);
    leftEar.rotation.z = Math.PI / 2;
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.72;
    rightEar.rotation.z = -Math.PI / 2;

    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.35, 0.48);
    const jaw = mesh(
      new THREE.CapsuleGeometry(0.38, 0.55, 6, 16),
      materials.woodLight,
      [0, -0.17, 0],
      [1.35, 0.56, 0.65],
    );
    jaw.rotation.z = Math.PI / 2;
    jawPivot.add(jaw);

    const eyes = new THREE.Group();
    [-1, 1].forEach((side) => {
      const eye = mesh(new THREE.SphereGeometry(0.15, 14, 10), materials.eye, [
        side * 0.29,
        0.58,
        0.6,
      ], [1, 0.72, 0.55]);
      const pupil = mesh(new THREE.SphereGeometry(0.065, 12, 8), materials.pupil, [
        side * 0.29,
        0.56,
        0.72,
      ]);
      eyes.add(eye, pupil);
    });
    const brows = new THREE.Group();
    [-1, 1].forEach((side) => {
      const brow = mesh(
        new THREE.CapsuleGeometry(0.055, 0.32, 4, 10),
        materials.woodLight,
        [side * 0.29, 0.76, 0.68],
      );
      brow.rotation.z = Math.PI / 2;
      brows.add(brow);
    });
    const cheeks = new THREE.Group();
    [-1, 1].forEach((side) => {
      cheeks.add(
        mesh(
          new THREE.SphereGeometry(0.24, 14, 10),
          materials.woodLight,
          [side * 0.3, -0.02, 0.58],
          [0.78, 0.45, 0.36],
        ),
      );
    });
    const mouth = mesh(
      new THREE.CapsuleGeometry(0.035, 0.48, 4, 12),
      materials.leather,
      [0, -0.46, 0.72],
    );
    mouth.rotation.z = Math.PI / 2;
    const cap = makeConeCap(materials);
    cap.position.y = 1.13;
    headPivot.add(
      face,
      nose,
      leftEar,
      rightEar,
      jawPivot,
      eyes,
      brows,
      cheeks,
      mouth,
      cap,
    );

    const leftArm = makeArm(materials, -1);
    const rightArm = makeArm(materials, 1);
    leftArm.position.set(-1.18, -0.08, 0);
    rightArm.position.set(1.18, -0.08, 0);
    body.add(leftArm, rightArm);

    const companion = makeCompanion(materials);
    companion.position.set(-1.16, -0.18, 0.7);
    companion.rotation.z = 0.18;
    body.add(companion);

    puppet.userData = {
      body,
      head: headPivot,
      jaw: jawPivot,
      eyes,
      leftArm,
      rightArm,
      companion,
    };
    return puppet;
  }

  function makeString(material) {
    const string = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), material);
    string.frustumCulled = false;
    return string;
  }

  function pointString(string, from, to) {
    const delta = new THREE.Vector3().subVectors(to, from);
    string.position.copy(from).addScaledVector(delta, 0.5);
    string.scale.y = delta.length();
    string.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
  }

  function createCard(materials, imageUrl) {
    const side = materials.cardEdge;
    const blank = materials.cardBack;
    const card = mesh(new THREE.BoxGeometry(1.12, 1.68, 0.055, 1, 1, 1), [
      side,
      side,
      side,
      side,
      blank,
      blank,
    ]);
    card.userData.imageUrl = '';
    updateCardTexture(card, imageUrl);
    return card;
  }

  function updateCardTexture(card, imageUrl) {
    if (!imageUrl || card.userData.imageUrl === imageUrl) return;
    card.userData.imageUrl = imageUrl;
    new THREE.TextureLoader().load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        const face = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.62,
          metalness: 0.02,
        });
        card.material[4] = face;
        card.material[5] = face;
        card.material.needsUpdate = true;
      },
      undefined,
      () => console.warn(`Unable to load dealt card texture: ${imageUrl}`),
    );
  }

  class PuppetDealer {
    constructor(host, quality) {
      this.host = host;
      this.quality = quality || 'medium';
      this.clock = new THREE.Clock();
      this.animation = null;
      this.pointer = new THREE.Vector2();
      this.disposed = false;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      this.camera.position.set(0, 1.2, 13.2);

      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: this.quality !== 'low',
        powerPreference: 'high-performance',
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.pointerEvents = 'none';
      host.appendChild(this.renderer.domElement);

      this.materials = {
        wood: new THREE.MeshStandardMaterial({ color: 0x8f4d22, roughness: 0.68 }),
        woodLight: new THREE.MeshStandardMaterial({ color: 0xc47a32, roughness: 0.62 }),
        fabric: new THREE.MeshStandardMaterial({ color: 0x641b26, roughness: 0.76 }),
        fabricDark: new THREE.MeshStandardMaterial({ color: 0x350f19, roughness: 0.8 }),
        ochre: new THREE.MeshStandardMaterial({ color: 0xd49317, roughness: 0.72 }),
        leather: new THREE.MeshStandardMaterial({ color: 0x21100c, roughness: 0.66 }),
        gold: new THREE.MeshStandardMaterial({
          color: 0xf4af17,
          roughness: 0.28,
          metalness: 0.52,
        }),
        eye: new THREE.MeshStandardMaterial({ color: 0xf1e5c9, roughness: 0.4 }),
        pupil: new THREE.MeshStandardMaterial({ color: 0x160b08, roughness: 0.4 }),
        string: new THREE.MeshBasicMaterial({ color: 0x8c724e }),
        cardEdge: new THREE.MeshStandardMaterial({ color: 0xe7d4ad, roughness: 0.52 }),
        cardBack: new THREE.MeshStandardMaterial({ color: 0x7d1b16, roughness: 0.7 }),
      };

      this.puppet = makePuppet(this.materials);
      this.puppet.position.set(0, 0.2, 0);
      this.scene.add(this.puppet);
      this.card = createCard(this.materials, '');
      this.card.visible = false;
      this.scene.add(this.card);

      this.strings = Array.from({ length: 5 }, () => makeString(this.materials.string));
      this.strings.forEach((string) => this.scene.add(string));

      this.setupLights();
      this.setQuality(this.quality);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(host);
      this.resize();
      window.addEventListener('pointermove', this.onPointerMove);
      this.render();
    }

    onPointerMove = (event) => {
      this.pointer.x = event.clientX / window.innerWidth - 0.5;
      this.pointer.y = event.clientY / window.innerHeight - 0.5;
    };

    setupLights() {
      this.scene.add(new THREE.HemisphereLight(0xffd7a2, 0x09070a, 1.25));
      const key = new THREE.SpotLight(0xffa84b, 48, 30, Math.PI / 5, 0.65, 1.2);
      key.position.set(-4.2, 7.5, 8);
      key.target.position.set(0, 0.7, 0);
      this.scene.add(key, key.target);
      this.keyLight = key;
      const fill = new THREE.DirectionalLight(0xb8d6ff, 1.7);
      fill.position.set(3.5, 2.5, 6);
      this.scene.add(fill);
      const rim = new THREE.DirectionalLight(0xff3045, 3.2);
      rim.position.set(4, 5, -4);
      this.scene.add(rim);
    }

    setQuality(quality) {
      this.quality = ['low', 'medium', 'high'].includes(quality) ? quality : 'medium';
      const ratios = { low: 0.8, medium: 1.25, high: 1.8 };
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratios[this.quality]));
      const shadows = this.quality !== 'low';
      this.renderer.shadowMap.enabled = shadows;
      this.renderer.shadowMap.type =
        this.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
      this.keyLight.castShadow = shadows;
      this.keyLight.shadow.mapSize.set(
        this.quality === 'high' ? 2048 : 768,
        this.quality === 'high' ? 2048 : 768,
      );
      setShadow(this.puppet, shadows);
      this.resize();
    }

    resize() {
      const width = Math.max(this.host.clientWidth, 1);
      const height = Math.max(this.host.clientHeight, 1);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      const narrow = width < 720;
      this.camera.fov = narrow ? 42 : 30;
      this.camera.position.z = narrow ? 16.2 : 15.2;
      this.puppet.scale.setScalar(narrow ? 0.82 : 0.94);
      this.puppet.position.y = narrow ? 0.55 : 0.2;
      this.camera.updateProjectionMatrix();
    }

    deal(imageUrl, direction) {
      if (this.animation) return false;
      updateCardTexture(this.card, imageUrl);
      this.animation = {
        kind: direction === 'receive' ? 'receive' : 'deal',
        started: performance.now(),
        duration: direction === 'receive' ? 1650 : 2350,
        attached: false,
        released: false,
      };
      this.card.visible = true;
      this.scene.attach(this.card);
      if (this.animation.kind === 'deal') {
        this.card.position.set(-3.15, -2.65, 1.15);
        this.card.rotation.set(-0.35, 0.12, -0.13);
      } else {
        this.card.position.set(0, -4.1, 2.1);
        this.card.rotation.set(-0.5, 0, 0);
      }
      return true;
    }

    setArmPose(arm, shoulderZ, shoulderX, elbowZ, elbowX, wristZ, wristX) {
      arm.rotation.z = shoulderZ;
      arm.rotation.x = shoulderX;
      arm.userData.forearm.rotation.z = elbowZ;
      arm.userData.forearm.rotation.x = elbowX;
      arm.userData.handPivot.rotation.z = wristZ;
      arm.userData.handPivot.rotation.x = wristX;
    }

    updateIdle(time) {
      const data = this.puppet.userData;
      const breath = Math.sin(time * 1.35) * 0.025;
      data.body.position.y = breath;
      data.body.rotation.z = Math.sin(time * 0.56) * 0.016;
      data.head.rotation.y = clamp(this.pointer.x * 0.22, -0.16, 0.16) +
        Math.sin(time * 0.42) * 0.035;
      data.head.rotation.x = clamp(this.pointer.y * 0.11, -0.08, 0.08);
      data.jaw.rotation.x = 0.03 + Math.max(0, Math.sin(time * 0.8)) * 0.025;
      data.companion.rotation.z = 0.18 + Math.sin(time * 1.1) * 0.035;
      this.setArmPose(data.leftArm, -0.28, -0.08, -0.25, 0.18, 0.08, -0.16);
      this.setArmPose(data.rightArm, -0.36, 0.08, 0.62, -0.12, -0.08, -0.1);
      curlHand(data.leftArm.userData.hand, 0.34);
      curlHand(data.rightArm.userData.hand, 0.28);
    }

    updateDeal(progress) {
      const data = this.puppet.userData;
      const reach = segment(progress, 0.0, 0.25);
      const grip = segment(progress, 0.2, 0.34);
      const lift = segment(progress, 0.3, 0.48);
      const present = segment(progress, 0.46, 0.68);
      const place = segment(progress, 0.66, 0.84);
      const back = segment(progress, 0.82, 1.0);
      const action = reach * (1 - back);
      const shoulderPose = lerp(-0.72, 0.5, present);
      const elbowPose = lerp(-0.38, 1.72, present);

      this.setArmPose(
        data.leftArm,
        lerp(-0.28, shoulderPose, action),
        lerp(-0.08, -0.48, lift * (1 - back)),
        lerp(-0.25, elbowPose, action),
        lerp(0.18, 0.55, lift * (1 - back)),
        lerp(0.08, -0.72, present * (1 - place)),
        lerp(-0.16, -0.5, present * (1 - back)),
      );
      this.setArmPose(
        data.rightArm,
        lerp(-0.36, -0.62, segment(progress, 0.48, 0.72) * (1 - back)),
        0.08,
        lerp(0.62, 1.0, segment(progress, 0.45, 0.68) * (1 - back)),
        -0.12,
        -0.08,
        -0.1,
      );
      curlHand(data.leftArm.userData.hand, lerp(0.18, 0.92, grip) * (1 - place));
      curlHand(data.rightArm.userData.hand, 0.28);
      data.head.rotation.y = lerp(-0.22, 0.08, present);
      data.head.rotation.x = lerp(0.18, -0.08, present);
      data.jaw.rotation.x = Math.sin(progress * Math.PI) * 0.12;

      if (grip > 0.6 && !this.animation.attached) {
        data.leftArm.userData.hand.attach(this.card);
        this.card.position.set(0.04, -0.18, 0.16);
        this.card.rotation.set(0.06, Math.PI, Math.PI);
        this.animation.attached = true;
      }
      if (place > 0.48 && !this.animation.released) {
        this.scene.attach(this.card);
        this.animation.released = true;
      }
      if (this.animation.released) {
        this.card.position.lerp(new THREE.Vector3(0, -4.0, 2.4), 0.12);
        this.card.rotation.x = lerp(this.card.rotation.x, -0.45, 0.12);
        this.card.rotation.z = lerp(this.card.rotation.z, 0, 0.12);
      }
    }

    updateReceive(progress) {
      const data = this.puppet.userData;
      const reach = segment(progress, 0.0, 0.28);
      const grip = segment(progress, 0.22, 0.38);
      const place = segment(progress, 0.48, 0.78);
      const back = segment(progress, 0.78, 1.0);
      const action = reach * (1 - back);
      this.setArmPose(
        data.rightArm,
        lerp(-0.36, -0.94, action),
        lerp(0.08, -0.42, action),
        lerp(0.62, 1.38, action),
        lerp(-0.12, 0.42, action),
        lerp(-0.08, 0.5, place),
        -0.2,
      );
      curlHand(data.rightArm.userData.hand, lerp(0.15, 0.9, grip) * (1 - place));
      curlHand(data.leftArm.userData.hand, 0.34);
      data.head.rotation.y = lerp(0.15, -0.18, place);
      data.head.rotation.x = 0.16 * (1 - back);

      if (grip > 0.65 && !this.animation.attached) {
        data.rightArm.userData.hand.attach(this.card);
        this.card.position.set(-0.02, -0.48, 0.39);
        this.card.rotation.set(0.05, Math.PI, Math.PI);
        this.animation.attached = true;
      }
      if (place > 0.55 && !this.animation.released) {
        this.scene.attach(this.card);
        this.animation.released = true;
      }
      if (this.animation.released) {
        this.card.position.lerp(new THREE.Vector3(3.0, -2.65, 1.1), 0.14);
        this.card.rotation.x = lerp(this.card.rotation.x, -0.35, 0.14);
        this.card.rotation.z = lerp(this.card.rotation.z, 0.15, 0.14);
      }
    }

    updateStrings(time) {
      const data = this.puppet.userData;
      const targets = [
        data.head,
        data.leftArm,
        data.rightArm,
        data.leftArm.userData.handPivot,
        data.rightArm.userData.handPivot,
      ];
      const anchors = [-0.55, -1.3, 1.3, -2.1, 2.1];
      targets.forEach((target, index) => {
        const to = new THREE.Vector3();
        target.getWorldPosition(to);
        to.y += index === 0 ? 0.9 : 0.2;
        const from = new THREE.Vector3(
          anchors[index] + Math.sin(time * 0.7 + index) * 0.025,
          5.5,
          -0.15,
        );
        pointString(this.strings[index], from, to);
      });
    }

    render = () => {
      if (this.disposed) return;
      const time = this.clock.getElapsedTime();
      if (!this.animation) {
        this.updateIdle(time);
      } else {
        const progress = clamp(
          (performance.now() - this.animation.started) / this.animation.duration,
          0,
          1,
        );
        if (this.animation.kind === 'deal') this.updateDeal(progress);
        else this.updateReceive(progress);
        if (progress >= 1) {
          this.card.visible = false;
          this.scene.attach(this.card);
          this.animation = null;
        }
      }
      this.updateStrings(time);
      this.renderer.render(this.scene, this.camera);
      this.frame = requestAnimationFrame(this.render);
    };

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.frame);
      window.removeEventListener('pointermove', this.onPointerMove);
      this.resizeObserver.disconnect();
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }

  window.puppetDealerCreate = function (id, quality) {
    const host = document.getElementById(id);
    if (!host || dealers.has(id)) return;
    dealers.set(id, new PuppetDealer(host, quality));
  };

  window.puppetDealerDeal = function (id, imageUrl) {
    return dealers.get(id)?.deal(imageUrl, 'deal') || false;
  };

  window.puppetDealerReceive = function (id, imageUrl) {
    return dealers.get(id)?.deal(imageUrl, 'receive') || false;
  };

  window.puppetDealerSetQuality = function (id, quality) {
    dealers.get(id)?.setQuality(quality);
  };

  window.puppetDealerDestroy = function (id) {
    dealers.get(id)?.dispose();
    dealers.delete(id);
  };
})();
