// Constants used in the Filters component
export const MULTI_SELECT_FIELDS = [
  "town", 
  "projectName", 
  "flatType", 
  "TOPDate", 
  "nearestMRT", 
  "nearestMrtLrt", 
  "schools_within_1km", 
  "schools_within_2km"
];

export const RANGE_KEYS = [
  "priceRange",
  "sizeRange", 
  "pricePSFRange",
  "levelRange",
  "walkingTimeRange",
  "walkingDistRange",
  "maxLeaseRange",
  "roiRange",
];

export const ETHNIC_GROUP_OPTIONS = [
  { id: 0, name: "All", value: null },
  { id: 1, name: "Chinese", value: "Chinese" },
  { id: 2, name: "Malay", value: "Malay" },
  { id: 3, name: "Indian / Others", value: "Indian / Others" },
];

export const REPURCHASED_OPTIONS = [
  { id: 0, name: "All", value: null },
  { id: 1, name: "Yes", value: true },
  { id: 2, name: "No", value: false },
];