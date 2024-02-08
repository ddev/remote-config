const fs = require('fs');
const jsoncParser = require('jsonc-parser');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true }); // Enabling detailed errors

function parseJsoncFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return jsoncParser.parse(fileContent);
    } catch (error) {
        console.error(`Error parsing JSONC file ${filePath}:`, error.message);
        process.exit(1);
    }
}

function validateJson(data, schema) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
        console.error('Validation errors:', validate.errors);
        return false;
    }
    return true;
}

function validateJsoncFile(filePath, schema) {
    const jsonData = parseJsoncFile(filePath);
    const isValid = validateJson(jsonData, schema);
    if (isValid) {
        console.log('JSONC file is valid.');
    } else {
        console.error('JSONC file is invalid.');
    }
}

if (process.argv.length < 3) {
    console.log('Usage: node validateJsonc.js <path/to/your/file.jsonc>');
    process.exit(1);
}

const filePath = process.argv[2];
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
                "required": ["interval", "infos"]
            }
        },
        "description": "Messages shown to the user."
    }
},
    "required": ["update-interval", "messages"]


};

validateJsoncFile(filePath, schema);
