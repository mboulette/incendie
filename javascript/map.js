var starting_point = {'red' : {'x':0,'y':0}, 'purple' : {'x':0,'y':0}, 'green' : {'x':0,'y':0}, 'blue' : {'x':0,'y':0}};
var draw_bound = false;
var map;


class Map {

    
    constructor(filepath) {

		this.floors = [];
		this.walls = [];
		this.furnitures = [];
		this.specials = [];  

		this.height = 0;
		this.width = 0;
		
		//this.loadMapFile();
		this.loadjsmap();


    }

    loadMapFile() {
		var self = this;

		$.get(filepath, function(contents) {

			var map = jsonpack.unpack(contents);

			for (var i = 0; i < map.floors.length; i++) {
				self.loadTitle('floors', self.floors, map.floors[i]);
			}
			for (var i = 0; i < map.walls.length; i++) {
				self.loadTitle('walls', self.walls, map.walls[i]);
			}
			for (var i = 0; i < map.furnitures.length; i++) {
				self.loadTitle('furnitures', self.furnitures, map.furnitures[i]);
			}
			for (var i = 0; i < map.specials.length; i++) {
				self.loadTitle('specials', self.specials, map.specials[i]);
			}
		});    	
    }

    loadjsmap() {
    		var self = this;   		
			var map = jsonpack.unpack(map_content);

			for (var i = 0; i < map.floors.length; i++) {
				self.loadTitle('floors', self.floors, map.floors[i]);
			}
			for (var i = 0; i < map.walls.length; i++) {
				self.loadTitle('walls', self.walls, map.walls[i]);
			}
			for (var i = 0; i < map.furnitures.length; i++) {
				self.loadTitle('furnitures', self.furnitures, map.furnitures[i]);
			}
			for (var i = 0; i < map.specials.length; i++) {
				self.loadTitle('specials', self.specials, map.specials[i]);
			}  	
    }

	loadTitle(layer_name, layer, contents) {

	    if (contents.special && contents.special.action != '') {
	    	if (contents.special.action == 'starting-point') {
	    		starting_point[contents.special.color] = {'x' : contents.current.x, 'y' : contents.current.y};
	    		return;
	    	}

	    	if (contents.special.action == 'fireon') {
	    		var new_tile = new Fire(contents.special.size, contents.current.x, contents.current.y);
		        var map_tiles = this.walls.concat(this.floors, this.furnitures);	


		        for (var i = 0; i < map_tiles.length; i++) {
		            if (map_tiles[i].intersecte(new_tile.bounds())) {
		            	new_tile.friend = map_tiles[i];
		            	map_tiles[i].current.alight = 1;
		            	break;
		            }
		        }
	    	}


	    } else {

			var new_tile = new BurningTile(
				contents.filePath, 
				contents.x, 
				contents.y, 
				contents.current.x, 
				contents.current.y, 
				contents.width, 
				contents.height, 
				contents.rotation, 
				contents.direction
			);

			//(inflammability, heatproof, heat, burned, inflamed)
			// enflamme : inflammability * heat
			// brule : inflamed / heatproof
			if (layer_name == 'walls') new_tile.ignite(10, 5, 10, 0, 0);
			if (layer_name == 'furnitures') new_tile.ignite(20, 1, 10, 0, 0);
			if (layer_name == 'floors') new_tile.ignite(2, 1, 1, 0, 0);


			if (contents.bounds.length > 0) new_tile.bounds.push(new Boundaries());

	    }    

	    this.height = Math.max(this.height, (contents.current.y + contents.height) );
	    this.width = Math.max(this.width, (contents.current.x + contents.width) );
	    
	    layer.push(new_tile);
	};

	clean() {
	    
	    /*
        for (var i = 0; i < map.specials.length; i++) {
            if (map.specials[i].friend && map.specials[i].friend.current.burned > 3) {
                map.specials[i].friend.current.alight = 0;
                map.specials[i].friend.current.inflamed = 0;
                map.specials[i].remove = true;
            }
        }
        */

        this.specials = this.specials.filter(function(object){
            //if (object.remove) console.log('yep');
            return !object.remove;
        });

	}

    draw() {

	    for (var i = 0; i < this.floors.length; i++) {
	        this.floors[i].draw();
	        if (draw_bound) this.floors[i].drawBounds();
	    }

	    for (var i = 0; i < this.walls.length; i++) {
	        this.walls[i].draw();
	        if (draw_bound) this.walls[i].drawBounds();
	    }

	    for (var i = 0; i < this.furnitures.length; i++) {
	        this.furnitures[i].draw(true);
	        if (draw_bound) this.furnitures[i].drawBounds();
	    }

	    for (var i = 0; i < this.specials.length; i++) {
	        this.specials[i].draw();
	        if (draw_bound) this.specials[i].drawBounds();
	    }

		if (draw_bound) this.drawGrid();	
    }

	drawGrid() {
	    ctx.save();
	    ctx.setLineDash([3, 6]);
	    for (var x = 0; x < this.width; x+=64) { 
	        for (var y = 0; y < this.height; y+=64) {                
	            ctx.beginPath();
	            ctx.strokeStyle = 'rgba(0, 0, 255, 0.1)';
	            ctx.rect(x, y, 64, 64);
	            ctx.stroke();
	        }
	    }
	    ctx.restore();
	}

	drawCoor() {
	    ctx.save();
	    ctx.font = '8px Arial';
	    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
	    ctx.textAlign = 'left';

	    for (var x = 0; x < this.width; x+=64) { 
	        for (var y = 0; y < this.height; y+=64) { 
	            var text = '(' + x + ', ' + y + ')';
	            ctx.fillText(text, x + 5, y + 58);
	        }
	    }
	    ctx.restore();   
	}

}
