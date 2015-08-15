define(function(require, exports, module){
require('game-shim');
require('dat.gui');
// only when optimized

var bloodHeight = 100;
var bloodPower = 10;
var bloodWidth = 100;
var bloodCursor = 120;
var options = {
        iterations: 25,
        mouse_force: 10,
        resolution: 1,
        cursor_size: 120,
        step: 1/120
    };

window.onload = function() {
    new Visualizer().ini();
};
var Visualizer = function() {
    this.file = null, //the current file
    this.fileName = null, //the current file name
    this.audioContext = null,
    this.source = null, //the audio source
    this.info = document.getElementById('info').innerHTML, //this used to upgrade the UI information
    this.infoUpdateId = null, //to sotore the setTimeout ID and clear the interval
    this.animationId = null,
    this.status = 0, //flag for sound is playing 1 or stopped 0
    this.forceStop = false,
    this.allCapsReachBottom = false
};
Visualizer.prototype = {
    ini: function() {
        this._prepareAPI();
        this._addEventListner();
    },
    _prepareAPI: function() {
        //fix browser vender for AudioContext and requestAnimationFrame
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
        try {
            this.audioContext = new AudioContext();
        } catch (e) {
            this._updateInfo('!Your browser does not support AudioContext', false);
            console.log(e);
        }
    },
    _addEventListner: function() {
        var that = this,
            audioInput = document.getElementById('uploadedFile'),
            dropContainer = document.getElementsByTagName("canvas")[0];
        //listen the file upload
        audioInput.onchange = function() {
            //the if statement fixes the file selction cancle, because the onchange will trigger even the file selection been canceled
            if (audioInput.files.length !== 0) {
                //only process the first file
                that.file = audioInput.files[0];
                that.fileName = that.file.name;
                if (that.status === 1) {
                    //the sound is still playing but we upload another file, so set the forceStop flag to true
                    that.forceStop = true;
                };
                document.getElementById('fileWrapper').style.opacity = 1;
                that._updateInfo('Uploading', true);
                //once the file is ready,start the visualizer
                that._start();
            };
        };
        //listen the drag & drop
        dropContainer.addEventListener("dragenter", function() {
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Drop it on the page', true);
        }, false);
        dropContainer.addEventListener("dragover", function(e) {
            e.stopPropagation();
            e.preventDefault();
            //set the drop mode
            e.dataTransfer.dropEffect = 'copy';
        }, false);
        dropContainer.addEventListener("dragleave", function() {
            document.getElementById('fileWrapper').style.opacity = 0.2;
            that._updateInfo(that.info, false);
        }, false);
        dropContainer.addEventListener("drop", function(e) {
            e.stopPropagation();
            e.preventDefault();
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Uploading', true);
            //get the dropped file
            that.file = e.dataTransfer.files[0];
            if (that.status === 1) {
                document.getElementById('fileWrapper').style.opacity = 1;
                that.forceStop = true;
            };
            that.fileName = that.file.name;
            //once the file is ready,start the visualizer
            that._start();
        }, false);
    },
    _start: function() {
        //read and decode the file into audio array buffer 
        var that = this,
            file = this.file,
            fr = new FileReader();
        fr.onload = function(e) {
            var fileResult = e.target.result;
            var audioContext = that.audioContext;
            if (audioContext === null) {
                return;
            };
            that._updateInfo('Decoding the audio', true);
            audioContext.decodeAudioData(fileResult, function(buffer) {
                that._updateInfo('Decode succussfully,start the visualizer', true);
                that._visualize(audioContext, buffer);
            }, function(e) {
                that._updateInfo('!Fail to decode the file', false);
                console.log(e);
            });
        };
        fr.onerror = function(e) {
            that._updateInfo('!Fail to read the file', false);
            console.log(e);
        };
        //assign the file to the reader
        this._updateInfo('Starting read the file', true);
        fr.readAsArrayBuffer(file);
    },
    _visualize: function(audioContext, buffer) {
        var audioBufferSouceNode = audioContext.createBufferSource(),
            analyser = audioContext.createAnalyser(),
            that = this;
        //connect the source to the analyser
        audioBufferSouceNode.connect(analyser);
        //connect the analyser to the destination(the speaker), or we won't hear the sound
        analyser.connect(audioContext.destination);
        //then assign the buffer to the buffer source node
        audioBufferSouceNode.buffer = buffer;
        //play the source
        if (!audioBufferSouceNode.start) {
            audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
            audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOn method
        };
        //stop the previous sound if any
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.source !== null) {
            this.source.stop(0);
        }
        audioBufferSouceNode.start(0);
        this.status = 1;
        this.source = audioBufferSouceNode;
        audioBufferSouceNode.onended = function() {
            that._audioEnd(that);
        };
        this._updateInfo('Playing ' + this.fileName, false);
        this.info = 'Playing ' + this.fileName;
        document.getElementById('fileWrapper').style.opacity = 0.2;
        this._drawSpectrum(analyser);
    },
    _drawSpectrum: function(analyser) {
        var that = this,
            canvas = document.getElementById('c'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //width of the meters in the spectrum
            gap = 2, //gap between meters
            capHeight = 2,
            capStyle = '#fff',
            meterNum = 800 / (10 + 2), //count of the meters
            capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame
        //ctx = canvas.getContext('2d'),

        var drawMeter = function() {
            analyser.fftSize = 2048;
            analyser.minDecibels = -80;
            analyser.maxDecibels = -10;
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            if (that.status === 0) {
                //fix when some sounds end the value still not back to zero
                for (var i = array.length - 1; i >= 0; i--) {
                    array[i] = 0;
                };
                allCapsReachBottom = true;
                for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                    allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
                };
                if (allCapsReachBottom) {
                    cancelAnimationFrame(that.animationId); //since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
                    return;
                };
            };

            var bassValue = (array[0] + array[1] + array[2] + array[3]) / 4;
            var kickValue = (array[3] + array[4] + array[5] +array[6] + array[7] ) / 5;
            var midSum = 0;
            var highSum = 0;
            for (var i = 25; i < 325; i++) {
                    midSum += array[i];
            };

           for (var i = 500; i < 1000; i++) {
                    highSum += array[i];
            };
            var highValue = (highSum / 500) * 5;
            var midValue = (midSum / 300) * 1.5;

            var rect = canvas.getBoundingClientRect();

            bloodWidth = (rect.width / 2) - 300 + kickValue + bassValue;
            bloodHeight = (rect.height / 2) - 150 + 1.5 * midValue - highValue;
            bloodPower = 5 + Math.exp((bassValue / 52));
            bloodCursor = bloodPower * 1.8 + 20;
            options.mouse_force = bloodPower;
            console.log(array[2]);
            that.animationId = requestAnimationFrame(drawMeter);
        }
        this.animationId = requestAnimationFrame(drawMeter);
    },
    _audioEnd: function(instance) {
        if (this.forceStop) {
            this.forceStop = false;
            this.status = 1;
            return;
        };
        this.status = 0;
        var text = 'HTML5 Audio API showcase | An Audio Viusalizer';
        document.getElementById('fileWrapper').style.opacity = 1;
        document.getElementById('info').innerHTML = text;
        instance.info = text;
        document.getElementById('uploadedFile').value = '';
    },
    _updateInfo: function(text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if (this.infoUpdateId !== null) {
            clearTimeout(this.infoUpdateId);
        };
        if (processing) {
            //animate dots at the end of the info text
            var animateDot = function() {
                if (i > 3) {
                    i = 0
                };
                infoBar.innerHTML = text + dots.substring(0, i++);
                that.infoUpdateId = setTimeout(animateDot, 250);
            }
            this.infoUpdateId = setTimeout(animateDot, 250);
        };
    }
}

var Loader = require('engine/loader'),
    Clock = require('engine/clock').Clock,
    InputHandler = require('engine/input').Handler,
    debounce = require('engine/utils').debounce,
    ShaderManager = require('engine/gl/shader').Manager,
    geometry = require('engine/gl/geometry'),
    FBO = require('engine/gl/texture').FBO,
    Mesh = require('engine/gl/mesh').Mesh,
    glcontext = require('engine/gl/context'),
    glm = require('gl-matrix'),
    ComputeKernel = require('compute').Kernel,
    vec2 = glm.vec2;

var canvas = document.getElementById('c'),
    gl = glcontext.initialize(canvas, {
        context: {
            depth: false
        },
        debug: false,
        //log_all: true,
        extensions: {
            texture_float: true
        }
    }, fail),
    gui = new dat.GUI(),
    clock = new Clock(canvas),
    input = new InputHandler(canvas),
    loader = new Loader(),
    resources = loader.resources,
    shaders = new ShaderManager(gl, resources);

window.gl = gl;

function fail(el, msg, id) {
    document.getElementById('video').style.display = 'block';
}

function hasFloatLuminanceFBOSupport(){
    var fbo = new FBO(gl, 32, 32, gl.FLOAT, gl.LUMINANCE);
    return fbo.supported;
}

function init(){
    // just load it when it's there. If it's not there it's hopefully not needed.
    gl.getExtension('OES_texture_float_linear');
    var format = hasFloatLuminanceFBOSupport() ? gl.LUMINANCE : gl.RGBA,
        onresize;
    window.addEventListener('resize', debounce(onresize = function(){
        var rect = canvas.getBoundingClientRect(),
            width = rect.width * options.resolution,
            height = rect.height * options.resolution;
        //console.log(rect.width, rect.height);
        //if(rect.width != canvas.width || rect.height != canvas.height){
            input.updateOffset();
            setup(width, height, format);
        //}
    }, 250));

    gui.close();
    onresize();
    clock.start();
}

function setup(width, height, singleComponentFboFormat){
    canvas.width = width,
    canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.lineWidth(1.0);

    var px_x = 1.0/canvas.width,
        px_y = 1.0/canvas.height,
        px = vec2.create([px_x, px_y]);
        px1 = vec2.create([1, canvas.width/canvas.height]),
        inside = new Mesh(gl, {
            vertex: geometry.screen_quad(1.0-px_x*2.0, 1.0-px_y*2.0),
            attributes: {
                position: {}
            }
        }),
        all = new Mesh(gl, {
            vertex: geometry.screen_quad(1.0, 1.0),
            attributes: {
                position: {}
            }
        }),
        boundary = new Mesh(gl, {
            mode: gl.LINES,
            vertex: new Float32Array([
                // bottom
                -1+px_x*0.0, -1+px_y*0.0,
                -1+px_x*0.0, -1+px_y*2.0,

                 1-px_x*0.0, -1+px_y*0.0,
                 1-px_x*0.0, -1+px_y*2.0,

                // top
                -1+px_x*0.0,  1-px_y*0.0,
                -1+px_x*0.0,  1-px_y*2.0,

                 1-px_x*0.0,  1-px_y*0.0,
                 1-px_x*0.0,  1-px_y*2.0,

                // left
                -1+px_x*0.0,  1-px_y*0.0,
                -1+px_x*2.0,  1-px_y*0.0,

                -1+px_x*0.0, -1+px_y*0.0,
                -1+px_x*2.0, -1+px_y*0.0,

                // right
                 1-px_x*0.0,  1-px_y*0.0,
                 1-px_x*2.0,  1-px_y*0.0,

                 1-px_x*0.0, -1+px_y*0.0,
                 1-px_x*2.0, -1+px_y*0.0

            ]),
            attributes: {
                position: {
                    size: 2,
                    stride: 16,
                    offset: 0
                },
                offset: {
                    size: 2,
                    stride: 16,
                    offset: 8
                }
            }
        }),
        velocityFBO0 = new FBO(gl, width, height, gl.FLOAT),
        velocityFBO1 = new FBO(gl, width, height, gl.FLOAT),
        divergenceFBO = new FBO(gl, width, height, gl.FLOAT, singleComponentFboFormat),
        pressureFBO0 = new FBO(gl, width, height, gl.FLOAT, singleComponentFboFormat),
        pressureFBO1 = new FBO(gl, width, height, gl.FLOAT, singleComponentFboFormat),
        advectVelocityKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'advect'),
            mesh: inside,
            uniforms: {
                px: px,
                px1: px1,
                scale: 1.0,
                velocity: velocityFBO0,
                source: velocityFBO0,
                dt: options.step
            },
            output: velocityFBO1
        }),
        velocityBoundaryKernel = new ComputeKernel(gl, {
            shader: shaders.get('boundary', 'advect'),
            mesh: boundary,
            uniforms: {
                px: px,
                scale: -1.0,
                velocity: velocityFBO0,
                source: velocityFBO0,
                dt: 1/60
            },
            output: velocityFBO1
        }),
        cursor = new Mesh(gl, {
            vertex: geometry.screen_quad(px_x*options.cursor_size*2, px_y*options.cursor_size*2),
            attributes: {
                position: {}
            }
        }),
        addForceKernel = new ComputeKernel(gl, {
            shader: shaders.get('cursor', 'addForce'),
            mesh: cursor,
            blend: 'add',
            uniforms: {
                px: px,
                force: vec2.create([0.5, 0.2]),
                center: vec2.create([0.1, 0.4]),
                scale: vec2.create([options.cursor_size*px_x, options.cursor_size*px_y])
            },
            output: velocityFBO1
        }),
        divergenceKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'divergence'),
            mesh: all,
            uniforms: {
                velocity: velocityFBO1,
                px: px
            },
            output: divergenceFBO
        }),
        jacobiKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'jacobi'),
            // use all so the simulation still works
            // even if the pressure boundary is not
            // properly enforced
            mesh: all,
            nounbind: true,
            uniforms: {
                pressure: pressureFBO0,
                divergence: divergenceFBO,
                alpha: -1.0,
                beta: 0.25,
                px: px
            },
            output: pressureFBO1
        }),
        pressureBoundaryKernel = new ComputeKernel(gl, {
            shader: shaders.get('boundary', 'jacobi'),
            mesh: boundary,
            nounbind: true,
            nobind: true,
            uniforms: {
                pressure: pressureFBO0,
                divergence: divergenceFBO,
                alpha: -1.0,
                beta: 0.25,
                px: px
            },
            output: pressureFBO1
        }),

        subtractPressureGradientKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'subtractPressureGradient'),
            mesh: all,
            uniforms: {
                scale: 1.0,
                pressure: pressureFBO0,
                velocity: velocityFBO1,
                px: px
            },
            output: velocityFBO0
        }),
        subtractPressureGradientBoundaryKernel = new ComputeKernel(gl, {
            shader: shaders.get('boundary', 'subtractPressureGradient'),
            mesh: boundary,
            uniforms: {
                scale: -1.0,
                pressure: pressureFBO0,
                velocity: velocityFBO1,
                px: px
            },
            output: velocityFBO0
        }),


        drawKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'visualize'),
            mesh: all,
            uniforms: {
                velocity: velocityFBO0,
                pressure: pressureFBO0,
                px: px
            },
            output: null
        });

    var rect = canvas.getBoundingClientRect();
    var x0 = bloodWidth,
        y0 = bloodHeight;

    clock.ontick = function(dt){
        var x1 = bloodWidth * options.resolution,
            y1 = bloodHeight * options.resolution,
            xd = x1-x0,
            yd = y1-y0;

        x0 = x1,
        y0 = y1;
        if(x0 === 0 && y0 === 0) xd = yd = 0;
        advectVelocityKernel.uniforms.dt = options.step*1.0;
        advectVelocityKernel.run();

        //console.log(bloodCursor);
        vec2.set([xd*px_x*bloodCursor*bloodPower,
                 -yd*px_y*bloodCursor*bloodPower], addForceKernel.uniforms.force);
        vec2.set([x0*px_x*2-1.0, (y0*px_y*2-1.0)*-1], addForceKernel.uniforms.center);
        addForceKernel.run();

        velocityBoundaryKernel.run();

        divergenceKernel.run();

        var p0 = pressureFBO0,
            p1 = pressureFBO1,
            p_ = p0;
        for(var i = 0; i < options.iterations; i++) {
            jacobiKernel.uniforms.pressure = pressureBoundaryKernel.uniforms.pressure = p0;
            jacobiKernel.outputFBO = pressureBoundaryKernel.outputFBO = p1;
            jacobiKernel.run();
            pressureBoundaryKernel.run();
            p_ = p0;
            p0 = p1;
            p1 = p_;
        }

        subtractPressureGradientKernel.run();
        subtractPressureGradientBoundaryKernel.run();

        drawKernel.run();

    };
}

if(gl)
loader.load([
            'js/shaders/advect.frag',
            'js/shaders/addForce.frag',
            'js/shaders/divergence.frag',
            'js/shaders/jacobi.frag',
            'js/shaders/subtractPressureGradient.frag',
            'js/shaders/visualize.frag',
            'js/shaders/cursor.vertex',
            'js/shaders/boundary.vertex',
            'js/shaders/kernel.vertex'
], init); 

});
