// Global config
const STAR_SPEED_MULTI = 0.025;
const STAR_NUM = 240;
const PLAYER_SPEED = 8;
const SPRITE_ANIMATION_INTERVAL = 10;
const ENEMY_MOVE_INTERVAL = 30;
const ENEMY_SPEED = 15;
const GAME_PADDING = 6;

// Game state
let animationId;
let t = null;
let stars = [];
let dir = 1;
let enemyFrameInterval = 0;
let enemyMoveInterval = 0;
let score = 0;
let player;
let projectilesFromPlayer = [];
let projectilesFromEnemies = [];
let enemies = [];
let ufos = [];
let ufoTimer = 0;
let gameStarted = false;
let gameWidth = 0;
let gameHeight = 0;
let rightEdge;
let soundMuted = false;

function resetGame() {
  t = null;
  dir = 1;
  enemyFrameInterval = 0;
  enemyMoveInterval = 0;
  score = 0;
  player;
  projectilesFromPlayer = [];
  projectilesFromEnemies = [];
  enemies = [];
  ufos = [];
  ufoTimer = 0;
  rightEdge;
}

// Space canvas background init
const spaceCanvas = document.querySelector('.space');
const spaceCtx = spaceCanvas.getContext('2d');
const header = document.querySelector('header');

// Set space size based on view heigh and window
spaceCanvas.width = innerWidth;
spaceCanvas.height = innerHeight - header.offsetHeight;
const SPACE_WIDTH = spaceCanvas.offsetWidth;
const SPACE_HEIGHT = spaceCanvas.offsetHeight;

// Game canvas init
const gameCanvas = document.querySelector('.game');
const gameCtx = gameCanvas.getContext('2d');

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

// Page panels
const elMenu = document.querySelector('.menu-panel');
const elGame = document.querySelector('.game-panel');
const elGameOver = document.querySelector('.gameover-panel');

// Score and Start button
const scoreEl = document.querySelector('#score');
const elemBtnNewGame = document.querySelector('.start-btn');

// Player sprite init
const playerImage = new Image();
playerImage.src = './res/player-canon.png';

// Enemy sprite init
const redAlienImage = new Image();
redAlienImage.src = './res/red-alien.png';
const greenAlienImage = new Image();
greenAlienImage.src = './res/green-alien.png';
const yellowAlienImage = new Image();
yellowAlienImage.src = './res/yellow-alien.png';
const ufoImage = new Image();
ufoImage.src = './res/ufo.png';

// Enemie's layouting on the gameplay
const enemyLayout = [
  [redAlienImage, 30],
  [greenAlienImage, 20],
  [greenAlienImage, 20],
  [yellowAlienImage, 10],
  [yellowAlienImage, 10],
];

// Parent class for all objects in the game
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

    if (Math.abs(dx) > aw || Math.abs(dy) > ah) return false;

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
    if (!soundMuted) {
      new Audio('./res/sfx/dead-enemy-sfx.mp3').play();
    } else {
    }
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
        projectilesFromPlayer = [];
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

// Score storing with localStorage
class Score {
  constructor() {
    this.highscore = JSON.parse(localStorage.getItem('highscore')) || [
      ['0', 'XXX'],
      ['0', 'XXX'],
      ['0', 'XXX'],
    ];
    this.elRanking = document.querySelector('#highscore ul');
  }

  // add new score record
  addScore(score, name) {
    this.highscore.push([score, name]);
    this.highscore.sort((a, b) => b[0] - a[0]);
    localStorage.setItem('highscore', JSON.stringify(this.highscore));
  }

  displayRanking() {
    let table = document.getElementById('rankings');
    let rank = 0;
    this.highscore.forEach((score) => {
      rank += 1;
      let row = table.insertRow(-1);
      let rankCell = row.insertCell(0);
      let scoreCell = row.insertCell(1);
      let playerCell = row.insertCell(2);
      rankCell.innerHTML = rank + '. ';
      scoreCell.innerHTML = score[0];
      playerCell.innerHTML = score[1];
    });
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

// Spawn player
function spawnPlayer() {
  const SHIP_Y = gameHeight - 100;
  const GAME_CENTER = gameWidth / 2 - playerImage.width / 2;
  player = new Player(GAME_CENTER, SHIP_Y, 37, 21, playerImage);
  rightEdge = gameWidth - GAME_PADDING - playerImage.width;
}

// Spawn enemies
function spawnEnemies() {
  for (let i = 0; i < enemyLayout.length; i++) {
    for (let j = 0; j < 10; j++) {
      let alien = enemyLayout[i];
      enemies.push(new Alien(40 + j * 40, 120 + i * 50, redAlienImage.width / 3, redAlienImage.height, alien[1], alien[0], 0, 0));
    }
  }
}

// Move player's ship based on key inputs form the keypad
function playerKeypadMovements(e) {
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
      if (projectilesFromPlayer.length === 0) {
        projectilesFromPlayer.push(new Projectile(player.x + playerImage.width / 2, player.y, 5, true, 2, 8));
        projectilesFromPlayer[0].draw();
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
      drawStar(star, dt + 2000);
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

  // Only render stars if the game hasn't been started yet or had already ended
  if (!gameStarted) {
    renderStars(timestamp, dt);
  } else {
    // End game when player killed all the enemies and play positive SFX
    if (enemies.length === 0) {
      if (!soundMuted) {
        new Audio('./res/sfx/game-won-sfx.wav').play();
      } else {
      }
      gameOver();
    }

    // Timers
    enemyFrameInterval++;
    enemyMoveInterval++;

    gameCtx.clearRect(0, 0, gameWidth, gameHeight);

    // Render stars
    renderStars(timestamp, dt);

    // Render player
    player.draw();

    // Player projectiles rendering
    projectilesFromPlayer.forEach((laser) => {
      laser.update();
    });

    // Enemy projectiles rendering
    projectilesFromEnemies.forEach((projectile, projectileIndex) => {
      // Remove enemy projectile if it collided with player's projectile
      if (projectilesFromPlayer.length !== 0) {
        if (projectile.collisionDetectionTo(projectilesFromPlayer[0])) {
          setTimeout(() => {
            if (!soundMuted) {
              new Audio('./res/sfx/laser-x-projectile-sfx.mp3').play();
            } else {
            }
            projectilesFromPlayer = [];
            projectilesFromEnemies.splice(projectileIndex, 1);
          }, 0);
        }

        // Remove projectile if it went pass the Game canvas
        else if (projectile.y >= gameHeight) {
          projectilesFromEnemies.splice(projectileIndex, 1);
        }
      }

      // End game if player has been hit
      if (projectile.collisionDetectionTo(player)) {
        if (!soundMuted) {
          new Audio('./res/sfx/game-over-sfx.wav').play();
        } else {
        }
        gameOver();
      }

      projectile.update();
    });

    let _max = 0;
    let _min = gameWidth;

    // Enemy rendering
    enemies.forEach((enemy, index) => {
      // End game if enemies had reached the player
      const distFromPlayer = Math.hypot(player.y - enemy.y);
      if (distFromPlayer - enemy.height / 2 - player.height / 2 < 1) {
        if (!soundMuted) {
          new Audio('./res/sfx/game-over-sfx.wav').play();
        } else {
        }
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

      // Collision detection between the enemy and the player's laser
      setTimeout(() => {
        projectilesFromPlayer.forEach((laser) => {
          if (laser.collisionDetectionTo(enemy)) {
            projectilesFromPlayer = [];

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

      // Enemy group movement
      enemy.moveHorizontally(enemyMoveInterval);
      _max = Math.max(_max, enemy.x + enemy.width);
      _min = Math.min(_min, enemy.x);
    });

    // Enemy group movement
    if (_max >= gameWidth - 30 || _min < 30) {
      dir *= -1;
      enemies.forEach((enemy) => {
        enemy.change(enemyFrameInterval);
        enemy.moveVertically(enemyMoveInterval);
      });
    }

    // Generate projectiles from front line enemies
    if (Math.random() < 0.02 && enemies.length > 0) {
      let num = Math.round(Math.random() * (enemies.length - 1));
      let a = enemies[num];
      enemies.forEach((enemy) => {
        var b = enemy;
        if (AABBIntersect(a.x, a.y, a.width, 100, b.x, b.y, b.width, b.height)) {
          a = b;
        }
      });
      // Create and append new bullet
      projectilesFromEnemies.push(new Projectile(a.x + a.width * 0.5, a.y + a.height, 2, false, 8, 8));
    }

    // Rendering Ufo on specific occasion
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
        projectilesFromPlayer.forEach((laser) => {
          if (laser.collisionDetectionTo(ufo)) {
            projectilesFromPlayer = [];

            // Score update
            score += ufo.value;
            scoreEl.innerHTML = score;

            // Dying animation before removal

            if (!soundMuted) {
              new Audio('./res/sfx/ufo-sfx.mp3').play();
            } else {
            }
            ufos = [];
          }
        });
      }, 0);
      ufo.ufoMove();
    });
  }
}

// Start game
function startGame() {
  window.addEventListener('keydown', playerKeypadMovements);
  setUp();
  spawnPlayer();
  spawnEnemies();
}

const newScore = new Score();

function goToGameOverPanel() {
  scoreEl.innerHTML = 0;
  resetGame();
  window.location.href = '#gameover';
}

let validName = false;

function gameOver() {
  window.removeEventListener('keydown', playerKeypadMovements);
  gameStarted = false;
  if (score > 0) {
    window.cancelAnimationFrame(animationId);

    // Create form elements when the game is over
    let labelEl = document.createElement('label');
    labelEl.innerHTML = 'NAME: ';

    let inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.classList.add('scorer');
    inputEl.placeholder = 'Player name';
    inputEl.autofocus = true;

    let buttonEl = document.createElement('button');
    buttonEl.innerHTML = 'SUBMIT';
    buttonEl.classList.add('submit-btn');

    let formEl = document.createElement('form');

    formEl.appendChild(labelEl);
    formEl.appendChild(inputEl);
    formEl.appendChild(buttonEl);

    let infoEl = document.createElement('small');
    infoEl.innerHTML = 'Please fill in your name to place your score in the ranking. Player name has to be 3 to 12 characters long.';

    const divEl = document.querySelector('.score-form');
    divEl.classList.add('yellow');
    divEl.appendChild(infoEl);
    divEl.appendChild(formEl);

    //save high score btn listener
    const elemBtnSubmit = document.querySelector('.submit-btn');
    inputEl.addEventListener('blur', checkName(inputEl));
    inputEl.addEventListener('keyup', checkName(inputEl));

    elemBtnSubmit.addEventListener('click', (e) => {
      checkName(inputEl);
      if (validName) {
        const name = document.querySelector('.scorer').value;
        newScore.addScore(score, name);
        goToGameOverPanel();
      } else {
        e.preventDefault();
      }
    });
  } else {
    goToGameOverPanel();
  }
}

// Player name validation
function checkName(target) {
  let nameValue = target.value.trim();

  if (nameValue.length >= 3 && nameValue.length <= 12) {
    validName = true;
  } else {
    validName = false;
  }
}

// Event listeners
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

document.querySelector('.sfx-switch').addEventListener('click', (e) => {
  if (!soundMuted) {
    e.target.src = 'res/sfx-muted.png';
    soundMuted = true;
  } else {
    e.target.src = 'res/sfx-unmuted.png';
    soundMuted = false;
  }
});

// Paging with use of History API
class Paging {
  constructor() {
    this.pages = document.querySelectorAll('section');
    //first run
    this.route();
    window.addEventListener('popstate', (e) => this.route());
  }
  route() {
    const hash = window.location.hash;
    switch (hash) {
      case '#main':
        gameStarted = false;
        this.changePage(hash);
        break;
      case '#gameplay':
        this.changePage(hash);
        gameStarted = true;
        startGame();
        break;
      case '#gameover':
        gameStarted = false;
        this.changePage(hash);
        if (document.querySelector('#rankings li') == null) {
          newScore.displayRanking();
        } else {
        }
        break;
      default:
        this.changePage('#main');
        break;
    }
    document.title = hash;
  }
  changePage(section) {
    this.pages.forEach((page) => {
      if (page.getAttribute('data-route') == section) {
        page.classList.remove('invisible');
      } else {
        page.classList.add('invisible');
      }
    });
  }
}

new Paging();
