export function parseTemplateLiteralVariableNames(templateLiteral: string) {
    const tlVarPattern = new RegExp(`\\$\{(?<varKey>[^}]+)\}`, 'g');
    const uniqueVarNames = [...new Set(test?.match(tlVarPattern).map(x => tlVarPattern.exec(x)?.groups?.varKey))].filter(Boolean);
    return uniqueVarNames;
};
