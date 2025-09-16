import React from 'react';

const SchoolList = ({ schools, isDarkMode, compact = false }) => {
  if (!schools || schools.length === 0) {
    return <span className="text-gray-500 text-2xs italic leading-none">N/A</span>;
  }

  const sortedSchools = schools
    .slice()
    .sort((a, b) => (a.WALK_TIME || 0) - (b.WALK_TIME || 0));

  if (compact) {
    // Ultra-compact inline display for space-constrained usage
    const maxVisible = 2;
    const displaySchools = sortedSchools.slice(0, maxVisible);
    const hasMore = schools.length > maxVisible;
    
    return (
      <span className="text-2xs leading-none">
        {displaySchools.map((school, index) => (
          <span key={index}>
            {index > 0 && ', '}
            <span className="font-medium">
              {school.SCHOOLNAME.replace(' SCHOOL', '').replace(' PRIMARY', '').trim()}
            </span>
            <span className={`text-2xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              ({Math.round(school.WALK_TIME || 0)}min)
            </span>
          </span>
        ))}
        {hasMore && <span className="text-gray-500"> +{schools.length - maxVisible}</span>}
      </span>
    );
  }

  const maxVisible = 3;
  
  if (schools.length <= maxVisible) {
    return (
      <div className="space-y-0">
        {sortedSchools.map((school, index) => (
          <div 
            key={index}
            className={`text-2xs px-0.5 py-0 rounded text-left leading-none ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span className="font-medium">{index + 1}.</span> {school.SCHOOLNAME.replace(' SCHOOL', '').trim()}
            <span className={`ml-1 text-2xs ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              ~{Math.round(school.WALK_TIME || 0)}min
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`max-h-12 overflow-y-auto space-y-0 p-0.5 rounded border text-left ${
      isDarkMode 
        ? 'border-gray-600 bg-gray-700' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      {sortedSchools.map((school, index) => (
        <div 
          key={index}
          className={`text-2xs px-0.5 py-0 rounded leading-none ${
            isDarkMode 
              ? 'bg-gray-600 text-gray-300' 
              : 'bg-white text-gray-700'
          }`}
        >
          <span className="font-medium">{index + 1}.</span> {school.SCHOOLNAME.replace(' SCHOOL', '').trim()}
          <span className={`ml-1 text-2xs ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            ~{Math.round(school.WALK_TIME || 0)}min
          </span>
        </div>
      ))}
    </div>
  );
};

export default SchoolList;
