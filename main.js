import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    StandardMaterial,
    Color3,
    Vector3,
    VertexData,
    Mesh,
    TransformNode
} from '@babylonjs/core';

/**
 * @typedef {[Vector3, Vector3, Vector3, Vector3]} Quad
 * @typedef {[Vector3, Vector3, Vector3]} Triangle
 */

const canvas = document.getElementById('renderCanvas');
const engine = new Engine(canvas, true);

const createScene = () => {
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("camera", 3 * (Math.PI / 2), Math.PI / 2, 25, new Vector3(0, 1.75, 0), scene);
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);
    light.intensity = 0.7;

    // Materiały
    const material = new StandardMaterial("material", scene);
    material.diffuseColor = new Color3(0.2, 0.2, 0.2); // Ciemny szary

    const padMaterial = new StandardMaterial("padMaterial", scene);
    padMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9); // Jasny szary

    const headband = makeHeadband(scene, "headband");

    const muffX = 4;
    const muffY = -2;
    const muffScale = 0.75;
    const muffRotation = Math.PI / 2;

    const leftEarMuff = makeMuff(scene, "leftEarMuff");
    leftEarMuff.position = new Vector3(-muffX, muffY, 0);
    leftEarMuff.scaling = new Vector3(muffScale, muffScale, muffScale);
    leftEarMuff.rotation.y = muffRotation;

    const rightEarMuff = makeMuff(scene, "rightEarMuff");
    rightEarMuff.position = new Vector3(muffX, muffY, 0);
    rightEarMuff.scaling = new Vector3(muffScale, muffScale, muffScale);
    rightEarMuff.rotation.y = -muffRotation;
    rightEarMuff.getChildMeshes().forEach(mesh => {
        mesh.material = padMaterial;
        mesh.material.wireframe = true;
    });

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

/**
 * Generates ear muff
 *
 * @param scene - BabylonJS scene
 * @param {string} name - Name of the node
 *
 * @returns {TransformNode} Ear muff node
 */
function makeMuff(scene, name) {
    const center = new Vector3(0, 0, 0);
    const radius = 3.5;
    const baseHeight = 1.5;
    const cushionHeight = 1.5;

    const node = new TransformNode("earMuff", scene);
    const base = makeMuffBase(scene, center, radius, baseHeight, `${name}_base`);
    const cushion = makeMuffCushion(scene, center, radius, cushionHeight, `${name}_cushion`);
    base.parent = node;
    cushion.parent = base;
    cushion.position = new Vector3(0, 0, baseHeight);

    return node;
}

/**
 * Generates base of the ear muff
 *
 * @param scene - BabylonJS scene
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} height
 * @param {string} name - Name of the node
 *
 * @returns {Mesh} Base mesh
 */
function makeMuffBase(scene, center, radius, height, name) {
    const pointCount = 32;

    const circleA = makeArc(center.add(new Vector3(0, 0, height / 2)), radius, pointCount, 0, 360, true);
    const circleB = makeArc(center.add(new Vector3(0, 0, -height / 2)), radius, pointCount, 0, 360, true);

    const quads = quadsFromLines(circleA, circleB);
    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan(toReversed(circleA)),
        ...makeTriangleFan(circleB)
    ];

    const {indices, points} = indexPoints(triangles.flat());
    const normals = []

    const positions = points.flatMap(p => [p.x, p.y, p.z]);
    const muffBase = new Mesh(name, scene);
    VertexData.ComputeNormals(positions, indices, normals)
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(muffBase);

    return muffBase;
}

/**
 * Generates muff cushion
 *
 * @param scene - BabylonJS scene
 * @param center
 * @param radius
 * @param height
 * @param name - Name of the node
 * @returns {Mesh}
 */
function makeMuffCushion(scene, center, radius, height, name) {
    const pointCount = 64

    const arcs = [
        makeArc(center.add(new Vector3(0, 0, -height / 2)), radius * 0.975, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 5)), radius * 0.95, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 2.25)), radius * 0.85, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 2)), radius * 0.75, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 2)), radius * 0.7, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 2.25)), radius * 0.6, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 3)), radius * 0.5, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, height / 20)), radius * 0.4, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, -height / 5)), radius * 0.4, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, -height / 3)), radius * 0.4, pointCount, 0, 360, true),
        makeArc(center.add(new Vector3(0, 0, -height / 2.8)), radius * 0.2, pointCount, 0, 360, true)
    ];

    const quads = arcs.slice(0, arcs.length - 1).flatMap((arc, i) => quadsFromLines(arcs[(i < arcs.length - 1 ? i + 1 : 0)], arc));
    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan(toReversed(arcs[arcs.length - 1]))
    ];

    const {indices, points} = indexPoints(triangles.flat());
    const normals = []

    const positions = points.flatMap(p => [p.x, p.y, p.z]);
    const muffBase = new Mesh(name, scene);
    VertexData.ComputeNormals(positions, indices, normals)
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(muffBase);

    return muffBase;
}

/**
 * Generates headband for the headphones
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the node
 * @returns {Mesh} Headband mesh
 */
function makeHeadband(scene, name) {
    //Constants
    const center = new Vector3(0, 1.75, 0);
    const radius = 5.5;
    const radiusExtension = 0.5;
    const z = 0.5;

    const pointCount = 100;

    //Arcs
    const arcBases = [{
        radius: radius,
        z: z
    }, {
        radius: radius,
        z: -z
    }, {
        radius: radius + radiusExtension,
        z: -z
    }, {
        radius: radius + radiusExtension,
        z: z
    }];

    const arcs = arcBases.map(base => makeArc(center.add(new Vector3(0, 0, base.z)), base.radius, pointCount, -15, 180+15));

    /** @type {Triangle[]} */
    const triangles = [];

    for (let i = 0; i < arcs.length; i++) {
        const quads = quadsFromLines(arcs[(i < arcs.length - 1 ? i + 1 : 0)], arcs[i]);
        triangles.push(...quads.flatMap(quad => triangulateQuad(quad)));
    }

    const {indices, points} = indexPoints(triangles.flat());
    const normals = []

    //Flatten points and compute normals
    const positions = points.flatMap(p => [p.x, p.y, p.z]);
    VertexData.ComputeNormals(positions, indices, normals)

    //Create mesh
    const headband = new Mesh(name, scene);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(headband);

    return headband;
}

/**
 * Function that generates arc
 *
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} pointCount
 */
// function makeArc(center, radius, pointCount, startAngle, endAngle) {

/**
 * Function that generates arc
 *
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} pointCount
 * @param {number} startAngle - in degrees
 * @param {number} endAngle - in degrees
 * @param {boolean} repeatLast - should the last point be the same as the first
 */
function makeArc(center, radius, pointCount, startAngle, endAngle, repeatLast = false) {
    /** @type {Vector3[]}*/
    const points = [];

    const start = startAngle * Math.PI / 180;
    const end = endAngle * Math.PI / 180;
    const anglePerPoint = (end - start) / pointCount;

    for (let i = 0; i < pointCount; i++) {
        const angle = start + i * anglePerPoint;

        const x = Math.cos(angle) * radius - center.x;
        const y = Math.sin(angle) * radius + center.y;

        points.push(new Vector3(x, y, center.z));
    }

    if (repeatLast) {
        points.push(points[0]);
    }
    return points;
}

/**
 * Generates quads from two lines
 *
 * @param {Vector3[]} lineA points in the first line
 * @param {Vector3[]} lineB points in the second line
 * @returns {Quad[]} array of quads
 */
function quadsFromLines(lineA, lineB) {
    /** @type {Quad[]} */
    const quads = [];

    for (let i = 0; i < lineA.length - 1; i++) {
        const a = lineA[i];
        const b = lineA[i + 1];
        const c = lineB[i + 1];
        const d = lineB[i];

        // noinspection JSCheckFunctionSignatures
        quads.push([a, b, c, d]);
    }

    return quads;
}

/**
 * Generates triangles from a quad
 *
 * @param {Quad} quad indices of points in the quad
 * @returns {Triangle[]}
 */
function triangulateQuad(quad) {
    /** @type {Triangle[]} */
    const triangles = [];

    triangles.push([quad[0], quad[1], quad[2]]);
    triangles.push([quad[0], quad[2], quad[3]]);

    return triangles;
}

/**
 * Generates indices from a list of quads
 *
 * @param {Vector3[]} rawPoints
 * @returns {{indices: number[], points: Vector3[]}}
 */
function indexPoints(rawPoints) {
    /** @type {number[]} */
    const indices = [];

    /** @type {Vector3[]} */
    const points = []

    /** @type {Map<string, number>} */
    const pointIndexMap = new Map();

    for (const point of rawPoints) {
        const simplifiedPoint = new Vector3(roundToNDecimals(point.x, 3), roundToNDecimals(point.y, 3), roundToNDecimals(point.z, 3));
        const hash = hashVector3(simplifiedPoint);

        if (!pointIndexMap.has(hash)) {
            const index = points.length;

            pointIndexMap.set(hash, index);
            points.push(simplifiedPoint);
            indices.push(index);
        } else {
            indices.push(pointIndexMap.get(hash));
        }
    }

    return {
        indices,
        points
    };
}

/**
 * Generates a hash for a Vector3 object
 *
 * @param {Vector3} vector
 * @returns {string} Hash
 */
function hashVector3(vector) {
    return `${vector.x},${vector.y},${vector.z}`;
}

/**
 * Rounds a number to n decimal places
 *
 * @param {number} value
 * @param {number} n Number of decimal places
 * @returns {number}
 */
function roundToNDecimals(value, n) {
    const factor = Math.pow(10, n);
    return Math.round(value * factor) / factor;
}

/**
 * Calculates the center of mass for a list of points
 *
 * @param {Vector3[]} points - List of points
 * @returns {Vector3} Center of mass
 */
function pointsCenterOfMass(points) {
    const center = new Vector3(0, 0, 0);

    for (const point of points) {
        center.addInPlace(point);
    }

    return center.scale(1 / points.length);
}

/**
 * Generates a triangle fan from a list of points
 *
 * @param {Vector3[]} points - List of points
 * @returns {Triangle[]} List of triangles
 */
function makeTriangleFan(points) {
    const triangles = [];

    const center = pointsCenterOfMass(points);

    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];

        triangles.push([a, b, center]);
    }

    return triangles;
}

/**
 * Reverses an array
 *
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function toReversed(array) {
    const reversed = [...array];
    reversed.reverse();
    return reversed;
}
