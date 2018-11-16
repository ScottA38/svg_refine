/*
//determine the width and height of the canvas object and make it the width and height of the parent object
var canv = document.getElementById('svg_wrapper');
var ctx = canv.getContext('2D');
var body = document.getElementsByTagName('body')[0];
var svg = document.getElementById('svgPCB');
console.log("Width " + body.clientWidth + "; " + "Height" + body.clientHeight);
canv.width = (0.9 * body.clientWidth);
canv.height = (0.9 * body.clientHeight);
*/

/*
var img = new Image();
img.onload = function () {
  ctx.drawImage(img, 0, 0);
}
*/

var path = new Path.Circle({
  center: view.center,
  radius: 10,
  strokeColor: 'red',
  strokeWidth: 3,
  applyMatrix: false,
  strokeScaling: false
});

var svgItem;

project.importSVG("http://localhost:8080/PCB-trace.svg", {
  onLoad : function (item) {
    item.center = view.center;
    svgItem = item;
    //console.log(item);
    console.log(item.children)
    console.log(item.children[(item.children.length - 1)]);
    console.log(item.children[(item.children.length -1 )].children);

    /* Approach 1: Make averages with all path's average size. Try deleting everything below the median
       Approach 2: Determine how big the bounds of a shape is relative to the canvas vh and vw. If below a certain percetage in both directions (vh, vw), then delete this path

       After this check the accuracy and if ok (no important material gone)

       Can I join all paths in compound path after this into one path object? Or will this make a union of all the paths in compound path? */
  }
});

tool.onMouseMove = function(event) {
  //on mouse move the position of 'path' var changes to underneath cursor again
  path.position = event.point;
  //console.log(event.point); //debug
}

var toolSize = document.getElementById("tool");
var smoothTool = document.getElementById("smooth");
var simplifyTool = document.getElementById("flatten");

var modPath; //a path to track the mouse drag without shift to show area which needs to be refined
tool.minDistance = 10;

console.log(toolSize);//debug
toolSize.addEventListener("change", function(event) {
  console.log("Radius slider change detected! " + event.target.value + ". path.radius is: " + path.bounds.width);
  path.scaling = this.value;
});

smoothTool.addEventListener('change', function(event) {
  console.log("Smoothing value change, new value is: " + event.target.value);
});

simplifyTool.addEventListener('change', function(event) {
  console.log("Simplification value changed, new value is: " + event.target.value);
})

tool.onMouseDown = function(event) {
  modPath = new Path();
  modPath.add(event.point);
  modPath.strokeColor = 'black';
}

tool.onMouseUp = function(event) {
  if (!event.modifiers.shift) {
    var transposedPath = [];
    for (var i=0; i < modPath.segments.length; i++) {
      //copy all the nearest points across from the drawn path to the svg
      //transposedPath[i] = svgItem.getNearestPoint(modPath.segments[i]);
      //svgItem.getNearestPoint(modPath.segments[i]).selected = true;
    }
    //console.log(modPath);
  }
}

tool.onMouseDrag = function(event) {
  //test to see of the shift key was held whilst a mouse drag action was peformed
  if (event.modifiers.shift)
  {
    //move the image the distance of the mouse drag
    svgItem.position += event.delta;
  } else {
    modPath.add(event.point)
  }
}
