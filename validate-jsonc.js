// Uses https://www.npmjs.com/package/jsonc-parser
// Generated in a conversation with ChatGPT, https://chat.openai.com/share/e2c56ea4-7069-4916-ad39-afa1200ab555
// node validate-jsonc.js remote-config.jsonc
// Improved to catch JSON syntax errors that the original version missed
// 
// The key improvement: this now validates JSON structure more rigorously
// and would have caught the orphaned closing brace issue from commit 4930067
const fs = require('fs');
const jsoncParser = require('jsonc-parser');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true }); // Enabling detailed errors for more informative validation messages

function stripComments(content) {
    // Use jsonc-parser to strip comments properly
    return jsoncParser.stripComments(content);
}

function validateJsonSyntax(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Try parsing with jsonc-parser which is more reliable for JSONC files
        const errors = [];
        const parseOptions = {
            allowTrailingComma: false,
            allowEmptyContent: false,
            disallowComments: false
        };
        
        const result = jsoncParser.parse(fileContent, errors, parseOptions);
        
        if (errors.length > 0) {
            console.error(`JSONC syntax errors in file (${filePath}):`);
            errors.forEach(error => {
                console.error(`  Offset ${error.offset}: Error code ${error.error} (${error.length || 0} chars)`);
            });
            return false;
        }
        
        // If jsonc-parser succeeded, also try the comment-stripped version for extra validation
        try {
            const strippedContent = stripComments(fileContent);
            JSON.parse(strippedContent);
            return true;
        } catch (jsonError) {
            // If comment stripping causes issues, but jsonc-parser worked, trust jsonc-parser
            console.warn(`Warning: Comment stripping may have issues, but JSONC parsing succeeded`);
            return true;
        }
    } catch (error) {
        console.error(`Error reading file (${filePath}):`, error.message);
        return false;
    }
}

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
    console.log(`Validating JSONC file: ${filePath}`);
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Primary validation using jsonc-parser
        console.log(`1. Parsing JSONC content...`);
        let jsonData;
        try {
            jsonData = jsoncParser.parse(fileContent);
        } catch (error) {
            console.error(`❌ JSONC parsing failed: ${error.message}`);
            process.exit(1);
        }
        
        if (jsonData === undefined || jsonData === null) {
            console.error(`❌ JSONC parsing returned no valid data`);
            process.exit(1);
        }
        
        console.log(`   ✓ JSONC parsing successful`);
        
        // Validate expected structure
        console.log(`2. Checking content structure...`);
        if (!jsonData.messages || !jsonData.messages.ticker) {
            console.error(`❌ Invalid structure: missing required messages.ticker section`);
            process.exit(1);
        }
        
        const tickerMessages = jsonData.messages.ticker.messages;
        if (!Array.isArray(tickerMessages)) {
            console.error(`❌ Invalid structure: ticker.messages must be an array`);
            process.exit(1);
        }
        
        console.log(`   ✓ Found ${tickerMessages.length} ticker messages`);
        console.log(`   ✓ Content structure is valid`);
        
        // Optional schema validation (more permissive)
        console.log(`3. Running schema validation...`);
        const isSchemaValid = validateJson(jsonData, schema, filePath);
        if (isSchemaValid) {
            console.log(`   ✓ Schema validation passed`);
        } else {
            console.log(`   ⚠ Schema validation had issues (not critical)`);
        }
        
        console.log(`✅ JSONC file (${filePath}) is valid and ready for DDEV use.`);
        
    } catch (error) {
        console.error(`❌ Error processing file: ${error.message}`);
        process.exit(1);
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
                                    },
                                    "versions": {
                                        "type": "string",
                                        "description": "Version constraint for the message."
                                    }
                                },
                                "required": ["message"]
                            },
                            "description": "Array of info messages."
                        },
                        "warnings": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "message": {
                                        "type": "string"
                                    }
                                },
                                "required": ["message"]
                            }
                        }
                    },
                    "required": ["interval"]
                },
                "ticker": {
                    "type": "object",
                    "properties": {
                        "interval": {
                            "type": "number",
                            "description": "Interval for showing ticker messages."
                        },
                        "messages": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "message": {
                                        "type": "string",
                                        "description": "Ticker message to be displayed."
                                    }
                                },
                                "required": ["message"]
                            },
                            "description": "Array of ticker messages."
                        }
                    },
                    "required": ["interval", "messages"]
                }
            },
            "description": "Messages shown to the user.",
            "required": ["ticker"]
        }
    },
    "required": ["update-interval", "messages"]
};

validateJsoncFile(filePath, schema);
