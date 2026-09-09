import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        // Exclude common virtual adapter prefixes if possible
        if (!name.toLowerCase().includes("vethernet") && !name.toLowerCase().includes("vmnet")) {
          addresses.unshift(net.address);
        } else {
          addresses.push(net.address);
        }
      }
    }
  }

  const primaryIp = addresses[0] || "127.0.0.1";

  return NextResponse.json({
    ip: primaryIp,
    allIps: addresses,
  });
}
