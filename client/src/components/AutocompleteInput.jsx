import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function AutocompleteInput({ value, name, onChange, onSelect, endpoint, placeholder, required, className, isTextarea = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchTerm) => {
    if (!endpoint) return;
    try {
      const { data } = await api.get(`/api/history/${endpoint}?q=${encodeURIComponent(searchTerm)}`);
      setSuggestions(data);
      setShowDropdown(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFocus = () => fetchSuggestions(value || '');

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(e); // Synthetic event with name and value
    fetchSuggestions(val);
  };

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    } else {
      const val = typeof item === 'string' ? item : (item.partyName || item.description || item.value || '');
      onChange({ target: { name, value: val } });
    }
    setShowDropdown(false);
  };

  const defaultClasses = "w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm";
  const finalClass = className || defaultClasses;

  return (
    <div ref={wrapperRef} className="relative w-full">
      {isTextarea ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={finalClass}
          rows="2"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={finalClass}
          autoComplete="off"
        />
      )}
      
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg mt-1 rounded-md max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => {
            const displayVal = typeof item === 'string' ? item : (item.partyName || item.description || item.value || JSON.stringify(item));
            return (
              <li 
                key={idx} 
                className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b last:border-0"
                onClick={() => handleSelect(item)}
              >
                {displayVal}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
