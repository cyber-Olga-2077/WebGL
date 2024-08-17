import {
    ArcRotateCamera,
    Color3,
    CubeTexture,
    Engine,
    PointLight,
    Matrix,
    Mesh,
    PBRMaterial,
    Scene,
    TransformNode,
    Vector3,
    VertexData,
    ShadowGenerator
} from '@babylonjs/core';

/**
 * @typedef {{body: {reflectionColor: Color3, albedoColor: Color3}, muff: {reflectionColor: Color3, albedoColor: Color3}}} ColorsDefinition
 * @typedef {[Vector3, Vector3, Vector3, Vector3]} Quad
 * @typedef {[Vector3, Vector3, Vector3]} Triangle
 */

// noinspection JSValidateTypes
/** @type {{black: ColorsDefinition; white: ColorsDefinition; cream: ColorsDefinition; pink: ColorsDefinition}} */
const colors = {
    black: {
        body: {
            albedoColor: new Color3(0.05, 0.05, 0.05),
            reflectionColor: new Color3(0.5, 0.5, 0.5),
        },
        muff: {
            albedoColor: new Color3(0.01, 0.01, 0.01),
            reflectionColor: new Color3(0.5, 0.5, 0.5),
        },
    },
    white: {
        body: {
            albedoColor: new Color3(.8, .8, .8),
            reflectionColor: new Color3(.8, .8, .8),
        },
        muff: {
            albedoColor: new Color3(1, 1, 1),
            reflectionColor: new Color3(1, 1, 1),
        },
    },
    pink: {
        body: {
            albedoColor: new Color3(0.9, 0.898 * 0.7, 0.925 * 0.7),
            reflectionColor: new Color3(0.9, 0.898 * 0.7, 0.925 * 0.7),
        },
        muff: {
            albedoColor: new Color3(1, 0.898, 0.925),
            reflectionColor: new Color3(1, 0.898, 0.925),
        },
    },
    cream: {
        body: {
            albedoColor: new Color3(0.992 * 0.9, 0.984 * 0.9, 0.831 * 0.7),
            reflectionColor: new Color3(0.992 * 0.9, 0.984 * 0.9, 0.831 * 0.7),
        },
        muff: {
            albedoColor: new Color3(0.992, 0.984, 0.831),
            reflectionColor: new Color3(0.992, 0.984, 0.831),
        },
    },
}

let selectedColor = "black";
let activeColor = "black";

let muffYRotationFactor = 20;
let muffXRotationFactor = 50;
let extensionFactor = 50;

function bindColorButtons() {
    document.querySelectorAll(".colorSelector-color").forEach(colorElement => colorElement.addEventListener("click", () => selectColor(colorElement.dataset.color)))
}

/**
 * @param {string} color
 */
function selectColor(color) {
    selectedColor = color;
}

function bindRotationRanges() {
    document.querySelectorAll(".rangeSelector-input").forEach(inputElement => inputElement.addEventListener("change", (event) => applyRotationFactor(event.target.value, event.target.dataset.axis)))
}

/**
 * @param {number} rotationFactor
 * @param {string} name
 */
function applyRotationFactor(rotationFactor, name) {
    switch (name) {
        case "muff-y":
            muffYRotationFactor = rotationFactor
            break;
        case "muff-x":
            muffXRotationFactor = rotationFactor
            break;
        case "extension":
            extensionFactor = rotationFactor
            break;
    }
}

/**
 * @param {AbstractEngine} engine
 */
const createScene = (engine) => {
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("camera", 3 * (Math.PI / 2), Math.PI / 2, 25, new Vector3(0, 1.75, 0), scene);
    camera.attachControl(canvas, true);

    const light = new PointLight("light", new Vector3(0, 50, -50), scene);

    const bodyMaterial = new PBRMaterial("bodyMaterial", scene);
    bodyMaterial.reflectionColor = colors.black.body.reflectionColor;
    bodyMaterial.albedoColor = colors.black.body.albedoColor;
    bodyMaterial.metallic = 0;
    bodyMaterial.roughness = 0.5;

    const cushionMaterial = new PBRMaterial("cushionMaterial", scene);
    cushionMaterial.reflectionColor = colors.black.muff.reflectionColor;
    cushionMaterial.albedoColor = colors.black.muff.albedoColor;
    cushionMaterial.metallic = 0;
    cushionMaterial.roughness = 1;

    const headband = makeHeadband(scene, "headband");
    headband.inner.material = bodyMaterial;
    headband.inner.getChildMeshes().forEach(mesh => mesh.material = bodyMaterial);
    headband.cushion.material = cushionMaterial;

    headband.inner.position.y += 4;

    const muffX = 4.9;
    const muffY = -4.8 * 1.05;
    const muffScale = 0.75;
    const muffRotation = Math.PI / 2;

    const leftEarMuff = makeMuff(scene, "leftEarMuff");
    leftEarMuff.root.parent = headband.left;
    leftEarMuff.root.position = new Vector3(-muffX, muffY, 0);
    leftEarMuff.root.scaling = new Vector3(muffScale, muffScale  * 1.1, muffScale);
    leftEarMuff.root.rotation.y = muffRotation;
    leftEarMuff.root.rotation.x = -Math.PI/16;
    leftEarMuff.root.getChildMeshes().forEach(mesh => mesh.material = bodyMaterial);
    leftEarMuff.cushion.material = cushionMaterial;

    const rightEarMuff = makeMuff(scene, "rightEarMuff", true);
    rightEarMuff.root.parent = headband.right;
    rightEarMuff.root.position = new Vector3(muffX, muffY, 0);
    rightEarMuff.root.scaling = new Vector3(muffScale, muffScale  * 1.1, muffScale);
    rightEarMuff.root.rotation.y = -muffRotation;
    rightEarMuff.root.rotation.x = -Math.PI/16;
    rightEarMuff.root.getChildMeshes().forEach(mesh => mesh.material = bodyMaterial);
    rightEarMuff.cushion.material = cushionMaterial;

    const shadowGenerator = new ShadowGenerator(1024 * 4, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.useKernelBlur = true;

    shadowGenerator.addShadowCaster(headband.inner)
    shadowGenerator.addShadowCaster(headband.left)
    shadowGenerator.addShadowCaster(headband.right)
    shadowGenerator.addShadowCaster(headband.center)
    shadowGenerator.addShadowCaster(headband.cushion)

    shadowGenerator.addShadowCaster(leftEarMuff.base);
    shadowGenerator.addShadowCaster(leftEarMuff.brace);
    shadowGenerator.addShadowCaster(leftEarMuff.cushion);
    leftEarMuff.buttons?.forEach(button => shadowGenerator.addShadowCaster(button))

    shadowGenerator.addShadowCaster(rightEarMuff.base);
    shadowGenerator.addShadowCaster(rightEarMuff.brace);
    shadowGenerator.addShadowCaster(rightEarMuff.cushion);
    rightEarMuff.buttons?.forEach(button => shadowGenerator.addShadowCaster(button))

    headband.left.rotation.z = 1.5 * Math.PI / 16;
    headband.right.rotation.z = 1.5 * -Math.PI / 16;

    const muffYRotation = {
        max: 110 * Math.PI / 180,
        min: 20 * Math.PI / 180,
        current: 0,
        real: 0,
        speed: Math.PI / 2000
    }

    const muffXRotation = {
        max: 50 * Math.PI / 180,
        min: 5 * Math.PI / 180,
        current: 0,
        real: 0,
        speed: Math.PI / 2000
    }

    const headbandExtension = {
        max: 1.5 * Math.PI / 16,
        min: 0,
        current: 0,
        real: 0,
        speed: Math.PI / 5000
    }

    scene.createDefaultEnvironment({
        createSkybox: true,
        skyboxSize: 100,
        skyboxColor: new Color3(1, 1, 1),
        groundSize: 100,
        groundYBias: 2,
        groundColor: new Color3(1, 1, 1),
        environmentTexture: CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/environments/environmentSpecular.env", scene)
    })

    scene.registerBeforeRender(() => {
        const deltaTime = scene.getEngine().getDeltaTime()

        if (selectedColor !== activeColor) {
            const color = colors[selectedColor];
            if (color) {
                bodyMaterial.albedoColor = color.body.albedoColor;
                bodyMaterial.reflectionColor = color.body.reflectionColor;

                cushionMaterial.albedoColor = color.muff.albedoColor;
                cushionMaterial.reflectionColor = color.muff.reflectionColor;

                activeColor = selectedColor;
            }
        }

        recalculateRotation(muffYRotation, muffYRotationFactor, deltaTime)
        leftEarMuff.brace.rotation.y = muffYRotation.real;
        rightEarMuff.brace.rotation.y = -muffYRotation.real;

        recalculateRotation(muffXRotation, muffXRotationFactor, deltaTime)
        leftEarMuff.base.rotation.x = muffXRotation.real;
        rightEarMuff.base.rotation.x = muffXRotation.real;

        recalculateRotation(headbandExtension, extensionFactor, deltaTime)
        headband.left.rotation.z = headbandExtension.real;
        headband.right.rotation.z = -headbandExtension.real;
    });

    return scene;
};

/**
 * @param {{current: number, min: number, max: number, real: number, speed: number}} properties
 * @param {number} factor
 * @param {number} deltaTime
 */
function recalculateRotation(properties, factor, deltaTime) {
    const target = lerp(0, properties.max, factor / 100)

    const diff = target - properties.current;
    const sign = Math.sign(diff)
    properties.current = clamp(properties.current + sign * properties.speed * deltaTime, properties.current, target)
    properties.real = properties.current - properties.min;
}

const canvas = document.getElementsByTagName('canvas')[0];
if (canvas && canvas instanceof HTMLCanvasElement) {
    bindColorButtons();
    bindRotationRanges();

    const engine = new Engine(canvas, true);

    const scene = createScene(engine);
    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });
}

/**
 * Generates ear muff
 *
 * @param scene - BabylonJS scene
 * @param {string} name - Name of the node
 * @param {boolean} hasButtons - If true, the muff will have a buttons
 *
 * @returns {{root: TransformNode, base: Mesh, cushion: Mesh, brace: Mesh, buttons: Mesh[] | undefined}}
 */
function makeMuff(scene, name, hasButtons = false) {
    const center = new Vector3(0, 0, 0);
    const radius = 3.5;

    const baseThickness = 1.5;
    const cushionThickness = 1.5;
    const braceThickness = 1;

    const braceWidth = 0.5;

    const root = new TransformNode("earMuff", scene);
    const base = makeMuffBase(scene, center, radius, baseThickness, `${name}_base`);
    const cushion = makeMuffCushion(scene, center, radius, cushionThickness, `${name}_cushion`);
    const brace = makeMuffBrace(scene, center, radius * 1.01, braceThickness, braceWidth, `${name}_brace`);
    const buttons = hasButtons ? makeMuffButtons(scene, center, radius, baseThickness / 3, 3, 72, 3, `${name}_buttons`) : undefined;

    brace.parent = root;
    base.parent = brace;
    base.rotation.x = Math.PI/16;
    cushion.parent = base;
    cushion.position = new Vector3(0, 0, baseThickness);
    buttons?.forEach(button => button.parent = base);

    return {
        root,
        base,
        cushion,
        brace,
        buttons
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
    const pointCount = 64 + 1;

    const innerCircle = makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius, pointCount, 0, 360);
    const outerCircle = makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius, pointCount, 0, 360);

    const quads = quadsFromLines(innerCircle, outerCircle);
    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan(outerCircle)
    ];

    return makeMeshFromPoints(scene, name, triangles.flat())
}

/**
 * Generates base of the ear muff
 *
 * @param scene - BabylonJS scene
 * @param {Vector3} center - Center of the base
 * @param {number} radius - Radius of the base
 * @param {number} thickness - Thickness of the base
 * @param {number} amount - Amount of buttons
 * @param {number} totalAngle - Total angle of the buttons
 * @param {number} gapAngle - Gap between the buttons
 * @param {string} name - Name of the nodes
 *
 * @returns {Mesh[]} Buttons meshes
 */
function makeMuffButtons(scene, center, radius, thickness, amount, totalAngle, gapAngle, name) {
    const pointCountPerButton = 64 * (totalAngle / 360)
    const anglePerButton = (totalAngle - gapAngle * (amount - 1)) / amount
    const startAngle = 270 - totalAngle / 2

    /** @type {Mesh[]} */
    const buttons = [];

    for (let i = 0; i < amount; i++) {
        const buttonStartAngle = startAngle + anglePerButton * i + gapAngle * i;
        const buttonEndAngle = startAngle + anglePerButton * (i + 1) + gapAngle * i;

        const arcs = [
            makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius * 0.98, pointCountPerButton, buttonStartAngle, buttonEndAngle),
            makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius * 1.01, pointCountPerButton, buttonStartAngle, buttonEndAngle),
            makeArc(center.add(new Vector3(0, 0, thickness / 2)), radius * 1.04, pointCountPerButton, buttonStartAngle, buttonEndAngle),
            makeArc(center.add(new Vector3(0, 0, -thickness / 3)), radius * 1.04, pointCountPerButton, buttonStartAngle, buttonEndAngle),
            makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius * 1.04, pointCountPerButton, buttonStartAngle, buttonEndAngle),
            makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius * 1.01, pointCountPerButton, buttonStartAngle, buttonEndAngle),
            makeArc(center.add(new Vector3(0, 0, -thickness / 2)), radius * 0.98, pointCountPerButton, buttonStartAngle, buttonEndAngle),
        ]

        const quads = [
            ...arcs.slice(0, -1).flatMap((_, i) => quadsFromLines(arcs[i], arcs[i+1]))
        ];
        const triangles = [
            ...quads.flatMap(quad => triangulateQuad(quad)),
            ...makeTriangleFan(toReversed(arcs.map(arc => arc[arc.length - 1]))),
            ...makeTriangleFan(arcs.map(arc => arc[0])),
        ];

        buttons.push(makeMeshFromPoints(scene, name, triangles.flat()))
    }

    return buttons;
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
    const capPointCount = 15;

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
    const centerTopArcs = topArcs.slice(1, topArcs.length - 1); //Top arcs without first and last point

    const bottomArcs = Array.from({length: Math.floor(mainArcs.length / 2)}, (_, i) => i).map(i => mainArcs[i + Math.floor(mainArcs.length / 2)]); //Second half of the arcs
    const centerBottomArcs = bottomArcs.slice(1, bottomArcs.length - 1); //Bottom arcs without first and last point

    const capArcsFront = [
        makeArc(arcTopCenter[arcTopCenter.length - 1], thickness / 2, capPointCount, 180, 360)
            .map(point => rotatePointByPointAndAxis(point, arcTopCenter[arcTopCenter.length - 1], new Vector3(0, 1, 0), 90)),

        makeArc(arcBottomCenter[arcBottomCenter.length - 1], thickness / 2, capPointCount, 180, 360)
            .map(point => rotatePointByPointAndAxis(point, arcBottomCenter[arcBottomCenter.length - 1], new Vector3(0, 1, 0), 90)),
    ]

    const capArcsBack = [
        makeArc(arcTopCenter[0], thickness / 2, capPointCount, 180, 360)
            .map(point => rotatePointByPointAndAxis(point,  arcTopCenter[0], new Vector3(0, 1, 0), 90)),

        makeArc(arcBottomCenter[0], thickness / 2, capPointCount, 180, 360)
            .map(point => rotatePointByPointAndAxis(point,  arcBottomCenter[0], new Vector3(0, 1, 0), 90)),
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
    braceScrewLowerMiddleVertices = braceScrewLowerMiddleVertices.map(point => scalePointRelativeToPoint(point, braceScrewLowerMiddleCenter, .7));

    const braceScrewUpperMiddleCenter = braceScrewLowerMiddleCenter.add(new Vector3(0, width / 3, 0));
    const braceScrewUpperMiddleVertices = makeCircle(braceScrewUpperMiddleCenter, width / 2, 17)
        .map(point => rotatePointByPointAndAxis(point, braceScrewUpperMiddleCenter, new Vector3(1, 0, 0), 90))
        .map(point => rotatePointByPointAndAxis(point, braceScrewUpperMiddleCenter, new Vector3(0, 1, 0), 180 - 45));

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
        ...makeTriangleFan([...capArcsBack[1], ...centerBottomArcs.map(arc => arc[0])]),
        ...makeTriangleFan(toReversed([...capArcsFront[1], ...centerBottomArcs.map(arc => arc[arc.length - 1])])),
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
 *
 * @returns {Mesh}
 */
function makeMuffCushion(scene, center, radius, thickness, name) {
    const pointCount = 64 + 1;
    const subPointCount = 16;

    const subRadius = radius * 0.3;

    const baseArc = makeArc(center, radius * 1.075 - subRadius, pointCount, 0, 360);
    const halfTorusArcs = baseArc
        .map(subCenter => [makeArc(subCenter, subRadius, subPointCount, -60, 180), subCenter])
        .map(([arc, arcCenter ]) => [arc, arcCenter, arcCenter.subtract(center).normalize()])
        .map(([arc, arcCenter, centerVector], index) => [arc.map(point => rotatePointByPointAndAxis(point, arcCenter, new Vector3(0, 0, 1), (360 / (pointCount - 1)) * index)), center, centerVector])
        .map(([arc, arcCenter, centerVector]) => arc.map(point => rotatePointByPointAndAxis(point, arcCenter, centerVector, 90)))
        .map(arc => [...arc, arc[arc.length - 1].add(new Vector3(0, 0, -thickness / 4)), arc[arc.length - 1].add(new Vector3(0, 0, -thickness / 4 * 3)), arc[arc.length - 1].add(new Vector3(0, 0, -thickness))])
        .map(arc => arc.map(point => point.add(new Vector3(0, 0, -thickness / 5))))
        .map(arc => arc.map(point => scalePointRelativeToPointByVector(point, center, new Vector3(1, 1, 0.8))));

    const quads = halfTorusArcs.flatMap((arc, i) => quadsFromLines(arc, halfTorusArcs[(i < halfTorusArcs.length - 1 ? i + 1 : 0)]));
    const triangles = [
        ...quads.flatMap(quad => triangulateQuad(quad)),
        ...makeTriangleFan(toReversed(halfTorusArcs.map(arc => arc[arc.length - 1]))),
    ];

    return makeMeshFromPoints(scene, name, triangles.flat())
}

/**
 * Generates headband for the headphones
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the node
 *
 * @returns {{center: Mesh, left: Mesh, right: Mesh, inner: Mesh, cushion: Mesh}} Headband meshes
 */
function makeHeadband(scene, name) {
    const radius = 5.5;
    const z = 0.75;

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

    const arcBasesCushion = [{
        radius: arcBasesCenter[0].radius,
        z: arcBasesCenter[0].z * 0.75
    }, {
        radius: arcBasesCenter[arcBasesCenterCounts.top - 1].radius,
        z: arcBasesCenter[arcBasesCenterCounts.top - 1].z * 0.6
    }]

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

    const centerBar = makeHeadbandBar(scene, `${name}_center`, arcBasesCenter, arcBasesCenterCounts, leftStart + sideBarSize + gapSize, rightStart - sideBarSize - gapSize);
    const rightBar = makeHeadbandBar(scene, `${name}_right`, arcBasesSides, arcBasesSidesCounts, leftStart, leftStart + sideBarSize);
    const leftBar = makeHeadbandBar(scene, `${name}_left`, arcBasesSides, arcBasesSidesCounts, rightStart - sideBarSize, rightStart);
    const innerBar = makeHeadbandBar(scene, `${name}_inner`, arcBasesInner, arcBasesInnerCounts, leftStart + gapSize, rightStart - gapSize);
    const cushion = makeHeadbandCushion(scene, `${name}_cushion`, arcBasesCushion, leftStart + sideBarSize + gapSize * 5, rightStart - sideBarSize - gapSize * 5);

    centerBar.parent = innerBar;
    leftBar.parent = innerBar;
    rightBar.parent = innerBar;
    cushion.parent = innerBar;

    return {
        center: centerBar,
        left: leftBar,
        right: rightBar,
        inner: innerBar,
        cushion: cushion
    };
}

/**
 * Generates center bar for the headphones
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the node
 * @param {{z: number, radius: number}[]} bases - List of points for the bases used to generate arcs used to make the mesh
 * @param {{top: number, left: number, bottom: number, right: number}} basesCounts - Number of points for each side
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 *
 * @returns {Mesh} Headband mesh
 */
function makeHeadbandBar(scene, name, bases, basesCounts, startAngle, endAngle) {
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

    const grids = pointsOnSides.map(points => unbalancedGridFill(points.top, points.bottom, points.left, points.right));

    const quads = [
        ...arcs.flatMap((_, i) => quadsFromLines(arcs[(i < arcs.length - 1 ? i + 1 : 0)], arcs[i])),
        ...grids[0].slice(0, -1).flatMap((_, i) => quadsFromLines(grids[0][i], grids[0][i + 1])),
        ...grids[1].slice(0, -1).flatMap((_, i) => quadsFromLines(grids[1][i], grids[1][i + 1])).map(q => reverseQuad(q)),
    ];
    const triangles = quads.flatMap(quad => triangulateQuad(quad));
    return makeMeshFromPoints(scene, name, triangles.flat());
}

/**
 * Generates center bar for the headphones
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the node
 * @param {{z: number, radius: number}[]} bases - List of points for bases used to generate arcs used to make the mesh
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 *
 * @returns {Mesh} Headband mesh
 */
function makeHeadbandCushion(scene, name, bases, startAngle, endAngle) {
    const pointCount = 64;

    const topArc = makeArc(new Vector3(0, 0, bases[0].z), bases[0].radius, pointCount, startAngle, endAngle)
        .map(point => point.add(new Vector3(0, -(bases[0].radius/20), 0)));

    const bottomArc = makeArc(new Vector3(0, 0, bases[1].z), bases[1].radius, pointCount, startAngle, endAngle)
        .map(point => point.add(new Vector3(0, -(bases[0].radius/20), 0)));

    const zDifference = topArc[0].z - bottomArc[0].z;

    const innerArcs = Array
        .from({length: pointCount / 16}, (_, i) => i)
        .map(i => makeArc(new Vector3(0, 0, bases[0].z - (zDifference / (pointCount / 16 + 1)) * (i + 1)), bases[0].radius, pointCount, startAngle, endAngle))
        .map(arc => arc.map(point => point.add(new Vector3(0, -(bases[0].radius/20), 0))));

    const bottomArcs = [
        topArc,
        ...innerArcs,
        bottomArc
    ]

    const bottomEdgeLoop = [
        ...topArc,
        ...innerArcs.map(arc => arc[arc.length - 1]),
        ...toReversed(bottomArc),
        ...toReversed(innerArcs.map(arc => arc[0])),
        topArc[0]
    ]

    const topEdgeLoop = bottomEdgeLoop
        .map(point => point.add(new Vector3(0, (bases[0].radius/20), 0)))
        .map(point => scalePointRelativeToPointByVector(point, new Vector3(0, 0, 0), new Vector3(1.1, 1, 1.1)));

    const quads = [
        ...bottomArcs.slice(0, -1).flatMap((arc, i) => quadsFromLines(bottomArcs[i + 1], arc)),
        ...quadsFromLines(bottomEdgeLoop, topEdgeLoop),
    ]
    const triangles = quads.flatMap(quad => triangulateQuad(quad));
    return makeMeshFromPoints(scene, name, triangles.flat());
}


/**
 * Generates mesh from a list of points
 *
 * @param {Scene} scene - BabylonJS scene
 * @param {string} name - Name of the mesh
 * @param {Vector3[]} rawPoints - List of points
 *
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
 * Scales a point relative to a center point
 *
 * @param {Vector3} point - Point to scale
 * @param {Vector3} center - Center of scaling
 * @param {number} scale - Scale factor
 *
 * @returns {Vector3} Scaled point
 */
function scalePointRelativeToPoint(point, center, scale) {
    return point.subtract(center).scaleInPlace(scale).addInPlace(center);
}

/**
 * Scales a point relative to a center point
 *
 * @param {Vector3} point - Point to scale
 * @param {Vector3} center - Center of scaling
 * @param {Vector3} scale - Scale factor
 *
 * @returns {Vector3} Scaled point
 */
function scalePointRelativeToPointByVector(point, center, scale) {
    return point.subtract(center).multiplyInPlace(scale).addInPlace(center);
}

/**
 * Generates quads from two lines of points
 *
 * @param {Vector3[]} lineA points in the first line
 * @param {Vector3[]} lineB points in the second line
 *
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
 *
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
 * Generates mesh indices from a list of points
 *
 * @param {Vector3[]} rawPoints
 *
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

    return {
        indices,
        points
    };
}

/**
 * Generates a unique hash for a Vector3 object
 *
 * @param {Vector3} vector
 *
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
 *
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
 *
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
 *
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
 *
 * @returns {T[]}
 */
function toReversed(array) {
    const reversed = [...array];
    reversed.reverse();
    return reversed;
}

/**
 * Generates a grid of points by averaging positions of the surrounding points with strong bias towards left top corner
 *
 * @param {Vector3[]} top
 * @param {Vector3[]} bottom
 * @param {Vector3[]} left
 * @param {Vector3[]} right
 *
 * @returns {Vector3[][]}
 */
function unbalancedGridFill(top, bottom, left, right) {
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
            lines[i][j] = topLeft.add(vectorFromTopLeftToBottomRight);
        }

        lines[i][numberOfColumnsToFill + 1] = right[i - 1];
    }

    lines[numberOfLinesToFill + 1] = bottom;

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
 * Linear interpolation between two numbers
 *
 * @param {number} start
 * @param {number} end
 * @param {number} factor
 *
 * @returns {number}
 */
function lerp(start, end, factor){
    return (1-factor)*start+factor*end
}

/**
 * Clamps a number
 *
 * @param {number} number
 * @param {number} min
 * @param {number} max
 *
 * @returns {number}
 */
function clamp(number, min, max) {
    if (min > max) [min, max] = [max, min]
    return Math.max(min, Math.min(number, max));
}