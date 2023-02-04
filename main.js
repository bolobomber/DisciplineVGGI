'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    this.iLight = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
const border = 4;
const tempo = 0.0025;
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    // let projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    let projection = m4.orthographic(-border,border,-border,border,-border,border*3);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    let matrixInversion = m4.inverse(modelViewProjection)
    let modelNormal = m4.transpose(matrixInversion)

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelNormalMatrix, false, modelNormal);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    gl.uniform3fv(shProgram.iLight, [Math.cos(Date.now()*tempo), Math.sin(Date.now()*tempo), 0]);

    surface.Draw();
}
function render(){
    draw();
    window.requestAnimationFrame(render);
}
function CreateSurfaceData() {
    let vertexList = [];

    for (let j = -1; j < 1; j += 0.025) {
        for (let i = 0; i < 360; i += 5) {
            const v1 = parabola(deg2rad(i), j),
            v2 = parabola(deg2rad(i+5), j),
            v3 = parabola(deg2rad(i), j+0.025),
            v4 = parabola(deg2rad(i+5), j+0.025);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v2.x, v2.y, v2.z);
        }
    }

    return vertexList;
}
function CreateSurfaceData2() {
    let normalList = [];

    for (let j = -1; j < 1; j += 0.025) {
        for (let i = 0; i < 360; i += 5) {
            const v1 = parabola(deg2rad(i), j),
            v2 = parabola(deg2rad(i+5), j),
            v3 = parabola(deg2rad(i), j+0.025),
            v4 = parabola(deg2rad(i+5), j+0.025);
            const v21 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z },
            v31 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z },
            v42 = { x: v4.x - v2.x, y: v4.y - v2.y, z: v4.z - v2.z },
            v32 = { x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z }
            const n1 = vec3Cross(v21, v31),
            n2 = vec3Cross(v42, v32)
            vec3Normalize(n1)
            vec3Normalize(n2)
            normalList.push(n1.x, n1.y, n1.z)
            normalList.push(n1.x, n1.y, n1.z)
            normalList.push(n1.x, n1.y, n1.z)
            normalList.push(n2.x, n2.y, n2.z)
            normalList.push(n2.x, n2.y, n2.z)
            normalList.push(n2.x, n2.y, n2.z)
        }
    }

    return normalList;
}
function vec3Cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3Normalize(a) {
    var mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    a.x /= mag; a.y /= mag; a.z /= mag;
}
const a = 0.8,
    c = 2,
    theta = Math.PI * 0.2;
function parabola(u, t) {
    const x = (a + t * Math.cos(theta) + c * Math.pow(t, 2) * Math.sin(theta)) * Math.cos(u),
        y = (a + t * Math.cos(theta) + c * Math.pow(t, 2) * Math.sin(theta)) * Math.sin(u),
        z = -t * Math.sin(theta) + c * Math.pow(t, 2) * Math.cos(theta);
    return { x: 0.5 * x, y: 0.5 * y, z: 0.5 * z }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelNormalMatrix = gl.getUniformLocation(prog, "ModelNormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLight = gl.getUniformLocation(prog, "light");

    surface = new Model('Surface');
    // surface.BufferData(CreateSurfaceData(),CreateSurfaceData2());
    surface.BufferData(CreateSurfaceData(),CreateSurfaceData2());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    // draw();
    render();
}
