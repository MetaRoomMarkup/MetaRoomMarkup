class MetaVideoController extends MRM.MetaComponentController {
  constructor(dom){
    super(dom)
    this.setupComponent();
    this.parent = dom.parentElement.controller;

    this.metaObject = this.createMetaObject()
    this.computedProperties = {};
    this.computedPropertiesKey.forEach((key) => {
      var settings = this.computedPropertiesSettings[key];
      var value = settings.type(this.properties[key] || settings.default)
      Object.defineProperty(this.computedProperties, key, {
        get: function(){
          return value
        },
        set: (inputValue) => {
          value = settings.type(inputValue)
        }
      })
    });
    this.updateMetaObject()
  }

  get computedPropertiesKey(){
    return Object.keys(this.computedPropertiesSettings);
  }

  get computedPropertiesSettings(){
    return {
      width: {
        type: Number,
        default: null,
      },
      length: {
        type: Number,
        default: null,
      },
    };
  }

  get propertiesSettings() {
    return {
      width: {
        type: Number,
        default: 1,
        attrName: 'width',
        onChange: (value)=>{
          this.computedProperties.width = value;
        }
      },
      length: {
        type: Number,
        default: 1,
        attrName: 'length',
        onChange: (value)=>{
          this.computedProperties.length = value;
        }
      },
      src: {type: String, default: '', attrName: 'src'},
    }
  }

  get metaAttachedActions(){
    return {
      attachMetaObject: true,
      updateChildrenDisplayInline: true
    }
  }

  get tagName() {
    return "meta-video"
  }

  get eventActionSettings(){
    return {
      "width": ["updateChildrenDisplayInline"],
      "length": ["updateChildrenDisplayInline"],
      "meta-style": ['propagateMetaStyle'],
      "class": ["propagateMetaStyle"],
      "id": ["propagateMetaStyle"]
    }
  }

  createMetaObject(){

    var video	= document.createElement('video');
  	video.width	= 320;
  	video.height	= 240;
  	video.autoplay	= true;
  	video.loop	= false;
  	video.src	= this.properties.src;

    this.videoElement = video;

  	var videoTexture = new THREE.VideoTexture( video );
  	videoTexture.minFilter = THREE.LinearFilter;
  	videoTexture.magFilter = THREE.LinearFilter;

    videoTexture.needsUpdate = true

    var geometry = new THREE.PlaneGeometry(1,1,1,1);
    var material = new THREE.MeshBasicMaterial({
      map: videoTexture,
      color: 0x333333,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geometry, material);
    var group = new THREE.Group();
    group.add( mesh );

    return {
      mesh: mesh,
      group: group
    }
  }

  updateMetaObject(){
    var mesh = this.metaObject.mesh;

    mesh.scale.x = this.computedProperties.width;
    mesh.scale.y = this.computedProperties.length;
    if(this.metaStyle.metaStyle["position"] === 'absolute'){
      var group = this.metaObject.group;
      group.position.x = - (this.parent.properties.width/2) + (this.metaStyle["left"] || 0) + (this.properties.width/2);
      group.position.y = (this.parent.properties.length/2) - (this.metaStyle["top"] || 0) - (this.properties.length/2);
      group.position.z = 1;
      if(this.metaStyle.metaStyle['rotate-x']){
        group.rotation.x = this.metaStyle.metaStyle['rotate-x'] * (Math.PI / 180);
      }else if(this.metaStyle.metaStyle['rotate-y']){
        group.rotation.y = this.metaStyle.metaStyle['rotate-y'] * (Math.PI / 180);
      }else if(this.metaStyle.metaStyle['rotate-z']){
        group.rotation.z = this.metaStyle.metaStyle['rotate-z'] * (Math.PI / 180);
      }
    }
  }

  updateFrame(frameWidth, frameThickness){
    //TODO: Add the Frame mesh to the group
    var length = this.properties.length;
    var width = this.properties.width;
    var frameShape = new THREE.Shape();
    frameShape.moveTo( 0,0 );
    frameShape.lineTo( 0, length );
    frameShape.lineTo( width, length );
    frameShape.lineTo( width, 0 );
    frameShape.lineTo( 0, 0 );

    var frameHole = new THREE.Path();
    frameHole.moveTo(frameWidth + 0, frameWidth + 0);
    frameHole.lineTo(width - frameWidth, frameWidth + 0 );
    frameHole.lineTo(width - frameWidth, length - frameWidth);
    frameHole.lineTo(frameWidth + 0, length - frameWidth);
    frameShape.holes.push(frameHole);

    var extrudeSettings = { amount: frameThickness || 0.3, bevelEnabled: false};
    var geometry = new THREE.ExtrudeGeometry( frameShape, extrudeSettings );
    var material = new THREE.MeshPhongMaterial( { color: 0xb00000, wireframe: false } );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set(1, 1, 1);
    mesh.position.set( -this.properties.width / 2, -this.properties.length / 2, 0);
    this.computedProperties.width = width - (2 * frameWidth);
    this.computedProperties.length = length - (2 * frameWidth);
    this.updateMetaObject();
    this.metaObject.group.add(mesh);
  }
}

class MetaVideo extends MRM.MetaComponent {
  createdCallback() {
    this.controller = new MetaVideoController(this);
    super.createdCallback();
  }
}

document.registerElement('meta-video', MetaVideo);
