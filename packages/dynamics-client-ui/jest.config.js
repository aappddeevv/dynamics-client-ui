/** 
 * Place your tests along side the code e.g. module1.ts could have
 * tests in tests/module1.test.ts *or* module1.spec.ts. Tests can
 * also be placed into <dir of module1.ts>/__tests__/module1.ts.
 */

module.exports = {
    "transform": {
        "^.+\\.tsx?$": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json"
    ],
    "globals": {
        "ts-jest": {
            "useBabelrc": true
        }
    },
    // 2 places to look, under src and src/tests (general tests)
    "roots": ["<rootDir>/src"],
    "setupTestFrameworkScriptFile": "<rootDir>/setupTestFramework.js",
    "moduleNameMapper": {
        "^BuildSettings$": "<rootDir>/configs/dev.config.ts"
    }
}
