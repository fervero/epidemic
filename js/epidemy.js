var vacEfficiency = 0.95,
    infectionProbability = 0.3,
    cellSize = 9,
    viableGenerations = 4;
var Person = function(x, y) {
// to be called with constructor calls
    this.x = x || Math.random();
    this.y = y || Math.random();
    this.state = 0;
    this.generation = 0;
    return this;
}
Person.prototype.vaccinate = function() {
    this.state = this.state | 1;
}
Person.prototype.infect = function() {
    this.state = this.state | 2;
    this.generation = viableGenerations;
}
Person.prototype.isVaccinated = function() {
    return ((this.state & 1) === 1);
}
Person.prototype.isInfected = function() {
    return ((this.state & 2) === 2);
}
Person.prototype.isContagious = function() {
    return ((this.state & 2) === 2) && this.generation > 0;
}
Person.prototype.mark = function() {
    this.state = this.state | 4;
}
Person.prototype.unmark = function() {
    this.state = this.state & (~4);
}
Person.prototype.isMarked = function() {
    return ((this.state & 4) === 4);
}
Person.prototype.updateGeneration = function() {
    if(this.isContagious())
        this.generation--;
}

Person.prototype.kissForward = function(anotherPerson) {
    var chance = infectionProbability * ( anotherPerson.isVaccinated() ? (1-vacEfficiency) : 1 );
    if (Math.random() < chance) {
        anotherPerson.mark();
    }
}

Person.prototype.kissBack = function(anotherPerson) {
    if (!(anotherPerson.isContagious()))
        return;
    var chance = infectionProbability * ( this.isVaccinated() ? (1-vacEfficiency) : 1 );
    if ( Math.random() < chance)
        this.mark();
}

Person.prototype.kiss = function(anotherPerson) {
    if (!(this.isInfected()))
        this.kissBack(anotherPerson);
    else if (this.isContagious())
        this.kissForward(anotherPerson);
}

var Cell = function(n) {
// to be called with constructor calls
    this.size = n;
    this.popArray = [];
    for (var i=0; i<n; i++)
        this.popArray.push(new Person());
}
Cell.prototype.pickOne = function() {
    var x = Math.floor(this.size * Math.random());
    this.popArray[x].infect();
}
Cell.prototype.countInfected = function() {
    return this.popArray.reduce(function(acc, elem) {
        return acc + (elem.isInfected() ? 1 : 0);
    }, 0);
}
Cell.prototype.countMarked = function() {
    return this.popArray.reduce(function(acc, elem) {
        return acc + (elem.isMarked() ? 1 : 0);
    }, 0);
}
Cell.prototype.vaccinate = function(ratio) {
    this.popArray.forEach(function(elem) {
        if (Math.random() < ratio)
            elem.vaccinate();
    });
}
Cell.prototype.update = function() {
    this.popArray.forEach(function(elem) {
        if(elem.isMarked()) {
            elem.infect();
            elem.unmark();
        }
    });
}
Cell.prototype.updateGeneration = function() {
    this.popArray.forEach(function(elem) {
        elem.updateGeneration();
    });
}

Cell.prototype.kiss = function(args) {
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
                for (k = 0; k < args[j].size; k++)
            // k - iterating through the other cell's population
                    this.popArray[i].kissBack(args[j].popArray[k]);
            }
        } else if (this.popArray[i].isContagious()) {
            for (j = 0; j < args.length; j++)
            // j - iterating through all the other cells to kiss through
                for (k = 0; k < args[j].size; k++)
            // k - iterating through the other cell's population
                    this.popArray[i].kissForward(args[j].popArray[k]);
        }
    }
}
var Population = function(size) {
    this.cellSize = cellSize;
    this.generation = 0;
    this.x = Math.round(Math.sqrt(size * 3 / this.cellSize / 2));
    this.y = Math.round(size/ this.x / this.cellSize);
    this.popArray = [];
    var row;
    for(var i = 0; i < this.x; i++) {
        row = [];
        for(var j=0; j < this.y; j++)
            row.push(new Cell(this.cellSize));
        this.popArray.push(row);
    }
    this.popArray[Math.floor(this.x/2)][Math.floor(this.y/2)].pickOne();
}

Population.prototype.vaccinate = function(ratio) {
    for (var x=0; x < this.x; x++)
        for (var y=0; y < this.y; y++)
            this.popArray[x][y].vaccinate(ratio);
}

Population.prototype.processCell = function(x, y) {
    var args = [];
    if(x + 1 < this.x)
        args.push(this.popArray[x+1][y]);
    if(y + 1 < this.y)
        args.push(this.popArray[x][y+1]);
    this.popArray[x][y].kiss(args);
}
Population.prototype.updateGeneration = function(x, y) {
    this.popArray[x][y].updateGeneration();
}
Population.prototype.update = function() {
    for (var x=0; x < this.x; x++)
        for (var y=0; y < this.y; y++)
            this.popArray[x][y].update();
}

Population.prototype.kiss = function() {
    for (var x=0; x < this.x; x++)
        for (var y=0; y < this.y; y++)
            this.processCell(x, y);
    for (var x=0; x < this.x; x++)
        for (var y=0; y < this.y; y++)
            this.updateGeneration(x, y);
    this.update();
    this.generation++;
}

Population.prototype.nKisses = function(n) {
    for (var i=0; i<n; i++)
        this.kiss();
}

Population.prototype.printOut = function() {
    var row;
    for (var y=0; y < this.y; y++) {
        row = '';
        for (var x=0; x < this.x; x++)
            row = row + this.popArray[x][y].countInfected();
        console.log(y + 1000 + ": " + row);
    }
}

function calculateProbability (R0) {
    return infectionProbability = R0/(5 * cellSize - 1) / viableGenerations;
}