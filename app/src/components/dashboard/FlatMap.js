import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import SchoolList from "./SchoolList";
import { FaHome, FaMapMarkerAlt, FaTrain, FaSchool, FaDollarSign } from 'react-icons/fa';

const FlatMap = ({ data, isDarkMode }) => {
  // Use "Grey" as the default recommended style, switch to "Night" for dark mode
  const mapStyle = isDarkMode ? "Night" : "Grey";
  const onemapUrl = `https://www.onemap.gov.sg/maps/tiles/${mapStyle}/{z}/{x}/{y}.png`;
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    setDataVersion(v => v + 1);
  }, [data]);

  // Create custom colored markers based on flat type
  const createCustomIcon = (flatType) => {
    const colors = {
      '2-room': '#8B5CF6',    // Purple
      '3-room': '#10B981',    // Green
      '4-room': '#3B82F6',    // Blue
      '5-room': '#F59E0B',    // Orange
      'Executive': '#EF4444', // Red
      '3Gen': '#9333EA',      // Purple shade for 3Gen
    };
    
    const color = colors[flatType] || '#6B7280'; // Default gray
    
    // Determine display text for the marker
    let displayText;
    if (flatType === 'Executive') {
      displayText = 'E';
    } else if (flatType === '3Gen') {
      displayText = '3G';
    } else {
      displayText = flatType.charAt(0);
    }
    
    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
          ${displayText}
        </text>
      </svg>
    `;
    
    return new L.DivIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const singaporeBounds = [
    [1.2258881, 103.6035873], // Southwest (min lat, min lon)
    [1.4900000, 104.0535126]  // Northeast (max lat, max lon)
  ];

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[1.3521, 103.8198]}
        zoom={11}
        style={{ height: "500px", width: "100%", position: "relative", zIndex: 0, borderRadius: "8px" }}
        attributionControl={false}
        maxBounds={singaporeBounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer url={onemapUrl} detectRetina={true} maxZoom={19} minZoom={11} />

        <MarkerClusterGroup key={dataVersion}>
          {data.map((flat) => (
            <Marker 
              key={flat.block + ", " + flat.unit} 
              position={[flat.project_lat, flat.project_lon]} 
              icon={createCustomIcon(flat.flat_type)}
            >
              <Popup maxWidth={220} minWidth={200} className="custom-popup">
                <div className={`p-1 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'} rounded-lg`}>
                  <div className="flex items-center gap-0.5 mb-0.5 pb-0.5 border-b border-gray-200 dark:border-gray-600">
                    <FaHome className="text-blue-500 w-2.5 h-2.5 flex-shrink-0" />
                    <h3 className="text-2xs font-semibold text-gray-900 dark:text-gray-100 leading-none truncate">{flat.project_name}</h3>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1">
                    <FaMapMarkerAlt className="text-orange-500 w-2.5 h-2.5 flex-shrink-0" />
                    <span className="text-2xs text-gray-600 dark:text-gray-400 leading-none mr-1">Location:</span>
                    <span className="font-medium text-2xs leading-none">
                      Block {flat.block} • {flat.unit}
                    </span>
                  </div>
                  
                  <div className="space-y-0">
                    <div className="flex items-center gap-0.5">
                      <FaDollarSign className="text-green-500 w-2.5 h-2.5 flex-shrink-0" />
                      <span className="text-2xs text-gray-600 dark:text-gray-400 leading-none mr-1">Price:</span>
                      <span className="font-semibold text-2xs text-green-600 dark:text-green-400 leading-none">
                        ${flat.price?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      <FaHome className="text-blue-500 w-2.5 h-2.5 flex-shrink-0" />
                      <span className="text-2xs text-gray-600 dark:text-gray-400 leading-none mr-1">Size:</span>
                      <span className="font-medium text-2xs leading-none">
                        {flat.size_sqm ? `${flat.size_sqm} sqm` : "N/A"}
                        <span className="text-blue-600 dark:text-blue-400 ml-1">
                          (${flat.price_psf?.toFixed() || 'N/A'} PSF)
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      <FaTrain className="text-purple-500 w-2.5 h-2.5 flex-shrink-0" />
                      <span className="text-2xs text-gray-600 dark:text-gray-400 leading-none mr-1">
                        {flat.nearest_mrt?.includes("LRT STATION") ? "LRT:" : "MRT:"}
                      </span>
                      <span className="font-medium text-2xs leading-none truncate">
                        {flat.nearest_mrt && flat.walking_time_in_mins
                          ? `${flat.nearest_mrt
                              .replace(" MRT STATION", "")
                              .replace(" LRT STATION", "")
                              .trim()} (~${flat.walking_time_in_mins}min walk)`
                          : "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-0.5">
                      <FaSchool className="text-orange-500 w-2.5 h-2.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-2xs text-gray-600 dark:text-gray-400 leading-none">Pri Schools:</span>
                        <div className="space-y-0">
                          <div className="flex items-start">
                            <span className="text-2xs font-medium text-gray-700 dark:text-gray-300 leading-none mr-1">1km:</span>
                            <SchoolList schools={flat.schools_within_1km} isDarkMode={isDarkMode} compact={true} />
                          </div>
                          <div className="flex items-start">
                            <span className="text-2xs font-medium text-gray-700 dark:text-gray-300 leading-none mr-1">2km:</span>
                            <SchoolList schools={flat.schools_within_2km} isDarkMode={isDarkMode} compact={true} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        
        {/* Enhanced OneMap Attribution */}
        <div
          className={`absolute bottom-3 right-3 px-3 py-2 rounded-md text-xs flex items-center shadow-lg z-[1000] ${
            isDarkMode 
              ? 'bg-gray-800/90 text-gray-200 border border-gray-600' 
              : 'bg-white/90 text-gray-800 border border-gray-300'
          }`}
        >
          <img
            src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png"
            className="h-5 w-5 mr-2"
            alt="OneMap Logo"
          />
          <a 
            href="https://www.onemap.gov.sg/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            OneMap
          </a>
          <span className="mx-1">©</span>
          <a 
            href="https://www.sla.gov.sg/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            SLA
          </a>
        </div>
      </MapContainer>
    </div >
  );
};

export default FlatMap;
