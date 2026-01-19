function parseAllTemplateLiteralVariableNames(templateLiteral: string) {
    
    const tlVarPattern = new RegExp(`\\$\{\\s*(?<varKey>[^}]+)\\s*\}`);
    
    const allMatches = templateLiteral?.match(new RegExp(tlVarPattern, 'g'));
    
    const allVarNames = allMatches?.map(x => tlVarPattern.exec(x)?.groups?.varKey).filter(Boolean);
    
    const uniqueVarNames = [...new Set(allVarNames)];
    
    return uniqueVarNames;
};
