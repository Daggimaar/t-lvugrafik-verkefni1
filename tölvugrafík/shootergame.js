var canvas;
var gl;
var renderId;

const TRIANGLE_BUFFER_SIZE = 3;
const TARGET_BUFFER_SIZE = 8;
const BULLET_BUFFER_SIZE = 8;
const MAX_BULLETS = 4;
const TARGET_WIDTH = 0.04;
const TARGET_HEIGHT = 0.05;
const BULLET_WIDTH = 0.02;
const BULLET_HEIGHT = 0.04;

var mouseX;               // Old value of x-coordinate  
var movement = false;     // Do we move the paddle?
var triangleBufferId;        
var targetBufferId;       
var bulletBufferId;      
var vPosition;
var triangleVertices = [
    vec2(-0.075, -0.95),  // Bottom left 
    vec2(0.0, -0.725),    // Top center 
    vec2(0.075, -0.95)    // Bottom right 
];
let points = "";         
let pointCounter = 0;     
let targetCounter = 0;   
var bullets = [];         
var targets = [];         
var numTarget = 5;       

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Bind shader to variables
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // buffer for triangle
    triangleBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(triangleVertices), gl.DYNAMIC_DRAW);

    
    targetBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, targetBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(numTarget * TARGET_BUFFER_SIZE), gl.DYNAMIC_DRAW);

    bulletBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bulletBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(BULLET_BUFFER_SIZE), gl.DYNAMIC_DRAW);

    // Event listeners fyrir músina
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);

    // Key event fyrir space takkan
    window.addEventListener("keydown", handleKeyDown);


    targets = generateTargets(numTarget);
    render();
};


function handleMouseDown(e) {
    movement = true;
    mouseX = e.offsetX;
}

function handleMouseUp(e) {
    movement = false;
}


function handleMouseMove(e) {
    if (movement) {
        var xmove = 2 * (e.offsetX - mouseX) / canvas.width;
        mouseX = e.offsetX;
        for (let i = 0; i < TRIANGLE_BUFFER_SIZE; i++) {
            triangleVertices[i][0] += xmove;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(triangleVertices));
    }
}


function handleKeyDown(e) {
    if (e.code === "Space") {
        if (bullets.length < MAX_BULLETS) {
            bullets.push({
                x: triangleVertices[1][0], // Based on the gun's midpoint
                y: -0.7,               // Starts just above the gun
                speed: 0.02            // Speed of the bullet
            });
        
            console.log("Bullet added at:", bullets[bullets.length - 1]);
        }
    }
}



function generateTargets(count) {
    let newTargets = [];
    for (let i = 0; i < count; i++) {
        newTargets.push({
            x: Math.random() * 2 - 1,  
            y: Math.random() * 0.8 + 0.1, 
            speed: (Math.random() * 0.005 + 0.006) * (Math.random() > 0.3 ? 1 : -1) 
        });
    }
    return newTargets;
}


function checkForCollisions() {
    for (let i = 0; i < bullets.length; i++) {
        let shot = bullets[i];
        for (let j = 0; j < targets.length; j++) {
            let target = targets[j];
            
            let shotLeft = shot.x - BULLET_WIDTH / 2;
            let shotRight = shot.x + BULLET_WIDTH / 2;
            let shotBottom = shot.y;
            let shotTop = shot.y + BULLET_HEIGHT;

            let targetLeft = target.x - TARGET_WIDTH;
            let targetRight = target.x + TARGET_WIDTH;
            let targetBottom = target.y - 0.01;
            let targetTop = target.y + TARGET_HEIGHT;

            
            if (
                shotRight > targetLeft &&
                shotLeft < targetRight &&
                shotTop > targetBottom &&
                shotBottom < targetTop
            ) {
               
                bullets.splice(i, 1);
                targets.splice(j, 1);
                console.log("target hit");

                points += "| ";
                targetCounter++;
                document.getElementById("stig").innerText = `Fuglar: ${points}`;

                if (targetCounter >= numTarget) {
                    endGame();
                    return;
                }
                i--; 
                break; 
            }
        }
    }
}


function endGame() {
    cancelAnimationFrame(renderId);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const nyrLeikur = "Nýr leikur";
    const button = document.createElement('button');
    button.className = 'nyrLeikur';
    button.innerText = nyrLeikur;
    document.body.appendChild(button);

    button.addEventListener('click', function() {
        startGame()
    })
}

function startGame() {
    location.reload();
}

function drawTargets() {
    for (let i = 0; i < targets.length; i++) {
        let target = targets[i];
        target.x += target.speed;

       
        if (target.x > 1.1) target.x = -1.1;
        if (target.x < -1.1) target.x = 1.1;

       
        var targetVertices = [
            vec2(target.x - TARGET_WIDTH, target.y - 0.01),   
            vec2(target.x - TARGET_WIDTH, target.y + TARGET_HEIGHT),  
            vec2(target.x + TARGET_WIDTH, target.y + TARGET_HEIGHT),   
            vec2(target.x + TARGET_WIDTH, target.y - 0.01)   
        ];

       
        gl.bindBuffer(gl.ARRAY_BUFFER, targetBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, i * TARGET_BUFFER_SIZE * Float32Array.BYTES_PER_ELEMENT, flatten(targetVertices));
    }

    
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < targets.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4); 
    }
}


function drawTriangle() {
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, TRIANGLE_BUFFER_SIZE);
}


function drawBullets() {
    for (let i = 0; i < bullets.length; i++) {
        let fired = bullets[i];
        fired.y += fired.speed;
       
        if (fired.y > 1.0) {
            bullets.splice(i, 1);
            i--;
            continue;
        }
        
        var bulletVertices = [
            vec2(fired.x - BULLET_WIDTH / 2, fired.y),
            vec2(fired.x - BULLET_WIDTH / 2, fired.y + BULLET_HEIGHT),
            vec2(fired.x + BULLET_WIDTH / 2, fired.y + BULLET_HEIGHT),
            vec2(fired.x + BULLET_WIDTH / 2, fired.y)
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, bulletBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(bulletVertices));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        console.log("shots fired");
    }
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawTriangle();
    drawTargets();
    drawBullets();
    checkForCollisions();
    
    renderId = requestAnimationFrame(render);
}
