
class Assets {
    
    constructor() {
        this.loaded = 0;
        this.files = [];
        this.AudioCtx = new AudioContext();
        this.volume = 0.05;
    }

    load(filePath, fileType) {
        var self = this;

        if ( !(filePath in this.files) ) {
            //this.files.push(filePath);
            this.files[filePath] = {};
            
            if (!fileType) fileType = 'image';

            if (fileType == "image") {
                var img = new Image();
                img.src = 'images/' + filePath;

                img.onload = function() {
                    self.loaded++;
                    self.files[filePath] = img;

                    $(document).trigger('AssetLoad', [self.loaded, Object.keys(self.files).length] );
                };
            }

            if (fileType == "sound") {
                var soundPath = 'https://raw.githubusercontent.com/mboulette/mariomaze/master/public_html/';

                var request = new XMLHttpRequest();
                request.open('GET', soundPath + 'sounds/' + filePath, true);
                request.responseType = 'arraybuffer';

                request.onload = function() {
                    self.AudioCtx.decodeAudioData(request.response, function(buffer) {
                        
                        var snd = {};
                        snd.buffer = buffer;
                        snd.gainNode = self.AudioCtx.createGain();
                        snd.gainNode.gain.value = self.volume;
                        snd.gainNode.connect(self.AudioCtx.destination);

                        self.loaded++;
                        self.files[filePath] = snd;

                        $(document).trigger('AssetLoad', [self.loaded, Object.keys(self.files).length] );

                    }, function(err) {
                        throw new Error(err);
                    });
                };

                request.send();

            }

        }

    }

    play(filePath) {
        var source = this.AudioCtx.createBufferSource();
        source.buffer = this.files[filePath].buffer;
        source.connect(this.files[filePath].gainNode);

        source.start(0);
    }

}


class Mask {
    constructor(x = 0, y = 0, width = 58, height = 58) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}


class Pivotable extends Mask {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.direction = 'none';
        this.rotation = 0;
    }

    rotate(angle) {
        this.rotation = angle;
        return this;
    }

    flip(direction) {
        this.direction = direction;
        return this;
    }

    draw (x, y) {
        if (this.rotation != 0 || this.direction != 'none') {
            ctx.translate(x + (this.width/2), y + (this.height/2));
            
            if (this.rotation != 0) ctx.rotate(this.rotation*Math.PI/180);
            if (this.direction.toLowerCase() == 'h' || this.direction.toLowerCase() == 'horizontal') ctx.scale(-1, 1);
            if (this.direction.toLowerCase() == 'v' || this.direction.toLowerCase() == 'vertical') ctx.scale(1, -1);        

            ctx.translate(0 - (x + (this.width/2)), 0 - (y + (this.height/2)));
        }
    }

}


class Sprites extends Pivotable {
    constructor(filePath, x, y, width, height) {
        super(x, y, width, height);
        this.filePath = filePath;
        assets.load(this.filePath);
    }

    draw (x, y) {
        ctx.save();
        super.draw(x,y);
        ctx.drawImage(assets.files[this.filePath], this.x, this.y, this.width, this.height, x, y, this.width, this.height);
        ctx.restore();
    }

}

class Boundaries {
    constructor(top=0, left=0, bottom=0, right=0) {
        this.top = top;
        this.left = left;
        this.bottom = bottom;
        this.right = right;
    }

    draw(x, y, width, height) {
        ctx.save();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';

        var width  = width + this.left + this.right;
        var height = height + this.top + this.bottom;

        var left = x - this.left;
        var top = y - this.top;
        var right = x + width;
        var bottom = y + height;
            
        for (var i = 0; i < width; i+=8) {
            ctx.moveTo(left+i, top);

            if (top+i < bottom) {
                ctx.lineTo(left, top+i);
            } else {
                ctx.lineTo(left - (bottom-top) + i, bottom);
            }
        }

        for (var i = 0; i <= height; i+=8) {
            ctx.moveTo(right, bottom-i);

            if (right-i > left) {
                ctx.lineTo(right-i, bottom);
            } else {
                ctx.lineTo(left, bottom + (right - left) - i);
            }  
        }

        ctx.stroke();
        ctx.restore();

    }

}

class Tiles extends Sprites {
    constructor(filePath, maskX=0, maskY=0, currentX=0, currentY=0, width=64, height=64, rotation=0, flip='none') {
        super(filePath, maskX, maskY, width, height);

        this.direction = flip;
        this.rotation = rotation;

        this.current = {
            'x' : currentX,
            'y' : currentY
        };

        this.bounds = [];

    }

    drawBounds() {
        for (var i = 0; i < this.bounds.length; i++) {
            this.bounds[i].draw(this.current.x, this.current.y, this.width, this.height);
        }
    }

    draw() {
        super.draw(this.current.x, this.current.y);
        return this;
    }
}

class AnimatedSprites extends Pivotable {
    constructor(filePath, framePosition = [{x: 0, y: 0}], frameRate = 200, width, height) {
        super(0, 0, width, height);

        this.filePath = filePath;
        this.framePosition = framePosition;
        this.frameRate = frameRate;
        this.timer = performance.now();
        this.sprites = [];
        this.frame = 0;

        for (var frame in this.framePosition) {
            this.sprites.push(new Sprites(this.filePath, this.framePosition[frame].x, this.framePosition[frame].y, this.width, this.height));
        }
    }

    update() {
        if (performance.now() - this.timer > this.frameRate) {
            this.frame++;
            if (this.frame >= this.sprites.length) this.frame = 0; 
            this.timer = performance.now();
        }
    }

    draw(x, y) {

        if (this.rotation != 0) this.sprites[this.frame].rotate(this.rotation);
        if (this.direction != 'none') this.sprites[this.frame].flip(this.direction);

        this.sprites[this.frame].draw(x, y);
    }

}


class Animations extends AnimatedSprites {
    constructor (filePath, y = 0, frameCount = 1, frameRate = 200, width = 64, height = 64) {
        
        var framePosition = [];

        for (var i = 0; i < frameCount; i++) { 
            framePosition.push({'x': i * width, 'y': y});
        }

        super(filePath, framePosition, frameRate, width, height);
    }
}

class Fireman {

    constructor(conn_id = '', name = 'Fireman', color = 'red', currentX = 0, currentY = 0, direction = 'none') {

        this.frameRate = 50;
        this.timer = performance.now();

        this.current = {
            'id' : conn_id,
            'name' : name,
            'x' : currentX,
            'y' : currentY,
            'direction' : direction,
            'color' : color
        };

        this.animations = {
            'none-red' :     new Animations('pompier.png', 0 * 64, 1), 
            'right-red' :    new Animations('pompier.png', 1 * 64, 8, 100),
            'left-red' :     new Animations('pompier.png', 2 * 64, 8, 100),
            'up-red' :       new Animations('pompier.png', 3 * 64, 6, 100),
            'down-red' :     new Animations('pompier.png', 4 * 64, 6, 100),

            'none-purple' :  new Animations('pompier.png', 5 * 64, 1), 
            'right-purple' : new Animations('pompier.png', 6 * 64, 8, 100),
            'left-purple' :  new Animations('pompier.png', 7 * 64, 8, 100),
            'up-purple' :    new Animations('pompier.png', 8 * 64, 6, 100),
            'down-purple' :  new Animations('pompier.png', 9 * 64, 6, 100),

            'none-green' :   new Animations('pompier.png', 10 * 64, 1), 
            'right-green' :  new Animations('pompier.png', 11 * 64, 8, 100),
            'left-green' :   new Animations('pompier.png', 12 * 64, 8, 100),
            'up-green' :     new Animations('pompier.png', 13 * 64, 6, 100),
            'down-green' :   new Animations('pompier.png', 14 * 64, 6, 100),

            'none-blue' :    new Animations('pompier.png', 15 * 64, 1), 
            'right-blue' :   new Animations('pompier.png', 16 * 64, 8, 100),
            'left-blue' :    new Animations('pompier.png', 17 * 64, 8, 100),
            'up-blue' :      new Animations('pompier.png', 18 * 64, 6, 100),
            'down-blue' :    new Animations('pompier.png', 19 * 64, 6, 100),
        };

    }

    move(delta) {
        switch(this.current.direction) {
            case 'left':
                this.current.x -= delta/10;
                break;
            case 'up':
                this.current.y -= delta/10;
                break;
            case 'right':
                this.current.x += delta/10;
                break;
            case 'down':
                this.current.y += delta/10;
                break;
        }
    }

    update(delta) {
        this.move(delta);
        this.animations[this.current.direction+'-'+this.current.color].update();
    }

    draw() {

        this.animations[this.current.direction+'-'+this.current.color].draw(this.current.x, this.current.y);

        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.current.name, this.current.x + 32, this.current.y);
    }

}