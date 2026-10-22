/**
 * Original L-system experiment. Symbol replacement builds a word that is interpreted as drawing and branching commands.
 */
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';
import { MapControls } from '../../Lib/Three/MapControls.js';
import { BooleanKeyframeTrack } from 'three';
let zoom = 1;

const scene = new THREE.Scene();
let camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight * 0.95);
// Keep visual frames separate from the simulation's own update timing.
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// controls

let controls = new MapControls( camera, renderer.domElement );

controls.addEventListener( 'change', animate ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
controls.zoomToCursor = true;
controls.dampingFactor = 0.05;
// controls.zoom = 10;
// controls.zoom0 = 10;

// controls.zoomSpeed = 0.001;
controls.screenSpacePanning = true;

controls.minDistance = 100;
controls.maxDistance = 500;

// controls.maxPolarAngle = Math.PI / 10;

let size = 1;
// const geometry = new THREE.BoxGeometry( size, size, size );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

camera.position.z = 5;

let gui = new GUI();

const settings = {
    recursionNumber : 1,
    angle : 30,
    seed : 'X',
    size : 100,
    leafSize : 30,
    /**
     * Append a rewrite rule and rebuild its GUI controls.
     *
     * Inputs: None; uses enclosing state where needed.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    addPatern : function() {addPatern()},
    /**
     * Remove the last rewrite rule and refresh the GUI.
     *
     * Inputs: None; uses enclosing state where needed.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    removePatern : function() {removePatern()},
    ruleList: [
        {
            patern : 'X',
            replacement : 'F[-X][+X]'
        }
    ],
    /**
     * Generate the current project result using the active configuration.
     *
     * Inputs: None; uses enclosing state where needed.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    generate : function() {lSystemAlgorythm(0, settings.seed)},
};

/**
 * Adjust the camera projection using the requested field-of-view change.
 *
 * @param delta - Amount added to the camera field of view.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function setCamera(delta) {
    camera.fov += delta;
    // camera.setViewOffset(window.innerWidth, window.innerHeight, window.innerWidth*zoom, window.innerHeight*zoom, 0.1, 1000);
    camera.updateProjectionMatrix()
    // camera = new THREE.PerspectiveCamera( 75, (window.innerWidth*zoom) / (window.innerHeight*zoom), 0.1, 1000 );
}

/**
 * Advance time-dependent simulation work and redraw the view on the next animation frame.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function animate() {

	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;

	renderer.render( scene, camera );
    // controls.update();
}

initGui();

// Init gui
/**
 * Connect editable simulation settings to the GUI controls.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function initGui() {
    gui.destroy();
    gui = new GUI();
    gui.domElement.id = 'gui';
    gui.add( settings, 'angle' ).min( -179 ).max( 179 );
    gui.add( settings, 'recursionNumber', [ 0,1,2,3,4,5,6,7,8,9,10 ]);
    gui.add( settings, 'seed' );
    gui.add( settings, 'size' );
    gui.add( settings, 'leafSize' );

    // submenu rules
    const rules = gui.addFolder( 'Rules' );
    settings.ruleList.forEach(e => {
        rules.add( e, 'patern' ).onChange( function ( value ) {

        });
        rules.add( e, 'replacement' ).onChange( function ( value ) {

        });
    });
    rules.add(settings, 'addPatern');
    rules.add(settings, 'removePatern');
    gui.add(settings, 'generate');
}


/**
 * Replace symbols recursively, then draw the final word at the configured recursion depth.
 *
 * @param iteration - Current recursive L-system rewrite iteration.
 * @param currentSeed - Current word being rewritten by the legacy L-system.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function lSystemAlgorythm(iteration, currentSeed) {
    let returnedString = "";
    for(const c of currentSeed) {
        const pattern = settings.ruleList.find(e => e.patern === c);
        if(pattern == undefined) {
            returnedString += c;
            continue;
        }
        returnedString += pattern.replacement;
    }

    if(iteration < settings.recursionNumber) {
        returnedString = lSystemAlgorythm(iteration+1, returnedString);
    } else { 
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }

        let points = drawPatern(returnedString, {x: 0, y:0}, 90);
    }

}

/**
 * Interpret movement, rotation, and branch commands as drawable line segments.
 *
 * @param returnedString - Expanded symbol string to interpret as drawing commands.
 * @param lastSavedPoint - Saved turtle position from which to resume drawing.
 * @param angle - Turtle turning angle in degrees.
 * @returns Drawing points assembled by the legacy turtle interpreter.
 */
function drawPatern(returnedString, lastSavedPoint, angle) {

    const material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
    const materialleaf = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    let x = lastSavedPoint.x;
    let y = lastSavedPoint.y;
    let points = [
        new THREE.Vector3( 
            x, 
            y, 
            0 )];
    let leafs = [];
     
    for(let i = 0; i < returnedString.length; i++) {
        if (returnedString[i] == 'F') {
            x += (settings.size / settings.recursionNumber) * Math.cos(angle * Math.PI / 180);
            y += (settings.size / settings.recursionNumber) * Math.sin(angle * Math.PI / 180);
            points.push(new THREE.Vector3( x , y, 0 ));
        } else if (returnedString[i] == '[') {
            let str = returnedString.slice(i+1, findMatchingBracket(returnedString, i));
            returnedString = returnedString.replace("["+str+"]", "");
            i -= 1;
            drawPatern(str, {x: x, y:y}, angle);
        } else if (returnedString[i] == ']') {
        } else if (returnedString[i] == '+') {
            angle += settings.angle;
        } else if (returnedString[i] == '-') {
            angle -= settings.angle;
        } else if (returnedString[i] == 'X') {
            leafs.push(new THREE.Vector3( x , y, 0 ));
            x += (settings.leafSize / settings.recursionNumber) * Math.cos(angle * Math.PI / 180);
            y += (settings.leafSize / settings.recursionNumber) * Math.sin(angle * Math.PI / 180);
            leafs.push(new THREE.Vector3( x , y, 0 ));
        }
    }
 
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    scene.add( line );
    const geometry2 = new THREE.BufferGeometry().setFromPoints( leafs );
    const line2 = new THREE.Line( geometry2, materialleaf );
    scene.add( line2 );
    return points;

}

/**
 * Count nested brackets to locate the closing symbol for a branch.
 *
 * @param patern - Legacy symbol string whose matching closing bracket is requested.
 * @param position - Index of the opening bracket whose matching closing bracket is sought.
 * @returns Index of the matching closing bracket, or undefined if none is found.
 */
function findMatchingBracket(patern, position) {
    let bracketCounter = 0;
    for(let i = position;i < patern.length; i++) {
        if(patern[i] == "[") {
            bracketCounter += 1;
        } else if (patern[i] == "]") {
            bracketCounter -= 1;
        }
        if (bracketCounter == 0) {
            return i;
        }
    }
}

// add and remove pannel to gui
/**
 * Append a rewrite rule and rebuild its GUI controls.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function addPatern() {
    settings.ruleList.push(
        {
            patern : 'F',
            replacement : 'F+FF-F[+FF]'
        }
    );
    initGui();
}
/**
 * Remove the last rewrite rule and refresh the GUI.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function removePatern() {
    settings.ruleList.pop();
    initGui();
}



