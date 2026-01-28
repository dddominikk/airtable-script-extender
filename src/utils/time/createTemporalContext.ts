/**
 * Creates a comprehensive temporal context object from a Date instance
 * @param {Date|ReturnType<DateConstructor['now']>} fromDate - The date to analyze
 */

export function createTemporalContext(fromDate) {

    const date = fromDate instanceof Date
        ? fromDate
        : new Date(fromDate);

    if (date.toString().toLowerCase().includes('invalid date'))
        throw new Error('Invalid date provided');

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();

    const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

    const getWeekNumber = (date) => {
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - target) / 604800000);
    };

    const getWeekOfMonth = (date) => {
        const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstDayOfWeek = firstOfMonth.getDay();
        return Math.ceil((date.getDate() + firstDayOfWeek) / 7);
    };

    const getDayOfYear = (date) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    const getSeason = (month, day, isNorthern = true) => {
        let season;

        if (month === 12 && day >= 21 || month <= 2 || (month === 3 && day < 20)) {
            season = 'winter';
        } else if (month >= 3 && month <= 5) {
            if (month === 3 && day < 20) season = 'winter';
            else if (month === 6 && day >= 21) season = 'summer';
            else season = 'spring';
        } else if (month >= 6 && month <= 8) {
            if (month === 6 && day < 21) season = 'spring';
            else if (month === 9 && day >= 22) season = 'autumn';
            else season = 'summer';
        } else {
            if (month === 9 && day < 22) season = 'summer';
            else if (month === 12 && day >= 21) season = 'winter';
            else season = 'autumn';
        }

        if (!isNorthern) {
            const seasonMap = {
                'spring': 'autumn',
                'summer': 'winter',
                'autumn': 'spring',
                'winter': 'summer'
            };
            season = seasonMap[season];
        }

        return season;
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const centuryNumber = Math.ceil(year / 100);
    const centuryStart = (centuryNumber - 1) * 100 + 1;
    const centuryEnd = centuryNumber * 100;
    const yearInCentury = year - centuryStart + 1;

    const halfCentury = yearInCentury <= 50 ? 'first' : 'second';
    const quarterCentury = Math.ceil(yearInCentury / 25);

    const decadeStart = Math.floor(year / 10) * 10;
    const yearInDecade = year % 10;
    const halfDecade = yearInDecade < 5 ? 'first' : 'second';

    let thirdDecade;
    if (yearInDecade <= 2) thirdDecade = 'early';
    else if (yearInDecade <= 6) thirdDecade = 'mid';
    else thirdDecade = 'late';

    const halfYear = month <= 6 ? 'first' : 'second';
    const quarterYear = Math.ceil(month / 3);

    let thirdYear;
    if (month <= 4) thirdYear = 'early';
    else if (month <= 8) thirdYear = 'mid';
    else thirdYear = 'late';

    const northernHemisphere = getSeason(month, dayOfMonth, true);
    const southernHemisphere = getSeason(month, dayOfMonth, false);

    const daysInCurrentMonth = getDaysInMonth(year, month);
    const halfMonth = dayOfMonth <= 15 ? 'first' : 'second';

    let thirdMonth;
    if (dayOfMonth <= 9) thirdMonth = 'early';
    else if (dayOfMonth <= 19) thirdMonth = 'mid';
    else thirdMonth = 'late';

    const weekOfYear = getWeekNumber(date);
    const weekOfMonth = getWeekOfMonth(date);
    const dayOfYear = getDayOfYear(date);
    const unixTimestamp = Math.floor(date.getTime() / 1000);
    const isoTimestamp = date.toISOString();

    const context = {
        date: new Date(date),
        timestamp: {
            unix: unixTimestamp,
            iso: isoTimestamp
        },

        century: {
            number: centuryNumber,
            ordinal: centuryNumber === 1 ? '1st' : centuryNumber === 2 ? '2nd' : centuryNumber === 3 ? '3rd' : `${centuryNumber}th`,
            yearRange: `${centuryStart}-${centuryEnd}`,
            half: {
                number: halfCentury === 'first' ? 1 : 2,
                position: halfCentury,
                yearRange: halfCentury === 'first' ? `${centuryStart}-${centuryStart + 49}` : `${centuryStart + 50}-${centuryEnd}`
            },
            quarter: {
                number: quarterCentury,
                position: quarterCentury === 1 ? 'first' : quarterCentury === 2 ? 'second' : quarterCentury === 3 ? 'third' : 'fourth',
                yearRange: quarterCentury === 1 ? `${centuryStart}-${centuryStart + 24}` :
                    quarterCentury === 2 ? `${centuryStart + 25}-${centuryStart + 49}` :
                        quarterCentury === 3 ? `${centuryStart + 50}-${centuryStart + 74}` :
                            `${centuryStart + 75}-${centuryEnd}`
            }
        },

        decade: {
            label: `${decadeStart}s`,
            yearRange: `${decadeStart}-${decadeStart + 9}`,
            half: {
                number: halfDecade === 'first' ? 1 : 2,
                position: halfDecade,
                yearRange: halfDecade === 'first' ? `${decadeStart}-${decadeStart + 4}` : `${decadeStart + 5}-${decadeStart + 9}`
            },
            third: {
                number: thirdDecade === 'early' ? 1 : thirdDecade === 'mid' ? 2 : 3,
                position: thirdDecade,
                yearRange: thirdDecade === 'early' ? `${decadeStart}-${decadeStart + 2}` :
                    thirdDecade === 'mid' ? `${decadeStart + 3}-${decadeStart + 6}` :
                        `${decadeStart + 7}-${decadeStart + 9}`
            }
        },

        year: {
            number: year,
            half: {
                number: halfYear === 'first' ? 1 : 2,
                position: halfYear,
                months: halfYear === 'first' ? 'Jan-Jun' : 'Jul-Dec'
            },
            quarter: {
                number: quarterYear,
                label: `Q${quarterYear}`,
                months: quarterYear === 1 ? 'Jan-Mar' : quarterYear === 2 ? 'Apr-Jun' : quarterYear === 3 ? 'Jul-Sep' : 'Oct-Dec'
            },
            third: {
                number: thirdYear === 'early' ? 1 : thirdYear === 'mid' ? 2 : 3,
                position: thirdYear,
                months: thirdYear === 'early' ? 'Jan-Apr' : thirdYear === 'mid' ? 'May-Aug' : 'Sep-Dec'
            }
        },

        season: {
            northernHemisphere,
            southernHemisphere
        },

        month: {
            number: month,
            name: monthNames[month - 1],
            daysInMonth: daysInCurrentMonth,
            half: {
                number: halfMonth === 'first' ? 1 : 2,
                position: halfMonth,
                dayRange: halfMonth === 'first' ? '1-15' : `16-${daysInCurrentMonth}`
            },
            third: {
                number: thirdMonth === 'early' ? 1 : thirdMonth === 'mid' ? 2 : 3,
                position: thirdMonth,
                dayRange: thirdMonth === 'early' ? '1-9' :
                    thirdMonth === 'mid' ? '10-19' :
                        `20-${daysInCurrentMonth}`
            }
        },

        week: {
            ofYear: weekOfYear,
            ofMonth: weekOfMonth,
            label: `Week ${weekOfYear}`
        },

        day: {
            ofWeek: {
                number: dayOfWeek,
                name: dayNames[dayOfWeek]
            },
            ofMonth: dayOfMonth,
            ofYear: dayOfYear
        }
    };

    return context;
};
