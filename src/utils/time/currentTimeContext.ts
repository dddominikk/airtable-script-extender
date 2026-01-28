export function currentTimeContext() {

    const D = new Date;

    const result = {
        D,
        fullYear: D.getFullYear(),
        utcFullYear: D.getUTCFullYear(),
        month: D.getMonth(),
        utcString: D.toUTCString(),
        utcMonth: D.getUTCMonth(),
        monthName: D.toLocaleString('friendly', { month: 'long' }),
        hours: D.getHours(),
        utcHours: D.getUTCHours(),
        minutes: D.getMinutes(),
        utcMinutes: D.getUTCMinutes(),
        utcDate: D.getUTCDate(),
        json: D.toJSON(),
        dateString: D.toDateString()
    };

    const _ = result;
    
    return result;

};
