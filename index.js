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

const loading = document.getElementById("loader-container");
const input = document.getElementById("file-input");
input.addEventListener(
  "change",
  async (changed) => {
    loading.classList.remove("hidden");
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    const model = await loadIfc(ifcURL);
    loading.classList.add("hidden");
    // scene.add(model);
  },
  false
);

async function loadIfc(url) {
  const model = await viewer.IFC.loadIfcUrl(url);
  await viewer.shadowDropper.renderShadow(model.modelID);

  const spatialTree = await viewer.IFC.getSpatialStructure(model.modelID);
  console.log(spatialTree);
};

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

window.onclick = async () => await viewer.IFC.selector.pickIfcItem();
window.onkeydown = async () => await viewer.IFC.selector.unpickIfcItems(); 

window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();
window.oncontextmenu = async () => await viewer.IFC.selector.unpickIfcItems();

// //Creates the Three.js scene
// const scene = new Scene();

// //Object to store the size of the viewport
// const size = {
//     width: window.innerWidth,
//     height: window.innerHeight,
// };

// //Creates the camera (point of view of the user)
// const camera = new PerspectiveCamera(75, size.width / size.height);
// camera.position.z = 15;
// camera.position.y = 13;
// camera.position.x = 8;

// //Creates the lights of the scene
// const lightColor = 0xffffff;

// const ambientLight = new AmbientLight(lightColor, 0.5);
// scene.add(ambientLight);

// const directionalLight = new DirectionalLight(lightColor, 1);
// directionalLight.position.set(0, 10, 0);
// directionalLight.target.position.set(-5, 0, 0);
// scene.add(directionalLight);
// scene.add(directionalLight.target);

// //Sets up the renderer, fetching the canvas of the HTML
// const threeCanvas = document.getElementById("three-canvas");
// const renderer = new WebGLRenderer({canvas: threeCanvas, alpha: true});
// renderer.setSize(size.width, size.height);
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// //Creates grids and axes in the scene
// const grid = new GridHelper(50, 30);
// scene.add(grid);

// const axes = new AxesHelper();
// axes.material.depthTest = false;
// axes.renderOrder = 1;
// scene.add(axes);

// //Creates the orbit controls (to navigate the scene)
// const controls = new OrbitControls(camera, threeCanvas);
// controls.enableDamping = true;
// controls.target.set(-2, 0, 0);

// //Animation loop
// const animate = () => {
//     controls.update();
//     renderer.render(scene, camera);
//     requestAnimationFrame(animate);
// };

// animate();

// //Adjust the viewport to the size of the browser
// window.addEventListener("resize", () => {
//     (size.width = window.innerWidth), (size.height = window.innerHeight);
//     camera.aspect = size.width / size.height;
//     camera.updateProjectionMatrix();
//     renderer.setSize(size.width, size.height);
// });

// //Sets up the IFC loading
// const ifcLoader = new IFCLoader();

// const input = document.getElementById("file-input");
// input.addEventListener(
//     "change",
//     async (changed) => {
//         const ifcURL = URL.createObjectURL(changed.target.files[0]);
//         const model = await ifcLoader.loadAsync(ifcURL);
//         scene.add(model);
//     },
//     false
// );
