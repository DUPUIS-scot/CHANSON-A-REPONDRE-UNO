(function () {
  'use strict';

  const dealers = new Map();
  const pendingMounts = new Map();
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

  function makeDiagnostic(host) {
    const overlay = document.createElement('div');
    overlay.className = 'dealer-3d-diagnostic';
    const debugEnabled =
      window.SHOW_3D_DIAGNOSTICS === true ||
      new URLSearchParams(window.location.search).has('dealerDebug');
    Object.assign(overlay.style, {
      position: 'absolute',
      top: '8px',
      left: '8px',
      zIndex: '4',
      padding: '7px 9px',
      border: '1px solid rgba(255, 201, 40, .72)',
      borderRadius: '6px',
      background: 'rgba(5, 8, 12, .82)',
      color: '#f7e7bd',
      font: '700 10px/1.35 monospace',
      letterSpacing: '.03em',
      whiteSpace: 'pre',
      pointerEvents: 'none',
      display: debugEnabled ? 'block' : 'none',
    });
    host.appendChild(overlay);
    return overlay;
  }

  function showFailure(host, error) {
    const overlay = host.querySelector('.dealer-3d-diagnostic') ||
      makeDiagnostic(host);
    const message = error instanceof Error ? error.message : String(error);
    overlay.style.borderColor = '#ff5f52';
    overlay.style.color = '#ffb0a9';
    overlay.style.display = 'block';
    overlay.textContent =
      `3D DEALER\nWebGL: FAILED\nScene: FAILED\nModel: FAILED\n` +
      `Animation: IDLE\nFPS: 0\n${message}`;
    host.dataset.dealerStatus = 'failed';
    console.error('3D DEALER FAILED', error);
  }

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

  function makeSurfaceTexture(base, accent, seed, direction) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = base;
    context.fillRect(0, 0, size, size);
    let value = seed || 37;
    const random = () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
    context.globalAlpha = 0.18;
    for (let i = 0; i < 1200; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const width = direction === 'wood' ? 8 + random() * 35 : 1 + random() * 4;
      const height = direction === 'wood' ? 0.35 + random() * 1.4 : width;
      context.fillStyle = random() > 0.48 ? accent : '#120b08';
      context.fillRect(x, y, width, height);
    }
    if (direction === 'wood') {
      context.globalAlpha = 0.22;
      context.strokeStyle = accent;
      context.lineWidth = 1.2;
      for (let y = 12; y < size; y += 18 + random() * 13) {
        context.beginPath();
        context.moveTo(0, y);
        for (let x = 0; x <= size; x += 16) {
          context.lineTo(x, y + Math.sin((x + seed * 3) * 0.07) * 3.5);
        }
        context.stroke();
      }
      context.globalAlpha = 0.14;
      context.strokeStyle = '#f2c276';
      for (let i = 0; i < 18; i += 1) {
        const x = random() * size;
        context.beginPath();
        context.moveTo(x, random() * size);
        context.lineTo(x + random() * 34 - 17, random() * size);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(direction === 'wood' ? 1.8 : 2.5, direction === 'wood' ? 3.5 : 2.5);
    texture.anisotropy = 4;
    return texture;
  }

  function taperedSegment(material, length, radiusTop, radiusBottom) {
    return mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 14, 3),
      material,
    );
  }

  function pointSegment(object, from, to) {
    const delta = new THREE.Vector3().subVectors(to, from);
    object.position.copy(from).addScaledVector(delta, 0.5);
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize(),
    );
    object.scale.y = delta.length();
    return object;
  }

  function makeFinger(material, length, radius) {
    const root = new THREE.Group();
    const middle = new THREE.Group();
    const tip = new THREE.Group();
    const sectionLength = length / 3;
    const makeSection = (index) => {
      const section = taperedSegment(
        material,
        sectionLength * 0.9,
        radius * (0.82 - index * 0.08),
        radius * (1 - index * 0.08),
      );
      section.position.y = -sectionLength * 0.48;
      return section;
    };
    const first = makeSection(0);
    const second = makeSection(1);
    const third = makeSection(2);
    root.add(first, middle);
    middle.position.y = -sectionLength;
    middle.add(second, tip);
    tip.position.y = -sectionLength;
    tip.add(third);
    [root, middle, tip].forEach((joint, index) => {
      joint.add(
        mesh(
          new THREE.SphereGeometry(radius * (1 - index * .08), 10, 7),
          material,
          [0, 0, 0],
          [1, .78, .82],
        ),
      );
    });
    root.userData.joints = [root, middle, tip];
    return root;
  }

  function makeHand(material, mirrored) {
    const hand = new THREE.Group();
    const palm = mesh(
      new THREE.CapsuleGeometry(0.31, 0.54, 7, 12),
      material,
      [0, 0, 0],
      [1, 1, 0.42],
    );
    palm.rotation.z = Math.PI;
    hand.add(palm);

    const fingers = [];
    const xPositions = [-0.26, -0.09, 0.09, 0.26];
    xPositions.forEach((x, index) => {
      const finger = makeFinger(
        material,
        0.72 - Math.abs(index - 1.5) * 0.055,
        0.072,
      );
      finger.position.set(x, -0.39, 0.025);
      finger.rotation.z = (index - 1.5) * 0.035;
      hand.add(finger);
      fingers.push(finger);
    });
    const thumb = makeFinger(material, 0.57, 0.082);
    thumb.position.set(mirrored ? -0.36 : 0.36, -0.01, 0.02);
    thumb.rotation.z = mirrored ? -1.02 : 1.02;
    thumb.rotation.y = mirrored ? -.18 : .18;
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
        joint.rotation.x =
          amount * multiplier * (0.38 + jointIndex * 0.26) +
          (index < 4 ? index * .018 : 0);
      });
    });
  }

  function makeArm(materials, side) {
    const shoulder = new THREE.Group();
    const sleeve = taperedSegment(materials.fabric, 1.04, .21, .31);
    sleeve.position.y = -.62;
    const sleeveCuff = mesh(
      new THREE.TorusGeometry(.235, .055, 8, 18),
      materials.ochreDark,
      [0, -1.14, 0],
    );
    sleeveCuff.rotation.x = Math.PI / 2;
    const elbow = mesh(new THREE.SphereGeometry(0.24, 16, 12), materials.wood, [
      0,
      -1.29,
      0,
    ]);
    const forearmPivot = new THREE.Group();
    forearmPivot.position.y = -1.29;
    const forearm = taperedSegment(materials.wood, 1.0, .16, .235);
    forearm.position.y = -.56;
    forearm.scale.z = .86;
    const wrist = mesh(new THREE.SphereGeometry(0.17, 14, 10), materials.wood, [
      0,
      -1.08,
      0,
    ]);
    const handPivot = new THREE.Group();
    handPivot.position.y = -1.18;
    const hand = makeHand(materials.wood, side < 0);
    hand.rotation.z = Math.PI;
    hand.scale.setScalar(.88);
    handPivot.add(hand);
    forearmPivot.add(forearm, wrist, handPivot);
    shoulder.add(sleeve, sleeveCuff, elbow, forearmPivot);
    shoulder.userData.forearm = forearmPivot;
    shoulder.userData.handPivot = handPivot;
    shoulder.userData.hand = hand;
    return shoulder;
  }

  function makeConeCap(materials) {
    const cap = new THREE.Group();
    const crown = mesh(
      new THREE.SphereGeometry(0.78, 28, 18),
      materials.fabric,
      [0, 0.01, -0.015],
      [1, 0.38, 0.92],
    );
    const browBand = mesh(
      new THREE.TorusGeometry(.66, .09, 8, 32, Math.PI * 1.7),
      materials.fabricDark,
      [0, -.13, .04],
    );
    browBand.rotation.z = Math.PI * .15;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(.14, .12, -.03),
      new THREE.Vector3(.42, .28, -.03),
      new THREE.Vector3(.55, .55, -.02),
      new THREE.Vector3(.46, .78, .01),
      new THREE.Vector3(.28, .88, .04),
    ]);
    const horn = mesh(
      new THREE.TubeGeometry(curve, 26, .17, 10, false),
      materials.fabric,
    );
    const hornTip = mesh(
      new THREE.ConeGeometry(.17, .45, 14),
      materials.fabricDark,
      [.17, 1.02, .04],
    );
    hornTip.rotation.z = .62;
    const bell = mesh(new THREE.SphereGeometry(0.15, 14, 10), materials.gold, [
      .01,
      1.18,
      .06,
    ]);
    const bellCollar = mesh(
      new THREE.TorusGeometry(.11, .026, 6, 14),
      materials.leather,
      [.01, 1.09, .06],
    );
    cap.add(crown, browBand, horn, hornTip, bellCollar, bell);
    return cap;
  }

  function makeCompanion(materials) {
    const group = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.3, 18, 12), materials.olive, [
      0,
      0,
      0,
    ], [0.82, 1.28, 0.7]);
    const vest = mesh(new THREE.SphereGeometry(.28, 16, 12), materials.fabricDark, [
      0,
      .03,
      .17,
    ], [.7, 1.05, .32]);
    const head = mesh(new THREE.SphereGeometry(0.28, 18, 14), materials.wood, [
      0,
      0.51,
      0,
    ], [0.82, 1.14, 0.78]);
    const nose = mesh(new THREE.SphereGeometry(.08, 12, 8), materials.woodLight, [
      0,
      .45,
      .26,
    ], [.72, .72, 1.45]);
    const cap = mesh(new THREE.SphereGeometry(.29, 16, 10), materials.fabric, [
      0,
      .76,
      -.01,
    ], [1, .42, .9]);
    const hoodTip = mesh(new THREE.ConeGeometry(.12, .42, 12), materials.fabric, [
      -.12,
      .98,
      0,
    ]);
    hoodTip.rotation.z = .34;
    const leftEye = mesh(new THREE.SphereGeometry(0.065, 10, 8), materials.eye, [
      -0.085,
      0.57,
      0.215,
    ]);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.085;
    rightEye.position.y = .55;
    const leftPupil = mesh(new THREE.SphereGeometry(.026, 8, 6), materials.pupil, [
      -.084, .56, .273,
    ]);
    const rightPupil = leftPupil.clone();
    rightPupil.position.x = .084;
    rightPupil.position.y = .54;
    const eyelid = mesh(new THREE.SphereGeometry(.07, 10, 8), materials.woodLight, [
      -.085, .61, .25,
    ], [1.1, .4, .6]);
    const otherEyelid = eyelid.clone();
    otherEyelid.position.x = .085;
    otherEyelid.position.y = .59;
    const smile = mesh(
      new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI),
      materials.leather,
      [0, 0.36, 0.22],
    );
    smile.rotation.z = Math.PI;
    const bell = mesh(new THREE.SphereGeometry(0.065, 10, 8), materials.gold, [
      -.2,
      1.17,
      0,
    ]);
    const arms = new THREE.Group();
    [-1, 1].forEach((side) => {
      const arm = taperedSegment(materials.ochre, .34, .045, .065);
      arm.position.set(side * .25, .06, .08);
      arm.rotation.z = side * -.72;
      const hand = mesh(
        new THREE.SphereGeometry(.075, 10, 8),
        materials.woodLight,
        [side * .39, -.07, .12],
        [1, 1.35, .75],
      );
      arms.add(arm, hand);
    });
    group.add(
      body,
      vest,
      head,
      nose,
      cap,
      hoodTip,
      leftEye,
      rightEye,
      leftPupil,
      rightPupil,
      eyelid,
      otherEyelid,
      smile,
      bell,
      arms,
    );
    group.scale.setScalar(1.22);
    return group;
  }

  function makePuppet(materials) {
    const puppet = new THREE.Group();
    const body = new THREE.Group();
    puppet.add(body);

    const torso = mesh(
      new THREE.CapsuleGeometry(.88, 1.22, 9, 20),
      materials.fabric,
      [0, -1.03, 0],
      [1.04, 1, .68],
    );
    const waist = mesh(
      new THREE.CylinderGeometry(.66, .82, .62, 18, 2),
      materials.olive,
      [0, -1.88, 0],
      [1, 1, .72],
    );
    const leftPanel = mesh(
      roundedBox(.52, 1.4, .055, .18, materials.fabricDark),
      materials.fabricDark,
      [-.25, -1.12, .7],
    );
    leftPanel.rotation.z = -.04;
    const rightPanel = mesh(
      roundedBox(.5, 1.34, .06, .18, materials.ochre),
      materials.ochre,
      [.27, -1.08, .705],
    );
    rightPanel.rotation.z = .055;
    const belt = mesh(
      new THREE.TorusGeometry(.72, .09, 8, 28, Math.PI),
      materials.leather,
      [0, -1.72, .14],
      [1, 1, .68],
    );
    belt.rotation.x = Math.PI / 2;
    const beltBuckle = mesh(
      new THREE.TorusGeometry(.13, .035, 6, 16),
      materials.gold,
      [0, -1.72, .69],
    );
    const collar = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const flap = mesh(
        new THREE.ConeGeometry(.24, .58, 12),
        i % 2 ? materials.fabricDark : materials.fabric,
        [(i - 2) * .34, -.03, .2 + Math.abs(i - 2) * -.04],
      );
      flap.rotation.z = Math.PI;
      flap.rotation.x = -0.25;
      collar.add(flap);
      const bell = mesh(new THREE.SphereGeometry(0.1, 12, 8), materials.gold, [
        (i - 2) * .34,
        -.34,
        .36,
      ]);
      collar.add(bell);
    }
    body.add(torso, waist, leftPanel, rightPanel, belt, beltBuckle, collar);

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
      new THREE.CapsuleGeometry(.65, 1.42, 10, 24),
      materials.wood,
      [0, .32, 0],
      [.62, 1.28, .72],
    );
    face.rotation.z = Math.PI;
    const nose = mesh(
      new THREE.CylinderGeometry(.12, .205, 1.13, 18, 5),
      materials.woodLight,
      [0, .18, .74],
      [.82, 1, 1],
    );
    nose.rotation.x = -.09;
    const leftEar = mesh(new THREE.ConeGeometry(0.36, 0.84, 16), materials.wood, [
      -0.74,
      0.55,
      0,
    ]);
    leftEar.rotation.z = Math.PI / 2;
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.74;
    rightEar.rotation.z = -Math.PI / 2;
    const innerEars = new THREE.Group();
    [-1, 1].forEach((side) => {
      innerEars.add(
        mesh(
          new THREE.SphereGeometry(.18, 12, 9),
          materials.woodDark,
          [side * .69, .55, .08],
          [.45, 1.1, .24],
        ),
      );
    });

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
        side < 0 ? 0.55 : 0.58,
        0.72,
      ]);
      const lid = mesh(
        new THREE.SphereGeometry(0.17, 16, 10),
        materials.woodLight,
        [side * 0.29, side < 0 ? 0.64 : 0.67, 0.675],
        [1.08, .38, .42],
      );
      lid.rotation.z = side * .09;
      eyes.add(eye, pupil, lid);
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
    const forehead = mesh(
      new THREE.SphereGeometry(0.5, 18, 12),
      materials.woodLight,
      [0, 0.96, 0.16],
      [.82, .48, .7],
    );
    const noseTip = mesh(
      new THREE.SphereGeometry(0.22, 16, 12),
      materials.woodLight,
      [0, -.4, .87],
      [.82, .68, 1.28],
    );
    const noseHook = mesh(
      new THREE.CapsuleGeometry(.105, .24, 5, 12),
      materials.woodLight,
      [0, -.49, .97],
      [.82, 1, .88],
    );
    noseHook.rotation.x = 1.1;
    const chin = mesh(
      new THREE.SphereGeometry(0.29, 16, 12),
      materials.wood,
      [0, -0.72, 0.38],
      [1.25, .68, .72],
    );
    const templePins = new THREE.Group();
    [-1, 1].forEach((side) => {
      templePins.add(
        mesh(
          new THREE.CylinderGeometry(0.075, 0.075, 0.055, 14),
          materials.gold,
          [side * .5, .13, .6],
        ),
      );
    });
    const cap = makeConeCap(materials);
    cap.position.y = 1.13;
    headPivot.add(
      face,
      nose,
      leftEar,
      rightEar,
      innerEars,
      jawPivot,
      eyes,
      brows,
      cheeks,
      mouth,
      forehead,
      noseTip,
      noseHook,
      chin,
      templePins,
      cap,
    );

    const leftArm = makeArm(materials, -1);
    const rightArm = makeArm(materials, 1);
    leftArm.position.set(-1.18, 0.42, 0);
    rightArm.position.set(1.18, 0.48, 0);
    body.add(leftArm, rightArm);

    const companion = makeCompanion(materials);
    companion.position.set(-1.58, 0.02, 0.76);
    companion.rotation.z = 0.18;
    const presentationCard = createCard(
      materials,
      'assets/assets/images/card_back.png',
    );
    presentationCard.scale.setScalar(.78);
    presentationCard.position.set(-.7, -.42, 1.04);
    presentationCard.rotation.set(.03, -.08, -.05);
    const tableCard = createCard(materials, 'assets/assets/images/card_back.png');
    tableCard.scale.setScalar(.68);
    tableCard.position.set(1.72, -1.86, 1.0);
    tableCard.rotation.set(-1.18, .08, -.16);
    body.add(companion, presentationCard, tableCard);

    puppet.userData = {
      body,
      head: headPivot,
      jaw: jawPivot,
      eyes,
      leftArm,
      rightArm,
      companion,
      presentationCard,
      tableCard,
    };
    return puppet;
  }

  function makeString(material) {
    const string = mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), material);
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
    card.userData.textureStatus = 'idle';
    updateCardTexture(card, imageUrl);
    return card;
  }

  function updateCardTexture(card, imageUrl) {
    if (!imageUrl || card.userData.imageUrl === imageUrl) return;
    card.userData.imageUrl = imageUrl;
    card.userData.textureStatus = 'loading';
    card.userData.onTextureStatus?.('loading');
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
        const edge = card.material[0];
        card.material = [edge, edge, edge, edge, face, face];
        face.needsUpdate = true;
        card.userData.textureStatus = 'ready';
        card.userData.onTextureStatus?.('ready');
      },
      undefined,
      () => {
        card.userData.textureStatus = 'failed';
        card.userData.onTextureStatus?.('failed');
        console.warn(`Unable to load dealt card texture: ${imageUrl}`);
      },
    );
  }

  class PuppetDealer {
    constructor(host, quality) {
      this.host = host;
      this.host.dataset.dealerStatus = 'loading';
      this.quality = quality || 'medium';
      this.clock = new THREE.Clock();
      this.animation = null;
      this.pointer = new THREE.Vector2();
      this.disposed = false;
      this.framesSinceSample = 0;
      this.fps = 0;
      this.lastFpsSample = performance.now();
      this.status = {
        webgl: 'LOADING',
        scene: 'LOADING',
        model: 'LOADING',
        card: 'IDLE',
        animation: 'IDLE',
      };
      this.diagnostic = makeDiagnostic(host);
      this.updateDiagnostic();
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      this.camera.position.set(0, 1.65, 10.8);
      this.camera.lookAt(0, 0.35, 0);

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
      this.renderer.domElement.style.display = 'block';
      this.renderer.domElement.style.pointerEvents = 'none';
      this.renderer.domElement.id = 'dealer-3d-canvas';
      this.renderer.domElement.dataset.renderer = 'three.js';
      host.appendChild(this.renderer.domElement);
      this.status.webgl = this.renderer.getContext() ? 'READY' : 'FAILED';
      this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.status.webgl = 'FAILED';
        this.updateDiagnostic('WebGL context lost');
      });

      const honeyWood = makeSurfaceTexture('#9d5a29', '#4a2414', 41, 'wood');
      const lightWood = makeSurfaceTexture('#c0803f', '#61331a', 73, 'wood');
      const darkWood = makeSurfaceTexture('#5b301c', '#26120c', 97, 'wood');
      const burgundy = makeSurfaceTexture('#681a25', '#270a10', 113, 'cloth');
      const deepBurgundy = makeSurfaceTexture('#351018', '#140508', 131, 'cloth');
      const ochre = makeSurfaceTexture('#c98b22', '#70420d', 149, 'cloth');
      const olive = makeSurfaceTexture('#4c5228', '#20230f', 167, 'cloth');
      this.materials = {
        wood: new THREE.MeshStandardMaterial({
          map: honeyWood,
          bumpMap: honeyWood,
          bumpScale: .025,
          roughness: .54,
        }),
        woodLight: new THREE.MeshStandardMaterial({
          map: lightWood,
          bumpMap: lightWood,
          bumpScale: .022,
          roughness: .5,
        }),
        woodDark: new THREE.MeshStandardMaterial({
          map: darkWood,
          bumpMap: darkWood,
          bumpScale: .02,
          roughness: .62,
        }),
        fabric: new THREE.MeshStandardMaterial({
          map: burgundy,
          bumpMap: burgundy,
          bumpScale: .012,
          roughness: .74,
        }),
        fabricDark: new THREE.MeshStandardMaterial({
          map: deepBurgundy,
          bumpMap: deepBurgundy,
          bumpScale: .012,
          roughness: .8,
        }),
        ochre: new THREE.MeshStandardMaterial({
          map: ochre,
          bumpMap: ochre,
          bumpScale: .01,
          roughness: .7,
        }),
        ochreDark: new THREE.MeshStandardMaterial({
          color: 0x6f4518,
          roughness: .72,
        }),
        olive: new THREE.MeshStandardMaterial({
          map: olive,
          bumpMap: olive,
          bumpScale: .01,
          roughness: .76,
        }),
        leather: new THREE.MeshStandardMaterial({ color: 0x21100c, roughness: 0.66 }),
        gold: new THREE.MeshStandardMaterial({
          color: 0xf4af17,
          roughness: 0.28,
          metalness: 0.52,
        }),
        eye: new THREE.MeshStandardMaterial({ color: 0xf1e5c9, roughness: 0.4 }),
        pupil: new THREE.MeshStandardMaterial({ color: 0x160b08, roughness: 0.4 }),
        string: new THREE.MeshBasicMaterial({
          color: 0xc2a274,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        }),
        cardEdge: new THREE.MeshStandardMaterial({ color: 0xe7d4ad, roughness: 0.52 }),
        cardBack: new THREE.MeshStandardMaterial({ color: 0x7d1b16, roughness: 0.7 }),
      };

      this.puppet = makePuppet(this.materials);
      this.puppet.position.set(0, -0.12, 0);
      this.puppet.traverse((object) => {
        object.visible = true;
        if (object.isMesh) object.frustumCulled = false;
      });
      this.scene.add(this.puppet);
      this.card = createCard(this.materials, '');
      this.card.userData.onTextureStatus = (status) => {
        this.status.card = status.toUpperCase();
        this.host.dataset.cardTexture = status;
        this.updateDiagnostic();
      };
      this.card.visible = false;
      this.scene.add(this.card);

      this.strings = Array.from({ length: 4 }, () => makeString(this.materials.string));
      this.strings.forEach((string) => this.scene.add(string));

      this.setupLights();
      this.status.scene = 'READY';
      this.status.model = 'READY';
      this.setQuality(this.quality);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(host);
      this.resize();
      window.addEventListener('pointermove', this.onPointerMove);
      const bounds = new THREE.Box3().setFromObject(this.puppet);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const meshCount = (() => {
        let count = 0;
        this.puppet.traverse((object) => {
          if (object.isMesh) count += 1;
        });
        return count;
      })();
      this.host.dataset.dealerStatus = 'ready';
      console.info('DEALER MODEL LOADED', {
        meshCount,
        boundingBoxSize: size.toArray(),
        boundingBoxCenter: center.toArray(),
        modelPosition: this.puppet.position.toArray(),
        cameraPosition: this.camera.position.toArray(),
        canvasSize: [host.clientWidth, host.clientHeight],
      });
      this.updateDiagnostic();
      this.render();
    }

    updateDiagnostic(error) {
      if (!this.diagnostic) return;
      this.diagnostic.textContent =
        `3D DEALER\nWebGL: ${this.status.webgl}\n` +
        `Scene: ${this.status.scene}\nModel: ${this.status.model}\n` +
        `Card: ${this.status.card}\n` +
        `Animation: ${this.status.animation}\nFPS: ${this.fps}` +
        (error ? `\n${error}` : '');
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
      this.camera.fov = narrow ? 36 : 30;
      this.puppet.scale.setScalar(narrow ? .92 : 1.1);
      this.puppet.position.y = narrow ? .28 : -.12;
      this.camera.position.set(0, narrow ? 1.5 : 1.65, narrow ? 11.3 : 10.8);
      this.camera.lookAt(0, narrow ? .45 : .35, 0);
      this.camera.updateProjectionMatrix();
      this.host.dataset.canvasWidth = String(width);
      this.host.dataset.canvasHeight = String(height);
    }

    deal(imageUrl, direction) {
      if (this.animation) return false;
      this.puppet.userData.presentationCard.visible = false;
      updateCardTexture(this.card, imageUrl);
      this.animation = {
        kind: direction === 'receive' ? 'receive' : 'deal',
        started: performance.now(),
        duration: direction === 'receive' ? 1650 : 2350,
        attached: false,
        released: false,
      };
      this.status.animation = 'DEALING';
      this.host.dataset.dealerAnimation = 'dealing';
      this.updateDiagnostic();
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
      data.head.rotation.z = -.035 + Math.sin(time * .48) * .012;
      this.setArmPose(data.leftArm, -0.66, -0.18, 1.88, 0.28, -0.36, -0.2);
      this.setArmPose(data.rightArm, 0.48, 0.14, -0.5, -0.2, 0.1, -0.05);
      curlHand(data.leftArm.userData.hand, 0.72);
      curlHand(data.rightArm.userData.hand, 0.48);
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
        data.rightArm.userData.handPivot,
      ];
      const anchors = [-0.5, -1.42, 1.34, 2.05];
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
      this.framesSinceSample += 1;
      const now = performance.now();
      if (now - this.lastFpsSample >= 500) {
        this.fps = Math.round(
          (this.framesSinceSample * 1000) / (now - this.lastFpsSample),
        );
        this.framesSinceSample = 0;
        this.lastFpsSample = now;
        this.updateDiagnostic();
      }
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
          this.puppet.userData.presentationCard.visible = true;
          this.animation = null;
          this.status.animation = 'IDLE';
          this.host.dataset.dealerAnimation = 'idle';
          this.updateDiagnostic();
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
      this.diagnostic?.remove();
    }
  }

  window.puppetDealerCreate = function (id, quality) {
    if (dealers.has(id) || pendingMounts.has(id)) return;
    const started = performance.now();
    const pending = { frame: 0, cancelled: false };
    pendingMounts.set(id, pending);
    console.info('3D DEALER MOUNT REQUESTED', { id, quality });

    const mount = () => {
      if (pending.cancelled || dealers.has(id)) {
        pendingMounts.delete(id);
        return;
      }
      const host = document.getElementById(id);
      const hasSize = host && host.clientWidth > 0 && host.clientHeight > 0;
      if (host?.isConnected && hasSize) {
        pendingMounts.delete(id);
        try {
          dealers.set(id, new PuppetDealer(host, quality));
        } catch (error) {
          showFailure(host, error);
        }
        return;
      }
      if (performance.now() - started > 8000) {
        pendingMounts.delete(id);
        const error = new Error(
          `Platform view "${id}" was not connected with a non-zero size.`,
        );
        if (host) showFailure(host, error);
        else console.error('3D DEALER FAILED', error);
        return;
      }
      pending.frame = requestAnimationFrame(mount);
    };
    pending.frame = requestAnimationFrame(mount);
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
    const pending = pendingMounts.get(id);
    if (pending) {
      pending.cancelled = true;
      cancelAnimationFrame(pending.frame);
      pendingMounts.delete(id);
    }
    dealers.get(id)?.dispose();
    dealers.delete(id);
  };
})();
