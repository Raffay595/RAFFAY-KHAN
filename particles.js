const { Renderer, Camera, Geometry, Program, Mesh } = window.ogl || ogl;

const defaultColors = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const int = parseInt(hex, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

class ParticlesSystem {
  constructor(container, options = {}) {
    if (!container) return;
    this.container = container;
    this.options = Object.assign({
      particleCount: 200,
      particleSpread: 10,
      speed: 0.1,
      particleColors: defaultColors,
      moveParticlesOnHover: false,
      particleHoverFactor: 1,
      alphaParticles: false,
      particleBaseSize: 100,
      sizeRandomness: 1,
      cameraDistance: 20,
      disableRotation: false,
      pixelRatio: window.devicePixelRatio || 1
    }, options);

    this.mouse = { x: 0, y: 0 };
    this.animationFrameId = null;
    this.init();
  }

  init() {
    const { pixelRatio, particleCount, particleSpread, particleColors, alphaParticles, particleBaseSize, sizeRandomness, cameraDistance, moveParticlesOnHover } = this.options;

    this.renderer = new Renderer({
      dpr: pixelRatio,
      depth: false,
      alpha: true
    });
    this.gl = this.renderer.gl;
    this.container.appendChild(this.gl.canvas);
    this.gl.clearColor(0, 0, 0, 0);

    this.camera = new Camera(this.gl, { fov: 15 });
    this.camera.position.set(0, 0, cameraDistance);

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize, false);
    this.resize();

    this.handleMouseMove = e => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouse = { x, y };
    };

    if (moveParticlesOnHover) {
      this.container.addEventListener('mousemove', this.handleMouseMove);
    }

    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;

    for (let i = 0; i < count; i++) {
      let x, y, z, len;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      const r = Math.cbrt(Math.random());
      positions.set([x * r, y * r, z * r], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
      colors.set(col, i * 3);
    }

    const geometry = new Geometry(this.gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors }
    });

    this.program = new Program(this.gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: particleSpread },
        uBaseSize: { value: particleBaseSize * pixelRatio },
        uSizeRandomness: { value: sizeRandomness },
        uAlphaParticles: { value: alphaParticles ? 1 : 0 }
      },
      transparent: true,
      depthTest: false
    });

    this.particles = new Mesh(this.gl, { mode: this.gl.POINTS, geometry, program: this.program });

    this.lastTime = performance.now();
    this.elapsed = 0;
    this.update = this.update.bind(this);
    this.animationFrameId = requestAnimationFrame(this.update);
  }

  resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.perspective({ aspect: this.gl.canvas.width / this.gl.canvas.height });
  }

  update(t) {
    this.animationFrameId = requestAnimationFrame(this.update);
    const delta = t - this.lastTime;
    this.lastTime = t;
    this.elapsed += delta * this.options.speed;

    this.program.uniforms.uTime.value = this.elapsed * 0.001;

    if (this.options.moveParticlesOnHover) {
      this.particles.position.x = -this.mouse.x * this.options.particleHoverFactor;
      this.particles.position.y = -this.mouse.y * this.options.particleHoverFactor;
    } else {
      this.particles.position.x = 0;
      this.particles.position.y = 0;
    }

    if (!this.options.disableRotation) {
      this.particles.rotation.x = Math.sin(this.elapsed * 0.0002) * 0.1;
      this.particles.rotation.y = Math.cos(this.elapsed * 0.0005) * 0.15;
      this.particles.rotation.z += 0.01 * this.options.speed;
    }

    this.renderer.render({ scene: this.particles, camera: this.camera });
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    if (this.options.moveParticlesOnHover) {
      this.container.removeEventListener('mousemove', this.handleMouseMove);
    }
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }
    if (this.container.contains(this.gl.canvas)) {
      this.container.removeChild(this.gl.canvas);
    }
  }
}

window.ParticlesSystem = ParticlesSystem;
