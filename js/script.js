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
        gameLoopId = 0,
        paused = true,
        fullScreenEvent,
        Infection = Epidemic.newInstance(),
        color = {
            text: '#000000',
            background: '#ffffff'
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
        //Infection.init();
        lang = document.documentElement.lang;
        cacheElements();
        Infection.configure({
            colorVaccinated: $('.vaccinated').css('color'),
            colorInfected: $('.infected').css('color'),
            colorUnvaccinated: $('.unvaccinated').css('color'),
            colorBackground: '#ffffff',
            colorText: '#000000'
        });
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
        Infection.configure({
            ctx: ctx,
            ctxWidth: ctxWidth = ctx.canvas.clientWidth,
            ctxHeight: ctxHeight = ctx.canvas.clientHeight
        });
        ctx.font = 'bold 32px sans-serif';
        if(population) {
            Infection.setContext();
            population.draw();
            drawDay();
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
        Infection.configure({
            R0: $r0.box.val(),
            infectiousDays: $gen.box.val(),
            vacEfficiency: parseInt($eff.box.val())/100,
            vaccinationRatio: ratio
        });
        population = Infection.getNewPopulation(size);
        resetCanvas();
    }
    function addInfected() {
        if(population) {
            population.pickN(1);
            population.draw();
            drawDay();
        }
    }
    function simulationStep() {
        population.kiss();
        population.draw();
        drawDay();
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
    function drawDay() {
        ctx.strokeStyle = Infection.config.colorBackground;
        ctx.lineWidth = 6;
        ctx.strokeText((day[lang] || '') + ': ' + population.days, 30, 40);
        ctx.strokeStyle = Infection.config.colorText;
        ctx.lineWidth = 4;
        ctx.strokeText((day[lang] || '') + ': ' + population.days, 30, 40);
        ctx.fillStyle = Infection.config.colorBackground;
        ctx.fillText((day[lang] || '') + ': ' + population.days, 30, 40);    
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