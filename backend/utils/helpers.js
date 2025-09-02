const handlebars = require('handlebars');

// Register Handlebars helpers
handlebars.registerHelper('romanNumeral', function (number) {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[number] || (number + 1).toString();
});

handlebars.registerHelper('repeat', function (n, options) {
    let result = '';
    for (let i = 0; i < n; i++) {
        result += options.fn(this);
    }
    return result;
});

handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

handlebars.registerHelper('formatDate', function (date) {
    return new Date(date).toLocaleDateString('en-GB');
});

handlebars.registerHelper('formatTime', function (timeObj) {
    if (typeof timeObj === 'object' && timeObj.start && timeObj.end) {
        return `${timeObj.start} - ${timeObj.end}`;
    }
    return timeObj;
});

module.exports = handlebars;