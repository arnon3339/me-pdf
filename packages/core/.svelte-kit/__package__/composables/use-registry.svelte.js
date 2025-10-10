import { getPDFContext } from '../context';
/**
 * Hook to access the PDF registry.
 * @returns The PDF registry or null during initialization
 */
export function useRegistry() {
    const contextValue = getPDFContext();
    // Error if used outside of context
    if (contextValue === undefined) {
        throw new Error('useCapability must be used within a PDFContext.Provider');
    }
    // During initialization, return null instead of throwing an error
    if (contextValue.isInitializing) {
        return contextValue;
    }
    // At this point, initialization is complete but registry is still null, which is unexpected
    if (contextValue.registry === null) {
        throw new Error('PDF registry failed to initialize properly');
    }
    return contextValue;
}
