function allPathChildren (item)
//function to find all paths within an SVG group item returned by .importSVG(<svgFile>).
{
  if (!(typeof item == "object" && item.className == "Group")) {
    throw "The argument given to function 'allPathChildren()' is not a JavaScript object of prototype class 'Group', it is of class '" + item.className + "'";
  }
  biggestBounds = 0;
  disseminate(item, "Group", ["Path", "CompoundPath", "Group"]);
}

//maybe a bit risky using recursion here (this level of abstraction required?)
function disseminate(item, inputName, acceptNames)
{
  if (typeof item != "object" || acceptNames.indexOf(item.className) == -1) {
    throw "Argument given to 'findChildPaths()' is not a JavaScript object or is not paperJS class ${inputName}. It is of class: '" + item.className + "'";
  }
  var childs = item.children;
  for (var i=0; i < childs.length; i++) {
    if (childs[i].className == acceptNames[0]) {
      if (childs[i].bounds.area > biggestBounds) {
        biggestBounds = childs[i].bounds.area;
      }
      //add the found path element to the 'firstChildren' array object. This is a superior scope variable and doesn't need to be returned
      collectedPaths.push(childs[i]);
      console.log("${acceptNames[0]} item found");
    }
    else if (acceptNames.indexOf(childs[i].className) > 0) {
      console.log(childs[i].className + " found, recursing..")
      disseminate(childs[i], acceptNames.indexOf(childs[i].className), acceptNames);
    }
    else {
      console.log("An object found withing svg group item which is not of type 'Path' or 'CompoundPath', it is of class: '" + childs[i].className + "'");
    }
  }
}

function loadSVG(url) {
  //import SVG item into the canvas
  project.importSVG(url, {
    onLoad : function (item) {
      item.center = view.center;
      svgItem = item;
      //console.log("item.children[-1].children: " + item.children[(item.children.length -1 )].children);

      /* Approach 1: Make averages with all path's average size. Try deleting everything below the median
         Approach 2: Determine how big the bounds of a shape is relative to the canvas vh and vw.
         If below a certain percetage in both directions (vh, vw), then delete this path

         After this check the accuracy of material removal */
      allPathChildren(item);
      console.log(collectedPaths);
      console.log("biggestBounds area is: " + biggestBounds);
    }
  });
}

//variable to hold SVG image url as a constant for the document
var url = "http://localhost:8080/PCB-trace.svg";

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
//initialise a variable to hold all of the paths
var collectedPaths = [];
//variable to hold path with highest bounds area. Computed and saved upon svg import to save iterating over svg paths repeatedly
var biggestBounds = 0 ;

//load the SVG into the HTML canvas element
loadSVG(url);

//check the cursor's current position and re-centre the path to this point
tool.onMouseMove = function(event) {
  //on mouse move the position of 'path' var changes to underneath cursor again
  path.position = event.point;
  //console.log(event.point); //debug
}

var toolSize = document.getElementById("tool");
var smoothTool = document.getElementById("smooth");
var simplifyTool = document.getElementById("flatten");
var smoothWhole = document.getElementById("smoothWhole");
var despeck = document.getElementById("despeck");
var zoomIn = document.getElementById("zoomIn");
var zoomOut = document.getElementById("zoomOut");

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
});

smoothWhole.addEventListener('change', function(event) {
  if (this.checked) {
    for (var i=0; i < collectedPaths.length; i++) {
      collectedPaths[i].smooth({ type: 'continuous'});
    }
  }
  else {
    //clear the html canvas
    project.clear();
    //reload the svg to remove the simplification
    loadSVG(url);
  }
});

simplifyWhole.addEventListener('change', function(event) {
  if (this.checked) {
    for (var i=0; i < collectedPaths.length; i++) {
      var completed = collectedPaths[i].simplify(0.5);
      if (!completed) {
        console.log("Path " + collectedPaths[i].name + " could not be simplified.")
      }
    }
  }
  else {
    project.clear();
    loadSVG(url);
  }
});

despeck.addEventListener('change', function(event) {
  console.log('event.target.value: ' + event.target.value);
  var entry = (parseInt(event.target.value, 10) / 100);
  if (entry > 0.5 || typeof entry != 'number') {
    throw "Either a non-numerical character or a number higer than 50 was entered";
  }
  else if (entry < 0.01) {
    throw "Supplied despeck parameter cannot be below 1";
  }
  for (var i=0; i < collectedPaths.length; i++) {
    //test if the current iterated path has an area less than the largest path's bounds area timesed by the user-inputted scale-factor
    if (collectedPaths[i].bounds.area < (biggestBounds * entry)) {
      console.log("Removed 'speck'");
      collectedPaths[i].remove();
    }
  }
  console.log(collectedPaths);
});

zoomIn.addEventListener('click', function(event) {
  view.scale(1.2, 1.2);
});

zoomOut.addEventListener('click', function(event) {
  view.scale(0.8, 0.8);
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
