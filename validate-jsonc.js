// Uses https://www.npmjs.com/package/jsonc-parser
// Generated in a conversation with ChatGPT, https://chat.openai.com/share/e2c56ea4-7069-4916-ad39-afa1200ab555
// node validate-jsonc.js remote-config.jsonc
// It does not seem to capture flagrant json errors
// but does catch schema violations, so that's a step forward
const fs = require('fs');
const jsoncParser = require('jsonc-parser');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true }); // Enabling detailed errors for more informative validation messages

function parseJsoncFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return jsoncParser.parse(fileContent);
    } catch (error) {
        console.error(`Error parsing JSONC file (${filePath}):`, error.message);
        process.exit(1);
    }
}

function validateJson(data, schema, filePath) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
        console.error(`Validation errors in file (${filePath}):`, validate.errors);
        return false;
    }
    return true;
}

function validateJsoncFile(filePath, schema) {
    const jsonData = parseJsoncFile(filePath);
    const isValid = validateJson(jsonData, schema, filePath);
    if (isValid) {
        console.log(`JSONC file (${filePath}) is valid.`);
    } else {
        console.error(`JSONC file (${filePath}) is invalid.`);
    }
}

if (process.argv.length < 3) {
    console.log('Usage: node validateJsonc.js <path/to/your/file.jsonc>');
    process.exit(1);
}

const filePath = process.argv[2]; // Taking the filename from the command line argument

// Define the schema based on the structure provided earlier
const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "update-interval": {
            "type": "number",
            "description": "Update interval of the remote config in hours."
        },
        "messages": {
            "type": "object",
            "properties": {
                "notifications": {
                    "type": "object",
                    "properties": {
                        "interval": {
                            "type": "number",
                            "description": "Interval for showing notifications."
                        },
                        "infos": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "message": {
                                        "type": "string",
                                        "description": "Information message to be displayed."
                                    }
                                },
                                "required": ["message"]
                            },
                            "description": "Array of info messages."
                        }
                    },
                    "required": ["interval",]
                }
            },
            "description": "Messages shown to the user."
        }
    },
    "required": ["update-interval", "messages"]
};

validateJsoncFile(filePath, schema);
