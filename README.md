# STNW - (Simple Typescript Nmap Wrapper)
## Description
A simple typescript nmap wrapper to perform basic nmap operations

## Example usage
```typescript
import NmapScanner from "nmap";

// Example usage:
const scanner = new NmapScanner("example.com");

scanner
  .quickScan()
  .then((result) => console.log("Quick Scan Result:\n", result));
scanner
  .scanPort(80)
  .then((result) => console.log("Port Scan Result:\n", result));
scanner.isHostUp().then((result) => console.log("Host Up Result:\n", result));
scanner.getOs().then((result) => console.log("OS Detection Result:\n", result));
scanner
  .scanServices()
  .then((result) => console.log("Service Scan Result:\n", result));
```
