
var ctx;
var assets = new Assets();
var erasing = false;
var copying = false;
var currentTile = new Tiles('tilesheet_complete.png');

var floors = [];
var walls = [];
var furnitures = [];
var specials = [];
var filename = 'map.json';

var start = {'x': -1, 'y' : -1};

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

    if (start.x >=0 && !copying) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
        
        ctx.rect(
            Math.min(start.x, currentTile.current.x), 
            Math.min(start.y, currentTile.current.y), 
            Math.abs(currentTile.current.x - start.x) + 64, 
            Math.abs(currentTile.current.y - start.y) + 64
        );

        ctx.fill();
        ctx.stroke();
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


    $('canvas').on('mousedown', function(e){
        var rect = this.getBoundingClientRect();

        if (!copying) {
            start.x = Math.floor((e.clientX - rect.left) / 64) * 64;
            start.y = Math.floor((e.clientY - rect.top) / 64) * 64;
        }
    });

    $('canvas').on('mouseup', function(e){


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
            return;
        }

        for (var x = Math.min(start.x, currentTile.current.x); x <= Math.max(start.x, currentTile.current.x); x+=64) { 
            for (var y = Math.min(start.y, currentTile.current.y); y <= Math.max(start.y, currentTile.current.y); y+=64) {
                putTile(x, y);
            }
        }

        start = {'x': -1, 'y' : -1};

    });

    var putTile = function(x,y) {

        window[$('#layers').val()] = window[$('#layers').val()].filter(function(object){
            return !(object.current.x == x && object.current.y == y);
        });

        if (!erasing) {
            var new_tile = new Tiles(
                currentTile.filePath, 
                currentTile.x, 
                currentTile.y, 
                x, 
                y, 
                currentTile.width, 
                currentTile.height, 
                currentTile.rotation, 
                currentTile.direction
            );

            if ($('#layers').val() == 'walls' || $('#layers').val() == 'specials')  new_tile.bounds.push(new Boundaries());

            window[$('#layers').val()].push(new_tile);
        }

    }

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


    $('#btnSave').on('click', function(e){

        var map = {
            'floors' : floors,
            'walls' : walls,
            'furnitures' : furnitures,
            'specials' : specials
        };

        var packed = jsonpack.pack(map);

        
        //window.open('data:text/json;charset=utf-8,' + JSON.stringify(map));

        filename = prompt("Nom du fichier", filename);
        if (filename) saveData(packed, filename);
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

    var saveData = (function () {

        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var json = data,
                blob = new Blob([json], {type: "octet/stream"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());


    function readSingleFile(e) {
      var file = e.target.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        var contents = e.target.result;
        loadFile(contents);
      };
      reader.readAsText(file);
    }

    function loadFile(contents) {
        var map = jsonpack.unpack(contents);

        for (var i = 0; i < map.floors.length; i++) {
            loadTitle(floors, map.floors[i]);
        }
        for (var i = 0; i < map.walls.length; i++) {
            loadTitle(walls, map.walls[i]);
        }
        for (var i = 0; i < map.furnitures.length; i++) {
            loadTitle(furnitures, map.furnitures[i]);
        }
        for (var i = 0; i < map.specials.length; i++) {
            loadTitle(specials, map.specials[i]);
        }

    }

    function loadTitle(layer, contents) {
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

        if (contents.bounds.length > 0) new_tile.bounds.push(new Boundaries());
        layer.push(new_tile);
    }

    document.getElementById('file-input')
      .addEventListener('change', readSingleFile, false);
    });