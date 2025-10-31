import { NextResponse } from 'next/server';
import { createNetwork, getDefaultNetworkConfig } from '@/src/lib/network-pipeline';
import { NetworkConfig } from '@/src/schemas/network';
import networksData from '@/src/api/dummy/networks.json';

/**
 * GET /api/network
 * Get network presets or generate a new network
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const preset = searchParams.get('preset');
  const action = searchParams.get('action');

  // Return list of presets
  if (action === 'list') {
    return NextResponse.json({
      presets: Object.keys(networksData).map(key => ({
        key,
        ...networksData[key as keyof typeof networksData]
      }))
    });
  }

  // Generate network from preset
  if (preset && preset in networksData) {
    const presetData = networksData[preset as keyof typeof networksData];
    const network = createNetwork(presetData.config as Partial<NetworkConfig>);
    return NextResponse.json({ network });
  }

  // Generate default network
  const network = createNetwork();
  return NextResponse.json({ network });
}

/**
 * POST /api/network
 * Generate a network with custom configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config: Partial<NetworkConfig> = body.config || {};
    
    const network = createNetwork(config);
    
    return NextResponse.json({ network });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate network' },
      { status: 500 }
    );
  }
}

