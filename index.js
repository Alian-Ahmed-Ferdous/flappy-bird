//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

// Additional variable for down arrow key handling
let downKeyPressed = false;
const downKey = "ArrowDown";

// Enemies
let enemyArray = [];
let enemyWidth = 40;
let enemyHeight = 40;
let enemyX = boardWidth;
let enemyY = boardHeight / 2;
let enemySpeed = -3;

// Additional variable for shooting
let bulletArray = [];
let bulletWidth = 10;
let bulletHeight = 4;
let bulletSpeed = 5;

// Timer interval for automatic bullet firing (milliseconds)
let bulletTimerInterval = 300; // 0.3 second

let gameOver = false;
let score = 0;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); //every 1.5 seconds
    setInterval(placeEnemy, 3000); //every 3 seconds
    setInterval(autoShoot, bulletTimerInterval); //automatically shoot bullets
    document.addEventListener("keydown", moveBird);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    //bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to the current bird.y, limit the bird.y to the top of the canvas
    context.fillStyle = "green";
    context.fillRect(bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.fillStyle = "red";
        context.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes the first element from the array
    }

    // Update and draw enemies
    updateEnemies();
    context.fillStyle = "blue";
    for (let i = 0; i < enemyArray.length; i++) {
        let enemy = enemyArray[i];
        context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        if (detectCollision(bird, enemy)) {
            gameOver = true;
        }
    }

    // Update and draw bullets
    updateBullets();
    context.fillStyle = "black";
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    //score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    if (gameOver) {
        context.fillText("GAME OVER", 5, 90);
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

    // Increase the space between the pipes
    let openingSpace = board.height / 3;

    let topPipe = {
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(topPipe);

    let bottomPipe = {
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(bottomPipe);
}

function placeEnemy() {
    if (gameOver) {
        return;
    }

    let randomEnemyY = Math.random() * (boardHeight - enemyHeight);
    let enemy = {
        x: enemyX,
        y: randomEnemyY,
        width: enemyWidth,
        height: enemyHeight
    };
    enemyArray.push(enemy);
}

function updateEnemies() {
    for (let i = 0; i < enemyArray.length; i++) {
        let enemy = enemyArray[i];
        enemy.x += enemySpeed;
    }

    while (enemyArray.length > 0 && enemyArray[0].x + enemyWidth < 0) {
        enemyArray.shift();
    }
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        //jump
        velocityY = -6;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            enemyArray = [];
            bulletArray = [];
            score = 0;
            gameOver = false;
        }
    }
}

function handleKeyDown(e) {
    if (e.code === downKey && !downKeyPressed) {
        velocityY += 1.5; // Increase the falling speed
        downKeyPressed = true;
    }
}

function handleKeyUp(e) {
    if (e.code === downKey) {
        downKeyPressed = false;
    }
}

function autoShoot() {
    if (!gameOver) {
        shootBullet();
    }
}

function shootBullet() {
    let bullet = {
        x: bird.x + bird.width,
        y: bird.y + bird.height / 2 - bulletHeight / 2,
        width: bulletWidth,
        height: bulletHeight
    };
    bulletArray.push(bullet);
}

function updateBullets() {
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.x += bulletSpeed;

        // Check for collision with enemies
        for (let j = 0; j < enemyArray.length; j++) {
            let enemy = enemyArray[j];
            if (detectCollision(bullet, enemy)) {
                // Remove the bullet and enemy on collision
                bulletArray.splice(i, 1);
                enemyArray.splice(j, 1);
                i--; // Adjust index after removing the bullet
                score += 2; // Increase score on enemy destruction
                break; // Exit the enemy loop, as the bullet can hit only one enemy in one frame
            }
        }

        // Remove bullets that go off the canvas
        if (bullet.x > boardWidth) {
            bulletArray.splice(i, 1);
            i--; // Adjust index after removing the bullet
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x && //a's top right corner passes b's top left corner
        a.y < b.y + b.height && //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y; //a's bottom left corner passes b's top left corner
}