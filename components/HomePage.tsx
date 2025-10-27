
import React from 'react';

interface HomePageProps {
  onGetStarted: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="text-center flex flex-col items-center p-8 max-w-4xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
        Practice Smarter with AI-Generated Quizzes
      </h1>
      <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
        Upload any question paper PDF — our AI extracts, organizes, and quizzes you instantly.
      </p>
      <button
        onClick={onGetStarted}
        className="px-8 py-4 bg-cyan-500 text-white font-bold text-lg rounded-full hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30"
      >
        Get Started
      </button>
    </div>
  );
};

export default HomePage;
