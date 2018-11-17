function findChildPaths (item)
//function to find all paths within an SVG group item returned by .importSVG(<svgFile>).
{
  if (!(typeof item == "Object" && item.className == "Group")) {
    throw new Exception("The argument given to function 'findChildPaths()' is not a JavaScript object of prototype class 'Group'");
  }
  //initialise a variable to hold all of the compound
  var firstChildren = [];

  for (path in item.children) {
    var regExp = new RegExp("^path\w*",'i');
    if (regExp.test(path.toString())) {
      //add the found path element to the 'firstChildren' array object
      firstChildren.push(item.children[path]);
      console.log("compPath found!: " + compPath.name);
      console.log("typeof compPath: " + typeof compPath);
      console.log(Object.keys(compPath));
    }
    else {
      console.log("compPath could not be found in svgItem");
    }
  }
}

//code to set up a circle which will follow the mouse cursor whilst in the canvas
var path = new Path.Circle({
  center: view.center,
  radius: 10,
  strokeColor: 'red',
  strokeWidth: 3,
  applyMatrix: false,
  strokeScaling: false
});

//initialise a variable to hold the svg callback item from .importSVG()
var svgItem;


//import SVG item into the canvas
project.importSVG("http://localhost:8080/PCB-trace.svg", {
  onLoad : function (item) {
    item.center = view.center;
    svgItem = item;
    console.log("item: " + item);
    console.log("item.class: ", item.className);
    console.log(item);
    console.log("item.children: " + item.children);
    console.log(item.children);
    console.log("item.children[-1]: " + item.children[(item.children.length - 1)]);
    //console.log("item.children[-1].children: " + item.children[(item.children.length -1 )].children);

    /* Approach 1: Make averages with all path's average size. Try deleting everything below the median
       Approach 2: Determine how big the bounds of a shape is relative to the canvas vh and vw. If below a certain percetage in both directions (vh, vw), then delete this path

       After this check the accuracy and if ok (no important material gone)*/
  }
});

//check the cursor's current position and re-centre the path to this point
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

//generate a path over the svg whilst the mouse is clicked
tool.onMouseDown = function(event) {
  modPath = new Path();
  modPath.add(event.point);
  modPath.strokeColor = 'black';
}

//function to capture 'mouse up' after a click and decide what to do with it. If it was a drag which wasn't a click, start procedure to
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
