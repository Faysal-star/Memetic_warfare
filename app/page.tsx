'use client';

import { useState, useMemo } from 'react';
import { Network } from '@/src/schemas/network';
import { Meme } from '@/src/schemas/meme';
import { createNetwork } from '@/src/lib/network-pipeline';
import { createMeme } from '@/src/lib/meme-pipeline';
import AStarVisualizer from '@/src/components/AStarVisualizer';
import CompetitiveMode from '@/src/components/CompetitiveMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, Target } from 'lucide-react';

export default function Home() {
  // Initialize with default network and meme using useMemo
  const initialNetwork = useMemo(() => createNetwork({
    size: 30,
    type: 'small-world',
    identity_distribution: {
      urban_professional: 0.3,
      university_student: 0.2,
      rural_traditional: 0.2,
      suburban_family: 0.2,
      tech_worker: 0.1,
    },
  }), []);

  const initialMeme = useMemo(() => createMeme(
    'political_conspiracy',
    'Test Conspiracy Theory'
  ), []);

  const [network, setNetwork] = useState<Network>(initialNetwork);
  const [meme, setMeme] = useState<Meme>(initialMeme);
  const [loading, setLoading] = useState(false);

  const generateNewNetwork = (type: 'small-world' | 'scale-free' | 'random') => {
    setLoading(true);
    setTimeout(() => {
      const newNetwork = createNetwork({
        size: 30,
        type,
        identity_distribution: {
          urban_professional: 0.25,
          university_student: 0.20,
          rural_traditional: 0.20,
          suburban_family: 0.20,
          tech_worker: 0.15,
        },
      });
      setNetwork(newNetwork);
      setLoading(false);
    }, 100);
  };

  const generateNewMeme = (contentType: 'political_conspiracy' | 'health_misinformation' | 'factual_news') => {
    const titles = {
      political_conspiracy: 'Political Conspiracy Theory',
      health_misinformation: 'Health Misinformation',
      factual_news: 'Factual News Article',
    };
    
    const newMeme = createMeme(contentType, titles[contentType]);
    setMeme(newMeme);
  };


  return (
    <main className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto">
          <h1 className="text-2xl font-bold">Memetic Warfare - A* Influence Pathfinding</h1>
          <p className="text-sm text-muted-foreground">
            Visualize how information spreads through social networks using A* algorithm
          </p>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="p-3 bg-white border-b">
        <div className="max-w-full mx-auto">
          <Tabs defaultValue="network" className="w-full">
            <TabsList className="grid w-64 grid-cols-2">
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="meme">Meme</TabsTrigger>
            </TabsList>

            <TabsContent value="network" className="mt-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateNewNetwork('small-world')}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Small-World
                  </Button>
                  <Button
                    onClick={() => generateNewNetwork('scale-free')}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Scale-Free
                  </Button>
                  <Button
                    onClick={() => generateNewNetwork('random')}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Random
                  </Button>
                </div>

                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="font-semibold">Nodes:</span> {network.nodes.length}
                  </div>
                  <div>
                    <span className="font-semibold">Edges:</span> {network.edges.length}
                  </div>
                  <div>
                    <span className="font-semibold">Avg Degree:</span>{' '}
                    {network.metadata.avg_degree.toFixed(2)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meme" className="mt-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateNewMeme('political_conspiracy')}
                    variant="outline"
                    size="sm"
                  >
                    Political
                  </Button>
                  <Button
                    onClick={() => generateNewMeme('health_misinformation')}
                    variant="outline"
                    size="sm"
                  >
                    Health
                  </Button>
                  <Button
                    onClick={() => generateNewMeme('factual_news')}
                    variant="outline"
                    size="sm"
                  >
                    Factual
                  </Button>
                </div>

                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="font-semibold">Title:</span> {meme.title}
                  </div>
                  <div>
                    <span className="font-semibold">Bias:</span>{' '}
                    {meme.attributes.political_bias.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-semibold">Accuracy:</span>{' '}
                    {meme.attributes.factual_accuracy.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-semibold">Virality:</span>{' '}
                    {meme.attributes.virality_factor.toFixed(2)}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Content - Mode Selection */}
      <div className="flex-1 p-4 overflow-hidden">
        <Tabs defaultValue="astar" className="h-full flex flex-col">
          <TabsList className="grid w-96 grid-cols-2 mb-4">
            <TabsTrigger value="astar" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              A* Pathfinding
            </TabsTrigger>
            <TabsTrigger value="competitive" className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Competitive Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="astar" className="flex-1 m-0 data-[state=active]:flex">
            <AStarVisualizer network={network} meme={meme} />
          </TabsContent>

          <TabsContent value="competitive" className="flex-1 m-0 data-[state=active]:flex">
            <CompetitiveMode network={network} meme={meme} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
