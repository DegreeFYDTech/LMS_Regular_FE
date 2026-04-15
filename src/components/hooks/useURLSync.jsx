import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const useURLSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlUpdateTimeoutRef = useRef(null);

  const parseFiltersFromURL = () => {
    const urlFilters = {};

    // Parse page and limit with defaults
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (page && !isNaN(parseInt(page, 10))) {
      urlFilters.page = parseInt(page, 10);
    }
    if (limit && !isNaN(parseInt(limit, 10))) {
      urlFilters.limit = parseInt(limit, 10);
    }

    // Parse other filters
    for (const [key, value] of searchParams.entries()) {
      if (value && value.trim() !== '' && key !== 'page' && key !== 'limit') {
        // Handle array parameters (comma-separated values)
        if ([
          'mode', 'source', 'leadStatus', 'leadSubStatus', 'callingStatus', 'subCallingStatus',
          'callingStatusL3', 'subCallingStatusL3', 'utmCampaign', 'utmSource', 'utmMedium',
          'utmKeyword', 'utmCampaignId', 'utmAdgroupId', 'utmCreativeId',
          'preferredCity', 'preferredState', 'preferredStream', 'preferredDegree',
          'preferredLevel', 'preferredSpecialization'
        ].includes(key)) {
          const values = value.split(',').map(v => v.trim()).filter(v => v !== '');
          if (values.length > 0) {
            urlFilters[key] = values;
          }
        } 
        // Handle JSON string parameters
        else if (value.startsWith('{') || value.startsWith('[')) {
          try {
            const parsed = JSON.parse(value);
            if (parsed !== null && parsed !== undefined) {
              urlFilters[key] = parsed;
            }
          } catch (e) {
            console.warn(`Failed to parse JSON for key ${key}:`, value);
            urlFilters[key] = value;
          }
        } 
        // Handle regular string/number parameters
        else {
          urlFilters[key] = value;
        }
      }
    }
    return urlFilters;
  };

  const convertFiltersToURLParams = useCallback((filtersToConvert) => {
    const params = new URLSearchParams();

    // Always include page and limit (with defaults)
    const page = filtersToConvert.page || 1;
    const limit = filtersToConvert.limit || 10;
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    // Handle other filters
    Object.entries(filtersToConvert).forEach(([key, value]) => {
      // Skip page and limit as they're already handled
      if (key === 'page' || key === 'limit') return;
      
      // Skip empty/null/undefined values
      if (value === undefined || value === null || value === '') return;

      // Handle arrays
      if (Array.isArray(value)) {
        const cleanValues = value.filter(item => 
          item !== null && item !== undefined && item !== ''
        );
        if (cleanValues.length > 0) {
          // Check if this is an array of objects (like advancedFilters)
          const isArrayOfObjects = cleanValues.some(item => typeof item === 'object');
          
          if (isArrayOfObjects) {
            params.set(key, JSON.stringify(cleanValues));
          } else {
            params.set(key, cleanValues.join(','));
          }
        }
      } 
      // Handle objects (convert to JSON string)
      else if (typeof value === 'object') {
        try {
          const jsonString = JSON.stringify(value);
          if (jsonString !== '{}' && jsonString !== '[]' && jsonString !== 'null') {
            params.set(key, jsonString);
          }
        } catch (e) {
          console.warn(`Failed to stringify object for key ${key}:`, value);
        }
      }
      // Handle strings and numbers
      else if (typeof value === 'string' && value.trim() !== '') {
        params.set(key, value.trim());
      } else if (typeof value === 'number') {
        params.set(key, value.toString());
      }
    });

    return params;
  }, []);

  const updateURL = useCallback((newFilters, immediate = false) => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    const updateFn = () => {
      const params = convertFiltersToURLParams(newFilters);
      setSearchParams(params, { replace: true });
    };

    if (immediate) {
      updateFn();
    } else {
      urlUpdateTimeoutRef.current = setTimeout(updateFn, 300);
    }
  }, [convertFiltersToURLParams, setSearchParams]);

  return {
    searchParams,
    parseFiltersFromURL,
    updateURL
  };
};

export default useURLSync;