export const formatPrice = (num) => {
    if (num >= 1000 && num < 1000000) {
        return Math.floor(num / 1000) + "k"; // No decimals for thousands
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + "M"; // One decimal for millions
    }
    return num?.toLocaleString ? num.toLocaleString() : num?.toString();
};

export const formatCurrency = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    // Round to nearest dollar and format without decimals
    return `$${Math.round(num).toLocaleString()}`;
};

export const formatCurrencyShort = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    const rounded = Math.round(num);
    if (rounded >= 1000 && rounded < 1000000) {
        return `$${(rounded / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    } else if (rounded >= 1000000) {
        return `$${(rounded / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    return `$${rounded.toLocaleString()}`;
};

export const sortSBFCodesChronologically = (codes) => {
    return codes.sort((a, b) => {
        const [monthA, yearA] = [a.slice(0, 3), parseInt(a.slice(3), 10)];
        const [monthB, yearB] = [b.slice(0, 3), parseInt(b.slice(3), 10)];
        return yearB !== yearA ? yearB - yearA : getMonthNumber(monthB) - getMonthNumber(monthA);
    });
};

const getMonthNumber = (month) => {
    const months = {
        Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
        Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
    };
    return months[month] || 0;
};