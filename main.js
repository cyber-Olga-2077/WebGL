import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    Curve3,
    VertexData,
    Mesh
} from '@babylonjs/core';

const canvas = document.getElementById('renderCanvas');
const engine = new Engine(canvas, true);

const createScene = () => {
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 20, new Vector3(0, 4, 0), scene);
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);
    light.intensity = 0.7;

    // Materiały
    const material = new StandardMaterial("material", scene);
    material.diffuseColor = new Color3(0.2, 0.2, 0.2); // Ciemny szary

    const padMaterial = new StandardMaterial("padMaterial", scene);
    padMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9); // Jasny szary

    const startX = 0; // odległość nausznika od środka
    const startY = 1.75; // początkowa wysokość nauszników
    const pointCount = 100; // ilość punktów

    const allPoints = [];
    const indices = [];
    const normals = [];


    const splineMovements = [{radius:5.5,z:0.5},{radius:5.5, z:-0.5}, {radius: 6, z:-0.5}, {radius:6, z:0.5},{radius:5.5,z:0.5}];
    for (const splineMovement of splineMovements) {
        // Generowanie punktów na półokręgu
        for (let i = 0; i < pointCount; i++) {
            const angle = Math.PI * (i / pointCount) * 1.2 - Math.PI * 0.08 // kąt od 0 do Pi
            const x = Math.cos(angle) * splineMovement.radius - startX;
            const y = Math.sin(angle) * (splineMovement.radius) + startY;
            allPoints.push(new Vector3(x, y, splineMovement.z));
        }

        //const curve = Curve3.CreateCatmullRomSpline(points, 60, false);
        //const headband = MeshBuilder.CreateTube("headband", {path: curve.getPoints(), radius: 0.1, tessellation: 24, sideOrientation: MeshBuilder.DOUBLESIDE}, scene);
    }

    for (let i = 0; i < pointCount - 1; i++) {
        for (let j= 0; j < pointCount * 4; j += pointCount){
            indices.push(i+j);
            indices.push(i+j+pointCount);
            indices.push(i+j+pointCount+1);
            indices.push(i+j);
            indices.push(i+j+pointCount+1);
            indices.push(i+j+1);
        }
    }

    indices.push(0);
    indices.push(pointCount*2);
    indices.push(pointCount);

    indices.push(0);
    indices.push(pointCount*3);
    indices.push(pointCount*2);

    indices.push(pointCount-1);
    indices.push(pointCount*2-1);
    indices.push(pointCount*3-1);

    indices.push(pointCount*3-1);
    indices.push(pointCount*4-1);
    indices.push(pointCount-1);


    console.log(indices)

    // Przetwarzanie danych do postaci tablicy

    const points = allPoints.flatMap(p => [p.x, p.y, p.z]);
    VertexData.ComputeNormals(points, indices, normals)

    //Tworzenie mesha pałąka

    const headband = new Mesh("headband", scene);
    const vertexData = new VertexData();
    vertexData.positions = points;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(headband);
        // headband.material = material;


    // Tworzenie nauszników
    const leftEarMuff = MeshBuilder.CreateSphere("leftEarMuff", { diameterX: 3.5, diameterY: 4, diameterZ: 2, segments: 32 }, scene);
    leftEarMuff.position.y = 0;
    leftEarMuff.position.x = -4;
    leftEarMuff.material = padMaterial;
    leftEarMuff.rotation.y = Math.PI / 2;

    const rightEarMuff = MeshBuilder.CreateSphere("rightEarMuff", { diameterX: 3.5, diameterY: 4, diameterZ: 2, segments: 32 }, scene);
    rightEarMuff.position.y = 0;
    rightEarMuff.position.x = 4;
    rightEarMuff.material = padMaterial;
    rightEarMuff.rotation.y = Math.PI / 2;

    // Obracanie słuchawek
    scene.registerBeforeRender(() => {

    });

    return scene;
};

const scene = createScene();
engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener('resize', () => {
    engine.resize();
});
