/** 
 * Simple error handler for the library. Errors are printed to the console. 
 * This should not be used as a logging solution but just a common handler
 * method that can be improved later e.g. report the error back to a developer.
 */

export interface ErrorMessage {
    /** The error message. */
    message: string
    /** Context for the error, typically some type of module/function identifier. */
    context: string
    /** Error object if an exeption is available. */
    error?: Error
    /** Data potentially relevant to some error handlers. */
    data?: any
}

export interface ErrorHandler {
    report: (e: ErrorMessage) => void
}

/** Simple error handler that just prints out to the console. */
export class ConsoleErrorHandler implements ErrorHandler {
    
    public report(e: ErrorMessage): void {
        console.log(`Error: ${e.context}: ${e.message}`, e.error, e.data)
    }
    
}


