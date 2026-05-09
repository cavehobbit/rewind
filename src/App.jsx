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
  delay = 4000,
  pauseOnHover = true,
  skewAmount = 6,
  easing = 'elastic',
  children,
  onCardClick
}) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    [childArr.length]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });

    const swap = () => {
     
      if (order.current.length < 2) return;
      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);

      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);

      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => gsap.set(elFront, { zIndex: backSlot.zIndex }),
        undefined,
        'return'
      );
     
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

   


    swap();
    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover && containerRef.current) {
      const node = containerRef.current;
      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);

      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
      };

    }

    return () => clearInterval(intervalRef.current);
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {

          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: e => {
            child.props.onClick?.(e);
            onCardClick?.(i);
          }
        })
      : child
  );

  return (

    <div
      ref={containerRef}
      className="card-swap-container"
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
};




function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_, info) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {


      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="stack-card-rotate-disabled" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="stack-card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

function Stack({

  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = true,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768

}) {

  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
 
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  const [stack, setStack] = useState(() =>
    cards.length
      ? cards.map((content, index) => ({ id: index + 1, content }))
      : []
  );

  useEffect(() => {

    if (cards.length) {
      setStack(cards.map((content, index) => ({ id: index + 1, content })));
    }
  }, [cards]);

  const sendToBack = id => {


    setStack(prev => {
      const newStack = [...prev];
      const index = newStack.findIndex(card => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;

    });
  };

  useEffect(() => {

    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);
      return () => clearInterval(interval);
    }
  

  }, [autoplay, autoplayDelay, stack, isPaused]);

  return (
    <div

      className="stack-container"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >

      {stack.map((card, index) => {
        const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
        return (


          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >


            <motion.div
              className="stack-card"
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: '90% 90%'
              }}

              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping
              }}
            >

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

  const steps = [
    { type: 'message', text: 'Survived this year!' },
    { type: 'message', text: 'Congratulations' },
    { type: 'message', text: "I\'m Proud of You" },
    { type: 'message', text: 'Keep going' },
    {
      type: 'input',
      text: 'How would you describe the year as?',
      placeholder: 'LOCK IN SHAKESPEAR'
    }
  ];

  const current = steps[step];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete?.(input);
    }
  };



  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      next();
    }
  };

  return (


    <div className="stepper-container">
      <div className="stepper-inner">
        <h2 className="stepper-text">{current.text}</h2>

        {current.type === 'input' ? (
          <input
            className="stepper-input"
            placeholder={current.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button className="stepper-button" onClick={next}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}




const months = ['January', 'February', 'March', 'April', 'June', 'July'];

const stackCards = [
  <img
    src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format"
    alt="card-1"
    className="stack-card-image"
  />,
  <img
    src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format"
    alt="card-2"
    className="stack-card-image"
  />,
  <img
    src="https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format"
    alt="card-3"
    className="stack-card-image"
  />,

  <img
    src="https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format"
    alt="card-4"
    className="stack-card-image"
  />
];

export default function App() {
  const [showStack, setShowStack] = useState(false);

  return (
    <div className="app-scroll">
   


      <section className="page page-1">
        <div className="page-1-inner">
          <div className="page-1-text">
            <h1>Your Year in Cards</h1>
            <p>Swipe through the months that made your year unforgettable.</p>
          </div>

          <div className="page-1-swap">
            <CardSwap>
              {months.map((month, i) => (
                <Card key={i} customClass="month-card">
                  <h3>{month}</h3>
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </section>

    


      <section className="page page-2">
        <div className="page-2-left">
          <h2>Moments that stayed with you</h2>
          <p>
            Imagine all your highlights orbiting around you. This space is for the
            memories you can&apos;t forget, and the ones you&apos;re still making.
          </p>
        </div>
        <div className="page-2-right">
          <div className="page-2-placeholder">
            <p>Infinite memory orbit placeholder</p>
            <span>(we removed heavy WebGL to keep your project light & simple)</span>
          </div>
        </div>
      </section>

     



      <section className="page page-3">
        {!showStack ? (
          <Stepper onComplete={() => setShowStack(true)} />
        ) : (
          <div className="stack-box fade-in">
            <Stack
              cards={stackCards}
              randomRotation={true}
              sensitivity={180}
              autoplay={false}
              sendToBackOnClick={true}
            />
          </div>
        )}
      </section>
    </div>
  );
}