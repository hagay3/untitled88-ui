import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="loader w-9 h-9 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
};

export default LoadingSpinner;

