const fs = require('fs');
let code = fs.readFileSync('src/services/ai/nlu/entityExtractor.ts', 'utf-8');

const regex1 = "    // \"باقي عل[ىي] محمد توفيق كم\"\\n    /\\(?:باقي عل\\[ىي\\]|كم باقي عل\\[ىي\\]\\)\\s+\\(\\[أ-يأإآءئؤ\\]\\{2,\\}\\(?:\\s+\\[أ-يأإآءئؤ\\]\\{2,\\}\\)\\{0,2\\}\\)\\s+كم/i,\\n";

code = code.replace(regex1, '');

const regex2 = "    // E.g. \"معلومات العميل احمد\", \"كم عند الزبون محمد\"";

code = code.replace(regex2, regex1 + regex2);

fs.writeFileSync('src/services/ai/nlu/entityExtractor.ts', code);
