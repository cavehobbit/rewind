import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import CardSwap, { Card } from './CardSwap';
import InfiniteMenu from './InfiniteMenu';
import Stack from './Stack';
import './styles.css';

const months = ['January', 'February', 'March', 'April', 'June', 'July'];

const menuItems = [

  { image: 'https://picsum.photos/900/900?random=1', link: '#', title: 'Project 1', description: 'Amazing work here' },
  { image: 'https://picsum.photos/900/900?random=2', link: '#', title: 'Project 2', description: 'Creative design' },
  { image: 'https://picsum.photos/900/900?random=3', link: '#', title: 'Project 3', description: 'Beautiful art' },
  { image: 'https://picsum.photos/900/900?random=4', link: '#', title: 'Project 4', description: 'Stunning visuals' }

];



const stackCards = [


  { content: <img src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format" alt="memory-1" className="card-image" /> },
  { content: <img src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format" alt="memory-2" className="card-image" /> },
  { content: <img src="https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format" alt="memory-3" className="card-image" /> }


];



function Stepper({ onComplete }) {

  const [step, setStep] = useState(0);

  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState('');

  const steps = [
    { text: 'Survived this year!', type: 'message' },
    { text: 'Congratulations', type: 'message' },

    { text: "I'm Proud of You", type: 'message' },
    { text: 'Keep going', type: 'message' },
    { text: 'How would you describe the year as?', placeholder: 'LOCK IN SHAKESPEAR', type: 'input' }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {

      setAnswers({ ...answers, description: input });
      onComplete();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && steps[step].type === 'input') {
      handleNext();
    }
  };



  return (
    <div className="stepper-container">
      <div className="stepper-content">
        <h2 className="stepper-text">{steps[step].text}</h2>
        {steps[step].type === 'input' ? (
          <input
            type="text"
            className="stepper-input"
            placeholder={steps[step].placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        ) : (
          <button className="stepper-button" onClick={handleNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}


export default function App() {
  const [showStack, setShowStack] = useState(false);

  return (
    <div className="app-container">
    


      <div className="page page-1">
        <div className="card-swap-wrapper">
          <CardSwap
            width={400}
            height={320}
            cardDistance={50}

            verticalDistance={60}
            delay={3000}
            pauseOnHover={true}
            skewAmount={6}
            easing="elastic"
          >
            {months.map((month, i) => (
              <Card key={i} customClass="month-card">
                <h3>{month}</h3>
              </Card>
            ))}
          </CardSwap>
        </div>
      </div>

     



      <div className="page page-2">
        <div className="page-2-left">
          <h1>Explore Our Work</h1>
          <p>Drag and discover amazing projects from this year.</p>
        </div>
        <div className="page-2-right">
          <InfiniteMenu items={menuItems} scale={1.0} />
        </div>
      </div>

    


      <div className="page page-3">


        {!showStack ? (
          <Stepper onComplete={() => setShowStack(true)} />
        ) : (
          <div className={`stack-wrapper ${showStack ? 'fade-in' : ''}`}>
            <Stack
              cards={stackCards}
              sensitivity={150}
              randomRotation={true}
              sendToBackOnClick={true}
              animationConfig={{ stiffness: 260, damping: 20 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
