import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return clerkClient().handleRequest(request);
}

export async function POST(request: NextRequest) {
  return clerkClient().handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return clerkClient().handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return clerkClient().handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return clerkClient().handleRequest(request);
}

