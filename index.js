import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { Color, Vector3, Object3D } from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCWINDOW } from "web-ifc";
import { Camera } from "three";

const container = document.getElementById("viewer-container");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0x3f3f3f),
});
viewer.grid.setGrid();
viewer.axes.setAxes();

const controls = viewer.context.ifcCamera.cameraControls;
controls.setLookAt(35, 55, 55, 0, 0, -20, false);

// const treeRoot = document.getElementById("tree-root");
const loading = document.getElementById("loader-container");
const input = document.getElementById("file-input");
input.addEventListener(
  "change",
  async (changed) => {
    loading.classList.remove("hidden");
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    const model = await loadIfc(ifcURL);
    loading.classList.add("hidden");
    // treeRoot.classList.remove("hidden");
    // scene.add(model);
  },
  false
);

const openButton = document.getElementsByClassName("openbtn")
const closeButton = document.getElementsByClassName("clsoebtn")
openButton.onclick = openNav();
closeButton.onclick = closeNav();
function openNav() {
  document.getElementById("mySidebar").style.width = "30%";
  document.getElementById("main").style.marginLeft = "250px";
  document.getElementById("main").classList.add("hidden");
}
function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
  document.getElementById("main").classList.remove("hidden");
}

async function loadIfc(url) {
  const model = await viewer.IFC.loadIfcUrl(url, true);
  await viewer.shadowDropper.renderShadow(model.modelID);

  const spatialTree = await viewer.IFC.getSpatialStructure(model.modelID);
  createTreeMenu(spatialTree, model.modelID);
};

//#region Materials
const selectMaterial = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.8,
  color: 0x74b8ff,
  depthTest: false,
});
viewer.IFC.selector.selection.material = selectMaterial;

const preSelectMaterial = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.6,
  color: 0x74b8ff,
  depthTest: false,
});
viewer.IFC.selector.preselection.material = preSelectMaterial;
//#endregion

//#region Navigation, Clicks etc.
window.onclick = async () => {
  viewer.IFC.selector.unpickIfcItems();
  await viewer.IFC.selector.unHighlightIfcItems();
  await viewer.IFC.selector.pickIfcItem();
}

window.onkeydown = async () => await viewer.IFC.selector.unHighlightIfcItems(); 
window.ondblclick = async () => {
  viewer.IFC.selector.unpickIfcItems();
  const result = await viewer.IFC.selector.highlightIfcItem(true);
  if (!result) return;
  const { modelID, id } = result;
  const props = await viewer.IFC.getProperties(modelID, id, true, false);
  console.log(props);
  createPropertiesMenu(props);
} 
viewer.clipper.active = true;
viewer.clipper.planeSize = 1;
window.onkeydown = (event) => {
    if(event.code === 'KeyP') {
        viewer.clipper.createPlane();
    }
    else if(event.code === 'KeyO') {
        viewer.clipper.deletePlane();
    }
}

window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();
// window.oncontextmenu = async () => await viewer.IFC.selector.unpickIfcItems();
//#endregion

//#region Model Structure Tree
function createTreeMenu(ifcProject, modelID) {
  const root = document.getElementById("tree-root");
  const newTree = root.cloneNode(true);
  newTree.id = "tree-root" + modelID;
  removeAllChildren(newTree);
  const projectName = document.getElementById("file-input").value.substring(12);
  const ifcProjectNode = createNestedChild(newTree,ifcProject, projectName);
  ifcProject.children.forEach(child => {
      constructTreeMenuNode(ifcProjectNode, child);
  })
  const myUL = document.getElementById("myUL");
  myUL.append(newTree);
  newTree.classList.remove("hidden");
  // newTree.getElementsByClassName("caret").textContent = "abc";

}

function nodeToString(node) {
  return `${node.type} - ${node.expressID}`
}

function constructTreeMenuNode(parent, node) {
  const children = node.children;
  if (children.length === 0) {
      createSimpleChild(parent, node);
      return;
  }
  const nodeElement = createNestedChild(parent, node);
  children.forEach(child => {
      constructTreeMenuNode(nodeElement, child);
  })
}
function createNestedChild(parent, node, contentName) {
  const content = contentName || nodeToString(node);
  const root = document.createElement('li');
  createTitle(root, content);
  const childrenContainer = document.createElement('ul');
  childrenContainer.classList.add("nested");
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;
}

function createTitle(parent, content) {
  const title = document.createElement("span");
  title.classList.add("caret");
  title.onclick = () => {
      title.parentElement.querySelector(".nested").classList.toggle("active");
      title.classList.toggle("caret-down");
  }
  title.textContent = content;
  parent.appendChild(title);
}

function createSimpleChild(parent, node) {
  const content = nodeToString(node);
  const childNode = document.createElement('li');
  childNode.classList.add('leaf-node');
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmouseenter = () => {
      viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
  }

  childNode.onclick = async () => {
      viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
  }
}
//#endregion

//#region Properties Menu
const propsGUI = document.getElementById("ifc-property-menu-root");

function createPropertiesMenu(properties) {

    removeAllChildren(propsGUI);

    delete properties.psets;
    delete properties.mats;
    delete properties.type;


    for (let key in properties) {
        createPropertyEntry(key, properties[key]);
    }

}

function createPropertyEntry(key, value) {
    const propContainer = document.createElement("div");
    propContainer.classList.add("ifc-property-item");

    if(value === null || value === undefined) value = "undefined";
    else if(value.value) value = value.value;

    const keyElement = document.createElement("div");
    keyElement.textContent = key;
    propContainer.appendChild(keyElement);

    const valueElement = document.createElement("div");
    valueElement.classList.add("ifc-property-value");
    valueElement.textContent = value;
    propContainer.appendChild(valueElement);

    propsGUI.appendChild(propContainer);
}

//#endregion

function removeAllChildren(element) {
  while (element.firstChild) {
      element.removeChild(element.firstChild);
  }
}