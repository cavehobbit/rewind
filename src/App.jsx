import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  Children,
  cloneElement,
  forwardRef,
  isValidElement
} from 'react';
import gsap from 'gsap';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import './styles.css';

const Card = forwardRef(({ customClass, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`card-swap-card ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  />
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const CardSwap = ({
  width = 400,
  height = 320,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 8000,
  pauseOnHover = true,
  skewAmount = 6,
  children,
  onCardClick
}) => {
  const config = {
    ease: 'elastic.out(0.6,0.9)',
    durDrop: 1.2,
    durMove: 1.2,
    durReturn: 1.2,
    promoteOverlap: 0.9,
    returnDelay: 0.05
  };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(() => childArr.map(() => React.createRef()), [childArr.length]);
  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const [frontIndex, setFrontIndex] = useState(0);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });

    const swap = () => {
      if (order.current.length < 2 || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      if (!elFront) {
        isAnimatingRef.current = false;
        return;
      }
      const tl = gsap.timeline({
        onComplete: () => {
          order.current = [...rest, front];
          setFrontIndex(order.current[0]);
          isAnimatingRef.current = false;
        }
      });
      tlRef.current = tl;
      tl.to(elFront, { y: '+=500', duration: config.durDrop, ease: config.ease });
      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.1}`);
      });
      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.set(elFront, { zIndex: backSlot.zIndex }, 'return');
      tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease }, 'return');
    };

    containerRef.current.triggerSwap = swap;
    setFrontIndex(order.current[0]);
    intervalRef.current = window.setInterval(swap, delay);
    return () => clearInterval(intervalRef.current);
  }, [cardDistance, verticalDistance, delay, skewAmount, refs]);

  const rendered = childArr.map((child, i) => {
    const isFront = i === frontIndex;
    return isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: {
            width, height,
            pointerEvents: isFront && !isAnimatingRef.current ? 'auto' : 'none',
            cursor: isFront && !isAnimatingRef.current ? 'pointer' : 'default',
            ...(child.props.style ?? {})
          },
          onClick: e => {
            if (isFront && !isAnimatingRef.current) {
              e.stopPropagation();
              onCardClick?.(i);
              containerRef.current?.triggerSwap?.();
            }
          }
        })
      : child;
  });

  return <div ref={containerRef} className="card-swap-container" style={{ width, height }}>{rendered}</div>;
};

function MonthCardModal({ month, index, onClose }) {
  const isOdd = index % 2 === 0;
  const monthImageMap = { January: 'Jan.jfif', February: 'Feb.jfif', March: 'march.jfif', April: 'May.jfif', June: 'June.jfif', July: 'July.jfif' };
  const monthTextMap = {
    January: 'I hope January gave you a soft start — slow mornings, quiet wins, and reminders that you made it into another year.',
    February: 'I hope February wrapped you in warmth — from friends, from love, and from the way you kept choosing to stay.',
    March: "I hope March nudged you forward — into new risks, new habits, and proof that you're stronger than you think.",
    April: "I hope April surprised you — with tiny joys, dumb inside jokes, and moments you didn't see coming.",
    June: "I hope June brought lighter days, where the air felt easier to breathe and your thoughts were a little kinder.",
    July: 'I hope July was loud in the best way — laughter that echoed, memories that stuck, and a heart that felt more alive.'
  };
  const cardData = { text: monthTextMap[month] ?? `...`, image: `/${monthImageMap[month]}` };

  return (
    <div className="dim-overlay" onClick={onClose}>
      <div className="month-card-modal" onClick={e => e.stopPropagation()}>
        {isOdd ? (
          <><div className="month-card-left"><img src={cardData.image} alt={month} className="month-card-image" /></div>
          <div className="month-card-right"><h2 className="month-card-title">{month}</h2><p className="month-card-text">{cardData.text}</p></div></>
        ) : (
          <><div className="month-card-left"><h2 className="month-card-title">{month}</h2><p className="month-card-text">{cardData.text}</p></div>
          <div className="month-card-right"><img src={cardData.image} alt={month} className="month-card-image" /></div></>
        )}
      </div>
    </div>
  );
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);
  function handleDragEnd(_, info) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) onSendToBack();
    else { x.set(0); y.set(0); }
  }
  if (disableDrag) return <motion.div className="stack-card-rotate-disabled">{children}</motion.div>;
  return (
    <motion.div className="stack-card-rotate" style={{ x, y, rotateX, rotateY }} drag dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}>
      {children}
    </motion.div>
  );
}

function Stack({ randomRotation = false, sensitivity = 200, cards = [], animationConfig = { stiffness: 260, damping: 20 }, sendToBackOnClick = true }) {
  const [stack, setStack] = useState(() => cards.map((content, index) => ({ id: index + 1, content })));
  const sendToBack = id => {
    setStack(prev => {
      const newStack = [...prev];
      const index = newStack.findIndex(card => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };
  return (
    <div className="stack-container">
      {stack.map((card, index) => {
        const isTop = index === stack.length - 1;
        return (
          <CardRotate key={card.id} onSendToBack={() => sendToBack(card.id)} sensitivity={sensitivity}>
            <motion.div className={`stack-card ${isTop ? 'stack-card-top' : 'stack-card-shadow'}`} onClick={() => sendToBackOnClick && sendToBack(card.id)} animate={{ rotateZ: (stack.length - index - 1) * 4 + (randomRotation ? Math.random() * 10 - 5 : 0), scale: 1 + index * 0.06 - stack.length * 0.06 }} transition={{ type: 'spring', ...animationConfig }}>
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}

function Stepper({ onComplete }) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const steps = [
    { type: 'message', text: 'Survived this year!' },
    { type: 'message', text: 'Congratulations' },
    { type: 'message', text: "I'm Proud of You" },
    { type: 'message', text: 'Keep going' },
    { type: 'input', text: 'How would you describe the year as?', placeholder: "CHOP CHOP..." }
  ];
  const current = steps[step];
  const next = () => step < steps.length - 1 ? setStep(step + 1) : onComplete?.(input);
  return (
    <>
      {focused && <div className="dim-overlay" onClick={() => setFocused(false)} />}
      <div className={`stepper-container ${focused ? 'stepper-hidden' : ''}`}>
        <div className="stepper-inner">
          <h2 className="stepper-text">{current.text}</h2>
          {current.type === 'input' ? <input className="stepper-input" placeholder={current.placeholder} value={input} onChange={e => setInput(e.target.value)} onFocus={() => setFocused(true)} onKeyDown={e => e.key === 'Enter' && next()} /> : <button className="stepper-button" onClick={next}>Next</button>}
        </div>
      </div>
      {focused && <input autoFocus className="stepper-input-focused" value={input} onChange={e => setInput(e.target.value)} onBlur={() => setFocused(false)} onKeyDown={e => e.key === 'Enter' && next()} />}
    </>
  );
}

const discVert = `#version 300 es
uniform mat4 uWorldMatrix, uViewMatrix, uProjectionMatrix;
uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition; in vec2 aModelUvs; in mat4 aInstanceMatrix;
out vec2 vUvs; out float vAlpha; flat out int vInstanceId;
void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);
    if (gl_VertexID > 0) {
        vec3 stretchDir = normalize(cross(centerPos, uRotationAxisVelocity.xyz));
        worldPosition.xyz += stretchDir * (min(.15, uRotationAxisVelocity.w * 15.) * sign(dot(stretchDir, normalize(worldPosition.xyz - centerPos))));
    }
    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs; vInstanceId = gl_InstanceID;
}`;

const discFrag = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform int uItemCount, uAtlasSize;
out vec4 outColor; in vec2 vUvs; in float vAlpha; flat in int vInstanceId;
void main() {
    int itemIndex = vInstanceId % uItemCount;
    vec2 cellSize = vec2(1.0) / vec2(float(uAtlasSize));
    vec2 cellOffset = vec2(float(itemIndex % uAtlasSize), float(itemIndex / uAtlasSize)) * cellSize;
    outColor = texture(uTex, vec2(vUvs.x, 1.0 - vUvs.y) * cellSize + cellOffset);
    outColor.a *= vAlpha;
}`;

class Geometry {
  constructor() { this.vertices = []; this.faces = []; }
  addVertex(x, y, z) { this.vertices.push({ position: vec3.fromValues(x, y, z), uv: vec2.create() }); return this; }
  addFace(a, b, c) { this.faces.push({ a, b, c }); return this; }
  subdivide(div = 1) {
    for (let d = 0; d < div; d++) {
      let newFaces = [];
      let cache = {};
      this.faces.forEach(f => {
        let m = (p1, p2) => {
          let k = p1 < p2 ? `${p1}_${p2}` : `${p2}_${p1}`;
          if (cache[k] !== undefined) return cache[k];
          let v1 = this.vertices[p1].position, v2 = this.vertices[p2].position;
          this.addVertex((v1[0]+v2[0])/2, (v1[1]+v2[1])/2, (v1[2]+v2[2])/2);
          return cache[k] = this.vertices.length - 1;
        };
        let a1 = m(f.a, f.b), b1 = m(f.b, f.c), c1 = m(f.c, f.a);
        newFaces.push({a:f.a, b:a1, c:c1}, {a:f.b, b:b1, c:a1}, {a:f.c, b:c1, c:b1}, {a:a1, b:b1, c:c1});
      });
      this.faces = newFaces;
    }
    return this;
  }
  spherize(r = 1) { this.vertices.forEach(v => { vec3.normalize(v.position, v.position); vec3.scale(v.position, v.position, r); }); return this; }
  get data() { return { vertices: new Float32Array(this.vertices.flatMap(v => [...v.position])), indices: new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])), uvs: new Float32Array(this.vertices.flatMap(v => [...v.uv])) }; }
}

class DiscGeometry extends Geometry {
  constructor(steps = 4, r = 1) {
    super();
    this.addVertex(0, 0, 0); this.vertices[0].uv.set([0.5, 0.5]);
    for (let i = 0; i <= steps; i++) {
      let a = (i / steps) * Math.PI * 2;
      let x = Math.cos(a), y = Math.sin(a);
      this.addVertex(r * x, r * y, 0);
      this.vertices[this.vertices.length - 1].uv.set([x * 0.5 + 0.5, y * 0.5 + 0.5]);
      if (i > 0) this.addFace(0, i, i + 1);
    }
  }
}

class IcosahedronGeometry extends Geometry {
  constructor() {
    super();
    let t = (1 + Math.sqrt(5)) / 2;
    [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].forEach(p => this.addVertex(...p));
    [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]].forEach(f => this.addFace(...f));
  }
}

class ArcballControl {
  constructor(canvas) {
    this.canvas = canvas; 
    this.orientation = quat.create(); 
    this.rotationAxis = vec3.fromValues(1, 0, 0); 
    this.rotationVelocity = 0;
    this.pPos = vec2.create(); 
    this.prevPPos = vec2.create(); 
    this.isDown = false; 
    this.pointerRotation = quat.create();
    canvas.addEventListener('pointerdown', e => { 
      this.isDown = true; 
      vec2.set(this.pPos, e.clientX, e.clientY); 
      vec2.copy(this.prevPPos, this.pPos); 
    });
    window.addEventListener('pointerup', () => this.isDown = false);
    canvas.addEventListener('pointermove', e => { 
      if (this.isDown) vec2.set(this.pPos, e.clientX, e.clientY); 
    });
    canvas.style.touchAction = 'none';
  }
  update() {
    if (this.isDown) {
      let p = this.project(this.pPos), q = this.project(this.prevPPos);
      let axis = vec3.cross(vec3.create(), p, q); 
      vec3.normalize(axis, axis);
      let angle = Math.acos(Math.max(-1, Math.min(1, vec3.dot(p, q)))) * 2;
      quat.setAxisAngle(this.pointerRotation, axis, angle);
      quat.multiply(this.orientation, this.pointerRotation, this.orientation);
      vec2.copy(this.prevPPos, this.pPos);
      this.rotationVelocity = angle; 
      vec3.copy(this.rotationAxis, axis);
    } else {
      this.rotationVelocity *= 0.95;
    }
  }
  project(pos) {
    let x = (2 * pos[0] / this.canvas.clientWidth) - 1, y = 1 - (2 * pos[1] / this.canvas.clientHeight);
    let z2 = 1 - x * x - y * y;
    return vec3.fromValues(x, y, z2 > 0 ? Math.sqrt(z2) : 0);
  }
}

class InfiniteGridMenu {
  constructor(canvas, items) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { 
      antialias: true, 
      alpha: true, 
      premultipliedAlpha: false 
    });
    if (!this.gl) {
      console.error('WebGL2 not supported');
      return;
    }
    this.items = items;
    this.init();
  }
  
  init() {
    let gl = this.gl;
    let createS = (t, s) => {
      let sh = gl.createShader(t);
      gl.shaderSource(sh, s);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    
    this.prog = gl.createProgram();
    gl.attachShader(this.prog, createS(gl.VERTEX_SHADER, discVert));
    gl.attachShader(this.prog, createS(gl.FRAGMENT_SHADER, discFrag));
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.prog));
    }

    this.geo = new DiscGeometry(56, 1).data;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    let b = (d, l, n) => {
      let buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0);
    };
    b(this.geo.vertices, 0, 3);
    b(this.geo.uvs, 2, 2);

    let ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.geo.indices, gl.STATIC_DRAW);

    this.ico = new IcosahedronGeometry().subdivide(1).spherize(2);
    this.instCount = this.ico.vertices.length;
    this.instData = new Float32Array(this.instCount * 16);
    this.instBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.instData, gl.DYNAMIC_DRAW);

    const bytesPerMatrix = 16 * 4;
    for (let i = 0; i < 4; i++) {
      const loc = 3 + i;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, i * 4 * 4);
      gl.vertexAttribDivisor(loc, 1);
    }

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

    this.atlasSize = Math.ceil(Math.sqrt(this.items.length));
    let atlas = document.createElement('canvas');
    atlas.width = atlas.height = this.atlasSize * 512;
    let ctx = atlas.getContext('2d');

    let loaded = 0;
    this.items.forEach((item, i) => {
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let x = (i % this.atlasSize) * 512;
        let y = Math.floor(i / this.atlasSize) * 512;
        ctx.drawImage(img, x, y, 512, 512);
        loaded++;
        if (loaded === this.items.length) {
          gl.bindTexture(gl.TEXTURE_2D, this.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
          gl.generateMipmap(gl.TEXTURE_2D);
        }
      };
      img.src = item.image;
    });

    this.control = new ArcballControl(this.canvas);
    this.view = mat4.lookAt(mat4.create(), [0, 0, 6], [0, 0, 0], [0, 1, 0]);
    this.updateProjection();
    this.run();
  }

  updateProjection() {
    const aspect = this.canvas.width / this.canvas.height;
    this.proj = mat4.perspective(mat4.create(), Math.PI / 4, aspect, 0.1, 100);
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio);
    const width = Math.round(this.canvas.clientWidth * dpr);
    const height = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.updateProjection();
      this.gl.viewport(0, 0, width, height);
    }
  }

  run() {
    let gl = this.gl;
    const loop = () => {
      this.resize();
      this.control.update();
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.prog);

      this.ico.vertices.forEach((v, i) => {
        let worldPos = vec3.transformQuat(vec3.create(), v.position, this.control.orientation);
        let m = mat4.create();
        mat4.translate(m, m, vec3.negate(vec3.create(), worldPos));
        let lookMat = mat4.targetTo(mat4.create(), [0,0,0], worldPos, [0,1,0]);
        mat4.multiply(m, m, lookMat);
        mat4.scale(m, m, [0.25, 0.25, 0.25]);
        mat4.translate(m, m, [0, 0, -2]);
        this.instData.set(m, i * 16);
      });

      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instData);
      
      gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uWorldMatrix'), false, mat4.create());
      gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uViewMatrix'), false, this.view);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uProjectionMatrix'), false, this.proj);
      gl.uniform4f(gl.getUniformLocation(this.prog, 'uRotationAxisVelocity'), 
        this.control.rotationAxis[0], 
        this.control.rotationAxis[1], 
        this.control.rotationAxis[2], 
        this.control.rotationVelocity
      );
      gl.uniform1i(gl.getUniformLocation(this.prog, 'uAtlasSize'), this.atlasSize);
      gl.uniform1i(gl.getUniformLocation(this.prog, 'uItemCount'), this.items.length);
      
      gl.bindVertexArray(this.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.geo.indices.length, gl.UNSIGNED_SHORT, 0, this.instCount);
      
      requestAnimationFrame(loop);
    };
    loop();
  }
}

function InfiniteMenu({ items = [] }) {
  const ref = useRef();
  
  useEffect(() => {
    if (ref.current && items.length > 0) {
      new InfiniteGridMenu(ref.current, items);
    }
  }, [items]);
  
  return <canvas ref={ref} id="infinite-grid-menu-canvas" />;
}

function WelcomeScreen({ onContinue }) {
  const [showCake, setShowCake] = useState(false);
  return (
    <div className="welcome-screen">
      {showCake && <div className="dim-overlay" onClick={() => setShowCake(false)}><div className="cake-glow-wrapper"><div className="candle-glow" /><img src="/cake.png" className="cake-modal" alt="Cake" /></div></div>}
      <div className="spotlight" /><div className="rabbit-wrapper"><span className="click-text click-left">click</span><img src="/rabbitcake.png" className="rabbit-cake" onClick={() => setShowCake(true)} alt="Rabbit with cake" /><span className="click-text click-right">click</span></div>
      <button className="continue-button" onClick={onContinue}>Continue</button>
    </div>
  );
}

const months = ['January', 'February', 'March', 'April', 'June', 'July'];
const stackCards = [
  <img key="1" src="https://picsum.photos/500/700?1" className="stack-card-image" alt="Memory 1" />,
  <img key="2" src="https://picsum.photos/500/700?2" className="stack-card-image" alt="Memory 2" />,
  <img key="3" src="https://picsum.photos/500/700?3" className="stack-card-image" alt="Memory 3" />,
  <img key="4" src="https://picsum.photos/500/700?4" className="stack-card-image" alt="Memory 4" />
];
const infiniteItems = [
  { image: '/ays1.png' }, 
  { image: '/ays2.png' }, 
  { image: '/ays3.png' }, 
  { image: '/ays4.png' }
];

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [selected, setSelected] = useState(null);
  
  if (!showApp) return <WelcomeScreen onContinue={() => setShowApp(true)} />;
  
  return (
    <div className="app-scroll app-bg-active">
      {selected && <MonthCardModal month={selected.m} index={selected.i} onClose={() => setSelected(null)} />}
      <section className="page page-1">
        <div className="page-1-header"><h1 className="happy-birthday-title">Happy Birthday</h1></div>
        <div className="page-1-inner"><div className="page-1-text" /><div className="page-1-swap"><CardSwap onCardClick={i => setSelected({ m: months[i], i })}>{months.map((m, i) => <Card key={i} customClass="month-card"><h3>{m}</h3></Card>)}</CardSwap></div></div>
      </section>
      <section className="page page-2">
        <div className="page-2-right">
          <InfiniteMenu items={infiniteItems} />
        </div>
      </section>
      <section className={`page page-3 ${showStack ? 'page-3-dark' : ''}`}>
        {!showStack ? <Stepper onComplete={() => setShowStack(true)} /> : <div className="stack-box fade-in"><Stack cards={stackCards} randomRotation sensitivity={180} /></div>}
      </section>
    </div>
  );
}