
var ctx;
var assets = new Assets();

var currentTile = new Tiles('tilesheet_complete.png');

var walls = [];

var main = function() {

    ctx.save();
    ctx.clearRect(0, 0, board.width, board.height);

    for (var i = 0; i < walls.length; i++) {
        walls[i].draw();
    }

    ctx.save();
    ctx.globalAlpha = 0.5;
    currentTile.draw();
    ctx.restore();

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

    requestAnimationFrame(main);
};


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
        walls.push(new Tiles(
            currentTile.filePath, 
            currentTile.x, 
            currentTile.y, 
            currentTile.current.x, 
            currentTile.current.y, 
            currentTile.width, 
            currentTile.height, 
            currentTile.rotation, 
            currentTile.direction
        ));
    });

    $('canvas').on('mousemove', function(e){
        var rect = this.getBoundingClientRect();

        currentTile.current.x = Math.floor((e.clientX - rect.left) / 64) * 64;
        currentTile.current.y = Math.floor((e.clientY - rect.top) / 64) * 64;
    });

    $('#tiles').on('click', function(e){
        var rect = this.getBoundingClientRect();
        currentTile = new Tiles(
            $(this).data('file'), 
            Math.floor((e.clientX - rect.left) / 64) * 64, 
            Math.floor((e.clientY - rect.top) / 64) * 64
        );
    });

    $('#btnRotate').on('click', function(e){
        currentTile.rotation += 45;
        if (currentTile.rotation == 360) currentTile.rotation = 0;
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