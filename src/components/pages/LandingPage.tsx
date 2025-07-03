import React from 'react';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-500 to-cyan-600 p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white drop-shadow-lg">
          Cambodia
        </h1>
        <p className="text-xl text-cyan-100 mt-2">
          A Game of Memory & Risk
        </p>
      </div>

      <div className="space-y-4 w-full max-w-xs">
        <button className="w-full bg-white text-teal-600 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
          Create Game
        </button>
        <button className="w-full bg-cyan-800 bg-opacity-75 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
          Join Game
        </button>
        <button className="w-full border-2 border-cyan-200 text-cyan-100 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
          View Rules
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
