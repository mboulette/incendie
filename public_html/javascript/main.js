
var timer = performance.now();
var ctx;
var assets = new Assets();



var main = function() {

    //assets.play('smb3_jump.wav');
    //pic1.draw(50, 50);
    //pic1.flip('v').draw(100, 50);
    ctx.clearRect(0, 0, board.width, board.height);
    pompier.update();
    pompier.draw(100, 50);

    feu1.update();
    feu1.draw(100, 100);

    feu2.update();
    feu2.draw(100, 300);
    feu3.update();
    feu3.draw(100, 400);
    feu4.update();
    feu4.draw(100, 500);    
    feu5.update();
    feu5.draw(100, 564); 

    feu6.update();
    feu6.draw(200, 500);    
    feu7.update();
    feu7.draw(200, 564); 


    requestAnimationFrame(main);
};


$( document ).ready(function() {
    board = $('canvas')[0];
    ctx = board.getContext('2d');

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    assets.load('pompier - copie.jpg');
    assets.load('smb3_jump.wav', 'sound');

    //pic1 = new Sprites('pompier.jpg', 0, 0);
    pompier = new Animations('pompier.png', 384, 8, 150);

    feu1 = new Animations('fire.png', 0, 5, 150);
    feu2 = new Animations('fire.png', 64, 5, 150);
    feu3 = new Animations('fire.png', 128, 5, 150);
    feu4 = new Animations('fire.png', 192, 5, 150);
    feu5 = new Animations('fire.png', 256, 5, 150);
    feu6 = new Animations('fire.png', 320, 5, 150);
    feu7 = new Animations('fire.png', 384, 5, 150);

    $(window).resize(function() {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;        
    });


});

$( document ).on('AssetLoad', function(e, current, total){
    if (current == total) {


        main();

    }
});