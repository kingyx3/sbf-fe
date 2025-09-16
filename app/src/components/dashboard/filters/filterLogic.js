/**
 * Filter data based on current filter settings
 */
export const filterData = (data, filters, includeLrt) => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((item) => {
    const sbfMatch = !filters.sbfCode || filters.sbfCode.name === item.sbfCode;
    const townMatch = !filters.town?.length || 
      filters.town.some((town) => town.name === item.project_town);
    
    return (
      sbfMatch &&
      townMatch &&
      (!filters.projectName?.length ||
        filters.projectName.some((p) => p.name === item.project_name)) &&
      (!filters.flatType?.length ||
        filters.flatType.some((f) => f.name === item.flat_type)) &&
      (!filters.TOPDate?.length ||
        filters.TOPDate.some((d) => d.name === item.top_delay_date)) &&
      (!filters.nearestMRT?.length ||
        filters.nearestMRT.some((m) => m.name === item.nearest_mrt)) &&
      (!filters.nearestMrtLrt?.length ||
        filters.nearestMrtLrt.some((m) => m.name === item.nearest_mrt_lrt)) &&
      (
        !filters.schools_within_1km?.length ||
        filters.schools_within_1km.some((filterSchool) =>
          (item.schools_within_1km || []).some(
            (school) => school.SCHOOLNAME === filterSchool.name))) &&
      (!filters.schools_within_2km?.length ||
        filters.schools_within_2km.some((filterSchool) =>
          (item.schools_within_2km || []).some(
            (school) => school.SCHOOLNAME === filterSchool.name))) &&
      (filters.repurchased == null ||
        item.repurchased === filters.repurchased) &&
      (filters.priceRange?.[0] == null ||
        item.price >= filters.priceRange[0]) &&
      (filters.priceRange?.[1] == null ||
        item.price <= filters.priceRange[1]) &&
      (filters.sizeRange?.[0] == null ||
        item.size_sqm >= filters.sizeRange[0]) &&
      (filters.sizeRange?.[1] == null ||
        item.size_sqm <= filters.sizeRange[1]) &&
      (filters.pricePSFRange?.[0] == null ||
        item.price_psf >= filters.pricePSFRange[0]) &&
      (filters.pricePSFRange?.[1] == null ||
        item.price_psf <= filters.pricePSFRange[1]) &&
      (filters.walkingTimeRange?.[0] == null ||
        (includeLrt ? item.mrt_lrt_walking_time_in_mins || item.walking_time_in_mins : item.walking_time_in_mins) >= filters.walkingTimeRange[0]) &&
      (filters.walkingTimeRange?.[1] == null ||
        (includeLrt ? item.mrt_lrt_walking_time_in_mins || item.walking_time_in_mins : item.walking_time_in_mins) <= filters.walkingTimeRange[1]) &&
      (filters.walkingDistRange?.[0] == null ||
        (includeLrt ? item.mrt_lrt_walking_distance_in_m || item.walking_distance_in_m : item.walking_distance_in_m) >= filters.walkingDistRange[0]) &&
      (filters.walkingDistRange?.[1] == null ||
        (includeLrt ? item.mrt_lrt_walking_distance_in_m || item.walking_distance_in_m : item.walking_distance_in_m) <= filters.walkingDistRange[1]) &&
      (filters.maxLeaseRange?.[0] == null ||
        item.max_lease >= filters.maxLeaseRange[0]) &&
      (filters.maxLeaseRange?.[1] == null ||
        item.max_lease <= filters.maxLeaseRange[1]) &&
      (filters.levelRange?.[0] == null ||
        item.level >= filters.levelRange[0]) &&
      (filters.levelRange?.[1] == null ||
        item.level <= filters.levelRange[1]) &&
      (filters.roiRange?.[0] == null ||
        (item.price && item.approximate_resale_value && item.approximate_resale_value > 0 &&
        ((item.approximate_resale_value - item.price) / item.price * 100) >= filters.roiRange[0])) &&
      (filters.roiRange?.[1] == null ||
        (item.price && item.approximate_resale_value && item.approximate_resale_value > 0 &&
        ((item.approximate_resale_value - item.price) / item.price * 100) <= filters.roiRange[1])) &&
      (filters.ethnicGroup == null ||
        (() => {
          if (filters.ethnicGroup === "Chinese") return item.chinese_quota > 0;
          if (filters.ethnicGroup === "Malay") return item.malay_quota > 0;
          if (filters.ethnicGroup === "Indian / Others")
            return item.indian_and_other_races_quota > 0;
          return true;
        })())
    );
  });
};