import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector4, WebGLRenderer } from 'three';

const MAX = 4;

/** Raumlicht hinter den Flächen: Lichtinseln und Schatten folgen ihnen, der Schatten wird beim Drehen schmal. Rein dekorativ. */
export function mountRoomLight(canvas: HTMLCanvasElement, targets: HTMLElement[], angles: () => number[]) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const uniforms = {
    uRes: { value: new Vector2() },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uRect: { value: Array.from({ length: MAX }, () => new Vector4()) },
    uOpen: { value: new Array<number>(MAX).fill(1) },
  };
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    uniforms,
    depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision highp float;
      uniform vec2 uRes; uniform float uTime; uniform float uScroll;
      uniform vec4 uRect[${MAX}]; uniform float uOpen[${MAX}];
      varying vec2 vUv;
      float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 px = vUv * uRes;
        vec3 col = mix(vec3(.868, .868, .848), vec3(.918, .918, .9), smoothstep(0., 1., vUv.y));
        float d = (px.x * .55 + px.y) / uRes.y + uScroll * .00012 + uTime * .004;
        col += vec3(1., .985, .95) * (.035 * smoothstep(.35, 0., abs(fract(d) - .5)) + .02 * smoothstep(.22, 0., abs(fract(d * 1.7 + .3) - .5)));
        float shade = 0.;
        for (int i = 0; i < ${MAX}; i++) {
          vec4 r = uRect[i];
          if (r.z < 1.) continue;
          vec2 c = r.xy + r.zw * .5;
          vec2 q = (px - c) / (r.zw * vec2(.95, 1.1));
          col += vec3(1., .99, .96) * exp(-dot(q, q) * 1.5) * .09;
          vec2 sc = c + vec2(r.z * .03, -r.w * .09);
          float sd = box(px - sc, vec2(r.z * .5 * max(uOpen[i], .05), r.w * .47), 18.);
          shade += (1. - smoothstep(-r.w * .06, r.w * .2, sd)) * .13;
        }
        col -= shade * vec3(.5, .52, .56);
        col += (hash(px + fract(uTime)) - .5) * .016;
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera();
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    uniforms.uRes.value.set(innerWidth, innerHeight);
  };
  const lost = (event: Event) => { event.preventDefault(); canvas.hidden = true; };
  addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', lost);
  resize();
  canvas.classList.add('is-lit');
  const shown = targets.slice(0, MAX);

  return {
    render(time: number) {
      uniforms.uTime.value = time / 1000;
      uniforms.uScroll.value = scrollY;
      const turns = angles();
      shown.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const visible = rect.bottom > -200 && rect.top < innerHeight + 200;
        uniforms.uRect.value[index].set(rect.left, innerHeight - rect.bottom, visible ? rect.width : 0, rect.height);
        uniforms.uOpen.value[index] = Math.abs(Math.cos((turns[index] * Math.PI) / 180));
      });
      renderer.render(scene, camera);
    },
    dispose() {
      removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.classList.remove('is-lit');
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
