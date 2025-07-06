import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGame = async () => {
    if (!currentUser || isCreating) return;

    setIsCreating(true);
    const shortId = generateShortId();
    try {
      // We now save the shortId to the document
      await addDoc(collection(db, 'games'), {
        hostId: currentUser.uid,
        shortId: shortId,
        status: 'waiting',
        createdAt: serverTimestamp(),
        playOrder: [currentUser.uid],
        players: {
          [currentUser.uid]: {
            name: `Player 1`,
            score: 0,
            isReady: true,
          }
        }
      });
      // Navigate using the new shortId
      navigate(`/lobby/${shortId}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game. Please try again.");
      setIsCreating(false);
    }
  };

  const handleJoinGame = () => {
    const gameId = prompt("Please enter the 6-character Game Code:");
    if (gameId && gameId.trim().length === 6) {
      navigate(`/lobby/${gameId.trim().toUpperCase()}`);
    } else if (gameId) {
      alert("Invalid Game Code. Please enter the 6-character code.");
    }
  };

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
        <button 
          onClick={handleCreateGame}
          disabled={isCreating || !currentUser}
          className="w-full bg-white text-teal-600 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isCreating ? 'Creating...' : 'Create Game'}
        </button>
        <button 
          onClick={handleJoinGame}
          className="w-full bg-cyan-800 bg-opacity-75 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
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
