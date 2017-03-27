var Epidemic = {
    config: {
        vacEfficiency: 1,
        viableGenerations: 1,
        cellSize: 10,
        R0: 2,
        infectionProbability: 1
    },
    default: {
        vacEfficiency: 1,
        viableGenerations: 1,
        cellSize: 10,
        R0: 2,
        infectionProbability: 1,
        colorBackground: 'white',
        colorFont: 'black',
        colorInfected: 'red',
        colorVaccinated: 'blue',
        colorUnvaccinated: 'yellow',
        ctxWidth: 200,
        ctxHeight: 200,
        dotRadius: 5
    },
    protoPopulation: {},
    protoCell: {},
    protoPerson: {},
    init: function() {
        this.protoPopulation.config = Object.create(this.config);
        this.protoCell.config = Object.create(this.config);
        this.protoPerson.config = Object.create(this.config);
    },
    newInstance: function() {
        var Infection = Object.create(this);
        Infection.config = Object.create(this.config);
        Infection.init();
        return Infection;
    },
    configure: function(newConfig) {
        $.extend(this.config, newConfig);
    },
    resetToDefault: function() {
        $.extend(this.config, this.default);
    },
    setContext: function(ctx) {
        this.config.ctx = ctx;
        this.config.ctxWidth = ctx.canvas.clientWidth;
        this.config.ctxHeight = ctx.canvas.clientHeight;
    }
}
Epidemic.protoPerson.init = function() {
    this.x = Math.random();
    this.y = Math.random();
    this.state = 0;
    this.generation = 0;
}
Epidemic.getNewPerson = function() {
    var newPerson = Object.create(this.protoPerson);
    newPerson.init();
    return newPerson;
}
Epidemic.protoPerson.vaccinate = function() {
    this.state = this.state | 1;
}
Epidemic.protoPerson.infect = function() {
    this.state = this.state | 2;
    this.generation = this.config.viableGenerations;
}
Epidemic.protoPerson.isVaccinated = function() {
    return ((this.state & 1) === 1);
}
Epidemic.protoPerson.isInfected = function() {
    return ((this.state & 2) === 2);
}
Epidemic.protoPerson.isContagious = function() {
    return ((this.state & 2) === 2) && this.generation > 0;
}
Epidemic.protoPerson.mark = function() {
    this.state = this.state | 4;
}
Epidemic.protoPerson.unmark = function() {
    this.state = this.state & (~4);
}
Epidemic.protoPerson.isMarked = function() {
    return ((this.state & 4) === 4);
}
Epidemic.protoPerson.updateGeneration = function() {
    if(this.isContagious())
        this.generation--;
}
Epidemic.protoPerson.kissForward = function(anotherPerson) {
    var chance = this.config.infectionProbability * ( anotherPerson.isVaccinated() ? (1-this.config.vacEfficiency) : 1 );
    if (Math.random() < chance) {
        anotherPerson.mark();
    }
}
Epidemic.protoPerson.kissBack = function(anotherPerson) {
    if (!(anotherPerson.isContagious()))
        return;
    var chance = this.config.infectionProbability * ( this.isVaccinated() ? (1-this.config.vacEfficiency) : 1 );
    if ( Math.random() < chance)
        this.mark();
}
Epidemic.protoPerson.kiss = function(anotherPerson) {
    if (!(this.isInfected()))
        this.kissBack(anotherPerson);
    else if (this.isContagious())
        this.kissForward(anotherPerson);
}
Epidemic.getNewCell = function(n) {
    var newCell, popArray = [], person;
    newCell = Object.create(this.protoCell);
    newCell.cellSize = n;
    for (var i=0; i<n; i++)
        popArray.push(this.getNewPerson());
    newCell.popArray = popArray;
    return newCell;
}
Epidemic.protoCell.pickOne = function() {
    var x = Math.floor(this.cellSize * Math.random()),
        arr = this.popArray,
        elem;
    elem = this.popArray.splice(x,1)[0];
    elem.infect();
    this.popArray.push(elem);
}
Epidemic.protoCell.countInfected = function() {
    return this.popArray.reduce(function(acc, elem) {
        return acc + (elem.isInfected() ? 1 : 0);
    }, 0);
}
Epidemic.protoCell.countMarked = function() {
    return this.popArray.reduce(function(acc, elem) {
        return acc + (elem.isMarked() ? 1 : 0);
    }, 0);
}
Epidemic.protoCell.vaccinate = function(ratio) {
    this.popArray.forEach(function(elem) {
        if (Math.random() < ratio)
            elem.vaccinate();
    });
}
Epidemic.protoCell.update = function() {
    this.popArray.forEach(function(elem) {
        if(elem.isMarked()) {
            elem.infect();
            elem.unmark();
        }
    });
}
Epidemic.protoCell.updateGeneration = function() {
    this.popArray.forEach(function(elem) {
        elem.updateGeneration();
    });
}
Epidemic.protoCell.kiss = function(args) {
    args = args || [];
    var i, j, k;
    for (i = 0; i < this.popArray.length; i++) {
// i - iterating through this cell's population
        for (k = i + 1; k < this.popArray.length; k++)
// k - iterating through this cell's population
            this.popArray[i].kiss(this.popArray[k]);
        if(!(this.popArray[i].isInfected())) {
            for (j = 0; j < args.length; j++) {
            // j - iterating through all the other cells to kiss through
                for (k = 0; k < args[j].cellSize; k++)
            // k - iterating through the other cell's population
                    this.popArray[i].kissBack(args[j].popArray[k]);
            }
        } else if (this.popArray[i].isContagious()) {
            for (j = 0; j < args.length; j++)
            // j - iterating through all the other cells to kiss through
                for (k = 0; k < args[j].cellSize; k++)
            // k - iterating through the other cell's population
                    this.popArray[i].kissForward(args[j].popArray[k]);
        }
    }
}
Epidemic.getNewPopulation = function(size) {
    var newPopulation = Object.create(this.protoPopulation),
        popArray = [],
        cellSize = this.config.cellSize,
        columns = newPopulation.columns = Math.round(Math.sqrt(size * 3 / cellSize / 2)),
        rows = newPopulation.rows = Math.round(size/ columns / cellSize),
        row;
    this.config.infectionProbability = this.config.R0/(5 * this.config.cellSize - 1) / this.config.viableGenerations;
    for(var i = 0; i < columns; i++) {
        row = [];
        for(var j=0; j < rows; j++)
            row.push(this.getNewCell(cellSize));
        popArray.push(row);
    }
    popArray[Math.floor(columns/2)][Math.floor(rows/2)].pickOne();   
    newPopulation.popArray = popArray;
    newPopulation.days = 0;
    newPopulation.size = columns * rows * cellSize;
    return newPopulation;
}
Epidemic.protoPopulation.pickN = function(n) {
    var i, x, y;
    for (var i=0; i<n; i++) {
        x = Math.floor(Math.random() * this.columns);
        y = Math.floor(Math.random() * this.rows);
        this.popArray[x][y].pickOne();
    }
}
Epidemic.protoPopulation.vaccinate = function(ratio) {
    for (var x=0; x < this.columns; x++)
        for (var y=0; y < this.rows; y++)
            this.popArray[x][y].vaccinate(ratio);
}
Epidemic.protoPopulation.processCell = function(x, y) {
    var args = [];
    if(x + 1 < this.columns)
        args.push(this.popArray[x+1][y]);
    if(y + 1 < this.rows)
        args.push(this.popArray[x][y+1]);
    this.popArray[x][y].kiss(args);
}
Epidemic.protoPopulation.updateGeneration = function(x, y) {
    this.popArray[x][y].updateGeneration();
}
Epidemic.protoPopulation.update = function() {
    for (var x=0; x < this.columns; x++)
        for (var y=0; y < this.rows; y++)
            this.popArray[x][y].update();
}
Epidemic.protoPopulation.kiss = function() {
    for (var x=0; x < this.columns; x++)
        for (var y=0; y < this.rows; y++)
            this.processCell(x, y);
    for (var x=0; x < this.columns; x++)
        for (var y=0; y < this.rows; y++)
            this.updateGeneration(x, y);
    this.update();
    this.days++;
}
Epidemic.protoPopulation.printOut = function() {
    var row;
    for (var y=0; y < this.rows; y++) {
        row = '';
        for (var x=0; x < this.columns; x++)
            row = row + this.popArray[x][y].countInfected();
        console.log(y + 1000 + ": " + row);
    }
}

Epidemic.protoCell.canvasDot = function(x, y, dotColor) {
    var ctx = this.config.ctx;
    ctx.beginPath();
    ctx.arc(x, y, this.config.dotRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.closePath();
}
Epidemic.protoCell.canvasAbstractDot = function(x, y, color) {
// Abstract coordinates between (0,0) and (1,1)
    var realX = x * this.config.ctxWidth,
        realY = y * this.config.ctxHeight;
    this.canvasDot(realX, realY, color);
}
Epidemic.protoCell.draw = function(x, y, xscale, yscale) {
    var colorVaccinated = this.config.colorVaccinated,
        colorInfected = this.config.colorInfected,
        colorUnvaccinated = this.config.colorUnvaccinated,
        canvasAbstractDot = this.canvasAbstractDot.bind(this);
    this.popArray.forEach(function(elem) {
        var elemColor;
        if (elem.isVaccinated()) {
            elemColor = colorVaccinated;
        } else {
            elemColor = colorUnvaccinated;
        };
        if (elem.isInfected()) {
            elemColor = colorInfected;
        }
        canvasAbstractDot((x + elem.x) * xscale, (y + elem.y) * yscale, elemColor);
    });
}
Epidemic.protoPopulation.drawOut = function() {
    var scaleX = 1 / this.columns,
        scaleY = 1 / this.rows,
        ctx = this.config.ctx,
        ctxHeight = this.config.ctxHeight,
        ctxWidth = this.config.ctxWidth;
    ctx.fillStyle = this.config.colorBackground;
    ctx.fillRect(0,0,ctxWidth,ctxHeight);
    for (var x = 0; x < this.columns; x++)
        for (var y = 0; y < this.rows; y++)
            this.popArray[x][y].draw(x, y, scaleX, scaleY);
}
