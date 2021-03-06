
Number.prototype.between = function(a, b) {
    var min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
    return this >= min && this <= max;
};

String.prototype.substitute = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.lpad = function(padstr, length) {
    var str = this;           
    while (str.length < length) str = padstr + str;
    return str;
}


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
                img.src = 'http://mboulette.16mb.com/images/' + filePath;

                img.onload = function() {
                    self.loaded++;
                    self.files[filePath] = img;

                    $(document).trigger('AssetLoad', [self.loaded, Object.keys(self.files).length] );
                };
            }

            if (fileType == "sound") {
                var soundPath = 'http://mboulette.16mb.com/sounds/';

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

    test() {
        $(document).trigger('AssetLoad', [this.loaded, Object.keys(this.files).length] );
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
        this.highlight = 0;
    }

    draw (x, y) {
        ctx.save();
        super.draw(x,y);
        ctx.drawImage(assets.files[this.filePath], this.x, this.y, this.width, this.height, x, y, this.width, this.height);

        if (this.highlight == 1){
            var bound = new Boundaries();
            bound.draw(x, y, this.width, this.height);
        }

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
        this.special = {};

    }

    hit(bound, left, right, top, bottom) {

        return !(
            bound.left > right ||
            bound.right < left ||
            bound.top > bottom ||
            bound.bottom < top 
        );

    }

    collision(bound) {
        
        for (var i = 0; i < this.bounds.length; i++) {

            var left = this.current.x - this.bounds[i].left;
            var right = this.current.x + this.width + this.bounds[i].left + this.bounds[i].right;

            var top = this.current.y - this.bounds[i].top;
            var bottom = this.current.y + this.height + this.bounds[i].top + this.bounds[i].bottom;

            return this.hit(bound, left, right, top, bottom);

        }

        return false;
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
    constructor(filePath, framePosition = [{x: 0, y: 0}], frameRate = 200, width, height, startFrame = 0) {
        super(0, 0, width, height);

        this.filePath = filePath;
        this.framePosition = framePosition;
        this.frameRate = frameRate;
        this.timer = performance.now();
        this.sprites = [];
        this.frame = startFrame;

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
    constructor (filePath, y = 0, frameCount = 1, frameRate = 200, width = 64, height = 64, startFrame = 0) {
        
        var framePosition = [];

        for (var i = 0; i < frameCount; i++) { 
            framePosition.push({'x': i * width, 'y': y});
        }

        super(filePath, framePosition, frameRate, width, height, startFrame);
    }
}


class SimplifiedFire {
    constructor(size = 'small', currentX = 0, currentY = 0) {
        this.current = {
            'size' : size,
            'x' : currentX,
            'y' : currentY,
        };

        var frame = Math.floor(Math.random() * 4);

        this.animations = {
            'tiny' :    new Animations('fire.png', 0 * 64, 5, 100, 64, 64, frame),
            'small' :   new Animations('fire.png', 1 * 64, 5, 100, 64, 64, frame),
            'medium' :  new Animations('fire.png', 2 * 64, 5, 100, 64, 64, frame),
            'large' :   new Animations('fire.png', 3 * 64, 5, 100, 64, 128, frame),
            'x-large' : new Animations('fire.png', 5 * 64, 5, 100, 64, 128, frame),
        }
    }

    draw() {
        var x = this.current.x;
        var y = this.current.y;

        if (this.current.size == 'large' || this.current.size == 'x-large') {
            y -= 64;
        }
        this.animations[this.current.size].draw(x, y);
        this.animations[this.current.size].update();
    }

    collision(bound) {
        return false;
    }

}

class Fire {
    constructor(size = 'small', currentX = 0, currentY = 0) {

        this.remove = false;

        this.current = {
            'size' : size,
            'x' : currentX,
            'y' : currentY,
        };

        var frame = Math.floor(Math.random() * 4);

        this.animations = {
            'tiny' :    new Animations('fire.png', 0 * 64, 5, 100, 64, 64, frame),
            'small' :   new Animations('fire.png', 1 * 64, 5, 100, 64, 64, frame),
            'medium' :  new Animations('fire.png', 2 * 64, 5, 100, 64, 64, frame),
            'large' :   new Animations('fire.png', 3 * 64, 5, 100, 64, 128, frame),
            'x-large' : new Animations('fire.png', 5 * 64, 5, 100, 64, 128, frame),
        }
    }

    bounds() {
        return {
            'left' : this.current.x + 5,
            'right' : this.current.x + 64 - 5,
            'top' : this.current.y + 5,
            'bottom' : this.current.y + 64 - 5
        };
    }


    spread(delta) {
        delta = delta / 10;

        this.friend.burn(delta);
        if (this.friend.current.inflamed == 0) this.current.size = 'tiny';
        if (this.friend.current.inflamed > 0) this.current.size = 'small';
        if (this.friend.current.inflamed > 2) this.current.size = 'medium';
        if (this.friend.current.inflamed > 4) this.current.size = 'large';
        if (this.friend.current.inflamed > 6) this.current.size = 'x-large';

        if (this.friend.current.inflamed < 0) {
            this.friend.current.inflamed = 0;
            this.remove = true;
            return;
        }

        /*
        var nb_collisions = 0;
        var current_inflamed = 0;
        var map_tiles = map.walls.concat(map.floors, map.furnitures);


        for (var i = 0; i < map_tiles.length; i++) {
            if (map_tiles[i].intersecte(this.bounds()) && map_tiles[i].current.inflamed >= 0 ) {

                nb_collisions++;
                map_tiles[i].burn(delta);

                if (map_tiles[i].current.inflamed <= 0) this.current.size = 'tiny';
                if (map_tiles[i].current.inflamed > 0) this.current.size = 'small';
                if (map_tiles[i].current.inflamed > 2) this.current.size = 'medium';
                if (map_tiles[i].current.inflamed > 4) this.current.size = 'large';
                if (map_tiles[i].current.inflamed > 6) this.current.size = 'x-large';

                current_inflamed = map_tiles[i].current.inflamed;
                map_tiles[i].current.alight == 1;

                break;
            }
        }

        if (nb_collisions == 0) {
            this.remove = true;
            console.log(map.specials);
            return;
        }
        */
        

        var centerX = this.current.x + (this.width / 2);
        var centerY = this.current.y + (this.height / 2);       
        var adjacents = [];
        var map_tiles = map.walls.concat(map.floors, map.furnitures);

        //trouver toutes les cases adjacente
        for (var i = 0; i < map_tiles.length; i++) {

            if (map_tiles[i].current.alight == 0) {
                
                if (map_tiles[i].intersecte( { 'left' : this.current.x - 59, 'right' : this.current.x + 64 + 59, 'top' : this.current.y - 59, 'bottom' : this.current.y + 64 + 59}  )) {
                    adjacents.push(map_tiles[i]);
                    //map.walls[i].highlight = 1;
                }

            }

        }

        for (var i = 0; i < adjacents.length; i++) {
            var taux = Math.floor(Math.random() * (burnning_speed * 4000) / delta) + 1;

            
            if (adjacents[i].inflammability * this.friend.current.inflamed >= taux) {
            
                //console.log(adjacents[i].inflammability, this.friend.current.inflamed, taux);

                var new_tile = new Fire('tiny', adjacents[i].current.x, adjacents[i].current.y);
                new_tile.friend = adjacents[i];
                adjacents[i].current.alight = 1;

                map.specials.push(new_tile);
            }

        }
        
       

    }

    draw() {
        if (this.remove != true) {
            var x = this.current.x;
            var y = this.current.y;

            if (this.current.size == 'large' || this.current.size == 'x-large') {
                y -= 64;
            }
            this.animations[this.current.size].draw(x, y);
            this.animations[this.current.size].update();
        }
    }

    collision(bound) {
        return false;
    }

}

class BurningTile extends Tiles {
    
    constructor(filePath, maskX=0, maskY=0, currentX=0, currentY=0, width=64, height=64, rotation=0, flip='none') {
        super(filePath, maskX, maskY, currentX, currentY, width, height, rotation, flip);

        this.inflammability = 0;
        this.heatproof = 0
        this.heat = 0;
        this.current.burned = 0;
        this.current.inflamed = 0;
        this.current.alight = 0;

        this.sprites = [
            new Sprites ('fire.png', 0 * 64, 7 * 64, 64, 64),
            new Sprites ('fire.png', 1 * 64, 7 * 64, 64, 64),
            new Sprites ('fire.png', 2 * 64, 7 * 64, 64, 64)
        ];
    }

    draw(furniture = false) {
        if (furniture) {
            switch (this.current.burned) {
                case 0 :
                    super.draw();
                    break
                case 1 :
                    super.draw();
                    this.sprites[0].draw(this.current.x, this.current.y);
                    break;
                case 2 :
                    this.sprites[0].draw(this.current.x, this.current.y);
                    break;
                default :
                    break;
            }

        } else {
            switch (this.current.burned) {
                case 0 :
                    super.draw();
                    break
                case 1 :
                    super.draw();
                    this.sprites[0].draw(this.current.x, this.current.y);
                    break;
                case 2 :
                    super.draw();
                    this.sprites[1].draw(this.current.x, this.current.y);
                    break;

                default :
                    this.sprites[2].draw(this.current.x, this.current.y);
                    if (this.collision(this.bounds)) this.sprites[1].draw(this.current.x, this.current.y);
                    break;
            }
        }

    }

    ignite(inflammability, heatproof, heat, burned, inflamed) {
        this.inflammability = inflammability;
        this.heatproof = heatproof;
        this.heat = heat;
        this.current.burned = burned;
        this.current.inflamed = inflamed;

        return this;
    }

    burn(delta) {
        var taux = Math.floor(Math.random() * (burnning_speed * 1000) / delta) + 1;

        if (this.inflammability * this.heat >= taux) {

            //console.log(this.inflammability, this.heat, taux, this.current.inflamed, this.current.burned);

            if (this.current.burned > 3) {
                this.current.inflamed--;
            } else {
                this.current.inflamed++;
            }
        }


        //console.log(this.current.inflamed, (this.heatproof/10), taux);
        if (this.current.inflamed / (this.heatproof/10) >= taux) {
            this.current.burned++;
        }

    }

    intersecte(bound) {
        if (this.current.burned > 3) {
            return false;
        } else {
            return !(
                bound.left > (this.current.x + this.width) ||
                bound.right < (this.current.x) ||
                bound.top > (this.current.y + this.height) ||
                bound.bottom < (this.current.y) 
            );
        }
    }

    collision(bound) {
        if (this.current.burned > 3 && this.current.inflamed < 1) {
            return false;
        } else {
            return super.collision(bound);
        }
    }
}

class Fireman {

    constructor(conn_id = '', name = 'Fireman', color = 'red', currentX = 0, currentY = 0, direction = 'none') {

        this.current = {
            'id' : conn_id,
            'name' : name,
            'x' : currentX,
            'y' : currentY,
            'direction' : direction,
            'color' : color,
            'last' : direction,
            'action' : 'none',
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

    bounds() {
        return {
            'left' : this.current.x + 20,
            'right' : this.current.x + 44,
            'top' : this.current.y + 30,
            'bottom' : this.current.y + 60
        };
    }

    boundsAction() {

        var x = this.current.x + 32;
        var y = this.current.y + 32;
        if (this.current.last == 'left') x -= 40;
        if (this.current.last == 'right') x += 40;
        if (this.current.last == 'up') y -= 40;
        if (this.current.last == 'down') y += 40;

        return {
            'left' : x - 10,
            'right' : x + 10,
            'top' : y - 10,
            'bottom' : y + 10
        };
    }

    collision() {
        for (var i = 0; i < map.walls.length; i++) {
            if (map.walls[i].collision(this.bounds())) {
                return true;
            }
        }

        for (var i = 0; i < map.specials.length; i++) {
            if (map.specials[i].collision(this.bounds())) {
                return true;
            }
        }

        return false;
    }

    move(delta) {

        var current_x = this.current.x;
        var current_y = this.current.y;

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

        if (this.current.direction != 'none') this.current.last = this.current.direction;

        if (this.current.direction != 'none' && this.collision()) {
            this.current.x = current_x;
            this.current.y = current_y;
        }

    }

    update(delta) {
        this.move(delta);
        this.animations[this.current.direction+'-'+this.current.color].update();

        if (this.current.action == 'soak') this.soak(delta);
        if (this.current.action == 'destroy') this.destroy(delta);

    }

    drawSoak() {
        var bound = this.boundsAction();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 255, 1)';
        ctx.rect(bound.left, bound.top, bound.right - bound.left, bound.bottom - bound.top);
        ctx.stroke();  
    }

    drawDestroy() {
        var bound = this.boundsAction();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
        ctx.rect(bound.left, bound.top, bound.right - bound.left, bound.bottom - bound.top);
        ctx.stroke();  
    }

    destroy(delta) {
        var map_tiles = map.walls.concat(map.furnitures);
        var taux = Math.floor(Math.random() * (4000) / delta) + 1;

        for (var i = 0; i < map_tiles.length; i++) {
            if (map_tiles[i].collision(this.boundsAction())) {                
                
                if (taux < 10 && map_tiles[i].current.burned < 4) {
                    map_tiles[i].current.burned += 1;
                }
            }
        }
    }

    soak(delta) {

        var map_tiles = map.walls.concat(map.floors, map.furnitures);

        for (var i = 0; i < map_tiles.length; i++) {
            if (map_tiles[i].intersecte(this.boundsAction())) {
                //console.log(map_tiles[i].current.inflamed );
                
                if (map_tiles[i].current.inflamed > 10) map_tiles[i].current.inflamed = Math.round(map_tiles[i].current.inflamed / 2);
                if (map_tiles[i].current.inflamed >= 0) map_tiles[i].current.inflamed -= (delta/100);
                if (map_tiles[i].current.inflamed < 0) {
                    map_tiles[i].current.alight = 0;
                }

            }
        }

        for (var i = 0; i < map.specials.length; i++) {
            if (map.specials[i].friend && map.specials[i].friend.current.burned > 3) {
                map.specials[i].remove = true;
            }
        }

    }

    draw() {

        this.animations[this.current.last+'-'+this.current.color].draw(this.current.x, this.current.y);

        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.current.name, this.current.x + 32, this.current.y);

        if (draw_bound) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
            ctx.rect(this.current.x+20, this.current.y+30, 24, 30);
            ctx.stroke();            
        }

        if (this.current.action == 'soak') this.drawSoak();
        if (this.current.action == 'destroy') this.drawDestroy();

    }

}