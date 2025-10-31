'use client';

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { Network } from '../schemas/network';
import { Node } from '../schemas/node';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface NetworkVisualizerProps {
  network: Network;
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
  highlightedNodes?: Set<string>;
  highlightedEdges?: Array<{ source: string; target: string }>;
  colorByIdentity?: boolean;
}

interface GraphData {
  nodes: Array<NodeObject & Node>;
  links: Array<LinkObject & { source: string; target: string; trust_weight: number }>;
}

const STATE_COLORS = {
  susceptible: '#9CA3AF',
  exposed: '#FBBF24',
  infected: '#EF4444',
  resistant: '#10B981',
};

const IDENTITY_COLORS = {
  urban_professional: '#3B82F6', // Blue
  university_student: '#8B5CF6', // Purple
  rural_traditional: '#F59E0B', // Amber
  suburban_family: '#10B981', // Green
  tech_worker: '#EC4899', // Pink
};

export default function NetworkVisualizer({
  network,
  onNodeClick,
  onNodeHover,
  highlightedNodes = new Set(),
  highlightedEdges = [],
  colorByIdentity = false,
}: NetworkVisualizerProps) {
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        const container = document.getElementById('graph-container');
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      }
    };

    updateDimensions();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  // Prepare graph data - memoize to prevent recreation on every render
  const graphData: GraphData = useMemo(() => ({
    nodes: network.nodes.map(node => ({ ...node })),
    links: network.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      trust_weight: edge.trust_weight,
    })),
  }), [network]);

  // Node rendering - memoized to prevent unnecessary recalculations
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as Node;
      const label = n.id;
      const fontSize = 12 / globalScale;
      const nodeSize = 5 + (n.attributes.social_activity * 5);
      
      // Node color based on mode
      const color = colorByIdentity 
        ? IDENTITY_COLORS[n.identity_class]
        : STATE_COLORS[n.state];
      
      // Highlight if selected
      const isHighlighted = highlightedNodes.has(n.id);
      
      // Draw node
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Border for highlighted nodes
      if (isHighlighted) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }
      
      // Draw label on hover
      if (hoveredNode?.id === n.id) {
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText(label, node.x!, node.y! + nodeSize + 10);
      }
    },
    [highlightedNodes, hoveredNode, colorByIdentity]
  );

  // Link rendering
  const linkCanvasObject = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const l = link as any;
      const start = link.source as NodeObject;
      const end = link.target as NodeObject;

      if (!start.x || !start.y || !end.x || !end.y) return;

      const isHighlighted = highlightedEdges.some(
        e => 
          (e.source === start.id && e.target === end.id) ||
          (e.source === end.id && e.target === start.id)
      );

      // Line thickness based on trust weight
      const thickness = (1 + (l.trust_weight * 3)) / globalScale;
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = isHighlighted ? '#FF6B35' : 'rgba(156, 163, 175, 0.3)';
      ctx.lineWidth = thickness;
      ctx.stroke();
    },
    [highlightedEdges]
  );

  const handleNodeClick = useCallback(
    (node: NodeObject) => {
      const n = node as Node;
      if (onNodeClick) {
        onNodeClick(n);
      }
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback((node: NodeObject | null) => {
    const n = node as Node | null;
    setHoveredNode(n);
    if (onNodeHover) {
      onNodeHover(n);
    }
  }, [onNodeHover]);

  return (
    <div className="relative w-full h-full bg-white rounded-lg border">
      <div id="graph-container" className="w-full h-full">
        <ForceGraph2D
          key={network.metadata.created_at}
          ref={graphRef as any}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeRelSize={6}
          linkDirectionalParticles={0}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          warmupTicks={100}
          cooldownTime={15000}
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400, 50);
            }
          }}
        />
      </div>

      {/* Legend - now fixed in corner */}
      <div className="absolute bottom-4 left-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">
              {colorByIdentity ? 'Identity Classes' : 'Node States'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {colorByIdentity ? (
              Object.entries(IDENTITY_COLORS).map(([identity, color]) => (
                <div key={identity} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{identity.replace('_', ' ')}</span>
                </div>
              ))
            ) : (
              Object.entries(STATE_COLORS).map(([state, color]) => (
                <div key={state} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{state}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Separate component for node info display
export function NodeInfoPanel({ node }: { node: Node | null }) {
  if (!node) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Node Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Hover over a node to see details
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Node: {node.id}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-semibold">State:</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATE_COLORS[node.state] }}
              />
              <span className="capitalize">{node.state}</span>
            </div>
          </div>
          <div>
            <span className="font-semibold">Identity:</span>
            <div className="mt-1 text-xs">{node.identity_class.replace('_', ' ')}</div>
          </div>
        </div>
        
        <div className="border-t pt-2">
          <div className="font-semibold mb-2">Attributes</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Political Leaning:</span>
              <span className="font-mono">{node.attributes.political_leaning.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Critical Thinking:</span>
              <span className="font-mono">{node.attributes.critical_thinking.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Emotional:</span>
              <span className="font-mono">{node.attributes.emotional_susceptibility.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Education:</span>
              <span className="font-mono">{node.attributes.education_level.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Social Activity:</span>
              <span className="font-mono">{node.attributes.social_activity.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold">Connections:</span>
            <span>{Object.keys(node.trust_network).length}</span>
          </div>
          {node.current_beliefs.length > 0 && (
            <div className="flex justify-between text-xs mt-1">
              <span className="font-semibold">Beliefs:</span>
              <span>{node.current_beliefs.length}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

