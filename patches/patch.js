/**
 * Even the simplest shell script fails in Windows, hence this file.
 *
 * The intention here is to only run `patch-package` during local installation, IE. during
 * development of the library and not upon installation by the users of the library.
 */

// Check if the script is running within node_modules
const isInNodeModules = __dirname.includes('node_modules');

// Check if the script is running in a workspace (e.g., pnpm, yarn workspaces)
const isInWorkspace = process.env.PWD && process.env.PWD.includes('node_modules');

// Determine if we should run patch-package
const shouldRunPatchPackage = !isInNodeModules && !isInWorkspace;

if (shouldRunPatchPackage) {
  require('patch-package');
}
