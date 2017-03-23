var $r0,
    $eff,
    $pop,
    $vrat,
    $gen,
    $start,
    $playPause,
    population,
    ctx,
    ctxWidth,
    ctxHeight,
    gameLoopId = 0,
    paused = true,
    color = {
        vaccinated: "#4040FF",
        unvaccinated: "#DDDD20",
        infected: "#FF0000"
    }

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
    $('form').submit(function(e) {e.preventDefault(); return false;});
    $start.on('click', startSimulation);
    $continue.on('click', simulationStep);
    $playPause.on('click', togglePause);
    tieInputs($r0);
    tieInputs($eff);
    tieInputs($pop);
    tieInputs($vrat);
    tieInputs($gen);
    ctx = document.getElementById('the-canvas').getContext('2d');
    ctxWidth = ctx.canvas.clientWidth;
    ctxHeight = ctx.canvas.clientHeight;
    ctx.font = 'bold 22px sans-serif';
});

function startSimulation() {
    pauseSimulation();
    var size = $pop.box.val(),
        ratio = $vrat.box.val();    
    Population.prototype.R0 = $r0.box.val();
    Person.prototype.viableGenerations = $gen.box.val();
    Person.prototype.vacEfficiency = $eff.box.val();    
    population = new Population(size);
    population.vaccinate(ratio);
    population.drawOut();
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
    console.log(paused);
    if(paused)
        unpauseSimulation.call(this);
    else
        pauseSimulation.call(this);
}

function unpauseSimulation() {
    $playPause.html('Pause');
    paused = false;
    gameLoopId = setTimeout(simulationLoop, 500);
}

function pauseSimulation() {
    window.clearTimeout(gameLoopId);
    paused = true;
    $playPause.html('Go on');
}

function canvasDot(x, y, dotColor) {
    var radius = 5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.closePath();
}

function canvasAbstractDot(x, y, color) {
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
    
        canvasDot((x + elem.x) * xscale, (y + elem.y) * yscale, elemColor);
    });
}

Population.prototype.drawOut = function() {
    var scaleX = ctxWidth / this.x;
    var scaleY = ctxHeight / this.y;
    ctx.clearRect(0,0,ctxWidth,ctxHeight);
    for (var x = 0; x < this.x; x++)
        for (var y = 0; y < this.y; y++)
            {
                this.popArray[x][y].draw(x, y, scaleX, scaleY);
            }
    ctx.fillStyle = 'black';
    ctx.fillText('Day: ' + population.generation, 30, 40);
}