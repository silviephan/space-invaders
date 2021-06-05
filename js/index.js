// global config
const STAR_SPEED_MULTI = 0.025;
const STAR_NUM = 240;
const PLAYER_SPEED = 8;
const SPRITE_ANIMATION_INTERVAL = 10;
const ENEMY_MOVE_INTERVAL = 30;
const ENEMY_SPEED = 15;
const GAME_PADDING = 6;

// Space init config
const spaceCanvas = document.querySelector('.space');
const spaceCtx = spaceCanvas.getContext('2d');

const header = document.querySelector('header');

spaceCanvas.width = innerWidth;
spaceCanvas.height = innerHeight - header.offsetHeight;

const SPACE_WIDTH = spaceCanvas.offsetWidth;
const SPACE_HEIGHT = spaceCanvas.offsetHeight;

// Game init configWS
const gameCanvas = document.querySelector('.game');
const gameCtx = gameCanvas.getContext('2d');

const scoreEl = document.querySelector('#score');
const elemBtnNewGame = document.querySelector('.start-btn');

// Game state
let animationId;
let t = null;
let stars = [];
let dir = 1;
let enemyFrameInterval = 0;
let enemyMoveInterval = 0;
let score = 0;
let player;
let lasers = [];
let projectiles = [];
let enemies = [];
let ufos = [];
let ufoTimer = 0;
let startGame = false;
let gameWidth = 0;
let gameHeight = 0;
let rightEdge;

// Player ship init
const shipImage = new Image();
shipImage.src = './res/player-canon.png';

const redAlienImage = new Image();
redAlienImage.src = './res/red-alien.png';
const greenAlienImage = new Image();
greenAlienImage.src = './res/green-alien.png';
const yellowAlienImage = new Image();
yellowAlienImage.src = './res/yellow-alien.png';
const ufoImage = new Image();
ufoImage.src = './res/ufo.png';

const rows = [
  [redAlienImage, 30],
  [greenAlienImage, 20],
  [greenAlienImage, 20],
  [yellowAlienImage, 10],
  [yellowAlienImage, 10],
];

function setUp() {
  if (window.innerWidth < 600 || window.innerHeight < 775) {
    gameCanvas.width = 300;
    gameCanvas.height = 387;
  } else {
    gameCanvas.width = 600;
    gameCanvas.height = 775;
  }
  gameWidth = gameCanvas.offsetWidth;
  gameHeight = gameCanvas.offsetHeight;
}

// var state = new State(initialState.todos, initialState.filter);

class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get cx() {
    return this.x + this.width * 0.5;
  }

  get cy() {
    return this.y + this.height * 0.5;
  }

  collisionDetectionTo(target) {
    let dx = target.cx - this.cx; // x difference between centers
    let dy = target.cy - this.cy; // y difference between centers
    let aw = (target.width + this.width) * 0.5; // average width
    let ah = (target.height + this.height) * 0.5; // average height

    /* If either distance is greater than the average dimension there is no collision. */
    if (Math.abs(dx) > aw || Math.abs(dy) > ah) return false;

    /* To determine which region of this rectangle the rect's center
    point is in, we have to account for the scale of the this rectangle.
    To do that, we divide dx and dy by it's width and height respectively. */
    if (Math.abs(dx / this.w) > Math.abs(dy / this.h)) {
      if (dx < 0) target.x = this.x - target.width;
      else target.x = this.x + this.width;
    } else {
      if (dy < 0) target.y = this.y - target.height;
      else target.y = this.y + this.height;
    }
    return true;
  }
}

class Player extends GameObject {
  constructor(x, y, width, height, img) {
    super(x, y, width, height);
    this.img = img;
  }

  draw() {
    gameCtx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  moveLeft() {
    this.draw();
    this.x = this.x - PLAYER_SPEED;
  }

  moveRight() {
    this.draw();
    this.x = this.x + PLAYER_SPEED;
  }
}

class Alien extends GameObject {
  constructor(x, y, width, height, value, img, frameX, frameY) {
    super(x, y, width, height);
    this.value = value;
    this.img = img;
    this.frameX = frameX;
    this.frameY = frameY;
    this.isAlive = true;
  }

  draw() {
    gameCtx.drawImage(this.img, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
  }

  die() {
    new Audio('./res/sfx/dead-enemy-sfx.mp3').play();
    this.frameX = 2;
    this.draw;
  }

  change(time) {
    if (time === SPRITE_ANIMATION_INTERVAL) {
      if (this.frameX === 0) this.frameX = 1;
      else if (this.frameX === 2) this.draw();
      else this.frameX = 0;
    }
  }

  moveHorizontally(time) {
    if (time === ENEMY_MOVE_INTERVAL) {
      this.draw();
      this.x += 10 * dir;
      this.draw();
    }
    this.draw();
  }

  moveVertically(time) {
    if (time === ENEMY_MOVE_INTERVAL) {
      this.draw();
      this.y += 20;
      this.x += 5 * dir;
      this.draw();
    }
    this.draw();
  }

  ufoMove() {
    this.x = this.x - 2;
    this.draw();
  }
}

class Projectile extends GameObject {
  constructor(x, y, velocity, fromPlayer, width, height) {
    super(x, y, width, height);
    this.velocity = velocity;
    this.fromPlayer = fromPlayer;
  }

  draw() {
    if (this.fromPlayer) {
      if (this.y <= 10) {
        lasers = [];
      }

      gameCtx.strokeStyle = 'white';
      gameCtx.lineWidth = this.width;

      gameCtx.beginPath();
      gameCtx.moveTo(this.x, this.y);
      gameCtx.lineTo(this.x, this.y + this.height);
      gameCtx.stroke();
    } else {
      gameCtx.strokeStyle = '#F83B3A';
      gameCtx.lineWidth = 2;

      gameCtx.beginPath();
      gameCtx.moveTo(this.x, this.y);
      gameCtx.lineTo(this.x, this.y - this.height);
      gameCtx.moveTo(this.x - this.width / 2, this.y - this.height);
      gameCtx.lineTo(this.x + this.width / 2, this.y - this.height);
      gameCtx.stroke();
    }
  }

  update() {
    if (this.fromPlayer) {
      this.y = this.y - this.velocity;
      this.draw();
    } else {
      this.y = this.y + this.velocity;
      this.draw();
    }
  }
}

function placeStars() {
  for (let i = 0; i < STAR_NUM; i++) {
    stars[i] = {
      x: Math.floor(Math.random() * spaceCanvas.width),
      y: SPACE_HEIGHT,
      speed: Math.random(),
    };
  }
}

// Draw space with stars background
function drawStar(star, dt, t) {
  if (star.y > SPACE_HEIGHT) {
    star.y = 0;
  } else {
    star.y += dt * star.speed * STAR_SPEED_MULTI;
  }
  star.y += dt * star.speed * STAR_SPEED_MULTI;
  spaceCtx.beginPath();
  spaceCtx.arc(star.x, star.y, 1, 0, 2 * Math.PI);
  spaceCtx.fillStyle = '#FFF7A1';
  spaceCtx.fill();
}

function initPlayer() {
  const SHIP_Y = gameHeight - 100;
  const GAME_CENTER = gameWidth / 2 - shipImage.width / 2;
  player = new Player(GAME_CENTER, SHIP_Y, 37, 21, shipImage);
  rightEdge = gameWidth - GAME_PADDING - shipImage.width;
}
function spawnEnemies() {
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < 10; j++) {
      let alien = rows[i];
      enemies.push(new Alien(40 + j * 40, 120 + i * 50, redAlienImage.width / 3, redAlienImage.height, alien[1], alien[0], 0, 0));
    }
  }
}

function keyMovements(e) {
  const key = e.key;
  switch (key) {
    case 'ArrowLeft':
      if (player.x >= GAME_PADDING) {
        player.moveLeft();
      }
      break;
    case 'ArrowRight':
      if (player.x <= rightEdge) {
        player.moveRight();
      }
      break;
    case ' ':
      if (lasers.length === 0) {
        lasers.push(new Projectile(player.x + shipImage.width / 2, player.y, 5, true, 2, 8));
        lasers[0].draw();
        ufoTimer += 1;
      }
      break;
  }
}

function AABBIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
}

function renderStars(timestamp, dt) {
  stars.forEach((star) => {
    if (timestamp <= 400) {
      drawStar(star, dt + 1000);
    } else {
      drawStar(star, dt);
    }
  });
}

// Main animation function
function animate(timestamp) {
  animationId = requestAnimationFrame(animate);

  if (!t) {
    t = timestamp;
  }
  const dt = timestamp - t;
  t = timestamp;

  spaceCtx.clearRect(0, 0, SPACE_WIDTH, SPACE_HEIGHT);

  //Player rendering
  if (!startGame) {
    renderStars(timestamp, dt);
  } else {
    gameCtx.clearRect(0, 0, gameWidth, gameHeight);
    //Enemy rendering
    let _max = 0;
    let _min = gameWidth;

    enemyFrameInterval++;
    enemyMoveInterval++;

    renderStars(timestamp, dt);

    player.draw();
    //Laser rendering
    lasers.forEach((laser) => {
      laser.update();
    });

    projectiles.forEach((projectile, projectileIndex) => {
      if (lasers.length !== 0) {
        if (projectile.collisionDetectionTo(lasers[0])) {
          setTimeout(() => {
            new Audio('./res/sfx/laser-x-projectile-sfx.mp3').play();
            lasers = [];
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else if (projectile.y >= gameHeight) {
          projectiles.splice(projectileIndex, 1);
        }
      }
      if (projectile.collisionDetectionTo(player)) {
        gameOver();
      }
      projectile.update();
    });

    enemies.forEach((enemy, index) => {
      // Compute enemies' distance to the player
      const distFromPlayer = Math.hypot(player.y - enemy.y);

      // Game over
      if (distFromPlayer - enemy.height / 2 - player.height / 2 < 1) {
        gameOver();
      }

      // Reset timers
      if (enemyFrameInterval > SPRITE_ANIMATION_INTERVAL) {
        enemyFrameInterval = 0;
      } else if (enemyMoveInterval > ENEMY_MOVE_INTERVAL) {
        enemyMoveInterval = 0;
      }

      // Enemy sprite animation
      enemy.change(enemyFrameInterval);

      setTimeout(() => {
        // Collision detection between the enemy and the player's laser
        lasers.forEach((laser) => {
          if (laser.collisionDetectionTo(enemy)) {
            lasers = [];

            // Score update
            score += enemy.value;
            scoreEl.innerHTML = score;

            // Dying animation before removal
            enemy.die();
            setTimeout(() => {
              enemies.splice(index, 1);
            }, 200);
          }
        });
      }, 0);

      //Enemy group movement
      enemy.moveHorizontally(enemyMoveInterval);
      _max = Math.max(_max, enemy.x + enemy.width);
      _min = Math.min(_min, enemy.x);
    });

    //Enemy group movement
    if (_max >= gameWidth - 30 || _min < 30) {
      dir *= -1;
      enemies.forEach((enemy) => {
        enemy.change(enemyFrameInterval);
        enemy.moveVertically(enemyMoveInterval);
      });
    }

    //Generate projectiles from fron line enemies
    if (Math.random() < 0.02 && enemies.length > 0) {
      let num = Math.round(Math.random() * (enemies.length - 1));
      let a = enemies[num];
      enemies.forEach((enemy) => {
        var b = enemy;
        if (AABBIntersect(a.x, a.y, a.width, 100, b.x, b.y, b.width, b.height)) {
          a = b;
        }
      });
      // create and append new bullet
      projectiles.push(new Projectile(a.x + a.width * 0.5, a.y + a.height, 2, false, 8, 8));
    }

    if (ufoTimer === 14) {
      ufos.push(new Alien(gameWidth, 70, ufoImage.width, ufoImage.height, 300, ufoImage, 0, 0));
      ufoTimer = 0;
    }

    ufos.forEach((ufo) => {
      if (ufo.x + ufo.width < 0) {
        ufos = [];
      }
      setTimeout(() => {
        // Collision detection between the enemy and the player's laser
        lasers.forEach((laser) => {
          if (laser.collisionDetectionTo(ufo)) {
            lasers = [];

            // Score update
            score += ufo.value;
            scoreEl.innerHTML = score;

            // Dying animation before removal
            new Audio('./res/sfx/ufo-sfx.mp3').play();
            ufos = [];
          }
        });
      }, 0);
      ufo.ufoMove();
    });
  }
}

function gameStart() {
  console.log('hello');
  setUp();
  initPlayer();
  spawnEnemies();
  requestAnimationFrame(animate);
}

function gameOver() {
  window.removeEventListener('keydown', keyMovements);
  cancelAnimationFrame(animationId);
}

// Event listeners
addEventListener('keydown', keyMovements);

addEventListener('load', () => {
  placeStars();
  requestAnimationFrame(animate);
});

addEventListener('resize', function () {
  spaceCanvas.width = innerWidth - 35;
  spaceCanvas.height = innerHeight - 480;
  gameCanvas.width = 600;
  gameCanvas.height = 775;
});

let currentPage = 0;
let req = new XMLHttpRequest();

const pages = {
  1: '.menu-panel',
  2: '.game-panel',
  3: '.gameover-panel',
};

// Game panels
let ElprevPage, ELcurrPage;

window.onload = function () {
  // Check if this is a reload, in which case you are already on a page.
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('page')) {
    var slideParam = Number(urlParams.get('page'));
    if (!isNaN(slideParam)) {
      goToPage(slideParam);
    }
  }
};

// Fires when the user goes back or forward in the history.
window.onpopstate = function (e) {
  if (e.state != null) {
    goToPage(e.state);
  }
};

// Click the Next button.
function nextPage() {
  var page;
  if (currentPage == 4) {
    page = 1;
  } else {
    page = currentPage + 1;
  }

  history.pushState(page, null, '?page=' + page);
  goToPage(page);
  return false;
}

// Start a request for the page you want to show.
function goToPage(page) {
  ElprevPage = document.querySelector(pages[currentPage]);
  ELcurrPage = document.querySelector(pages[page]);

  ElprevPage.classList.add('invisible');
  ELcurrPage.classList.remove('invisible');
  currentPage = page;
  if (currentPage === 2) {
    gameStart();
  }
}

elemBtnNewGame.addEventListener('click', (e) => {
  nextPage();
});
