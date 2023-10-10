// Uses https://www.npmjs.com/package/jsonc-parser
// Generated in a conversation with ChatGPT, https://chat.openai.com/share/9ed4dc4d-2442-4693-9f32-131a5f12ab9a
// node validate-jsonc.js remote-config.jsonc
const fs = require('fs');
const { parseTree, ParseErrorCode } = require('jsonc-parser');

const getLineAndCharacter = (content, offset) => {
    const beforeError = content.slice(0, offset);
    const line = beforeError.split('\n').length;
    const character = beforeError.split('\n').pop().length + 1;
    return { line, character };
};

const filePath = process.argv[2];
const fileContent = fs.readFileSync(filePath, 'utf-8');

const errorMessages = {
    [ParseErrorCode.CloseBraceExpected]: "Expected close brace }",
    [ParseErrorCode.CloseBracketExpected]: "Expected close bracket ]",
    [ParseErrorCode.ColonExpected]: "Expected colon :",
    [ParseErrorCode.CommaExpected]: "Expected comma ,",
    [ParseErrorCode.EndOfFileExpected]: "Expected end of file",
    [ParseErrorCode.InvalidCharacter]: "Invalid character",
    [ParseErrorCode.InvalidCommentToken]: "Invalid comment token",
    [ParseErrorCode.InvalidNumberFormat]: "Invalid number format",
    [ParseErrorCode.InvalidSymbol]: "Invalid symbol",
    [ParseErrorCode.OpenBraceExpected]: "Expected open brace {",
    [ParseErrorCode.OpenBracketExpected]: "Expected open bracket [",
    [ParseErrorCode.PropertyNameExpected]: "Expected property name",
    [ParseErrorCode.ValueExpected]: "Expected value",
};

try {
    const errors = [];
    parseTree(fileContent, errors);

    if (errors.length > 0) {
        console.error(`Error in ${filePath}:`);
        errors.forEach(error => {
            const { line, character } = getLineAndCharacter(fileContent, error.offset);
            const message = errorMessages[error.error] || "Unknown error";
            console.error(`- ${message} at offset ${error.offset} (line: ${line}, character: ${character})`);
        });
        process.exit(1);
    } else {
        console.log(`${filePath} is valid JSONC.`);
    }
} catch (error) {
    console.error(`Unexpected error in ${filePath}: ${error.message}`);
    process.exit(1);
}
