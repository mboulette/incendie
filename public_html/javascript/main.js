
var timer = performance.now();
var ctx;
var assets = new Assets();



var main = function() {

    //assets.play('smb3_jump.wav');
    //pic1.draw(50, 50);
    //pic1.flip('v').draw(100, 50);

    anim.update();
    anim.flip('v').draw(100, 50);

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
    anim = new Animations('pompier.jpg', 0, 9);

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