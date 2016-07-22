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
		
		var self = this;

		$.get(filepath, function(contents) {

			var map = jsonpack.unpack(contents);

			for (var i = 0; i < map.floors.length; i++) {
				self.loadTitle(self.floors, map.floors[i]);
			}
			for (var i = 0; i < map.walls.length; i++) {
				self.loadTitle(self.walls, map.walls[i]);
			}
			for (var i = 0; i < map.furnitures.length; i++) {
				self.loadTitle(self.furnitures, map.furnitures[i]);
			}
			for (var i = 0; i < map.specials.length; i++) {
				self.loadTitle(self.specials, map.specials[i]);
			}
		});    	
    }

	loadTitle(layer, contents) {
	    var new_tile = new Tiles(
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

	    this.height = Math.max(this.height, (contents.current.y + contents.height) );
	    this.width = Math.max(this.width, (contents.current.x + contents.width) );

	    if (contents.bounds.length > 0) new_tile.bounds.push(new Boundaries());
	    layer.push(new_tile);
	};

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
	        this.furnitures[i].draw();
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


$(document).ready(function() {

	map = new Map('https://raw.githubusercontent.com/mboulette/incendie/master/public_html/maps/map1.map');

});
