import * as THREE from 'three';
import { networkConnections, stations } from './data';
import type { LandscapeController } from './controller';

const fieldVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fieldFragment = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPhase;
  void main(){
    vec2 p=(vUv-.5)*2.0;
    float grain=sin(p.x*5.1+uPhase)*cos(p.y*4.3-uPhase*.4)*.095;
    p.x+=sin(p.y*3.0+uPhase)*.16;
    p.y+=cos(p.x*4.1-uPhase)*.10;
    float distance=length(p*vec2(.91,1.12))+grain;
    float cloud=exp(-distance*distance*3.2)*(1.0-smoothstep(.67,1.05,distance));
    float core=exp(-dot(p+vec2(.18,-.08),p+vec2(.18,-.08))*8.0);
    gl_FragColor=vec4(mix(uColor,uColor+vec3(.12),core*.22),cloud*uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** Decorative, deterministic imagery. Navigation and project content remain ordinary HTML. */
export function initLandscape(container: HTMLElement): LandscapeController {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const disposers: (() => void)[] = [];
  const pins = [...container.querySelectorAll<HTMLElement>('[data-pin]')];
  const pinStyles = pins.map(pin => pin.getAttribute('style'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer: THREE.WebGLRenderer | undefined;
  let disposed = false, enabled = true, visible = true;
  let frame = 0, lastTime = 0, width = 1, height = 1;
  let currentProgress = -1, targetProgress = -1;
  const geometry = <T extends THREE.BufferGeometry>(value:T):T => { geometries.add(value); return value; };
  const material = <T extends THREE.Material>(value:T):T => { materials.add(value); return value; };

  function cleanup() {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    for (const dispose of disposers.reverse()) dispose();
    for (const value of geometries) value.dispose();
    for (const value of materials) value.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
    delete container.dataset.render;
    pins.forEach((pin,i) => {
      if (pinStyles[i] === null) pin.removeAttribute('style');
      else pin.setAttribute('style',pinStyles[i]!);
    });
  }
  function fallback() {
    cleanup();
    container.dataset.render = 'static';
    container.dispatchEvent(new CustomEvent('landscape-fallback',{bubbles:true}));
  }

  try {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#172f3a',.009);
    const camera = new THREE.PerspectiveCamera(42,1,.1,180);
    renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    const gpu = renderer;
    gpu.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.6));
    gpu.setClearColor(0x000000,0);
    gpu.outputColorSpace = THREE.SRGBColorSpace;
    gpu.toneMapping = THREE.ACESFilmicToneMapping;
    gpu.toneMappingExposure = 1.15;
    gpu.domElement.setAttribute('aria-hidden','true');
    container.querySelector('.journey-webgl')!.append(gpu.domElement);
    const contextLost = (event:Event) => { event.preventDefault(); fallback(); };
    gpu.domElement.addEventListener('webglcontextlost',contextLost);
    disposers.push(() => gpu.domElement.removeEventListener('webglcontextlost',contextLost));

    scene.add(new THREE.HemisphereLight('#e9f4ec','#345460',3.3));
    const key = new THREE.DirectionalLight('#f4f4e8',4.2);
    key.position.set(-12,19,16); scene.add(key);
    const fill = new THREE.DirectionalLight('#b9d4e8',1.8);
    fill.position.set(15,8,-9); scene.add(fill);

    const planeGeometry = geometry(new THREE.PlaneGeometry(1,1));
    function cloud(color:string,opacity:number,phase:number) {
      return material(new THREE.ShaderMaterial({
        vertexShader:fieldVertex,fragmentShader:fieldFragment,
        uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:opacity},uPhase:{value:phase}},
        transparent:true,depthWrite:false,side:THREE.DoubleSide,
      }));
    }
    const fields = stations.map((station,index) => {
      const group = new THREE.Group(); group.name = `field-${station.id}`;
      group.position.set(station.position[0],1.2,station.position[1]); scene.add(group);
      const layers = [0,1,2].map(layer => {
        const surface = cloud(station.visual.color,.38,index*.71+layer*1.4);
        const mesh = new THREE.Mesh(planeGeometry,surface);
        mesh.position.set((layer-1)*.65,(layer-1)*.38,-layer*.8);
        mesh.scale.set(8.7+layer*2.8,6.1+layer*2.3,1);
        mesh.renderOrder = -10+layer;
        group.add(mesh);
        return {mesh,surface};
      });
      return {group,layers};
    });

    // Fine pathways describe useful connections; the growing overlay follows reading progress.
    const network = new THREE.Group(); network.name = 'connection-network'; scene.add(network);
    const strands = {content:'#9fbeb7',design:'#c0cbb4',function:'#85b4c6'};
    const growing: {mesh:THREE.Mesh; from:number; to:number; count:number; opacity:number}[] = [];
    function connection(points:THREE.Vector3[],from:number,to:number,color:string,radius=.022) {
      const curve = new THREE.CatmullRomCurve3(points);
      const shape = geometry(new THREE.TubeGeometry(curve,60,radius,5,false));
      const base = new THREE.Mesh(shape,material(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.14,depthWrite:false})));
      network.add(base);
      const traced = geometry(shape.clone());
      const mesh = new THREE.Mesh(traced,material(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false})));
      mesh.name = `connection-${from}-${to}`; network.add(mesh);
      growing.push({mesh,from,to,count:traced.index!.count,opacity:radius<.02?.48:.8});
    }
    networkConnections.forEach((edge,index) => {
      const a = stations[edge.from].position, b = stations[edge.to].position;
      const bend = (index%2 ? 1 : -1)*(1.1+Math.abs(edge.to-edge.from)*.38);
      const points = [
        new THREE.Vector3(a[0],-.35,a[1]),
        new THREE.Vector3(THREE.MathUtils.lerp(a[0],b[0],.29),-.65,a[1]+bend),
        new THREE.Vector3(THREE.MathUtils.lerp(a[0],b[0],.68),-.25,b[1]+bend),
        new THREE.Vector3(b[0],-.2,b[1]),
      ];
      connection(points,edge.from,edge.to,strands[edge.strand]);
      const path = new THREE.CatmullRomCurve3(points);
      for (let branch=0;branch<2;branch++) {
        const p = path.getPoint(.35+branch*.28);
        connection([p,p.clone().add(new THREE.Vector3(.65,.08,bend*.65)),p.clone().add(new THREE.Vector3(1.8,.18,bend*.9))],edge.from,edge.to,strands[edge.strand],.012);
      }
    });

    const boxGeometry = geometry(new THREE.BoxGeometry(1,1,1));
    const cylinderGeometry = geometry(new THREE.CylinderGeometry(1,1,1,32));
    const sphereGeometry = geometry(new THREE.SphereGeometry(1,24,16));
    const worlds = stations.map((station,index) => {
      const group = new THREE.Group(); group.name = `world-${station.id}`;
      group.position.set(station.position[0],0,station.position[1]); scene.add(group);
      const surfaces:THREE.MeshStandardMaterial[] = [];
      const moves:{object:THREE.Object3D; origin:THREE.Vector3; offset:THREE.Vector3}[] = [];
      const surface = (color:string,roughness=.7,metalness=0) => {
        const value = material(new THREE.MeshStandardMaterial({color,roughness,metalness,transparent:true,opacity:0}));
        surfaces.push(value); return value;
      };
      const pearl = surface('#e8e8d9'), paper = surface('#f4f3e8'), slate = surface('#29434d');
      const sage = surface('#829e90'), oak = surface('#b5a38a'), accent = surface(station.visual.color,.47);
      function box(x:number,y:number,z:number,w:number,h:number,d:number,finish:THREE.Material=pearl) {
        const mesh = new THREE.Mesh(boxGeometry,finish);
        mesh.position.set(x,y+h/2,z); mesh.scale.set(w,h,d); group.add(mesh); return mesh;
      }
      function disc(x:number,y:number,z:number,r:number,h:number,finish:THREE.Material=pearl) {
        const mesh = new THREE.Mesh(cylinderGeometry,finish);
        mesh.position.set(x,y+h/2,z); mesh.scale.set(r,h,r); group.add(mesh); return mesh;
      }
      function tube(points:THREE.Vector3[],radius:number,finish:THREE.Material) {
        const mesh = new THREE.Mesh(geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,radius,7,false)),finish);
        group.add(mesh); return mesh;
      }
      function assemble(object:THREE.Object3D,offset:THREE.Vector3) { moves.push({object,origin:object.position.clone(),offset}); }

      if (station.landmark === 'clearing') {
        for (let i=0;i<5;i++) {
          const panel = box(-1.55+i*.78,.55+(i%2)*.48,(i%2)*.38,1.02,.12,1.5,i===2?accent:paper);
          panel.rotation.z=(i-2)*.035;
          assemble(panel,new THREE.Vector3((i-2)*.38,.65+(i%2)*.3,(i%2?1:-1)*.5));
        }
        box(-1.35,1.7,-.75,2.1,.035,.045,accent);
        box(-1.35,1.7,-.75,.035,.6,.045,accent);
        box(.85,1.7,-.75,.035,.6,.045,accent);
      } else if (station.landmark === 'atelier') {
        for (let i=0;i<3;i++) {
          const panel=box(-1.5+i*1.5,.22+i*.08,0,1.3,.12,2.3,[pearl,oak,slate][i]);
          assemble(panel,new THREE.Vector3((i-1)*.7,.9+i*.2,(i-1)*.7));
          for(let line=0;line<3;line++) box(-1.5+i*1.5,.4+i*.08,-.7+line*.46,.8,.025,.13,i===2?sage:accent);
        }
        box(0,1.5,-1.25,4.3,.07,.07,accent);
        for(const x of [-1.5,0,1.5])box(x,.55,-1.25,.045,1,.045,accent);
      } else if (station.landmark === 'room') {
        box(0,-.1,0,4.4,.16,3.4,paper);
        box(0,.06,-1.55,4.4,2.9,.13,pearl); box(-2.1,.06,0,.13,2.9,3.1,oak);
        box(.15,.08,.55,2.55,.55,1.05,sage); box(.15,.6,.11,2.55,.64,.18,sage);
        for(const x of [-1.05,1.35])box(x,.59,.57,.18,.45,1.04,sage);
        disc(.2,.1,-.64,.56,.67,oak); disc(.2,.76,-.64,.65,.07,paper);
        for(let swatch=0;swatch<3;swatch++) {
          const panel = box(2.55+swatch*.55,.5+swatch*.22,-.5,.42,2.4,.1,[oak,sage,pearl][swatch]);
          panel.rotation.y=-.2;
        }
        for(let i=0;i<4;i++)box(-1.1+i*.5,2.05,-1.47,.28,.5,.035,i===1?accent:paper);
      } else if (station.landmark === 'technical') {
        box(-.9,.08,0,1.05,3.4,1.15,slate);box(.8,.08,0,1.15,2.4,1.2,pearl);
        for(let i=0;i<13;i++)box(.8,.35+i*.13,.62,.91,.035,.04,sage);
        for(let i=0;i<5;i++){box(-.9,.42+i*.55,.59,.77,.13,.035,oak);box(-1.13,.45+i*.55,.62,.08,.055,.025,accent);}
        box(-.9,3.49,0,1.07,.06,1.17,accent);
        const routeMaterial=surface('#b7d8d9',.4);
        for(let branch=0;branch<3;branch++) {
          const z=-1.2+branch*1.35;
          tube([new THREE.Vector3(1.5,.22,0),new THREE.Vector3(2.3,.22,z*.7),new THREE.Vector3(3.25,.22,z)],.025,routeMaterial);
          box(3.3,.18,z,.65,.12,.52,branch===1?accent:paper);
        }
      } else if (station.landmark === 'garden') {
        const petalSurface=surface('#b3a5c4',.76), innerSurface=surface('#d1c8dd',.7), threadSurface=surface('#a78385',.66);
        for(let flower=0;flower<3;flower++) {
          const center=new THREE.Vector3((flower-1)*1.55,.95+(flower%2)*.7,(flower-1)*.35);
          tube([new THREE.Vector3(center.x-.15,-.65,center.z),new THREE.Vector3(center.x-.35,center.y*.4,center.z),center],.035,sage);
          for(let petal=0;petal<6;petal++) {
            const angle=petal/6*Math.PI*2;
            const mesh=new THREE.Mesh(sphereGeometry,petal%2?petalSurface:innerSurface);
            mesh.position.copy(center).add(new THREE.Vector3(Math.cos(angle)*.48,.28,Math.sin(angle)*.48));
            mesh.scale.set(.35,.82,.17);mesh.rotation.set(Math.sin(angle)*.6,angle,Math.cos(angle)*-.6);group.add(mesh);
          }
          for(let thread=0;thread<3;thread++) {
            const dx=(thread-1)*.12;
            tube([center.clone(),center.clone().add(new THREE.Vector3(dx,.65,.03)),center.clone().add(new THREE.Vector3(dx+.16,.94,.09))],.025,threadSurface);
          }
          for(const direction of [-1,1]) {
            const leaf=new THREE.Mesh(sphereGeometry,sage);leaf.scale.set(.055,.9,.12);
            leaf.position.set(center.x+direction*.28,0,center.z);leaf.rotation.z=direction*-.4;group.add(leaf);
          }
        }
        box(1.9,-.18,1.2,1.1,.08,.8,paper);
        for(let i=0;i<5;i++)tube([new THREE.Vector3(1.6+i*.13,-.09,1),new THREE.Vector3(1.65+i*.13,-.05,1.2),new THREE.Vector3(1.56+i*.13,-.09,1.4)],.015,threadSurface);
      } else if (station.landmark === 'furniture') {
        box(0,-.12,0,4.9,.12,3.4,pearl);
        box(-1.7,0,-1.4,.1,3.15,.1,oak);box(1.9,0,-1.4,.1,3.15,.1,oak);box(.1,3.1,-1.4,3.7,.1,.1,oak);
        for(let i=0;i<7;i++)box(-1.4+i*.5,.65,-1.4,.035,2.15,.055,oak);
        disc(-.15,.88,.25,.93,.09,oak);disc(-.15,.03,.25,.13,.85,slate);
        for(const x of [-1.55,1.3]) {
          box(x,.48,.3,.7,.13,.74,sage);box(x,.57,-.02,.7,.85,.11,sage);
          for(const dx of [-.25,.25])for(const z of [.05,.55])box(x+dx,.03,z,.055,.45,.055,slate);
        }
        box(2.5,.05,-.65,.85,1.25,.62,oak);box(2.5,.44,-.32,.72,.025,.025,slate);box(2.5,.85,-.32,.72,.025,.025,slate);
        for(let i=0;i<3;i++)box(-2.4+i*.52,.07,1.75,.42,.06,.6,[sage,oak,slate][i]);
      } else {
        box(0,.02,0,4.6,.055,3,paper);
        for(let i=0;i<3;i++) {
          const panel=box(-1.4+i*1.35,.45+i*.15,-1.2,1.05,1.5,.045,i===1?accent:pearl);
          panel.rotation.y=(i-1)*-.09;
          assemble(panel,new THREE.Vector3((i-1)*.4,.4,.7));
        }
        for(let i=0;i<4;i++)box(-1.45+i*.95,.09,.85,.65,.025,.05,sage);
      }
      if(station.demoId)group.scale.setScalar(.7);
      return {group,surfaces,moves,index};
    });

    // Layers have real depth and move only while travelling between chapters.
    const mist = [0,1,2].map(index => {
      const surface=cloud(index===1?'#b0c3c7':'#779caa',0,index*1.7);
      const mesh=new THREE.Mesh(planeGeometry,surface);mesh.name=`transition-mist-${index}`;
      mesh.renderOrder=20+index;mesh.material.depthTest=false;scene.add(mesh);
      return {mesh,surface};
    });
    const cameraRail = new THREE.CatmullRomCurve3(stations.map(s => new THREE.Vector3(s.position[0]-4.5,4.1,s.position[1]+8.5)),false,'catmullrom',.25);
    const lookRail = new THREE.CatmullRomCurve3(stations.map(s => new THREE.Vector3(s.position[0],1.25,s.position[1])),false,'catmullrom',.25);
    const forward = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
    const overview = new THREE.Vector3();
    const overviewLook = new THREE.Vector3(.1,0,0);
    const overviewDepth = 2.4;

    function fitOverview() {
      const mobile=width<760;
      const left=mobile?.08:.46,right=mobile?.92:.93;
      let distance=42;
      // Fit the full set, including room around each light field, in its actual visual column.
      for(let attempt=0;attempt<70;attempt++) {
        overview.set(.1,distance*.45,distance*.893);
        camera.position.copy(overview);camera.lookAt(overviewLook);camera.updateMatrixWorld();
        const fits=stations.every(station=>[-3,3].every(margin=>{
          const point=new THREE.Vector3(station.position[0]+margin,1.2,station.position[1]*overviewDepth).project(camera);
          const x=point.x*.5+.5,y=-point.y*.5+.5;
          return x>=left&&x<=right&&y>=.15&&y<=.82;
        }));
        if(fits)break;
        distance*=1.045;
      }
    }

    function pose() {
      const bounded=reduced.matches?-1:THREE.MathUtils.clamp(currentProgress,-1,stations.length-1);
      const mobile=width<760;
      const t=Math.max(0,bounded)/(stations.length-1);
      const position=cameraRail.getPoint(t), focus=lookRail.getPoint(t);
      if(mobile)position.add(new THREE.Vector3(-.6,.7,2));
      const descent=THREE.MathUtils.smoothstep(bounded,-1,0);
      camera.position.copy(overview).lerp(position,descent);
      camera.lookAt(overviewLook.clone().lerp(focus,descent));
      camera.updateMatrixWorld();
      const depthSpread=THREE.MathUtils.lerp(overviewDepth,1,descent);
      network.scale.z=depthSpread;
      const fraction=bounded-Math.floor(bounded);
      const travelling=bounded<stations.length-1?Math.pow(Math.sin(fraction*Math.PI),2):0;
      const haze=reduced.matches?0:travelling;
      (scene.fog as THREE.FogExp2).density=.009+haze*.009;

      fields.forEach(({group,layers},index) => {
        const distance=Math.abs(Math.max(0,bounded)-index);
        const prominence=bounded<0?.88:Math.max(.2,1-distance*.42);
        group.position.z=stations[index].position[1]*depthSpread;
        group.quaternion.copy(camera.quaternion);
        layers.forEach(({surface},layer) => {
          surface.uniforms.uOpacity.value=prominence*(.34-layer*.065);
          surface.uniforms.uPhase.value=index*.71+layer*1.4+bounded*.07;
        });
      });
      worlds.forEach(({group,surfaces,moves,index}) => {
        const proximity=bounded<0?index===0?descent:0:Math.max(0,1-Math.abs(bounded-index)/.94);
        const reveal=THREE.MathUtils.smoothstep(proximity,.08,.84)*(1-haze*.22);
        group.visible=reveal>.005;
        const station=stations[index];
        // Live website surfaces occupy the centre. Their physical studies sit below and beside them.
        group.position.set(station.position[0]+(station.demoId?1.6:0),station.demoId?-2:-.12*(1-reveal),station.position[1]+(station.demoId?1.2:0));
        surfaces.forEach(value => {value.opacity=reveal;value.depthWrite=reveal>.55;});
        moves.forEach(({object,origin,offset}) => object.position.copy(origin).addScaledVector(offset,1-reveal));
      });
      growing.forEach(({mesh,from,to,count,opacity}) => {
        const completed=bounded<0?0:THREE.MathUtils.clamp((bounded-from+.6)/(to-from+.6),0,1);
        mesh.geometry.setDrawRange(0,Math.floor(count*completed/3)*3);
        (mesh.material as THREE.MeshBasicMaterial).opacity=opacity*(.65+haze*.2);
      });
      camera.getWorldDirection(forward);right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
      mist.forEach(({mesh,surface},index) => {
        const distance=4+index*2;
        mesh.position.copy(camera.position).addScaledVector(forward,distance).addScaledVector(right,(fraction-.5)*(index%2?-2.8:2.8)).addScaledVector(up,(index-1)*.35);
        mesh.quaternion.copy(camera.quaternion);
        mesh.scale.set(distance*1.65*camera.aspect,distance*1.6,1);
        surface.uniforms.uOpacity.value=haze*(index===1?.23:.14);
        surface.uniforms.uPhase.value=index*1.7+fraction*.75;
        mesh.visible=haze>.001;
      });
      pins.forEach((pin,index) => {
        const station=stations[index];
        const point=new THREE.Vector3(station.position[0],bounded<0?1.2:3.7,station.position[1]*depthSpread).project(camera);
        pin.style.left=`${(point.x*.5+.5)*width}px`;
        pin.style.top=`${(-point.y*.5+.5)*height}px`;
        pin.style.visibility=point.z>1||point.z< -1||Math.abs(point.x)>.94||Math.abs(point.y)>.86?'hidden':'';
      });
    }
    function render(time:number) {
      frame=0;
      if(disposed||!enabled||!visible||document.hidden)return;
      const elapsed=Math.min(.06,(time-lastTime)/1000||.016);lastTime=time;
      currentProgress=reduced.matches?targetProgress:THREE.MathUtils.lerp(currentProgress,targetProgress,1-Math.exp(-elapsed*9));
      if(Math.abs(targetProgress-currentProgress)<.001)currentProgress=targetProgress;
      try{pose();gpu.render(scene,camera);container.dataset.render='webgl';}catch{fallback();return;}
      if(currentProgress!==targetProgress)invalidate();
    }
    function invalidate(){if(!frame&&!disposed&&enabled&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
    function resize(){
      width=container.clientWidth;height=container.clientHeight;
      if(!width||!height)return;
      camera.aspect=width/height;
      camera.setViewOffset(width,height,width<760?0:-width*.19,0,width,height);
      camera.updateProjectionMatrix();fitOverview();gpu.setSize(width,height,false);invalidate();
    }
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);disposers.push(()=>resizeObserver.disconnect());
    const visibilityObserver=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible){lastTime=0;invalidate();}else if(frame){cancelAnimationFrame(frame);frame=0;}
    },{threshold:0});
    visibilityObserver.observe(container);disposers.push(()=>visibilityObserver.disconnect());
    const visibility=()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else{lastTime=0;invalidate();}};
    document.addEventListener('visibilitychange',visibility);disposers.push(()=>document.removeEventListener('visibilitychange',visibility));
    reduced.addEventListener('change',invalidate);disposers.push(()=>reduced.removeEventListener('change',invalidate));
    resize();
    return {
      setProgress(progress,immediate=false){targetProgress=THREE.MathUtils.clamp(Number.isFinite(progress)?progress:-1,-1,stations.length-1);if(immediate)currentProgress=targetProgress;invalidate();},
      setEnabled(value){enabled=value;if(!enabled&&frame){cancelAnimationFrame(frame);frame=0;}else{lastTime=0;invalidate();}},
      dispose:cleanup,
    };
  }catch(error){cleanup();throw error;}
}
