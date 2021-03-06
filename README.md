# Epidemic
A simulator of an epidemic spreading through population. See it live [here](https://fervero.github.io/epidemic/index-en.html).

## The basics
1. Link the epidemic.js file in your project. Create a new model. Within it, create a new population. Pass a 2d context to it, so it has a place to put them colored blots. Draw. Minimal code looks like this:
```
var model = Epidemic.newInstance(),
    population = model.getNewPopulation();
model.setContext(document.querySelector('canvas').getContext('2d'));
population.draw();
```
2. To move the simulation forward, call the ```kiss()``` method:
```
population.kiss();
```
3. To have multiple simulations going at once in the same window, just create more models:
```
var model1 = Epidemic.newInstance(),
    model2 = Epidemic.newInstance(),
    pop1 = model1.getNewPopulation(),
    pop2 = model2.getNewPopulation();
model1.setContext(ctx1);
model2.setContext(ctx2);
```
4. And now the fun part: playing with the simulation. You can configure such (self-explanatory, I hope) parameters, like colors, population size, vaccine efficiency, vaccination ratio, etc. You do it like this:
```
model.configure({
  vacEfficiency: 0.95,
  R0: 4,
  colorBackground: 'black',
  infectiousDays: 7
});
```
Look at the ```Epidemic.default``` object to see the names of all parameters.
To be on the safe side, do the configuring <i>before</i> creating a population. Also, it's a good idea to call the ```setContext()``` method some time between creating the population, and trying to draw a single point on the canvas.
