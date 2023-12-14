class ScoreManager {
    constructor(element) {
        this.score = 0;
        this.maxScore = 99999;
        this.log = "";
        this.element = element; //document.getElementById("id")
        this.element.innerText = String(this.score);
    }

    add(points, log) {
        this.score += points;
        this.log += log;
        if (this.score > this.maxScore) {
            this.score = this.maxScore;
        }
        this.displayUpdate();
    }

    getScore() {
        return this.score;
    }

    getLog() {
        return this.log
    }

    displayUpdate() {
        this.element.innerText = String(this.score);
        this.animateScore();
    }

    reset() {
        this.score = 0;
        this.log = "";
        this.displayUpdate();
    }

    animateScore() {
        this.element.style.transition = 'transform 0.05s cubic-bezier(0.16, 1, 0.3, 1)';
        this.element.style.transform = 'scale(1.5)';
        setTimeout(() => {
            this.element.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
            this.element.style.transform = 'scale(1)';
        }, 50);
    }
}

class NextManager {
    constructor() {
        this.list = [];
        this.generateNext();
        this.generateNext();
    }

    generateNext() {
        this.list.push(Math.floor(Math.random() * 5) + 1);
        if (this.list.length > 2) {
            this.list.shift();
        }
    }

    getList(idx) {
        return this.list[idx];
    }
}

class NextDisplay {
    constructor(element, ballsProperties) {
        this.element = element; //document.getElementById("id");
        this.id = 0;
        this.ballsProperties = ballsProperties;
    }

    setBall(id) {
        this.id = id;
        this.updateDisplay();
    }

    updateDisplay() {
        const ballsPropertie = this.ballsProperties[this.id - 1];
        var ctx = this.element.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, this.element.width, this.element.height);
        ctx.arc(75 / 2, 75 / 2, ballsPropertie.radius, 0, 2 * Math.PI);
        ctx.fillStyle = ballsPropertie.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
    }  
}

// Settings
const maxScoreboard = 100
const lineheight = 50;
const generateHeight = 25;
const wallSize = 10;
const sv = 'https://script.google.com/macros/s/AKfycbw9ElR802KIiy0jJV5lzC0197ShpgzrmkqYpKpB9AYyvefjH2R8E2DtvJ6R60QGm6f2/exec';
let pause = false;

// Balls properties
const ballsProperties = [
    {'radius': 15, 'color': '#ED0E11', 'score': 0, 'char': 'z'}, 
    {'radius': 20, 'color': '#F67850', 'score': 1, 'char': 'f'}, 
    {'radius': 25, 'color': '#8445EE', 'score': 3, 'char': 'e'}, 
    {'radius': 30, 'color': '#F4AE0E', 'score': 6, 'char': 'd'}, 
    {'radius': 35, 'color': '#F48010', 'score': 10, 'char': 'h'}, 
    {'radius': 40, 'color': '#D30708', 'score': 15, 'char': 'y'}, 
    {'radius': 50, 'color': '#FCF674', 'score': 21, 'char': 'n'}, 
    {'radius': 60, 'color': '#FAB7AD', 'score': 28, 'char': 'c'}, 
    {'radius': 70, 'color': '#E1D100', 'score': 36, 'char': 'x'}, 
    {'radius': 80, 'color': '#83CD0C', 'score': 45, 'char': 's'}, 
    {'radius': 100, 'color': '#047000', 'score': 55, 'char': 'a'},
    {'radius': 0, 'color': '#FFFFFF', 'score': 66, 'char': 'v'}
];

// Basic setup for Matter.js
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Composite = Matter.Composite,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Runner = Matter.Runner;
// Create an engine
let engine = Engine.create();
engine.timing.timeScale = 1

let accumulator = 0;
let lastTime = 0;

function update(time) {
    // 経過時間の計算（ミリ秒）
    const deltaTime = time - lastTime;
    lastTime = time;
    console.log("a");
    // エンジンの更新
    Engine.update(engine, deltaTime);

    // 次のフレームのリクエスト
    requestAnimationFrame(update);
}


function updateEngine(timeScale) {
    const fixedDeltaTime = 1000 / 360; // 60 FPSに固定
    //console.log("a");
    //Engine.update(engine, fixedDeltaTime, timeScale);
}

Runner.tick = function(time, deltaTime) {
    updateEngine(1); // 時間スケーリングを適用（ここでは1に固定）
};

// Create a Composite
let composite = Composite.create();
// Create a runner
let runner = Runner.create();
// Create a main renderer
let render = Render.create({
    element: document.getElementById('canvas-container'),
    engine: engine,
    options: {
        width: 350,
        height: 500,
        wireframes: false
    }
});


// Function to create a ball
function createBall(x, y, sizeIndex) {
    let ballProp = ballsProperties[sizeIndex - 1];
    return Bodies.circle(x, y, ballProp.radius, { 
        render: { fillStyle: ballProp.color },
        char: ballProp.char,
        restitution: 0,
        label: 'ball',
        ballSize: sizeIndex,
        score: ballProp.score,
        collisioned: false
    });
}

function createNextBall(sizeIndex) {
    let ballProp = ballsProperties[sizeIndex - 1];
    return Bodies.circle(ballProp.radius / 2, ballProp.radius / 2, ballProp.radius, { 
        render: { fillStyle: ballProp.color },
        label: 'nextBall',
        collisionFilter: {
            group: -1,
            category: 0,
            mask: 0
        }
    });
}

let scoreManager = new ScoreManager(document.getElementById("score"));
let nextDisplay = new NextDisplay(document.getElementById("nextBallRender"), ballsProperties);
let nextManager = new NextManager();
nextDisplay.setBall(nextManager.getList(1));
let previewBall = null;

function gameInit() {
    const allBodies = Composite.allBodies(engine.world);
    // 全ての物体を削除
    for (const body of allBodies) {
        World.remove(engine.world, body);
    }

    // Add walls (except for the top wall)
    let ground = Bodies.rectangle(175, 500, 350, 20, {
        label: 'ground',
        isStatic: true,
        render: {
            fillStyle: '#FFFFFF'
        },
        restitution: 0
    });
    let leftWall = Bodies.rectangle(0, 250, 20, 500, {
        label: 'wall',
        isStatic: true,
        render: {
            fillStyle: '#FFFFFF'
        },
        restitution: 0
    });
    let rightWall = Bodies.rectangle(350, 250, 20, 500, {
        label: 'wall',
        isStatic: true,
        render: {
            fillStyle: '#FFFFFF'
        },
        restitution: 0
    });
    // Create a thin white line
    let whiteLine = Bodies.rectangle(175, lineheight, 350, 1, {
        label: 'whiteLine',
        isSensor: true,
        isStatic: true,
        render: {
            fillStyle: '#FFFFFF'
        }
    });

    World.add(engine.world, [ground, leftWall, rightWall, whiteLine]);

    scoreManager = new ScoreManager(document.getElementById("score"));
    nextDisplay = new NextDisplay(document.getElementById("nextBallRender"), ballsProperties);
    nextManager = new NextManager();
    nextDisplay.setBall(nextManager.getList(1));
    previewBall = null;
}

//ユーザ名の文字数が0の場合、登録ボタンを押せないようにする。
document.addEventListener('DOMContentLoaded', function() {
    var textInput = document.getElementById('name-input');
    var registerButton = document.getElementById('button1');

    textInput.addEventListener('input', function() {
        // テキスト入力が0文字の場合、ボタンを無効化
        registerButton.disabled = textInput.value.length === 0;
    });

    // 初期状態でボタンを無効化する場合（オプション）
    registerButton.disabled = true;
});

// イベントリスナーを追加する関数
function enableEvents() {
    document.getElementById('canvas-container').addEventListener('mousemove', handleMouseMove);
    document.getElementById('canvas-container').addEventListener('mousedown', handleMouseDown);
    document.getElementById('canvas-container').addEventListener('mouseout', handleMouseOut);
}

// イベントリスナーを削除する関数
function disableEvents() {
    document.getElementById('canvas-container').removeEventListener('mousemove', handleMouseMove);
    document.getElementById('canvas-container').removeEventListener('mousedown', handleMouseDown);
    document.getElementById('canvas-container').removeEventListener('mouseout', handleMouseOut);
}

function handleMouseMove(event) {
    if (!previewBall) {
        previewBall = createBall(event.offsetX, generateHeight, nextManager.getList(0));
        previewBall.isStatic = true; // Make the ball static
        previewBall.render.opacity = 0.5; // Make the ball semi-transparent
        previewBall.collisionFilter = { group: -1, category: 0, mask: 0 }; // Disable collision
        World.add(engine.world, previewBall);
    }
        let clampedX = wallClipRange()
        Matter.Body.setPosition(previewBall, { x: clampedX, y: generateHeight });
};

let canClick = true; // Variable to track if clicking is allowed
function handleMouseDown(event) {
    if (previewBall && canClick) {
        canClick = false; // Disable further clicks
        World.remove(engine.world, previewBall);
        nextManager.generateNext();
        nextDisplay.setBall(nextManager.getList(1));
        let clampedX = wallClipRange()
        let newBall = createBall(clampedX, generateHeight, previewBall.ballSize);
        World.add(engine.world, newBall);
        previewBall = null; // Reset the preview ball
        setTimeout(function() {
            canClick = true; // Re-enable clicking after 0.5 seconds
        }, 500);
    }
};

function handleMouseOut(event) {
    if (previewBall) {
        World.remove(engine.world, previewBall);
        previewBall = null;
    }
};

// Collision event
Events.on(engine, 'collisionStart', function(event) {
    let pairs = event.pairs;
    pairs.forEach(function(pair) {
        let bodyA = pair.bodyA,
            bodyB = pair.bodyB;

        if (bodyA.label === 'ball' && bodyB.label === 'ball' && bodyA.ballSize === bodyB.ballSize) {
            // Check if it's not the maximum size
            if (bodyA.ballSize < 11) {
                let newSize = bodyA.ballSize + 1;
                let newX = (bodyA.position.x + bodyB.position.x) / 2;
                let newY = (bodyA.position.y + bodyB.position.y) / 2;
                let newBall = createBall(newX, newY, newSize);
                World.remove(engine.world, [bodyA, bodyB]);
                World.add(engine.world, newBall);
                scoreManager.add(newBall.score, newBall.char);
            } else {
                // Remove both balls if they are of maximum size
                World.remove(engine.world, [bodyA, bodyB]);
                scoreManager.add(ballsProperties[ballsProperties.length - 1].score, ballsProperties[ballsProperties.length - 1].char);
            }
        } else if (pair.bodyA.label != 'whiteLine' && pair.bodyA.label != 'wall' && pair.bodyB.collisioned == false) {
            bodyB.collisioned = true;
        }
    });
});

Events.on(engine, 'collisionActive', event => {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];

        // ボールが感知領域に入ったかどうかをチェック
        if ((pair.bodyA.label === 'whiteLine' && pair.bodyB.collisioned === true) ||
            (pair.bodyA.collisioned === true && pair.bodyB.label === 'whiteLine')) {
            gameOver();
        }
    }
});

function wallClipRange() {
    let maxClip = 350 - (previewBall.circleRadius + wallSize);
    let minClip = (previewBall.circleRadius + wallSize);
    let clampedX = Math.min(Math.max(event.offsetX, minClip), maxClip);
    return clampedX
}

function gamePause(bool) {
    pause = bool;
    if (pause === true) {
        Runner.stop(runner);
        Render.stop(render);
        disableEvents();

    } else {
        lastTime = performance.now();
        requestAnimationFrame(update);
        Runner.run(runner, engine);
        Render.run(render);
        enableEvents();
    }
}

function gameOver() {
    gameOverMessage('canvas-container');
    gamePause(true);
}

function gameOverMessage(containerId, message) {
    const container = document.getElementById(containerId);
    const menu = document.getElementById('end');

    //ゲームオーバ + スコアの追加
    const messageElem = document.createElement("div");
    messageElem.classList.add("message");
    messageElem.innerText = 'GAME OVER\n' + scoreManager.getScore();
    container.appendChild(messageElem);

    // アニメーション開始
    setTimeout(() => {
        messageElem.style.transform = 'translate(-50%, -50%) scale(1)';
        container.style.filter = 'sepia(0.9)';
    }, 100);

    setTimeout(() => {
        messageElem.style.top = '30%';
        menu.style.transform = 'scale(1)';
        menu.style.opacity = '1';
        menu.style.top = '50%';
    }, 1500);
}

function retryGame() {
    window.location.reload();
}

// スコア登録
async function registerScore() {
    const data = {
        type: "3",
        name: document.getElementById("name-input").value,
        test: await sha256(scoreManager.getScore()),
        data: scoreManager.getLog()
    }

    const returnElem = document.getElementById('retmsg');
    const registerButton = document.getElementById('button1');

    registerButton.disabled = true;
    returnElem.innerText = "sending...";

    const result = await postJson(sv, data);
    let msg = "failed";
    if (result.bool === true) {
        msg = "success"
    } else {
        setTimeout(() => {
            registerButton.disabled = false;
        }, 5000);
    }
    returnElem.innerText = msg;
}

// ランキング表を生成する関数
async function createRankingTable(id) {
    const data = {
        type: "2",
        count: String(maxScoreboard)
    }
    const result = await postJson(sv, data);
    const scoreboardDiv = document.getElementById(id);
    const loadingText = document.getElementById('loadingText');

    if (result === false) {
        loadingText.innerText = "error"
        return
    }

    // テーブル要素を作成
    const table = document.createElement('table');
    table.style.width = '100%';
    table.setAttribute('border', '1');

    // ヘッダー行を追加
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Name';
    const scoreHeader = document.createElement('th');
    scoreHeader.textContent = 'Score';
    headerRow.appendChild(nameHeader);
    headerRow.appendChild(scoreHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // データ行を追加
    const tbody = document.createElement('tbody');
    await result.Data.forEach(item => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = item.name;
        const scoreCell = document.createElement('td');
        scoreCell.textContent = item.score;
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    loadingText.parentNode.removeChild(loadingText);
    scoreboardDiv.appendChild(table);
}

async function postJson(url, data) {
  try {
    var postparam = {
        "method": "POST",
        "Content-Type": "application/json",
        "body" : JSON.stringify(data)
    };

    const response = await fetch(url, postparam);

    // レスポンスが正常かチェック
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    // レスポンスをJSONとして解析し、返す
    return await response.json();
  } catch (error) {
    console.error('Error in postJson:', error);
    return false; // エラーが発生した場合はfalseを返す
  }
}

async function sha256(message) {
    // 文字列をエンコードしてUint8Arrayに変換
    const msgBuffer = new TextEncoder().encode(message); 

    // ハッシュを計算
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // ハッシュを16進数文字列に変換
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

gameInit();
gamePause(false);

createRankingTable('scoreboard');