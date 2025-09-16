import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";

const CustomSelect = ({
    options,
    value,
    onChange,
    isDarkMode,
    placeholder,
    isMulti = false,
}) => {
    const selectedValues = isMulti ? (Array.isArray(value) ? value : []) : value;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useLayoutEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflowY = "scroll";
        } else {
            document.documentElement.style.overflowY = "";
            document.body.style.paddingRight = "";
        }
        return () => {
            document.documentElement.style.overflowY = "";
            document.body.style.paddingRight = "";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleRemove = (option, event) => {
        event.stopPropagation();
        if (isMulti) {
            const newValues = selectedValues.filter((val) => val.id !== option.id);
            onChange(newValues);
        } else {
            onChange(null);
        }
    };

    return (
        <Listbox
            value={selectedValues}
            onChange={(val) => {
                onChange(val);
                if (!isMulti) setIsOpen(false);
            }}
            multiple={isMulti}
            as="div"
        >
            <div ref={dropdownRef} className="relative w-full">
                <ListboxButton
                    as="div"
                    className={`w-full py-1.5 pl-3 pr-8 text-left rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm
                        ${isDarkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-expanded={isOpen}
                >
                    <div className="flex flex-wrap gap-1">
                        {isMulti ? (
                            selectedValues.length > 0 ? (
                                selectedValues.map((val) => (
                                    <span
                                        key={val.id}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md
                                            ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"}`}
                                    >
                                        {val.name}
                                        <button
                                            onClick={(e) => handleRemove(val, e)}
                                            className={`ml-1 p-0.5 text-xs transition-colors
                                                ${isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-600 hover:text-gray-900"}`}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-sm">{placeholder}</span>
                            )
                        ) : selectedValues ? (
                            <span
                                key={selectedValues.id}
                                className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md
                                    ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"}`}
                            >
                                {selectedValues.name}
                                {/* <button
                                    onClick={(e) => handleRemove(selectedValues, e)}
                                    className={`ml-1 p-0.5 text-xs transition-colors
                                        ${isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-600 hover:text-gray-900"}`}
                                >
                                    ✕
                                </button> */}
                            </span>
                        ) : (
                            <span className="text-gray-400 text-sm">{placeholder}</span>
                        )}
                    </div>

                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                </ListboxButton>

                {isOpen && (
                    <ListboxOptions
                        className={`absolute z-10 w-full mt-1 overflow-auto max-h-60 rounded-md shadow-lg focus:outline-none
                            ${isDarkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
                    >
                        {options.map((option) => (
                            <ListboxOption
                                key={option.id}
                                value={option}
                                className={({ active }) =>
                                    `${active ? (isDarkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-900") : ""}
                                        cursor-default text-xs select-none relative py-1.5 pl-10 pr-4`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{option.name}</span>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <svg
                                                    className="w-4 h-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                )}
            </div>
        </Listbox>
    );
};

export default CustomSelect;