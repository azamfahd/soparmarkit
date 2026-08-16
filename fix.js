const fs = require('fs');
let code = fs.readFileSync('src/services/ai/nlu/entityExtractor.ts', 'utf8');

const anchor = '    // E.g. "الزبون محمد", "العميل فهد عل[ىي]"\n';

// wait, the line with "الزبون محمد" is actually gone or something?
