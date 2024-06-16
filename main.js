import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    StandardMaterial,
    PBRMaterial,
    Color3,
    Vector3,
    VertexData,
    Mesh,
    TransformNode, Matrix, HDRCubeTexture, CubeTexture, Texture, MeshBuilder
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
    light.intensity = .75;

    const material = new StandardMaterial("material", scene);
    material.diffuseColor = new Color3(0.2, 0.2, 0.2);
    material.wireframe = true;

    const muffMaterial = new PBRMaterial("muffMaterial", scene);
    muffMaterial.reflectionColor = new Color3(0.05, 0.05, 0.05);
    muffMaterial.albedoColor = new Color3(0.1, 0.1, 0.1);
    muffMaterial.metallic = 0;
    muffMaterial.roughness = 0.25;

    const cushionMaterial = new PBRMaterial("cushionMaterial", scene);
    cushionMaterial.reflectionColor = new Color3(0.05, 0.05, 0.05);
    cushionMaterial.albedoColor = new Color3(0.02, 0.02, 0.02);
    cushionMaterial.metallic = 0;
    cushionMaterial.roughness = 1;

    const headband = makeHeadband(scene, "headband");

    const muffX = 4.9;
    const muffY = -4.8;
    const muffScale = 0.75;
    const muffRotation = Math.PI / 2;

    const leftEarMuff = makeMuff(scene, "leftEarMuff");
    leftEarMuff.root.parent = headband.left;
    leftEarMuff.root.position = new Vector3(-muffX, muffY, 0);
    leftEarMuff.root.scaling = new Vector3(muffScale, muffScale, muffScale);
    leftEarMuff.root.rotation.y = muffRotation;
    leftEarMuff.root.rotation.x = -Math.PI/16;
    leftEarMuff.root.getChildMeshes().forEach(mesh => mesh.material = muffMaterial);
    leftEarMuff.cushion.material = cushionMaterial;

    const rightEarMuff = makeMuff(scene, "rightEarMuff");
    rightEarMuff.root.parent = headband.right;
    rightEarMuff.root.position = new Vector3(muffX, muffY, 0);
    rightEarMuff.root.scaling = new Vector3(muffScale, muffScale, muffScale);
    rightEarMuff.root.rotation.y = -muffRotation;
    rightEarMuff.root.rotation.x = -Math.PI/16;
    rightEarMuff.root.getChildMeshes().forEach(mesh => mesh.material = material);
    // rightEarMuff.cushion.material = cushionMaterial;

    // headband.left.rotation.z = Math.PI / 16;
    // headband.right.rotation.z = -Math.PI / 16;

    // const muffBraceMaxYRotation = 110 * Math.PI / 180;
    // const muffBraceMinYRotation = 0;
    // const muffBraceRotationSpeed = Math.PI/5000;
    //
    // let muffBraceTargetYRotation = muffBraceMaxYRotation;
    // let muffBraceCurrentYRotation = muffBraceMinYRotation;

    scene.createDefaultEnvironment({
        createSkybox: true,
        skyboxSize: 100,
        skyboxColor: new Color3(0.9, 0.9, 0.9),
        groundSize: 100,
        groundColor: new Color3(0.9, 0.9, 0.9),
        environmentTexture: CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/environments/environmentSpecular.env", scene)
    })

    let isAnimating = false;
    function animate() {
        isAnimating = true;
    }
    //
    // scene.registerBeforeRender(() => {
    //     if (!isAnimating) return
    //
    //     const deltaTime = scene.getEngine().getDeltaTime()
    //
    //     const diff = muffBraceTargetYRotation - muffBraceCurrentYRotation;
    //     const sign = Math.sign(diff);
    //     const rotation = sign * Math.min(Math.abs(diff), muffBraceRotationSpeed * deltaTime);
    //
    //     muffBraceCurrentYRotation += rotation;
    //
    //     if (muffBraceCurrentYRotation >= muffBraceMaxYRotation) {
    //         muffBraceCurrentYRotation = muffBraceMaxYRotation;
    //         muffBraceTargetYRotation = muffBraceMinYRotation;
    //     } else if (muffBraceCurrentYRotation <= muffBraceMinYRotation) {
    //         muffBraceCurrentYRotation = muffBraceMinYRotation;
    //         muffBraceTargetYRotation = muffBraceMaxYRotation;
    //     }
    //
    //     leftEarMuff.brace.rotation.y = muffBraceCurrentYRotation - 20 * Math.PI / 180;
    //     rightEarMuff.brace.rotation.y = -muffBraceCurrentYRotation + 20 * Math.PI / 180;
    // });

    return {scene, animate};
};

const {scene, animate} = createScene();
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
 * @returns {{root: TransformNode, base: Mesh, cushion: Mesh, brace: Mesh}}
 */
function makeMuff(scene, name) {
    const center = new Vector3(0, 0, 0);
    const radius = 3.5;

    const baseThickness = 1.5;
    const cushionThickness = 1.5;
    const braceThickness = 1;

    const braceWidth = 0.5;

    const root = new TransformNode("earMuff", scene);
    const base = makeMuffBase(scene, center, radius, baseThickness, `${name}_base`);
    const cushion = makeMuffCushion(scene, center, radius, cushionThickness, `${name}_cushion`);
    const brace = makeMuffBrace(scene, center, radius, braceThickness, braceWidth, `${name}_brace`);
    brace.parent = root;
    base.parent = brace;
    base.rotation.x = Math.PI/16;
    cushion.parent = base;
    cushion.position = new Vector3(0, 0, baseThickness);

    return {
        root,
        base,
        cushion,
        brace
    };
}

/**
 * Generates base of the ear muff
 *
 * @param scene - BabylonJS scene
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} thickness
 * @param {string} name - Name of the node
 *
 * @returns {Mesh} Base mesh
 */
function makeMuffBase(scene, center, radius, thickness, name) {
    const pointCount = 32;

    const circleA = makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius, pointCount, 0, 360);
    const circleB = makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius, pointCount, 0, 360);

    const quads = quadsFromLines(circleA, circleB);
    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan(toReversed(circleA)),
        ...makeTriangleFan(circleB)
    ];

    return makeMeshFromPoints(scene, name, triangles.flat())
}

/**
 * Generates brace of the ear muff
 *
 * @param scene - BabylonJS scene
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} thickness
 * @param {number} width
 * @param {string} name - Name of the node
 *
 * @returns {Mesh} Base mesh
 */
function makeMuffBrace(scene, center, radius, thickness, width, name) {
    const pointCount = 55;
    const capPointCount = 9;

    const arcTopCenter = makeArc(center.add(new Vector3(0, 0, 0)), radius * 1.1, pointCount, 0, 180);
    const arcBottomCenter = makeArc(center.add(new Vector3(0, 0, 0)), radius, pointCount, 0, 180);

    const mainArcs = [
        makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius * 1.1, pointCount, 0, 180),
        makeArc(center.add(new Vector3(0, 0, -thickness / 4)), radius * 1.1, pointCount, 0, 180),
        arcTopCenter,
        makeArc(center.add(new Vector3(0, 0, thickness / 4)), radius * 1.1, pointCount, 0, 180),
        makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius * 1.1, pointCount, 0, 180),
        makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius, pointCount, 0, 180),
        makeArc(center.add(new Vector3(0, 0, thickness / 4)), radius, pointCount, 0, 180),
        arcBottomCenter,
        makeArc(center.add(new Vector3(0, 0, -thickness / 4)), radius, pointCount, 0, 180),
        makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius, pointCount, 0, 180),
    ]

    const topArcs = Array.from({length: Math.floor(mainArcs.length / 2)}, (_, i) => i).map(i => mainArcs[i]); //First half of the arcs
    const centerTopArcs = topArcs.slice(1, topArcs.length - 1); //Top arcs without first and last

    const capArcsFront = [
        rotatePointsByPointAndAxis(makeArc(arcTopCenter[arcTopCenter.length - 1], thickness / 2, capPointCount, 180, 360), arcTopCenter[arcTopCenter.length - 1], new Vector3(0, 1, 0), 90),
        rotatePointsByPointAndAxis(makeArc(arcBottomCenter[arcBottomCenter.length - 1], thickness / 2, capPointCount, 180, 360), arcBottomCenter[arcBottomCenter.length - 1], new Vector3(0, 1, 0), 90),
    ]

    const capArcsBack = [
        rotatePointsByPointAndAxis(makeArc(arcTopCenter[0], thickness / 2, capPointCount, 180, 360), arcTopCenter[0], new Vector3(0, 1, 0), 90),
        rotatePointsByPointAndAxis(makeArc(arcBottomCenter[0], thickness / 2, capPointCount, 180, 360), arcBottomCenter[0], new Vector3(0, 1, 0), 90),
    ]

    const arcQuadRibbons = mainArcs.map((arc, i) => quadsFromLines(mainArcs[(i < mainArcs.length - 1 ? i + 1 : 0)], arc));
    const quadRibbonsToSpliceIndices = Array.from({length: Math.floor(mainArcs.length / 2) - 1}, (_, i) => i);
    const centerSlicePointIndex = Math.floor(arcQuadRibbons[0].length / 2);
    for (const i of quadRibbonsToSpliceIndices) {
        arcQuadRibbons[i].splice(centerSlicePointIndex - 2, 4)
    }

    const centerVertexIndex = Math.floor(centerTopArcs[0].length / 2);
    /** @type {number[]} */
    const centerFiveVertexIndices = Array.from({length: 5}, (_, i) => (i + centerVertexIndex - 2));

    const braceScrewBaseVertices = [
        ...toReversed(topArcs[0].slice(centerFiveVertexIndices[0], centerFiveVertexIndices[centerFiveVertexIndices.length - 1] + 1)),
        ...centerTopArcs.map(arc => arc[centerVertexIndex - 2]),
        ...topArcs[topArcs.length - 1].slice(centerFiveVertexIndices[0], centerFiveVertexIndices[centerFiveVertexIndices.length - 1] + 1),
        ...toReversed(centerTopArcs.map(arc => arc[centerVertexIndex + 2])),
    ]
    braceScrewBaseVertices.push(braceScrewBaseVertices[0]);

    let braceScrewLowerMiddleVertices = braceScrewBaseVertices.map(v => ({x: v.x, y: v.y, z: v.z})).map(v => new Vector3(v.x, v.y += width / 3, v.z));
    braceScrewLowerMiddleVertices.forEach(v => v.y = braceScrewLowerMiddleVertices[0].y);
    const braceScrewLowerMiddleCenter = pointsCenterOfMass(braceScrewLowerMiddleVertices.slice(0, -1)).add(new Vector3(0, 0.2, 0));
    braceScrewLowerMiddleVertices = scalePointsRelativeToPoint(braceScrewLowerMiddleVertices, braceScrewLowerMiddleCenter, .7);

    const braceScrewUpperMiddleCenter = braceScrewLowerMiddleCenter.add(new Vector3(0, width / 3, 0));
    const braceScrewUpperMiddleVertices = rotatePointsByPointAndAxis(rotatePointsByPointAndAxis(makeCircle(braceScrewUpperMiddleCenter, width / 2, 17), braceScrewUpperMiddleCenter, new Vector3(1, 0, 0), 90), braceScrewUpperMiddleCenter, new Vector3(0, 1, 0), 180 - 45);

    const braceScrewTopVertices = braceScrewUpperMiddleVertices.map(v => v.add(new Vector3(0, width / 2, 0)));

    const quads = [
        ...arcQuadRibbons.flat(),
        ...quadsFromLines(capArcsFront[1], capArcsFront[0]),
        ...quadsFromLines(capArcsBack[0], capArcsBack[1]),
        ...quadsFromLines(braceScrewBaseVertices, braceScrewLowerMiddleVertices),
        ...quadsFromLines(braceScrewLowerMiddleVertices, braceScrewUpperMiddleVertices),
        ...quadsFromLines(braceScrewUpperMiddleVertices, braceScrewTopVertices),
    ];

    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan([...capArcsFront[0], ...centerTopArcs.map(arc => arc[arc.length - 1])]),
        ...makeTriangleFan(toReversed([...capArcsBack[0], ...centerTopArcs.map(arc => arc[0])])),
    ];

    return makeMeshFromPoints(scene, name, triangles.flat())
}



/**
 * Generates muff cushion
 *
 * @param scene - BabylonJS scene
 * @param center
 * @param radius
 * @param thickness
 * @param name - Name of the node
 * @returns {Mesh}
 */
function makeMuffCushion(scene, center, radius, thickness, name) {
    const pointCount = 64

    const arcs = [
        makeCircle(center.add(new Vector3(0, 0, -thickness / 2)), radius * 0.975, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 5)), radius * 0.95, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 3)), radius * 0.92, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 2.25)), radius * 0.85, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 2)), radius * 0.75, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 2)), radius * 0.7, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 2.25)), radius * 0.6, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 3)), radius * 0.5, pointCount),
        makeCircle(center.add(new Vector3(0, 0, thickness / 20)), radius * 0.4, pointCount),
        makeCircle(center.add(new Vector3(0, 0, -thickness / 5)), radius * 0.4, pointCount),
        makeCircle(center.add(new Vector3(0, 0, -thickness / 3)), radius * 0.4, pointCount),
        makeCircle(center.add(new Vector3(0, 0, -thickness / 2.8)), radius * 0.2, pointCount),
    ];

    const quads = arcs.slice(0, arcs.length - 1).flatMap((arc, i) => quadsFromLines(arcs[(i < arcs.length - 1 ? i + 1 : 0)], arc));
    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan(toReversed(arcs[arcs.length - 1]))
    ];

    return makeMeshFromPoints(scene, name, triangles.flat())
}

/**
 * Generates headband for the headphones
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the node
 * @returns {{center: Mesh, left: Mesh, right: Mesh, inner: Mesh}} Headband meshes
 */
function makeHeadband(scene, name) {
    // const center = new Vector3(0, 1.75, 0);
    const radius = 5.5;
    const z = 0.5;

    const arcBasesSides = [
        {radius: radius, z: z},
        {radius: radius, z: z * 0.8},
        {radius: radius, z: 0},
        {radius: radius, z: -z * 0.8},
        {radius: radius, z: -z},
        {radius: radius * 1.05, z: -z},
        {radius: radius * 1.1, z: -z},
        {radius: radius * 1.1, z: -z * 0.8},
        {radius: radius * 1.1, z: 0},
        {radius: radius * 1.1, z: z * 0.8},
        {radius: radius * 1.1, z: z},
        {radius: radius * 1.05, z: z}
    ];

    const arcBasesSidesCounts = {
        top: 5,
        left: 1,
        bottom: 5,
        right: 1
    }

    const arcBasesCenter = [
        {radius: radius * 1.02, z: z},
        {radius: radius * 1.02, z: z * 0.8},
        {radius: radius * 1.02, z: 0},
        {radius: radius * 1.02, z: -z * 0.8},
        {radius: radius * 1.02, z: -z},
        {radius: radius * 1.05, z: -z},
        {radius: radius * 1.08, z: -z},
        {radius: radius * 1.08, z: -z * 0.8},
        {radius: radius * 1.08, z: 0},
        {radius: radius * 1.08, z: z * 0.8},
        {radius: radius * 1.08, z: z},
        {radius: radius * 1.05, z: z},
    ];

    const arcBasesCenterCounts = {
        top: 5,
        left: 1,
        bottom: 5,
        right: 1
    }

    const arcBasesInner = [
        {radius: radius * 1.04, z: z * 0.8},
        {radius: radius * 1.04, z: -z * 0.8},
        {radius: radius * 1.06, z: -z * 0.8},
        {radius: radius * 1.06, z: z * 0.8}
    ];

    const arcBasesInnerCounts = {
        top: 2,
        bottom: 2,
        left: 0,
        right: 0,
    }

    const gapSize = 2;
    const leftStart = -15;
    const rightStart = 180 + 15;
    const sideBarSize = 60;

    const centerBar = makeHeadphonesBar(scene, `${name}_center`, arcBasesCenter, arcBasesCenterCounts, leftStart + sideBarSize + gapSize, rightStart - sideBarSize - gapSize);
    const rightBar = makeHeadphonesBar(scene, `${name}_right`, arcBasesSides, arcBasesSidesCounts, leftStart, leftStart + sideBarSize);
    const leftBar = makeHeadphonesBar(scene, `${name}_left`, arcBasesSides, arcBasesSidesCounts, rightStart - sideBarSize, rightStart);
    const innerBar = makeHeadphonesBar(scene, `${name}_inner`, arcBasesInner, arcBasesInnerCounts, leftStart + gapSize, rightStart - gapSize);

    centerBar.parent = innerBar;
    leftBar.parent = innerBar;
    rightBar.parent = innerBar;

    return {
        center: centerBar,
        left: leftBar,
        right: rightBar,
        inner: innerBar
    };
}

/**
 * Generates center bar for the headphones
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the node
 * @param {{z: number, radius: number}[]} bases - List of points for the bases
 * @param {{top: number, left: number, bottom: number, right: number}} basesCounts - Number of points for each side
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 *
 * @returns {Mesh} Headband mesh
 */
function makeHeadphonesBar (scene, name, bases, basesCounts, startAngle, endAngle) {
    const pointCount = 64;
    const arcs = bases.map(base => makeArc(new Vector3(0, 0, base.z), base.radius, pointCount, startAngle, endAngle));

    const sideLines = {
        top: arcs.slice(0, basesCounts.top),
        left: arcs.slice(basesCounts.top, basesCounts.top + basesCounts.left),
        bottom: arcs.slice(basesCounts.top + basesCounts.left, basesCounts.top + basesCounts.left + basesCounts.bottom),
        right: arcs.slice(basesCounts.top + basesCounts.left + basesCounts.bottom, basesCounts.top + basesCounts.left + basesCounts.bottom + basesCounts.right),
    }

    const pointsOnSides = [0, arcs[0].length - 1].map(i => ({
        top: toReversed(sideLines.top.map(line => line[i])),
        left: toReversed(sideLines.left.map(line => line[i])),
        bottom: sideLines.bottom.map(line => line[i]),
        right: sideLines.right.map(line => line[i]),
    }));

    const grids = pointsOnSides.map(points => gridFill(points.top, points.bottom, points.left, points.right));

    const quads = [
        ...arcs.flatMap((_, i) => quadsFromLines(arcs[(i < arcs.length - 1 ? i + 1 : 0)], arcs[i])),
        ...grids[0].slice(0, -1).flatMap((_, i) => quadsFromLines(grids[0][i], grids[0][i + 1])),
        ...reverseQuads(grids[1].slice(0, -1).flatMap((_, i) => quadsFromLines(grids[1][i], grids[1][i + 1]))),
    ];
    const triangles = quads.flatMap(quad => triangulateQuad(quad));
    return makeMeshFromPoints(scene, name, triangles.flat());
}


/**
 * Generates mesh from a list of points
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the mesh
 * @param {Vector3[]} rawPoints - List of points
 * @returns {Mesh}
 */
function makeMeshFromPoints(scene, name, rawPoints) {
    const {indices, points} = indexPoints(rawPoints);

    /** @type {number[]} */
    const normals = []

    const positions = points.flatMap(p => [p.x, p.y, p.z]);
    const mesh = new Mesh(name, scene);
    VertexData.ComputeNormals(positions, indices, normals)
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(mesh);

    return mesh;
}

/**
 * Function that generates arc
 *
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} pointCount
 *
 * @returns {Vector3[]} List of points
 */
function makeCircle(center, radius, pointCount ) {
    return makeArc(center, radius, pointCount, 0, 360);
}

/**
 * Function that generates arc
 *
 * @param {Vector3} center
 * @param {number} radius
 * @param {number} pointCount
 * @param {number} startAngle - in degrees
 * @param {number} endAngle - in degrees
 *
 * @returns {Vector3[]} List of points
 */
function makeArc(center, radius, pointCount, startAngle, endAngle) {
    /** @type {Vector3[]}*/
    const points = [];

    const start = startAngle * Math.PI / 180;
    const end = endAngle * Math.PI / 180;
    const anglePerPoint = (end - start) / (pointCount - 1);

    for (let i = 0; i < pointCount; i++) {
        const angle = start + i * anglePerPoint;

        const x = Math.cos(angle) * radius + center.x;
        const y = Math.sin(angle) * radius + center.y;

        points.push(new Vector3(x, y, center.z));
    }

    return points;
}

/**
 * Rotates a list of points around an axis
 *
 * @param {Vector3[]} points - List of points
 * @param {Vector3} center - Center of rotation
 * @param {Vector3} axis - Axis of rotation
 * @param {number} angle - Angle of rotation in degrees
 *
 * @returns {Vector3[]} Rotated points
 */
function rotatePointsByPointAndAxis(points, center, axis, angle) {
    return points.map(point => rotatePointByPointAndAxis(point, center, axis, angle));
}

/**
 * Rotates a point around an axis
 *
 * @param {Vector3} point - Point to rotate
 * @param {Vector3} center - Center of rotation
 * @param {Vector3} axis - Axis of rotation
 * @param {number} angle - Angle of rotation in degrees
 *
 * @returns {Vector3} Rotated point
 */
function rotatePointByPointAndAxis(point, center, axis, angle) {
    const rotationMatrix = Matrix.RotationAxis(axis, angle * Math.PI / 180);
    const rotated = Vector3.TransformCoordinates(point.subtract(center), rotationMatrix);
    return rotated.add(center);
}

/**
 * Scales a list of points relative to a center point
 *
 * @param {Vector3[]} points - List of points
 * @param {Vector3} center - Center of scaling
 * @param {number} scale - Scale factor
 *
 * @returns {Vector3[]} Scaled points
 */
function scalePointsRelativeToPoint(points, center, scale) {
    return points.map(point => scalePointRelativeToCenter(point, center, scale));
}


/**
 * Scales a point relative to a center point
 *
 * @param {Vector3} point - Point to scale
 * @param {Vector3} center - Center of scaling
 * @param {number} scale - Scale factor
 *
 * @returns {Vector3} Scaled point
 */
function scalePointRelativeToCenter(point, center, scale) {
    return point.subtract(center).scaleInPlace(scale).addInPlace(center);
}

/**
 * Generates debug cubes at points for debugging purposes, the cubes can grow in size sequentially if needed
 *
 * @param {Vector3[]} points
 * @param {number} radius
 * @param {boolean} growing - If true, new cubes will be larger than the previous ones
 *
 * @returns {Quad[][]} List of cubes
 */
function makeDebugCubesAtPoints(points, radius, growing = false) {
    /** @type {Quad[][]} */
    const Cubes = [];

    let i = 1;
    for (const point of points) {
        const cube = makeCube(point, radius * (growing ? i * 0.1 : 1));
        Cubes.push(cube);
        i += 1;
    }

    return Cubes;
}


/**
 * Generates a cube from a center point and a radius
 *
 * @param {Vector3} center
 * @param {number} radius
 * @returns {Quad[]}
 */

function makeCube(center, radius) {
    /** @type {Quad[]} */
    const quads = [];

    const halfSize = radius / 2;

    const a = new Vector3(center.x - halfSize, center.y - halfSize, center.z - halfSize);
    const b = new Vector3(center.x + halfSize, center.y - halfSize, center.z - halfSize);
    const c = new Vector3(center.x + halfSize, center.y + halfSize, center.z - halfSize);
    const d = new Vector3(center.x - halfSize, center.y + halfSize, center.z - halfSize);

    const e = new Vector3(center.x - halfSize, center.y - halfSize, center.z + halfSize);
    const f = new Vector3(center.x + halfSize, center.y - halfSize, center.z + halfSize);
    const g = new Vector3(center.x + halfSize, center.y + halfSize, center.z + halfSize);
    const h = new Vector3(center.x - halfSize, center.y + halfSize, center.z + halfSize);

    // noinspection JSCheckFunctionSignatures
    quads.push([a, b, c, d]);
    // noinspection JSCheckFunctionSignatures
    quads.push([h, g, f, e]);
    // noinspection JSCheckFunctionSignatures
    quads.push([e, f, b, a]);
    // noinspection JSCheckFunctionSignatures
    quads.push([f, g, c, b]);
    // noinspection JSCheckFunctionSignatures
    quads.push([g, h, d, c]);
    // noinspection JSCheckFunctionSignatures
    quads.push([h, e, a, d]);

    return quads;
}

/**
 * Generates quads from two lines of points
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
 * Generates indices from a list of points
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

    const decimals = 5;

    for (const point of rawPoints) {
        const simplifiedPoint = new Vector3(roundToNDecimals(point.x, decimals), roundToNDecimals(point.y, decimals), roundToNDecimals(point.z, decimals));
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

    console.log(points.length)

    return {
        indices,
        points
    };
}

/**
 * Generates a unique hash for a Vector3 object
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
 * @param {Vector3} center - Center of the fan
 * @returns {Triangle[]} List of triangles
 */
function makeTriangleFan(points, center = pointsCenterOfMass(points)) {
    const triangles = [];

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

/**
 * Generates a grid of points
 *
 * @param {Vector3[]} top
 * @param {Vector3[]} bottom
 * @param {Vector3[]} left
 * @param {Vector3[]} right
 *
 * @returns {Vector3[][]}
 */
function gridFill(top, bottom, left, right) {
    const numberOfLinesToFill = left.length;
    const numberOfColumnsToFill = top.length - 2;

    const lines = new Array(numberOfLinesToFill + 1);
    lines[0] = top;

    for (let i = 1; i < numberOfLinesToFill + 1; i++) {
        lines[i] = new Array(numberOfColumnsToFill + 1);
        lines[i][0] = left[i - 1];

        for (let j = 1; j < numberOfColumnsToFill + 1; j++) {
            const bottomLeft = lines[i][j - 1];
            const topRight = lines[i - 1][j];
            const topLeft = lines[i - 1][j - 1];

            const center = bottomLeft.add(topRight).scale(0.5);
            const vectorFromTopLeftToCenter = center.subtract(topLeft);

            const vectorFromTopLeftToBottomRight = vectorFromTopLeftToCenter.scale(2);
            const bottomRight = topLeft.add(vectorFromTopLeftToBottomRight);

            lines[i][j] = bottomRight;
        }

        lines[i][numberOfColumnsToFill + 1] = right[i - 1];
    }

    lines[numberOfLinesToFill + 1] = bottom;

    console.log(lines)

    return lines;
}


/**
 * Reverses a quad
 *
 * @param {Quad} quad
 *
 * @returns {Quad}
 */
function reverseQuad(quad) {
    return [quad[3], quad[2], quad[1], quad[0]];
}

/**
 * Reverses a list of quads
 *
 * @param {Quad[]} quads
 *
 * @returns {Quad[]}
 */
function reverseQuads(quads) {
    return quads.map(reverseQuad);
}
