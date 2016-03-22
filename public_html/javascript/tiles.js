"use strict";

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


class Sprites {
    constructor(filePath, x, y, width, height) {
        this.filePath = filePath;
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 60;
        this.height = height || 60;
        this.direction = 'none';
        this.rotation = 0;

        assets.load(this.filePath);
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
        ctx.save();

        if (this.rotation != 0 || this.direction != 'none') {
            ctx.translate(x + (this.width/2), y + (this.height/2));
            
            if (this.rotation != 0) ctx.rotate(this.rotation*Math.PI/180);
            if (this.direction.toLowerCase() == 'h' || this.direction.toLowerCase() == 'horizontal') ctx.scale(-1, 1);
            if (this.direction.toLowerCase() == 'v' || this.direction.toLowerCase() == 'vertical') ctx.scale(1, -1);        

            ctx.translate(0 - (x + (this.width/2)), 0 - (y + (this.height/2)));
        }

        ctx.drawImage(assets.files[this.filePath], this.x, this.y, this.width, this.height, x, y, this.width, this.height);
        ctx.restore();
    }

}

class Animations {
    constructor(filePath, framePosition, frameRate, width, height) {
        this.filePath = filePath;
        this.framePosition = framePosition || [{x: 0, y: 0}];
        this.frameRate = frameRate || 200;
        this.width = width || 60;
        this.height = height || 60;
        this.direction = 'none';
        this.rotation = 0;
        this.timer = performance.now();
        this.sprites = [];
        this.frame = 0;

        for (var frame in this.framePosition) {
            this.sprites.push(new Sprites(this.filePath, this.framePosition[frame].x, this.framePosition[frame].y, this.width, this.height));
        }
    }

    rotate(angle) {
        this.rotation = angle;
        return this;
    }

    flip(direction) {
        this.direction = direction;
        return this;
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

/*

class Mask {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
*/