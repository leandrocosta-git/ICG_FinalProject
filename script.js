var scene,
  camera, fieldOfView, aspectRatio, nearPlane, farPlane,
  gobalLight, shadowLight, backLight,
  renderer,
  container,
  controls,
  clock;
var delta = 0;
var floorRadius = 200;
var speed = 6;
var distance = 0;
var level = 1;
var levelInterval;
var levelUpdateFreq = 3000;
var initSpeed = 5;
var maxSpeed = 48;
var lanternFishPos = .65;
var lanternFishPosTarget = .65;
var floorRotation = 0;
var collisionObstacle = 10;
var collisionBonus = 20;
var gameStatus = "play";
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var lanternFishAcceleration = 0.004;
var malusClearColor = 0x0e1521;
var malusClearAlpha = 1;
var zPerspective = false;
var audio = new Audio('audio/phantomm.mp3')

var fieldGameOver, fieldDistance;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH, windowHalfX, windowHalfY,
  mousePos = {
    x: 0,
    y: 0
  };

//3D OBJECTS VARIABLES

var submarine;

// Materials
var blackMat = new THREE.MeshPhongMaterial({
  color: 0x100707,
  shading: THREE.FlatShading,
});

var brownMat = new THREE.MeshPhongMaterial({
  color: 0xb44b39,
  shininess: 0,
  shading: THREE.FlatShading,
});

var greenMat = new THREE.MeshPhongMaterial({
  color: 0x123B07,
  shininess: 0,
  shading: THREE.FlatShading,
});

var pinkMat = new THREE.MeshPhongMaterial({
  color: 0xdc5f45,//0xb43b29,//0xff5b49,
  shininess: 0,
  shading: THREE.FlatShading,
});

var yellowMat = new THREE.MeshPhongMaterial({
  color: 0xffdd00,
  shininess: 0,
  shading: THREE.FlatShading,
});

var lightBrownMat = new THREE.MeshPhongMaterial({
  color: 0xe07a57,
  shading: THREE.FlatShading,
});

var whiteMat = new THREE.MeshPhongMaterial({
  color: 0xa49789,
  shading: THREE.FlatShading,
});
var skinMat = new THREE.MeshPhongMaterial({
  color: 0xff9ea5,
  shading: THREE.FlatShading
});


// OTHER VARIABLES

var PI = Math.PI;

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function initScreenAnd3D() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  scene = new THREE.Scene();

  scene.fog = new THREE.Fog(0x0E1521, 0.9);

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = 2;
  farPlane = 2000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.x = 0;
  camera.position.z = cameraPosGame;
  camera.position.y = 30;
  camera.lookAt(new THREE.Vector3(0, 30, 0));

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(malusClearColor, malusClearAlpha);

  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
      audio.play();
      if (gameStatus === "gameOver") {
        //replay();
      } else if (gameStatus === "play") {
        submarine.jump();
      }
    } else if (event.key === 'c') {
      // Toggle zPerspective when 'c' is pressed
      zPerspective = !zPerspective;

      // Update camera settings based on zPerspective
      if (zPerspective) {
        fieldOfView = 50;
        camera.position.x = 0;
        camera.position.z = cameraPosGame;
        camera.position.y = 30;
        camera.lookAt(new THREE.Vector3(0, 30, 0));
      } else {
        fieldOfView = 80;
        camera.position.set(-60, 70, 0);
        camera.lookAt(new THREE.Vector3(0, 35, 0));
      }

      camera.updateProjectionMatrix(); // Update the camera with the new settings
    }
  });
  document.addEventListener("touchend", handleMouseDown, false);

  clock = new THREE.Clock();
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseDown(event) {
  if (gameStatus == "play") Submarine.jump();
  else if (gameStatus == "readyToReplay") {
    replay();
  }
}

function createLights() {
  globalLight = new THREE.AmbientLight(0x222222, 0.02);

  shadowLight = new THREE.DirectionalLight(0xffffff, 0.5);
  shadowLight.position.set(-30, 40, 20);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 2000;
  shadowLight.shadow.mapSize.width = shadowLight.shadow.mapSize.height = 2048;

  scene.add(globalLight);
  scene.add(shadowLight);

}

function createFloor() {

  floorShadow = new THREE.Mesh(new THREE.SphereGeometry(floorRadius, 50, 50), new THREE.MeshPhongMaterial({
    color: 0x917a5,
    specular: 0x000000,
    shininess: 1,
    transparent: true,
    opacity: .5
  }));
  //floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.receiveShadow = true;

  floorGrass = new THREE.Mesh(new THREE.SphereGeometry(floorRadius - .5, 50, 50), new THREE.MeshBasicMaterial({
    color: 0xd2b48c,
  }));
  //floor.rotation.x = -Math.PI / 2;
  floorGrass.receiveShadow = true;

  floor = new THREE.Group();
  floor.position.y = -floorRadius;

  floor.add(floorShadow);
  floor.add(floorGrass);
  scene.add(floor);

}

Submarine = function () {
  this.mesh = new THREE.Group(); // Main group for all submarine parts

  // Creating the main body of the submarine
  var bodyGeom = new THREE.CylinderGeometry(3, 3, 9, 16, 1);
  var bodyMat = new THREE.MeshPhongMaterial({ color: whiteMat, shading: THREE.FlatShading });
  this.body = new THREE.Mesh(bodyGeom, bodyMat);

  var bodyFront = new THREE.CylinderGeometry(3, 2, 2, 16, 1);
  this.bodyFront = new THREE.Mesh(bodyFront, bodyMat);
  this.bodyFront.position.set(0, 5.5, 0);
  this.bodyFront.rotation.x = Math.PI;

  this.body.add(this.bodyFront);
  this.body.position.set(0, 10, 0);

  this.body.rotation.z = Math.PI / 2;
  this.body.rotation.y = Math.PI / 2;
  this.mesh.add(this.body);

  // Create the Propeller group
  var propeller = new THREE.Group();
  // Create the blades
  var bladeGeom = new THREE.BoxGeometry(0.5, 1, 4, 1);
  var bladeMat = new THREE.MeshPhongMaterial({ color: 0x23190f, shading: THREE.FlatShading });
  var blade1 = new THREE.Mesh(bladeGeom, bladeMat);
  blade1.position.set(2.5, 0, 0);

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI / 2;

  propeller.add(blade1);
  propeller.add(blade2);

  var propellerHolderGeom = new THREE.BoxGeometry(1, 1, 1, 1);
  var propellerHolder = new THREE.Mesh(propellerHolderGeom, bodyMat);
  propellerHolder.position.set(3, 0, 0);
  propeller.add(propellerHolder);

  propeller.rotation.y = Math.PI / 2;
  propeller.rotation.z = Math.PI / 2;
  propeller.position.set(0, -8, 0);

  this.body.add(propeller);

  // Create Conning tower
  var towerGeom = new THREE.CylinderGeometry(2, 2, 2, 6, 1);
  towerGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 3, 0));
  var tower = new THREE.Mesh(towerGeom, whiteMat);
  tower.position.set(0, 10, 0);
  this.mesh.add(tower);

  // Create the  Periscope
  var periscopeGeom = new THREE.CylinderGeometry(0.5, 0.5, 5, 6, 1);
  periscopeGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 4, 0));
  var periscope = new THREE.Mesh(periscopeGeom, whiteMat);
  periscope.position.set(0, 10, 0);

  var periscope2Geom = new THREE.CylinderGeometry(0.5, 0.5, 2, 6, 1);
  periscope2Geom.applyMatrix(new THREE.Matrix4().makeTranslation(0, -1, 0));
  var periscope2 = new THREE.Mesh(periscope2Geom, whiteMat);
  periscope2.position.set(0, 16.1, 0);
  periscope2.rotation.z = Math.PI / 2;
  periscope2.rotation.y = Math.PI / 2;

  this.mesh.add(periscope2);
  this.mesh.add(periscope);

  this.mesh.scale.set(2, 2, 2);
};

Submarine.prototype.run = function () {
  this.status = "running";

  var s = Math.min(speed, maxSpeed);
  this.runningCycle += delta * s * .7;
  this.runningCycle = this.runningCycle % (Math.PI * 2);
  var t = this.runningCycle;

  var amp = 2;
  var disp = .2;
}

Submarine.prototype.jump = function () {
  if (this.status == "jumping") return;
  this.status = "jumping";
  var _this = this;
  var totalSpeed = 10 / speed;
  var jumpHeight = 45;
  TweenMax.to(this.mesh.position, totalSpeed / 2, { y: jumpHeight, ease: Power2.easeOut });
  TweenMax.to(this.mesh.position, totalSpeed / 2, {
    y: 0, ease: Power4.easeIn, delay: totalSpeed / 2, onComplete: function () {
      //t = 0;
      _this.status = "running";
    }
  });
}

BonusParticles = function () {
  this.mesh = new THREE.Group();
  var bigParticleGeom = new THREE.CubeGeometry(10, 10, 10, 1);
  var smallParticleGeom = new THREE.CubeGeometry(5, 5, 5, 1);
  this.parts = [];
  for (var i = 0; i < 10; i++) {
    var partPink = new THREE.Mesh(bigParticleGeom, yellowMat);
    var partGreen = new THREE.Mesh(smallParticleGeom, greenMat);
    partGreen.scale.set(.5, .5, .5);
    this.parts.push(partPink);
    this.parts.push(partGreen);
    this.mesh.add(partPink);
    this.mesh.add(partGreen);
  }
}

BonusParticles.prototype.explose = function () {
  var _this = this;
  var explosionSpeed = .5;
  for (var i = 0; i < this.parts.length; i++) {
    var tx = -50 + Math.random() * 100;
    var ty = -50 + Math.random() * 100;
    var tz = -50 + Math.random() * 100;
    var p = this.parts[i];
    p.position.set(0, 0, 0);
    p.scale.set(1, 1, 1);
    p.visible = true;
    var s = explosionSpeed + Math.random() * .5;
    TweenMax.to(p.position, s, { x: tx, y: ty, z: tz, ease: Power4.easeOut });
    TweenMax.to(p.scale, s, { x: .01, y: .01, z: .01, ease: Power4.easeOut, onComplete: removeParticle, onCompleteParams: [p] });
  }
}

function removeParticle(p) {
  p.visible = false;
}

LanternFish = function () {
  this.runningCycle = 0;
  this.mesh = new THREE.Group();
  this.body = new THREE.Group();

  // The body of the lanternfish, you can adjust the parameters as needed
  var bodyGeom = new THREE.CylinderGeometry(16, 7, 30, 6, 1);
  bodyGeom.rotateX(Math.PI / 2);
  this.body = new THREE.Mesh(bodyGeom, blackMat);

  //head
  var headGeom = new THREE.CylinderGeometry(16, 1, 20, 6, 1);
  headGeom.rotateX(Math.PI / 2);
  this.head = new THREE.Mesh(headGeom, blackMat);
  this.head.rotateX(Math.PI);
  this.head.position.z = 25;
  this.body.add(this.head);

  this.body.position.y = 20;
  this.body.position.z = -40;

  //tail
  var tailGeom = new THREE.CylinderGeometry(2, 6, 18, 3, 1);
  tailGeom.rotateX(Math.PI / 2);
  this.tail = new THREE.Mesh(tailGeom, blackMat);
  this.tail.position.z = -15;
  this.tail.position.y = 0;
  this.tail.rotation.z = -Math.PI / 8;
  this.body.add(this.tail);

  // Lantern of the lanternfish, a glowing small sphere
  var lanternMaterial = new THREE.MeshPhongMaterial({
    color: 0x00FFFF,
    emissive: 0x00FFFF,
    shading: THREE.FlatShading,
  });
  var lanternGeom = new THREE.CylinderGeometry(2, 2, 2, 6, 1);
  this.lantern = new THREE.Mesh(lanternGeom, lanternMaterial);
  this.lantern.rotateX(Math.PI / 2);
  this.lantern.position.z = 24;
  this.lantern.position.y = 22;
  this.body.add(this.lantern);

  //light to the lantern
  var light = new THREE.PointLight(0x00FFFF, 80, 250, 5);
  light.position.set(0, 0, 0);
  this.lantern.add(light);

  window.addEventListener('keydown', function (event) {
    switch (event.key) {
      case '1':
        light.intensity = 90;
        light.distance = 150;
        light.decay = 6;
        break;
      case '2':
        light.intensity = 80;
        light.distance = 250;
        light.decay = 5;
        break;
      case '3':
        light.intensity = 30;
        light.distance = 400;
        light.decay = 3;
        break;
    }
  });

  //lantern holder
  var lanternHolderGeom = new THREE.CylinderGeometry(2, 2, 10, 6, 1);
  this.lanternHolder = new THREE.Mesh(lanternHolderGeom, blackMat);
  this.lanternHolder.rotateX(Math.PI / 2);
  this.lanternHolder.position.z = 18.5;
  this.lanternHolder.position.y = 22;
  this.body.add(this.lanternHolder);

  var lanternHolderGeom2 = new THREE.CylinderGeometry(2, 2, 15, 6, 1);
  this.lanternHolder2 = new THREE.Mesh(lanternHolderGeom2, blackMat);
  this.lanternHolder2.position.z = 15;
  this.lanternHolder2.position.y = 15;
  this.body.add(this.lanternHolder2);

  //lateral fins
  var finGeom = new THREE.BoxGeometry(3, 8, 20);
  finGeom.translate(0, 0, 10);
  this.finLeft = new THREE.Mesh(finGeom, blackMat);
  this.finLeft.position.y = 0;
  this.finLeft.position.z = 0;
  this.finLeft.position.x = 10;

  this.finRight = this.finLeft.clone();
  this.finRight.position.x = -10;

  this.body.add(this.finLeft);
  this.body.add(this.finRight);

  // Adding the body group to the main mesh group
  this.mesh.add(this.body);

  // Setting shadows, if enabled in your scene
  this.body.castShadow = true;
  this.head.castShadow = true;

  // Adjust the rotation and position of the entire fish, if needed
  this.mesh.rotation.y = Math.PI / 2;
}

LanternFish.prototype.run = function () {
  var s = Math.min(speed, maxSpeed);
  this.runningCycle += delta * s * .7;
  this.runningCycle = this.runningCycle % (Math.PI * 2);
  var t = this.runningCycle;

  var amp = 2;
  var disp = .2;

  // BODY
  this.body.position.y = 20 + Math.sin(t - Math.PI / 2) * amp;
  this.body.rotation.z = Math.sin(t - Math.PI / 2) * amp * .05;
}

LanternFish.prototype.nod = function () {
  var _this = this;
  var speed = .1 + Math.random() * .5;

  var angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
  TweenMax.to(this.head.rotation, speed, { y: angle, onComplete: function () { _this.nod(); } });
}

Submarine.prototype.hang = function () {
  var _this = this;
  var sp = 1;
  var ease = Power4.easeOut;
  this.body.rotation.x = 0;
  this.torso.rotation.x = 0;
  this.body.position.y = 0;
  this.torso.position.y = 7;

  TweenMax.to(this.mesh.rotation, sp, { y: 0, ease: ease });
  TweenMax.to(this.mesh.position, sp, { y: -7, z: 6, ease: ease });
}

Submarine.prototype.nod = function () {
  var _this = this;
  var speed = .1 + Math.random() * .5;
  var angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
}

LanternFish.prototype.sit = function () {
  var _this = this;
  var sp = 1;
  var ease = Power4.easeOut;
  this.body.rotation.x = 0;
  this.body.position.y = 0;

  TweenMax.to(this.mesh.rotation, sp, { y: 0, ease: ease });
  TweenMax.to(this.mesh.position, sp, { y: -7, z: 6, ease: ease });
  TweenMax.to(this.head.rotation, sp, { x: Math.PI / 6, ease: ease, onComplete: function () { _this.nod(); } });
}

function updateLanternFishPosition() {
  lanternFish.run();
  lanternFishPosTarget -= delta * lanternFishAcceleration;
  lanternFishPos += (lanternFishPosTarget - lanternFishPos) * delta;
  if (lanternFishPos < .5) {
    gameOver();
  }

  var angle = Math.PI * lanternFishPos;
  lanternFish.mesh.position.y = -floorRadius + Math.sin(angle) * (floorRadius + 12);
  lanternFish.mesh.position.x = Math.cos(angle) * (floorRadius + 15);
  lanternFish.mesh.rotation.z = -Math.PI / 2 + angle;
}


LightningBolt = function () {
  this.angle = 0;
  this.mesh = new THREE.Group();

  // Define the first cone
  var coneGeom1 = new THREE.ConeGeometry(5, 10, 4, 2);
  var cone1 = new THREE.Mesh(coneGeom1, yellowMat);
  cone1.position.set(3, 5, 0);
  cone1.rotation.set(0, Math.PI / 4, 0); // Rotate to align with the second cone

  // Define the second cone
  var coneGeom2 = new THREE.ConeGeometry(5, 10, 4, 2);
  var cone2 = new THREE.Mesh(coneGeom2, yellowMat);
  cone2.position.set(0, -5, 0);
  cone2.rotation.set(Math.PI, Math.PI / 4, 0); // Rotate to align with the first cone

  this.mesh.add(cone1);
  this.mesh.add(cone2);

  this.mesh.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  this.mesh.scale.set(0.6, 0.6, 0.6);
}

Coral = function () {
  this.angle = 0;
  this.status = "ready";
  this.mesh = new THREE.Group();

  //creating the body of the coral
  var bodyGeom = new THREE.CylinderGeometry(0, 0);
  var body = new THREE.Mesh(bodyGeom, blackMat);
  body.position.y = -1;
  this.body = body;
  this.mesh.add(body);

  //adding sticks to the coral
  var stickGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 6, 1);
  this.sticks = [];
  for (var i = 0; i < 20; i++) {
    var stick = new THREE.Mesh(stickGeom, blackMat);
    stick.position.x = Math.sin(i * .3) * 4;
    stick.position.z = Math.cos(i * .3) * 4;
    stick.position.y = -1 + Math.random() * 4;
    stick.rotation.x = Math.random() * Math.PI;
    stick.rotation.y = Math.random() * Math.PI;
    this.sticks.push(stick);
    this.mesh.add(stick);
  }

  this.mesh.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

Coral.prototype.nod = function () {
  var _this = this;
  var speed = .1 + Math.random() * .5;
  var angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
}

function createSubmarine() {
  submarine = new Submarine();
  submarine.mesh.rotation.y = Math.PI / 2;
  scene.add(submarine.mesh);
  submarine.nod();
}

function createLanternFish() {
  lanternFish = new LanternFish();
  lanternFish.mesh.position.z = 20;
  scene.add(lanternFish.mesh);
  updateLanternFishPosition();
}

function startGame() {
  fieldStartGame.className = "show";
  gameStatus = "startGame";
  lanternFish.sit();
  submarine.hang();
  lanternFish.submarineHolder.add(submarine.mesh);
  TweenMax.to(this, 1, { speed: 0 });
  TweenMax.to(camera.position, 3, { z: cameraPosStartGame, y: 60, x: -30 });
  lightningBolt.mesh.visible = false;
  obstacle.mesh.visible = false;
  clearInterval(levelInterval);
}

function gameOver() {
  fieldGameOver.className = "show";
  gameStatus = "gameOver";
  lantern.sit();
  submarine.hang();
  lantern.submarineHolder.add(submarine.mesh);
  TweenMax.to(this, 1, { speed: 0 });
  TweenMax.to(camera.position, 3, { z: cameraPosGameOver, y: 60, x: -30 });
  lightningBolt.mesh.visible = false;
  obstacle.mesh.visible = false;
  clearInterval(levelInterval);
}

function replay() {
  // Reset game parameters
  submarine.mesh.position.set(0, 0, 0); // Reset submarine's position
  submarine.mesh.rotation.set(0, 0, 0); // Reset submarine's rotation
  submarine.status = "running";
  distance = 0; // Reset distance traveled
  speed = initSpeed; // Reset speed to initial speed
  gameStatus = "play"; // Set game status to 'play'

  fieldGameOver.style.display = "none";
  fieldDistance.innerHTML = "0";

  resetGameEnvironment();
  resetGameParameters();
  requestAnimationFrame(loop);
}


Fir = function () {
  var height = 200;
  var truncGeom = new THREE.CylinderGeometry(2, 2, height, 6, 1);
  truncGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, height / 2, 0));
  this.mesh = new THREE.Mesh(truncGeom, greenMat);
  this.mesh.castShadow = true;
}

var firs = new THREE.Group();

function createFirs() {
  var nTrees = 100; // Número de "árvores"
  for (var i = 0; i < nTrees; i++) {
    var phi = i * (Math.PI * 2) / nTrees;
    var theta = Math.PI / 2;
    theta += (Math.random() > .05) ? .25 + Math.random() * .3 : - .35 - Math.random() * .1;

    var fir = new Tree();
    fir.mesh.position.x = Math.sin(theta) * Math.cos(phi) * floorRadius;
    fir.mesh.position.y = Math.sin(theta) * Math.sin(phi) * (floorRadius - 10);
    fir.mesh.position.z = Math.cos(theta) * floorRadius;

    var vec = fir.mesh.position.clone();
    var axis = new THREE.Vector3(0, 1, 0);
    fir.mesh.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
    floor.add(fir.mesh);
  }
}

Tree = function () {
  this.mesh = new THREE.Object3D();
  this.trunk = new Trunk();
  this.mesh.add(this.trunk.mesh);

  // Adicionando folhas ao longo do tronco
  var nLeaves = 10 + Math.floor(Math.random() * 10); // Número ajustado de folhas para cada tronco
  for (var i = 0; i < nLeaves; i++) {
    var leaf = new Leaf();
    var scale = 0.5 + Math.random() * 0.5;
    leaf.mesh.scale.set(scale, scale, scale);
    leaf.mesh.position.y = -this.trunk.height / 2 + i * (this.trunk.height / nLeaves);
    leaf.mesh.position.x = Math.random() * 5 - 2.5;
    leaf.mesh.position.z = Math.random() * 5 - 2.5;
    leaf.mesh.rotation.x = Math.random() * Math.PI;
    leaf.mesh.rotation.z = Math.random() * Math.PI;
    this.mesh.add(leaf.mesh);
  }
}

Trunk = function () {
  this.height = 100 + Math.random() * 150; // Altura do tronco
  var radius = 3;
  var matTrunk = greenMat;
  var geom = new THREE.CylinderGeometry(radius, radius, this.height, 6, 1); // Geometria simplificada do tronco
  geom.applyMatrix(new THREE.Matrix4().makeTranslation(0, this.height / 2, 0));

  this.mesh = new THREE.Mesh(geom, matTrunk);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
}

Leaf = function () {
  var geom = new THREE.BoxGeometry(2, 10, 2, 1, 5, 1); // Geometria das folhas
  geom.vertices.forEach(vertex => {
    vertex.y += Math.random() * 5 - 2.5; // Adiciona variação para criar uma forma mais orgânica
  });

  var matLeaf = new THREE.MeshPhongMaterial({
    color: 0x228B22,
    shininess: 10,
    flatShading: true
  });

  this.mesh = new THREE.Mesh(geom, matLeaf);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
}

function createLightningBolt() {
  lightningBolt = new LightningBolt();
  scene.add(lightningBolt.mesh);
}

function updateLightningBoltPosition() {
  lightningBolt.mesh.rotation.y += delta * 6;
  lightningBolt.mesh.rotation.z = Math.PI / 2 - (floorRotation + lightningBolt.angle);
  lightningBolt.mesh.position.y = -floorRadius + Math.sin(floorRotation + lightningBolt.angle) * (floorRadius + 50);
  lightningBolt.mesh.position.x = Math.cos(floorRotation + lightningBolt.angle) * (floorRadius + 50);
}

function updateObstaclePosition() {
  if (obstacle.status == "flying") return;

  // TODO fix this,
  if (floorRotation + obstacle.angle > 2.5) {
    obstacle.angle = -floorRotation + Math.random() * .3;
    obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  }

  obstacle.mesh.rotation.z = floorRotation + obstacle.angle - Math.PI / 2;
  obstacle.mesh.position.y = -floorRadius + Math.sin(floorRotation + obstacle.angle) * (floorRadius + 3);
  obstacle.mesh.position.x = Math.cos(floorRotation + obstacle.angle) * (floorRadius + 3);

}

function updateFloorRotation() {
  floorRotation += delta * .03 * speed;
  floorRotation = floorRotation % (Math.PI * 2);
  floor.rotation.z = floorRotation;
}

function createObstacle() {
  obstacle = new Coral();
  obstacle.body.rotation.y = -Math.PI / 2;
  obstacle.mesh.scale.set(1.5, 1.5, 1.5);
  obstacle.mesh.position.y = floorRadius + 4;
  obstacle.nod();
  scene.add(obstacle.mesh);
}

function createBonusParticles() {
  bonusParticles = new BonusParticles();
  bonusParticles.mesh.visible = false;
  scene.add(bonusParticles.mesh);

}

function checkCollision() {
  var db = submarine.mesh.position.clone().sub(lightningBolt.mesh.position.clone());
  var dm = submarine.mesh.position.clone().sub(obstacle.mesh.position.clone());

  if (db.length() < collisionBonus) {
    getBonus();
  }

  if (dm.length() < collisionObstacle && obstacle.status != "flying") {
    getMalus();
  }
}

function getBonus() {
  bonusParticles.mesh.position.copy(lightningBolt.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  lightningBolt.angle += Math.PI / 2;
  //speed*=.95;
  lanternFishPosTarget += .025;
}

function getMalus() {
  obstacle.status = "flying";
  var tx = (Math.random() > .5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 4, { x: tx, y: Math.random() * 50, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 4, {
    x: Math.PI * 3, z: Math.PI * 3, y: Math.PI * 6, ease: Power4.easeOut, onComplete: function () {
      obstacle.status = "ready";
      obstacle.body.rotation.y = Math.random() * Math.PI * 2;
      obstacle.angle = -floorRotation - Math.random() * .4;

      obstacle.angle = obstacle.angle % (Math.PI * 2);
      obstacle.mesh.rotation.x = 0;
      obstacle.mesh.rotation.y = 0;
      obstacle.mesh.rotation.z = 0;
      obstacle.mesh.position.z = 0;

    }
  });
  //
  lanternFishPosTarget -= .04;
  TweenMax.from(this, .5, {
    malusClearAlpha: .5, onUpdate: function () {
      renderer.setClearColor(malusClearColor, malusClearAlpha);
    }
  })
}

function updateDistance() {
  distance += delta * speed;
  var d = distance / 2;
  fieldDistance.innerHTML = Math.floor(d);
}

function updateLevel() {
  if (speed >= maxSpeed) return;
  level++;
  speed += 2;
}

function loop() {
  delta = clock.getDelta();
  updateFloorRotation();

  if (gameStatus == "gameOver") {
    resetGame();
  }

  if (gameStatus == "play") {
    if (submarine.status == "running") {
      submarine.run();
    }
    updateDistance();
    updateLanternFishPosition();
    updateLightningBoltPosition();
    updateObstaclePosition();
    checkCollision();
  }
  audio.loop = true;
  audio.play();
  render();
  requestAnimationFrame(loop);
}

function render() {
  renderer.render(scene, camera);
}

window.addEventListener('load', init, false);

function init(event) {
  initScreenAnd3D();
  createLights();
  createFloor()
  createSubmarine();
  createLanternFish();
  createFirs();
  createLightningBolt();
  createBonusParticles();
  createObstacle();
  initUI();
  resetGame();
  loop();

  audio.play();
}

function resetGame() {
  scene.add(submarine.mesh);
  submarine.mesh.rotation.y = Math.PI / 2;
  submarine.mesh.position.set(0, 0, 0);

  lanternFishPos = .56;
  lanternFishPosTarget = .65;
  speed = initSpeed;
  level = 0;
  distance = 0;
  lightningBolt.mesh.visible = true;
  obstacle.mesh.visible = true;
  gameStatus = "play";
  submarine.status = "running";
  submarine.nod();
  //audio.play();
  updateLevel();
  levelInterval = setInterval(updateLevel, levelUpdateFreq);
}

function initUI() {
  fieldDistance = document.getElementById("distValue");
  fieldGameOver = document.getElementById("centerText");
  fieldStartGame = document.getElementById("startGame");
}