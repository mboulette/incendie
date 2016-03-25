
var ctx;
var assets = new Assets();
var erasing = false;
var copying = false;
var currentTile = new Tiles('tilesheet_complete.png');

var floors = [];
var walls = [];
var furnitures = [];
var specials = [];

var main = function() {

    ctx.save();
    ctx.clearRect(0, 0, board.width, board.height);

    if ($('#viewLayer').is(':checked')) ctx.globalAlpha = ($('#layers').val() == 'floors') ? 1 : 0.3;
    for (var i = 0; i < floors.length; i++) {
        floors[i].draw();
        if ($("#viewBounds").is(':checked')) floors[i].drawBounds();
    }

    if ($('#viewLayer').is(':checked')) ctx.globalAlpha = ($('#layers').val() == 'walls') ? 1 : 0.3;
    for (var i = 0; i < walls.length; i++) {
        walls[i].draw();
        if ($("#viewBounds").is(':checked')) walls[i].drawBounds();
    }

    if ($('#viewLayer').is(':checked')) ctx.globalAlpha = ($('#layers').val() == 'furnitures') ? 1 : 0.3;
    for (var i = 0; i < furnitures.length; i++) {
        furnitures[i].draw();
        if ($("#viewBounds").is(':checked')) furnitures[i].drawBounds();
    }

    if ($('#viewLayer').is(':checked')) ctx.globalAlpha = ($('#layers').val() == 'specials') ? 1 : 0.3;
    for (var i = 0; i < specials.length; i++) {
        specials[i].draw();
        if ($("#viewBounds").is(':checked')) specials[i].drawBounds();
    }
    ctx.restore();

    if (!erasing && !copying) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        currentTile.draw();
        ctx.restore();
    }

    drawGrid();
    drawCoor();

    

    requestAnimationFrame(main);
};


var drawGrid = function() {
    if ($('#viewGrid').is(':checked')) {
        ctx.save();
        ctx.setLineDash([3, 6]);
        for (var x = 0; x < board.width; x+=64) { 
            for (var y = 0; y < board.height; y+=64) {                
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0, 0, 255, 0.1)';
                ctx.rect(x, y, 64, 64);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

var drawCoor = function(x, y) {
    if ($('#viewCoor').is(':checked')) {
        ctx.save();
        ctx.font = '8px Arial';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.textAlign = 'left';

        for (var x = 0; x < board.width; x+=64) { 
            for (var y = 0; y < board.height; y+=64) { 
                var text = '(' + x + ', ' + y + ')';
                ctx.fillText(text, x + 5, y + 58);
            }
        }
        ctx.restore();
    }
    
}

$(document).on('AssetLoad', function(e, current, total){
    if (current == total) {
        main();
    }
});

$(document).ready(function() {

    board = $('canvas')[0];
    ctx = board.getContext('2d');

    assets.load('tilesheet_complete.png');


    $('canvas').on('click', function(e){
       
        if (copying) {

            for (var i = 0; i < window[$('#layers').val()].length; i++) {
                var object =  window[$('#layers').val()][i];
                
                if (object.current.x == currentTile.current.x && object.current.y == currentTile.current.y) {
                    currentTile.filePath = object.filePath;
                    currentTile.x = object.x; 
                    currentTile.y = object.y; 
                    currentTile.current.x = object.current.x;
                    currentTile.current.y = object.current.y;
                    currentTile.width = object.width;
                    currentTile.height = object.height;
                    currentTile.rotation = object.rotation;
                    currentTile.direction = object.direction;

                    copying = false;
                    return;
                }

            }

        }


        window[$('#layers').val()] = window[$('#layers').val()].filter(function(object){
            return !(object.current.x == currentTile.current.x && object.current.y == currentTile.current.y);
        });

        if (!erasing && !copying) {
            var new_tile = new Tiles(
                currentTile.filePath, 
                currentTile.x, 
                currentTile.y, 
                currentTile.current.x, 
                currentTile.current.y, 
                currentTile.width, 
                currentTile.height, 
                currentTile.rotation, 
                currentTile.direction
            );

            if ($('#layers').val() == 'walls' || $('#layers').val() == 'specials')  new_tile.bounds.push(new Boundaries());

            window[$('#layers').val()].push(new_tile);
        }
    });

    $('canvas').on('mousemove', function(e){
        var rect = this.getBoundingClientRect();

        currentTile.current.x = Math.floor((e.clientX - rect.left) / 64) * 64;
        currentTile.current.y = Math.floor((e.clientY - rect.top) / 64) * 64;
    });

    $('#tiles').on('click', function(e){
        var rect = this.getBoundingClientRect();

        currentTile.filePath = $(this).data('file');
        currentTile.x = Math.floor((e.clientX - rect.left) / 64) * 64;
        currentTile.y = Math.floor((e.clientY - rect.top) / 64) * 64;
        currentTile.rotation = 0;
        currentTile.direction = 'none';

        erasing = false;
        copying = false;

    });

    $('#btnCopy').on('click', function(e){
        copying = true;
    });

    $('#btnErase').on('click', function(e){
        erasing = true;
    });

    $('#btnRotateD').on('click', function(e){
        currentTile.rotation += 45;
        if (currentTile.rotation == 360) currentTile.rotation = 0;
    });

    $('#btnRotateG').on('click', function(e){
        currentTile.rotation -= 45;
        if (currentTile.rotation == -360) currentTile.rotation = 0;
    });


    $('#btnFlipV').on('click', function(e){
        if (currentTile.direction == 'v') {
            currentTile.direction = 'none';
        } else {
            currentTile.direction = 'v';
        }
    });

    $('#btnFlipH').on('click', function(e){
        if (currentTile.direction == 'h') {
            currentTile.direction = 'none';
        } else {
            currentTile.direction = 'h';
        }
    });


});