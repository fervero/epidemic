(function() {
    

var $r0,
    $eff,
    $pop,
    $vrat,
    $gen,
    $start,
    $playPause,
    $plusOne,
    $zoomIn,
    $zoomOut,
    $simButtons,
    $zoomButtons,
    $main,
    $fullScreen,
    population,
    theCanvas,
    ctx,
    lang,
    day = {
        pl: 'Dzień',
        en: 'Day'
    },
    ctxWidth,
    ctxHeight,
    cachedCanvasWidth,
    cachedCanvasHeight,
    dotRadius = 5,
    gameLoopId = 0,
    paused = true,
    fullScreenEvent,
    color = {}

function tieInputs(pair) {
    pair.range.val(pair.box.val());
    pair.box.off('input').on('input', function(){
        pair.range.val(pair.box.val());
    });
    pair.range.off('input').on('input', function(){
        pair.box.val(parseFloat(pair.range.val()));
    });
}
document.addEventListener('DOMContentLoaded', function() {
    lang = document.documentElement.lang;
    cacheElements();
    color.vaccinated = $('.vaccinated').css('color');
    color.infected = $('.infected').css('color');
    color.unvaccinated = $('.unvaccinated').css('color');
    color.background = '#ffffff';
    tieInputs($r0);
    tieInputs($eff);
    tieInputs($pop);
    tieInputs($vrat);
    tieInputs($gen);
    initListeners();
    initCanvas();
    startSimulation();
});
function cacheElements() {
    $r0 = {
        box: $('input[name="r0field"]'),
        range: $('input[name="r0range"]')
    }
    $eff = {
        box: $('input[name="efficiency-field"]'),
        range: $('input[name="efficiency-range"]')
    }
    $pop = {
        box: $('input[name="population-field"]'),
        range: $('input[name="population-range"]')
    }
    $vrat = {
        box: $('input[name="vaccination-field"]'),
        range: $('input[name="vaccination-range"]')
    }
    $gen = {
        box: $('input[name="generations-field"]'),
        range: $('input[name="generations-range"]')
    }
    $start = $("#start");
    $continue = $("#continue");
    $playPause = $("#play");
    $plusOne = $("#plus-one");
    $zoomIn = $("#zoom-in");
    $zoomOut = $("#zoom-out");
    $fullScreen = $("#full-screen");
    $simButtons = $("#simulation-buttons");
    $zoomButtons = $("#zoom-buttons");
    $main = $('main');
}
function initListeners() {
    $start.on('click', startSimulation);
    $continue.on('click', simulationStep);
    $playPause.on('click', togglePause);    
    $plusOne.on('click', addInfected);
    $('form').submit(function(e) {e.preventDefault();});
    $zoomIn.on('click', zoomIn);
    $zoomOut.on('click', zoomOut);
    if($(document).fullScreen())
        $fullScreen.hide();
    $fullScreen.on('click', toggleFullScreen);
    $(document).on('fullscreenchange', handleFullScreenChange);
}
function resetCanvas() {
    ctxWidth = ctx.canvas.clientWidth;
    ctxHeight = ctx.canvas.clientHeight;
    ctx.font = 'bold 22px sans-serif';
    if(population) {
        dotRadius = Math.max(3, 5 * Math.sqrt(2000 / population.size) * ctxWidth / 600 );
        population.drawOut();
    }       
}
function initCanvas() {
    theCanvas = document.getElementById('the-canvas');
    ctx = theCanvas.getContext('2d');
    theCanvas = $(theCanvas);
    resetCanvas();
}
function startSimulation() {
    pauseSimulation();
    var size = $pop.box.val(),
        ratio = parseInt($vrat.box.val())/100;    
    Population.prototype.R0 = $r0.box.val();
    Person.prototype.viableGenerations = $gen.box.val();
    Person.prototype.vacEfficiency = parseInt($eff.box.val())/100;
    population = new Population(size);
    population.vaccinate(ratio);
    resetCanvas();
}
function addInfected() {
    if(population) {
        population.pickN(1);
        population.drawOut();
    }
}
function simulationStep() {
    population.kiss();
    population.drawOut();
}
function simulationLoop() {
    simulationStep();
    gameLoopId = setTimeout(simulationLoop, 500);
}
function togglePause() {
    if(paused)
        unpauseSimulation.call(this);
    else
        pauseSimulation.call(this);
}
function unpauseSimulation() {
    $playPause.html("<span class='fa fa-pause' aria-hidden='true' aria-label='pause'></i>");
    paused = false;
    gameLoopId = setTimeout(simulationLoop, 500);
}
function pauseSimulation() {
    window.clearTimeout(gameLoopId);
    paused = true;
    $playPause.html("<span class='fa fa-play' aria-hidden='true' aria-label='play continuously'></span>");
}
function canvasDot(x, y, dotColor) {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.closePath();
}
function canvasAbstractDot(x, y, color) {
// Abstract coordinates between (0,0) and (1,1)
    var realX = x * ctxWidth,
        realY = y * ctxHeight;
    canvasDot(realX, realY, color);
}
Cell.prototype.draw = function(x, y, xscale, yscale) {
    this.popArray.forEach(function(elem) {
        var elemColor;
        if (elem.isVaccinated()) {
            elemColor = color.vaccinated;
        } else {
            elemColor = color.unvaccinated;
        };
        if (elem.isInfected()) {
            elemColor = color.infected;
        }
        canvasAbstractDot((x + elem.x) * xscale, (y + elem.y) * yscale, elemColor);
    });
}
Population.prototype.drawOut = function() {
    var scaleX = 1 / this.x;
    var scaleY = 1 / this.y;
    ctx.fillStyle = color.background;
    ctx.fillRect(0,0,ctxWidth,ctxHeight);
    for (var x = 0; x < this.x; x++)
        for (var y = 0; y < this.y; y++)
            this.popArray[x][y].draw(x, y, scaleX, scaleY);
    ctx.fillStyle = 'black';
    ctx.fillText((day[lang] || '') + ': ' + population.generation, 30, 40);
}
function resizeCanvas(scale) {
    if(!(scale)) return;
    var width = parseFloat(theCanvas.attr("width"));
    var height = parseFloat(theCanvas.attr("height"));
    theCanvas.attr("width", String(scale*width));
    theCanvas.attr("height", String(scale*height));
    resetCanvas();
}
function resizeCanvasTo(x, y) {
    if((!(x)) || (!(y)))
        return;
    theCanvas.attr("width", String(x));
    theCanvas.attr("height", String(y));
    resetCanvas();
}
function zoomIn() {
    resizeCanvas(1.1);
}
function zoomOut() {
    resizeCanvas(0.9);
}
function handleFullScreenChange() {
    if($(document).fullScreen())
        handleFullScreen();
    else
        handleExitFullScreen();
}
function handleFullScreen() {
    $main.addClass('full-screen');
    cachedCanvasWidth = theCanvas.width();
    cachedCanvasHeight = theCanvas.height();
    var newWidth = Math.round($(window).width() * 0.8).toString(),
        vertSpace = ($(window).height() - $simButtons.outerHeight() - $zoomButtons.outerHeight()),
        newHeight = vertSpace.toString();
    console.log(vertSpace);
    theCanvas.attr('width', newWidth).attr('height', newHeight);
    resetCanvas();
}
function handleExitFullScreen() {
    $main.removeClass('full-screen');
    theCanvas.attr('width', cachedCanvasWidth).attr('height', cachedCanvasHeight);
    resetCanvas();
}
function toggleFullScreen() {
    if($(document).fullScreen())
        $main.fullScreen(false);
    else
        $main.fullScreen(true);
}
    
})();