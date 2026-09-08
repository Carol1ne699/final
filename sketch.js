const STATE_MENU = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;
const STATE_PREP = 3;
const STATE_DISHWASH = 4;

let gameState = STATE_MENU;
let score = 0;
let lives = 3;
let maxLives = 3;
let feverMeter = 0;
const maxFever = 100;
let isFeverMode = false;
let chefAnger = 0;

let pan;
let oven;
let bell;
let meatballs = [];
let particles = [];
let floatingTexts = [];
let plates = [];

let shakeIntensity = 0;
let flashAlpha = 0;
let whiteFlashAlpha = 0;
let hitPause = 0;

let baseSpeed = 7;
let maxMeatballs = 1;

let prepType = 0;
let prepTarget = [];
let prepCurrent = [];
let prepOptions = [];
let prepTimer = 0;
let prepMaxTimer = 600;
let prepShake = 0;

let missCounter = 0;
let dirtLevel = 100;
let dishTimer = 0;
let maxDishTimer = 300; 

let video;
let targetColor = [100, 200, 255]; 
let threshold = 60;
let trackedY = 300;
let smoothedY = 300;
let camW = 160;
let camH = 120;
let trackedCamX = 80;
let trackedCamY = 60;

let titleImg;

function preload() {
    titleImg = loadImage('crazy kitchen.png');
}

class Particle {
    constructor(x, y, z, color, type = 'NORMAL') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = random(-6, 6);
        this.vy = random(-6, 6);
        this.vz = random(2, 6);
        this.life = 255;
        this.color = color;
        this.size = random(4, 12);
        this.type = type;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vz -= 0.4;
        if (this.z < 0) {
            this.z = 0;
            this.vz *= -0.5;
            this.vx *= 0.8;
            this.vy *= 0.8;
        }
        
        if (this.type === 'FIRE' || this.type === 'BLUE_FIRE') {
            this.life -= 20;
            this.size *= 0.9;
        } else if (this.type === 'CHEESE') {
            this.life -= 10;
            this.size *= 0.98;
        } else {
            this.life -= 15;
            this.size *= 0.95;
        }
    }

    display() {
        noStroke();
        fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.life);
        ellipse(this.x, this.y - this.z, this.size);
    }
}

class FloatingText {
    constructor(x, y, txt, type) {
        this.x = x;
        this.y = y - 30;
        this.txt = txt;
        this.life = 255;
        this.type = type;
        this.scale = 0.1;
    }

    update() {
        this.y -= 1.5;
        this.life -= 5;
        if (this.scale < 1) this.scale += 0.2;
    }

    display() {
        push();
        translate(this.x, this.y);
        scale(this.scale);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        textSize(36);
        
        strokeWeight(6);
        if (this.type === 'SMASH' || this.type === 'FEVER') {
            stroke(150, 0, 0); fill(255, 255, 0); textSize(48);
            if(this.type === 'FEVER') { stroke(0, 0, 150); fill(0, 255, 255); textSize(56); }
        } else if (this.type === 'NICE') {
            stroke(0, 100, 0); fill(100, 255, 100);
        } else if (this.type === 'MISS') {
            stroke(100, 0, 0); fill(255, 100, 100);
        } else if (this.type === 'SCORE') {
            stroke(200, 100, 0); fill(255, 200, 0); textSize(40);
        } else if (this.type === 'PERFECT') {
            stroke(150, 0, 150); fill(255, 100, 255); textSize(50);
        } else {
            stroke(50); fill(255);
        }
        
        drawingContext.globalAlpha = max(0, this.life / 255);
        text(this.txt, 0, 0);
        drawingContext.globalAlpha = 1.0;
        pop();
    }
}

class Plate {
    constructor() {
        this.x = width - 120;
        this.y = random(100, height - 100);
        this.vy = random(2, 5) * (random() > 0.5 ? 1 : -1);
        this.radius = 25;
        this.active = true;
        this.respawnTimer = 0;
    }

    update() {
        this.x = width - 120; 
        if (!this.active) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.active = true;
                this.y = random(100, height - 100);
                this.vy = random(2, 5) * (random() > 0.5 ? 1 : -1);
            }
            return;
        }
        this.y += this.vy;
        if (this.y < 80 || this.y > height - 80) this.vy *= -1;
    }

    display() {
        if (!this.active) return;
        push();
        translate(this.x, this.y);
        drawingContext.shadowBlur = 10;
        drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
        stroke(200);
        strokeWeight(2);
        fill(250);
        ellipse(0, 0, this.radius * 2, this.radius * 2);
        stroke(180);
        noFill();
        ellipse(0, 0, this.radius * 1.3, this.radius * 1.3);
        pop();
    }
    
    break() {
        this.active = false;
        this.respawnTimer = 120;
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(this.x, this.y, 20, color(255, 255, 255)));
        }
        floatingTexts.push(new FloatingText(this.x, this.y, "+5", "SCORE"));
        score += 5;
    }
}

class Bell {
    constructor() {
        this.x = width - 200;
        this.y = height / 2;
        this.vy = 3;
        this.radius = 45; 
        this.active = false;
    }

    update() {
        this.x = width - 200; 
        if (!this.active) return;
        this.y += this.vy;
        if (this.y < 120 || this.y > height - 120) this.vy *= -1;
    }

    display() {
        if (!this.active) return;
        push();
        translate(this.x, this.y);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(255, 215, 0, 0.6)';
        fill(255, 215, 0);
        arc(0, 10, 60, 60, PI, 0);
        fill(200, 150, 0);
        rect(-5, -25, 10, 10);
        fill(50);
        ellipse(0, 10, 65, 15);
        fill(255);
        textSize(20);
        textAlign(CENTER, CENTER);
        text("🛎️", 0, -5);
        pop();
    }
}

class Pan {
    constructor() {
        this.radius = 45;
        this.x = 80;
        this.y = height / 2;
        this.swingSpeed = 0;
        this.hitTimer = 0;
        this.shockwaveRadius = 0;
        this.feverAura = 0;
    }

    update() {
        if (abs(mouseY - pmouseY) > 0) {
            trackedY = mouseY;
        }
        let targetY = constrain(smoothedY, this.radius, height - this.radius);
        this.swingSpeed = targetY - this.y; 
        this.y = targetY;

        if (this.hitTimer > 0) {
            this.hitTimer--;
            this.shockwaveRadius += isFeverMode ? 25 : 10;
        }
        
        if (isFeverMode) {
            this.feverAura += 0.1;
            if (random() > 0.7) {
                particles.push(new Particle(this.x + random(-20, 20), this.y + random(-20, 20), random(0, 20), color(0, 200, 255), 'BLUE_FIRE'));
            }
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        
        if (this.hitTimer > 0) {
            noFill();
            strokeWeight(isFeverMode ? 8 : 4);
            stroke(isFeverMode ? color(0, 255, 255, map(this.hitTimer, 0, 15, 0, 255)) : color(255, 255, 255, map(this.hitTimer, 0, 15, 0, 255)));
            ellipse(0, 0, this.shockwaveRadius);
        }

        let scaleEffect = this.hitTimer > 0 ? (isFeverMode ? 1.3 : 1.15) : 1.0;
        scale(scaleEffect);

        drawingContext.shadowBlur = isFeverMode ? 25 + sin(this.feverAura)*10 : 15;
        drawingContext.shadowColor = isFeverMode ? 'rgba(0, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.5)';
        drawingContext.shadowOffsetY = isFeverMode ? 0 : 10;

        strokeWeight(2);
        stroke(30);
        fill(40, 20, 10);
        rectMode(CENTER);
        rect(-50, 0, 70, 14, 5);
        fill(150);
        rect(-25, 0, 15, 18, 2);

        stroke(isFeverMode ? color(0, 255, 255) : 50);
        strokeWeight(3);
        fill(60); 
        ellipse(0, 0, this.radius * 2);

        noStroke();
        fill(30);
        ellipse(0, 0, this.radius * 1.7);
        
        drawingContext.shadowBlur = 0;
        fill(255, 40);
        ellipse(-this.radius*0.3, -this.radius*0.3, this.radius*0.8, this.radius*0.4);

        pop();
    }
    
    triggerHit(isSmash) {
        this.hitTimer = 15;
        this.shockwaveRadius = this.radius;
    }
}

class Oven {
    constructor() {
        this.w = 90;
        this.h = 120;
        this.x = width - 50;
        this.y = height / 2;
        this.vy = 4;
        this.shootTimer = 0;
        this.openMouth = 0;
    }

    update() {
        this.x = width - 50; 
        this.y += this.vy;
        if (this.y < this.h / 2 + 50 || this.y > height - this.h / 2 - 50) {
            this.vy *= -1;
        }

        if (this.openMouth > 0) this.openMouth -= 0.1;

        if (meatballs.length < maxMeatballs && gameState === STATE_PLAYING) {
            this.shootTimer++;
            if (this.shootTimer > 40) {
                this.openMouth = min(this.openMouth + 0.2, 1);
            }
            if (this.shootTimer > 60) {
                this.shoot();
                this.shootTimer = 0;
            }
        }
    }

    shoot() {
        meatballs.push(new Meatball(this.x - 20, this.y));
        triggerShake(5);
        for(let i=0; i<5; i++) {
            particles.push(new Particle(this.x-30, this.y, 20, color(200,50,0), 'FIRE'));
        }
        chefAnger = min(chefAnger + 12, 100); 
        if (chefAnger >= 100) {
            lives--;
            chefAnger = 0;
            flashAlpha = 150;
            triggerShake(30);
            floatingTexts.push(new FloatingText(width/2, height/2, "CHEF IS FURIOUS!", "MISS"));
            if (lives <= 0) gameState = STATE_GAMEOVER;
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = 'rgba(0, 0, 0, 0.6)';
        drawingContext.shadowOffsetY = 15;

        stroke(50);
        strokeWeight(4);
        fill(200, 50, 50);
        rectMode(CENTER);
        rect(0, 0, this.w, this.h, 15);
        
        fill(180);
        rect(0, -this.h/2, this.w - 10, 20, 5);
        fill(0);
        ellipse(-20, -this.h/2, 8);
        ellipse(20, -this.h/2, 8);

        let doorGap = map(this.openMouth, 0, 1, 0, 40);
        
        fill(20);
        noStroke();
        rect(-10, 10, 60, 50 + doorGap, 5);
        if (this.openMouth > 0) {
            fill(255, 100, 0, random(100, 255));
            rect(-10, 10 + doorGap/2, 50, 20);
        }

        stroke(50);
        fill(150, 200, 255, 150);
        rect(-10, 10 + doorGap, 60, 50, 5);
        pop();
    }
}

class Meatball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.z = 40;
        this.vx = -baseSpeed;
        this.vy = random(-3, 3);
        this.vz = random(3, 6);
        
        this.baseRadius = 18;
        this.radius = this.baseRadius;
        this.type = 'NORMAL'; 
        
        this.trail = [];
        this.color = color(139, 69, 19); 
        this.rotation = 0;
        this.rotSpeed = random(-0.2, 0.2);
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        this.trail.push({x: this.x, y: this.y, z: this.z});
        if (this.trail.length > 15) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vz -= 0.3; 

        if (this.z <= 0) {
            this.z = 0;
            if (abs(this.vz) > 1) {
                this.vz = abs(this.vz) * 0.6;
                particles.push(new Particle(this.x, this.y, 0, color(200, 200, 200, 100)));
            } else {
                this.vz = 0;
            }
        }

        this.rotation += this.rotSpeed;

        if (this.y < 50) {
            this.y = 50; this.vy *= -1;
        } else if (this.y > height - 50) {
            this.y = height - 50; this.vy *= -1;
        }

        if (this.x > width - 30) {
            this.x = width - 30;
            this.vx *= -1;
            score++;
            feverMeter = min(feverMeter + 5, maxFever);
            floatingTexts.push(new FloatingText(this.x - 30, this.y - this.z, "+1", "NORMAL"));
            
            if (score % 4 === 0) baseSpeed = min(baseSpeed + 0.5, 14);
            if (score % 8 === 0) maxMeatballs = min(maxMeatballs + 1, 5);
        }
    }

    mutate(isSmash, isFeverAttack) {
        if (isFeverAttack) {
            this.type = 'FEVER_BALL';
            this.color = color(0, 255, 255);
            this.radius = this.baseRadius * 1.5;
            this.vx = baseSpeed * 3;
            this.vz = 0;
            this.rotSpeed = 1;
            return;
        }

        let rand = random(1);
        if (isSmash || rand < 0.25) {
            this.type = 'SPICY';
            this.color = color(255, 60, 0);
            this.radius = this.baseRadius * 0.9;
            this.vx = (baseSpeed * (isSmash ? 2.2 : 1.6));
            this.vz = 2;
            this.rotSpeed = 0.5;
        } else if (rand < 0.5) {
            this.type = 'CHEESE';
            this.color = color(255, 215, 0);
            this.radius = this.baseRadius * 2.2;
            this.vx = (baseSpeed * 0.4);
            this.vz = 9;
            this.rotSpeed = 0.05;
        } else if (rand < 0.75) {
            this.type = 'GHOST';
            this.color = color(200, 200, 255);
            this.radius = this.baseRadius;
            this.vx = baseSpeed * 1.1;
            this.vz = random(4, 7);
            this.rotSpeed = 0.3;
        } else {
            this.type = 'NORMAL';
            this.color = color(160, 82, 45);
            this.radius = this.baseRadius;
            this.vx = baseSpeed * 1.2; 
            this.vz = random(5, 8);
            this.rotSpeed = 0.2;
        }
    }

    display() {
        if (!this.active) return;
        
        let visualAlpha = 255;
        if (this.type === 'GHOST' && this.vx < 0 && this.x > 250 && this.x < 650) {
            visualAlpha = 15;
        }

        noStroke();
        let shadowAlpha = map(this.z, 0, 150, 150, 20) * (visualAlpha/255);
        let shadowScale = map(this.z, 0, 150, 1, 1.5);
        fill(0, 0, 0, shadowAlpha);
        ellipse(this.x, this.y + this.radius*0.5, this.radius * 2 * shadowScale, this.radius * shadowScale);

        if (visualAlpha > 50) {
            for (let i = 0; i < this.trail.length; i++) {
                let pos = this.trail[i];
                let progress = i / this.trail.length;
                let alpha = progress * 100 * (visualAlpha/255);
                
                if (this.type === 'SPICY') fill(255, 100, 0, alpha);
                else if (this.type === 'CHEESE') fill(255, 200, 50, alpha);
                else if (this.type === 'FEVER_BALL') fill(0, 255, 255, alpha);
                else if (this.type === 'GHOST') fill(100, 200, 255, alpha);
                else fill(139, 69, 19, alpha);
                
                let trailSize = progress * this.radius * 2;
                ellipse(pos.x, pos.y - pos.z, trailSize);
            }
        }

        push();
        translate(this.x, this.y - this.z); 
        let scaleByZ = map(this.z, 0, 200, 1, 1.3);
        scale(scaleByZ);
        rotate(this.rotation);

        strokeWeight(2);
        stroke(50, visualAlpha);
        
        let c = color(this.color.levels[0], this.color.levels[1], this.color.levels[2], visualAlpha);
        fill(c);
        
        let currentW = this.radius * 2;
        let currentH = this.radius * 2;
        if (this.type === 'CHEESE') {
            currentW += sin(frameCount * 0.1) * 8;
            currentH -= sin(frameCount * 0.1) * 8;
        }
        ellipse(0, 0, currentW, currentH);
        
        noStroke();
        if (this.type === 'CHEESE') {
            fill(200, 150, 0, visualAlpha > 50 ? 150 : 0);
            ellipse(-this.radius*0.4, -this.radius*0.2, this.radius*0.5);
            ellipse(this.radius*0.3, this.radius*0.4, this.radius*0.7);
            ellipse(this.radius*0.5, -this.radius*0.3, this.radius*0.3);
        } else if (this.type !== 'FEVER_BALL' && this.type !== 'GHOST') {
            fill(0, visualAlpha > 50 ? 50 : 0);
            ellipse(-this.radius*0.2, -this.radius*0.2, this.radius*0.6, this.radius*0.3);
            ellipse(this.radius*0.3, this.radius*0.3, this.radius*0.4, this.radius*0.2);
        }
        
        fill(255, visualAlpha > 50 ? 60 : 0);
        ellipse(-this.radius*0.4, -this.radius*0.4, this.radius*0.5);
        pop();
    }
}

function checkCollisions() {
    for (let i = meatballs.length - 1; i >= 0; i--) {
        let b = meatballs[i];
        if (!b.active) continue;
        
        if (b.x < -b.radius) {
            meatballs.splice(i, 1);
            missCounter++;
            
            if (missCounter >= 3) {
                startDishwashMinigame();
                return; 
            }

            lives--;
            chefAnger = min(chefAnger + 15, 100);
            flashAlpha = 150; 
            triggerShake(20); 
            floatingTexts.push(new FloatingText(50, height/2, "MISS!", "MISS"));
            
            if (lives <= 0 || chefAnger >= 100) {
                gameState = STATE_GAMEOVER;
            }
            continue;
        }
        
        if (b.vx > 0) {
            for (let p of plates) {
                if (p.active) {
                    let pd = dist(b.x, b.y, p.x, p.y);
                    if (pd < b.radius + p.radius) {
                        p.break();
                        if (b.type !== 'FEVER_BALL') {
                            b.active = false;
                            meatballs.splice(i, 1);
                        } else {
                            score += 5; 
                        }
                    }
                }
            }
            
            if (bell.active) {
                let bd = dist(b.x, b.y, bell.x, bell.y);
                if (bd < b.radius + bell.radius) {
                    bell.active = false;
                    b.active = false;
                    meatballs.splice(i, 1);
                    startPrepMinigame();
                    return; 
                }
            }
        }

        let d = dist(pan.x, pan.y, b.x, b.y);
        
        if (d < pan.radius + b.radius && b.vx < 0 && b.x > pan.x - 10) {
            let angle = atan2(b.y - pan.y, b.x - pan.x);
            b.x = pan.x + cos(angle) * (pan.radius + b.radius);
            b.y = pan.y + sin(angle) * (pan.radius + b.radius);
            
            let swingForce = abs(pan.swingSpeed);
            let isSmash = swingForce > 15;
            let currentFeverMode = isFeverMode;
            
            b.vx = abs(b.vx);
            b.vy = pan.swingSpeed * 0.4 + random(-2, 2); 
            b.vy = constrain(b.vy, -15, 15);

            b.mutate(isSmash, currentFeverMode);

            if (currentFeverMode) {
                hitPause = 8;
                whiteFlashAlpha = 255;
                triggerShake(40);
                floatingTexts.push(new FloatingText(b.x, b.y, "SUPER SMASH!", "FEVER"));
                feverMeter = 0;
                isFeverMode = false;
                
                for (let p = 0; p < 40; p++) {
                    particles.push(new Particle(b.x, b.y, b.z, color(0, 255, 255), 'BLUE_FIRE'));
                }
            } else if (isSmash) {
                hitPause = 3;
                whiteFlashAlpha = 200;
                triggerShake(25);
                floatingTexts.push(new FloatingText(b.x, b.y, "SMASH!", "SMASH"));
                feverMeter = min(feverMeter + 15, maxFever);
                
                for (let p = 0; p < 20; p++) {
                    particles.push(new Particle(b.x, b.y, b.z, color(255, 255, 100), 'FIRE'));
                    particles.push(new Particle(b.x, b.y, b.z, color(255, 100, 0), 'FIRE'));
                }
            } else {
                triggerShake(5);
                if (random() > 0.5) floatingTexts.push(new FloatingText(b.x, b.y, "NICE!", "NICE"));
                feverMeter = min(feverMeter + 5, maxFever);
                
                for (let p = 0; p < 8; p++) {
                    particles.push(new Particle(b.x, b.y, b.z, b.color));
                }
            }

            if (feverMeter >= maxFever) {
                isFeverMode = true;
            }

            pan.triggerHit(isSmash || currentFeverMode);
        }
    }
}

function triggerShake(intensity) {
    shakeIntensity = max(shakeIntensity, intensity);
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('game-container');
    
    video = createCapture(VIDEO);
    video.size(camW, camH);
    video.hide();
    
    pan = new Pan();
    oven = new Oven();
    bell = new Bell();
    for (let i = 0; i < 3; i++) plates.push(new Plate());
    
    textAlign(CENTER, CENTER);
}

function updateTracking() {
    if (video.loadedmetadata) {
        video.loadPixels();
        let avgY = 0;
        let avgX = 0;
        let count = 0;
        
        let startX = Math.floor(video.width * 0.25);
        let endX = Math.floor(video.width * 0.75);
        let startY = Math.floor(video.height * 0.1);
        let endY = Math.floor(video.height * 0.9);

        for (let y = startY; y < endY; y += 2) {
            for (let x = startX; x < endX; x += 2) {
                let index = (x + y * video.width) * 4;
                let r = video.pixels[index];
                let g = video.pixels[index + 1];
                let b = video.pixels[index + 2];
                
                let dr = r - targetColor[0];
                let dg = g - targetColor[1];
                let db = b - targetColor[2];
                
                let wR = 0.3;
                let wG = 0.59;
                let wB = 0.11;
                
                let d = Math.sqrt(dr*dr*wR + dg*dg*wG + db*db*wB);
                
                if (d < threshold) {
                    avgY += y;
                    avgX += x;
                    count++;
                }
            }
        }
        
        if (count > 15) {
            avgY /= count;
            avgX /= count;
            trackedCamX = avgX;
            trackedCamY = avgY;
            trackedY = map(avgY, 0, video.height, 0, height);
        }
    }
    smoothedY = lerp(smoothedY, trackedY, 0.4);
}

function draw() {
    updateTracking();
    
    if (hitPause > 0) {
        hitPause--;
        return; 
    }

    if (gameState === STATE_PREP) {
        cursor(ARROW);
        runPrepMinigame();
    } else if (gameState === STATE_DISHWASH) {
        cursor(ARROW);
        runDishwashMinigame();
    } else {
        noCursor();
        drawKitchenCourt();

        push();
        if (shakeIntensity > 0) {
            translate(random(-shakeIntensity, shakeIntensity), random(-shakeIntensity, shakeIntensity));
            shakeIntensity *= 0.85; 
            if (shakeIntensity < 0.5) shakeIntensity = 0;
        }

        if (gameState === STATE_MENU) {
            drawMenu();
        } else if (gameState === STATE_PLAYING) {
            runGame();
        } else if (gameState === STATE_GAMEOVER) {
            drawGameOver();
        }
        pop();
    }

    if (flashAlpha > 0) {
        fill(255, 0, 0, flashAlpha);
        noStroke();
        rect(0, 0, width, height);
        flashAlpha -= 15;
    }
    if (whiteFlashAlpha > 0) {
        fill(255, 255, 255, whiteFlashAlpha);
        noStroke();
        rect(0, 0, width, height);
        whiteFlashAlpha -= 20;
    }
}

function drawKitchenCourt() {
    background(20);
    noStroke();
    let tileSize = 60;
    for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
            if ((x / tileSize + y / tileSize) % 2 === 0) {
                fill(240);
            } else {
                fill(40);
            }
            rect(x, y, tileSize, tileSize);
        }
    }

    push();
    rectMode(CENTER);
    translate(width/2, height/2);
    
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = 'rgba(0,0,0,0.8)';
    
    fill(205, 133, 63);
    stroke(139, 69, 19);
    strokeWeight(8);
    rect(0, 0, width - 80, height - 80, 20);
    
    drawingContext.shadowBlur = 0;
    stroke(184, 115, 51);
    strokeWeight(2);
    noFill();
    
    let w = width;
    let h = height;
    bezier(-w * 0.33, -h * 0.33, -w * 0.11, -h * 0.25, w * 0.11, -h * 0.41, w * 0.33, -h * 0.33);
    bezier(-w * 0.39, h * 0.17, -w * 0.17, h * 0.25, w * 0.17, h * 0.08, w * 0.39, h * 0.25);

    stroke(255, 255, 255, 200);
    strokeWeight(6);
    drawingContext.setLineDash([15, 15]);
    line(0, -height/2 + 45, 0, height/2 - 45);
    drawingContext.setLineDash([]);
    
    noStroke();
    fill(220, 30, 30);
    ellipse(0, -height/2 + 45, 24);
    ellipse(0, height/2 - 45, 24);
    fill(50, 150, 50);
    ellipse(0, -height/2 + 40, 10, 5);
    ellipse(0, height/2 - 50, 10, 5);
    pop();
}

function runGame() {
    oven.update();
    oven.display();

    for (let p of plates) {
        p.update();
        p.display();
    }

    if (chefAnger > 20 && !bell.active) {
        bell.active = true;
    } else if (chefAnger <= 20) {
        bell.active = false;
    }
    
    bell.update();
    bell.display();

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let b of meatballs) {
        b.update();
        b.display();
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].display();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    pan.update();
    pan.display();

    checkCollisions();
    drawUI();
}

function drawUI() {
    push();
    textSize(36);
    textAlign(CENTER, TOP);
    stroke(0);
    strokeWeight(6);
    fill(255, 200, 0);
    text("SCORE: " + score, width / 2, 20);

    textAlign(LEFT, TOP);
    textSize(28);
    fill(255);
    stroke(0);
    strokeWeight(4);
    let healthText = "LIVES: ";
    for (let i = 0; i < maxLives; i++) {
        healthText += (i < lives) ? "👨‍🍳 " : "💀 ";
    }
    text(healthText, 20, 20);

    let barWidth = 200;
    let barHeight = 20;
    let barX = 20;
    let barY = 60;
    
    strokeWeight(2);
    stroke(0);
    fill(50);
    rect(barX, barY, barWidth, barHeight, 10);
    
    let fillWidth = map(feverMeter, 0, maxFever, 0, barWidth);
    if (isFeverMode) {
        fill(0, 255, 255);
        if (frameCount % 10 < 5) fill(255);
    } else {
        fill(255, 100, 0);
    }
    noStroke();
    rect(barX + 2, barY + 2, max(0, fillWidth - 4), barHeight - 4, 8);
    
    fill(255);
    stroke(0);
    strokeWeight(3);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(isFeverMode ? "SUPER SMASH READY!" : "FEVER", barX + barWidth/2, barY + barHeight/2);
    
    let angerWidth = 150;
    let angerX = width - angerWidth - 20;
    let angerY = 20;
    strokeWeight(2);
    stroke(0);
    fill(50);
    rect(angerX, angerY, angerWidth, 20, 10);
    
    let angerFill = map(chefAnger, 0, 100, 0, angerWidth);
    fill(255, 50, 50);
    if (chefAnger > 75 && frameCount % 10 < 5) fill(255, 255, 255);
    noStroke();
    rect(angerX + 2, angerY + 2, max(0, angerFill - 4), 16, 8);
    fill(255);
    stroke(0);
    strokeWeight(3);
    textSize(14);
    text("CHEF ANGER", angerX + angerWidth/2, angerY + 10);

    pop();
    drawCameraUI();
}

function drawCameraUI() {
    push();
    translate(20, height - camH - 20);
    if (video.loadedmetadata) {
        image(video, 0, 0, camW, camH);
        
        stroke(0, 255, 0, 150);
        strokeWeight(2);
        noFill();
        let roiX = camW * 0.25;
        let roiY = camH * 0.1;
        let roiW = camW * 0.5;
        let roiH = camH * 0.8;
        rect(roiX, roiY, roiW, roiH);
        
        if (typeof trackedCamX !== 'undefined') {
            stroke(255, 0, 0);
            strokeWeight(2);
            line(trackedCamX - 10, trackedCamY, trackedCamX + 10, trackedCamY);
            line(trackedCamX, trackedCamY - 10, trackedCamX, trackedCamY + 10);
            noFill();
            ellipse(trackedCamX, trackedCamY, 15);
        }
    }
    stroke(255);
    strokeWeight(2);
    noFill();
    rect(0, 0, camW, camH);
    fill(targetColor[0], targetColor[1], targetColor[2]);
    rect(0, -25, 25, 25);
    
    fill(255, 255, 0);
    textSize(12);
    textAlign(LEFT, CENTER);
    noStroke();
    text("SENSITIVITY: " + threshold + " (UP/DOWN keys)", 35, -12);
    pop();
}

function drawMenu() {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    push();
    textAlign(CENTER, CENTER);
    
    if (titleImg) {
        imageMode(CENTER);
        let imgW = 600;
        let imgH = titleImg.height * (imgW / titleImg.width);
        image(titleImg, width / 2, height / 2 - 100, imgW, imgH);
        imageMode(CORNER);
    }
    
    textSize(24);
    let pulse = sin(frameCount * 0.1) * 100 + 155;
    fill(255, 255, 0, pulse);
    stroke(0);
    strokeWeight(3);
    text("CLICK TO START BRAWL", width / 2, height / 2 + 100);
    pop();
    
    pan.update();
    pan.display();
}

function drawGameOver() {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    push();
    textAlign(CENTER, CENTER);
    
    textSize(72);
    stroke(0);
    strokeWeight(12);
    fill(255, 50, 50);
    text("KITCHEN OVERRUN!", width / 2, height / 2 - 60);
    
    textSize(48);
    fill(255, 200, 0);
    strokeWeight(8);
    text("HIGH SCORE: " + score, width / 2, height / 2 + 30);
    
    textSize(24);
    let pulse = sin(frameCount * 0.1) * 100 + 155;
    fill(255, 255, 255, pulse);
    strokeWeight(5);
    text("CLICK TO RESTART", width / 2, height / 2 + 120);
    pop();
    
    pan.update();
    pan.display();
}

function startPrepMinigame() {
    gameState = STATE_PREP;
    prepTimer = prepMaxTimer;
    prepCurrent = [];
    prepShake = 0;
    meatballs = []; 
    
    if (random() > 0.5) {
        prepType = 0; 
        prepOptions = ['🍞', '🥩', '🥬', '🍅', '🧀'];
        prepTarget = ['🍞'];
        let fillings = ['🥩', '🥬', '🍅', '🧀'];
        let count = floor(random(2, 5));
        for (let i = 0; i < count; i++) {
            prepTarget.push(random(fillings));
        }
        prepTarget.push('🍞');
    } else {
        prepType = 1; 
        prepOptions = ['🥤', '🧊', '🍋', '🧃', '🍒'];
        prepTarget = ['🥤', '🧊'];
        let liquids = ['🍋', '🧃', '🍒'];
        let count = floor(random(1, 3));
        for (let i = 0; i < count; i++) {
            prepTarget.push(random(liquids));
        }
    }
}

function runPrepMinigame() {
    background(230, 220, 200);
    
    noStroke();
    fill(180, 170, 150);
    for (let i = 0; i < width; i += 40) {
        rect(i, 0, 2, height);
    }
    
    fill(139, 69, 19);
    rect(0, height - 180, width, 180);
    fill(160, 82, 45);
    rect(0, height - 170, width, 10);
    
    push();
    if (prepShake > 0) {
        translate(random(-prepShake, prepShake), random(-prepShake, prepShake));
        prepShake *= 0.8;
    }
    
    textSize(80);
    textAlign(CENTER, CENTER);
    text("🤬", width/2, 80);
    
    fill(255, 255, 240);
    stroke(0);
    strokeWeight(2);
    rect(width/2 - 120, 140, 240, 100);
    fill(0);
    noStroke();
    textSize(24);
    text("ORDER TICKET", width/2, 160);
    textSize(30);
    text(prepTarget.join(""), width/2, 200);
    
    for (let i = 0; i < prepCurrent.length; i++) {
        textSize(60);
        let yOffset = height - 180 - (i * 30);
        text(prepCurrent[i], width/2, yOffset);
    }
    
    let btnSpacing = 120;
    let startX = width/2 - (prepOptions.length * btnSpacing)/2 + btnSpacing/2;
    
    for (let i = 0; i < prepOptions.length; i++) {
        let bx = startX + i * btnSpacing;
        let by = height - 90;
        
        let d = dist(mouseX, mouseY, bx, by);
        let hover = d < 40;
        
        fill(hover ? 200 : 240);
        stroke(0);
        strokeWeight(3);
        ellipse(bx, by, 80, 80);
        
        textSize(40);
        noStroke();
        text(prepOptions[i], bx, by);
    }
    
    pop();
    
    prepTimer--;
    
    stroke(0);
    strokeWeight(4);
    fill(100);
    rect(20, 20, 200, 20, 10);
    let tWidth = map(max(0, prepTimer), 0, prepMaxTimer, 0, 200);
    fill(prepTimer < 120 ? color(255,0,0) : color(0,255,0));
    noStroke();
    rect(22, 22, tWidth-4, 16, 8);
    
    if (prepTimer <= 0) {
        failPrep();
    }
}

function failPrep() {
    flashAlpha = 150;
    triggerShake(30);
    lives--;
    chefAnger = 50;
    if (lives <= 0) gameState = STATE_GAMEOVER;
    else {
        gameState = STATE_PLAYING;
        floatingTexts.push(new FloatingText(width/2, height/2, "TOO SLOW!", "MISS"));
    }
}

function passPrep() {
    whiteFlashAlpha = 200;
    score += 20;
    chefAnger = 0;
    if(lives < maxLives) lives++;
    gameState = STATE_PLAYING;
    floatingTexts.push(new FloatingText(width/2, height/2, "ORDER UP!", "PERFECT"));
}

function startDishwashMinigame() {
    gameState = STATE_DISHWASH;
    dishTimer = maxDishTimer;
    dirtLevel = 100;
    missCounter = 0; 
    meatballs = []; 
    triggerShake(20);
}

function runDishwashMinigame() {
    background(20, 60, 80);
    
    noStroke();
    fill(40, 90, 120);
    for (let i = 0; i < width; i += 60) {
        rect(i, 0, 5, height);
    }

    push();
    if (shakeIntensity > 0) {
        translate(random(-shakeIntensity, shakeIntensity), random(-shakeIntensity, shakeIntensity));
        shakeIntensity *= 0.8;
    }

    push();
    translate(width/2, height/2);
    drawingContext.shadowBlur = 40;
    drawingContext.shadowColor = 'rgba(0,0,0,0.6)';
    fill(240);
    stroke(200);
    strokeWeight(8);
    ellipse(0, 0, 400, 400);
    
    drawingContext.shadowBlur = 0;
    fill(220);
    noStroke();
    ellipse(0, 0, 280, 280);

    let alphaValue = map(dirtLevel, 0, 100, 0, 255);
    fill(80, 120, 40, alphaValue); 
    ellipse(-40, -50, 180, 150);
    ellipse(60, 40, 160, 180);
    ellipse(10, 80, 220, 120);
    
    fill(50, 80, 20, alphaValue);
    ellipse(-70, -30, 80, 80);
    ellipse(80, -20, 100, 100);
    pop();

    pan.update();

    let scrubPower = abs(pan.swingSpeed);
    if (scrubPower > 5) { 
        dirtLevel -= scrubPower * 0.05; 
        if (frameCount % 4 === 0) {
            particles.push(new Particle(width/2 + random(-100, 100), height/2 + random(-100, 100), random(10, 30), color(200, 255, 255, 150), 'NORMAL'));
        }
    }
    dirtLevel = max(0, dirtLevel);

    let scrubY = map(smoothedY, 0, height, height/2 - 180, height/2 + 180);
    
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
    fill(255, 200, 50); 
    stroke(200, 150, 0);
    strokeWeight(4);
    rectMode(CENTER);
    rect(width/2, scrubY, 120, 80, 15);
    
    fill(200, 150, 0);
    noStroke();
    ellipse(width/2 - 30, scrubY - 15, 15);
    ellipse(width/2 + 20, scrubY + 10, 20);
    ellipse(width/2 - 10, scrubY + 20, 10);
    pop();

    push();
    textAlign(CENTER, TOP);
    textSize(50);
    stroke(0);
    strokeWeight(6);
    fill(255, 100, 100);
    text("SCRUB THE DISH!!!", width/2, 20);
    
    textSize(30);
    fill(255, 255, 0);
    text("SHAKE FAST UP & DOWN", width/2, 80);

    strokeWeight(4);
    stroke(0);
    fill(50);
    rect(width/2 - 200, 130, 400, 25, 10);
    let barW = map(dirtLevel, 0, 100, 400, 0); 
    fill(0, 255, 100);
    noStroke();
    rect(width/2 - 198, 132, barW - 4, 21, 8);
    pop();

    dishTimer--;

    stroke(0);
    strokeWeight(4);
    fill(100);
    rect(20, 20, 200, 20, 10);
    let tWidth = map(max(0, dishTimer), 0, maxDishTimer, 0, 200);
    fill(dishTimer < 120 ? color(255,0,0) : color(0,255,255));
    noStroke();
    rect(22, 22, tWidth-4, 16, 8);

    if (dirtLevel <= 0) {
        passDishwash();
    } else if (dishTimer <= 0) {
        failDishwash();
    }
    
    pop();
}

function passDishwash() {
    whiteFlashAlpha = 200;
    score += 30;
    if(lives < maxLives) lives++;
    gameState = STATE_PLAYING;
    floatingTexts.push(new FloatingText(width/2, height/2, "SQUEAKY CLEAN!", "PERFECT"));
}

function failDishwash() {
    flashAlpha = 150;
    triggerShake(40);
    lives--;
    chefAnger = min(chefAnger + 30, 100);
    if (lives <= 0) gameState = STATE_GAMEOVER;
    else {
        gameState = STATE_PLAYING;
        floatingTexts.push(new FloatingText(width/2, height/2, "STILL DIRTY!", "MISS"));
    }
}

function mousePressed(event) {
    let camX = 20;
    let camY = height - camH - 20;
    
    if (mouseX > camX && mouseX < camX + camW && mouseY > camY && mouseY < camY + camH) {
        let clickX = floor(map(mouseX, camX, camX + camW, 0, video.width));
        let clickY = floor(map(mouseY, camY, camY + camH, 0, video.height));
        let index = (clickX + clickY * video.width) * 4;
        
        targetColor = [
            video.pixels[index],
            video.pixels[index + 1],
            video.pixels[index + 2]
        ];
        return; 
    }
    
    if (gameState === STATE_MENU) {
        resetGame();
        gameState = STATE_PLAYING;
    } else if (gameState === STATE_GAMEOVER) {
        gameState = STATE_MENU;
    } else if (gameState === STATE_PREP) {
        let btnSpacing = 120;
        let startX = width/2 - (prepOptions.length * btnSpacing)/2 + btnSpacing/2;
        
        for (let i = 0; i < prepOptions.length; i++) {
            let bx = startX + i * btnSpacing;
            let by = height - 90;
            if (dist(mouseX, mouseY, bx, by) < 40) {
                
                prepCurrent.push(prepOptions[i]);
                
                let idx = prepCurrent.length - 1;
                if (prepCurrent[idx] !== prepTarget[idx]) {
                    prepShake = 20;
                    prepCurrent = [];
                    prepTimer -= 60; 
                } else if (prepCurrent.length === prepTarget.length) {
                    passPrep();
                }
                break;
            }
        }
    }
  
}

function keyPressed() {
    if (keyCode === UP_ARROW) {
        threshold = min(threshold + 5, 150);
    } else if (keyCode === DOWN_ARROW) {
        threshold = max(threshold - 5, 10);
    } else if (key === 'b' || key === 'B') {
        startPrepMinigame(); 
    } else if (key === 'c' || key === 'C') {
        startDishwashMinigame();
    }
  if(keyCode === "f"|| "F"){
      let fs = fullscreen();
    fullscreen(!fs);f
  }
}

function resetGame() {
    score = 0;
    lives = maxLives;
    baseSpeed = 7;
    maxMeatballs = 1;
    meatballs = [];
    particles = [];
    floatingTexts = [];
    feverMeter = 0;
    isFeverMode = false;
    chefAnger = 0;
    missCounter = 0;
    bell.active = false;
    oven.y = height / 2;
    oven.openMouth = 0;
    for (let p of plates) {
        p.active = true;
        p.y = random(100, height - 100);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}