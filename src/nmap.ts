import { spawn } from "child_process";

export interface QuickScanResult {
  otherAddresses: string[];
  isUp: boolean;
  latency: number;
}

export interface PortScanResult {
  openPorts: { port: number; state: string; service: string }[];
}

export interface HostUpResult {
  isUp: boolean;
  latency: number;
}

export interface OsDetectionResult {
  deviceType: string;
  osCPE: string;
  guesses: string[];
}

export interface ServiceScanResult {
  services: { port: number; state: string; service: string; version: string }[];
}

export default class NmapScanner {
  private host: string;

  constructor(host: string) {
    this.host = host;
  }

  async quickScan(): Promise<QuickScanResult> {
    const args = ["-Pn", this.host];
    const result = await this.executeCommand(args);

    const otherAddressesRegex = /Other addresses for .*?: ([^\n]+)/;
    const otherAddressesMatch = result.match(otherAddressesRegex);
    const otherAddresses = otherAddressesMatch
      ? otherAddressesMatch[1].split(", ")
      : [];

    const isUpRegex = /Host is up \(([\d.]+s) latency\)/;
    const isUpMatch = result.match(isUpRegex);
    const latency = isUpMatch ? parseFloat(isUpMatch[1]) : 0;

    return {
      otherAddresses,
      isUp: otherAddresses.length > 0,
      latency,
    };
  }

  async scanPort(port: number): Promise<PortScanResult> {
    const args = ["-p", port.toString(), this.host];
    const result = await this.executeCommand(args);

    const openPortsRegex = /(\d+)\/(\w+)\s+(\w+)\s+(\w+)/g;
    const openPorts: { port: number; state: string; service: string }[] = [];
    let match;
    while ((match = openPortsRegex.exec(result)) !== null) {
      openPorts.push({
        port: parseInt(match[1]),
        state: match[2],
        service: match[3],
      });
    }

    return {
      openPorts,
    };
  }

  async isHostUp(): Promise<HostUpResult> {
    const args = ["-sP", this.host];
    const result = await this.executeCommand(args);

    const isUpRegex = /Host is up \(([\d.]+s) latency\)/;
    const isUpMatch = result.match(isUpRegex);
    const latency = isUpMatch ? parseFloat(isUpMatch[1]) : 0;

    return {
      isUp: latency > 0,
      latency,
    };
  }

  async getOs(): Promise<OsDetectionResult> {
    const args = ["-O", this.host];
    const result = await this.executeCommand(args);

    const deviceTypeRegex = /Device type: (\w+)/;
    const osCpeRegex = /OS CPE: (\S+)/;
    const guessesRegex = /Aggressive OS guesses: (.+)/;

    const deviceTypeMatch = result.match(deviceTypeRegex);
    const osCpeMatch = result.match(osCpeRegex);
    const guessesMatch = result.match(guessesRegex);

    return {
      deviceType: deviceTypeMatch ? deviceTypeMatch[1] : "",
      osCPE: osCpeMatch ? osCpeMatch[1] : "",
      guesses: guessesMatch ? guessesMatch[1].split(", ") : [],
    };
  }

  async scanServices(): Promise<ServiceScanResult> {
    const args = ["-sV", this.host];
    const result = await this.executeCommand(args);

    const servicesRegex = /(\d+)\/(\w+)\s+(\w+)\s+(\w+\/\d+)/g;
    const services: {
      port: number;
      state: string;
      service: string;
      version: string;
    }[] = [];
    let match;
    while ((match = servicesRegex.exec(result)) !== null) {
      services.push({
        port: parseInt(match[1]),
        state: match[2],
        service: match[3],
        version: match[4],
      });
    }

    return {
      services,
    };
  }

  private executeCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const nmapProcess = spawn("nmap", ["--privileged", ...args]);

      let result = "";

      nmapProcess.stdout.on("data", (data) => {
        result += data;
      });

      nmapProcess.on("close", (code) => {
        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Nmap process exited with code ${code}`));
        }
      });

      nmapProcess.on("error", (error) => {
        reject(error);
      });
    });
  }
}
