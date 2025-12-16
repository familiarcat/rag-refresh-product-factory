import { NextResponse } from 'next/server';
import { 
  extractVideoId, 
  fetchVideoMetadata, 
  generateProjectProposals,
  YouTubeVideo 
} from '../../../lib/youtube-analyzer';
import { appendEvent } from '../../../lib/store';

export async function POST(req: Request) {
  const { url, context } = await req.json();
  
  if (!url) {
    return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
  }

  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  // Fetch video metadata
  const metadata = await fetchVideoMetadata(videoId);
  
  const video: YouTubeVideo = {
    id: videoId,
    url: url,
    title: metadata.title,
    channel: metadata.channel,
    ...metadata,
  };

  // Generate project proposals using crew collaboration
  const projects = generateProjectProposals(video, context);

  // Log the event
  await appendEvent({
    type: 'youtube-projects',
    at: new Date().toISOString(),
    videoId,
    videoTitle: video.title,
    projectCount: projects.length,
    projectNames: projects.map(p => p.name),
  });

  return NextResponse.json({
    video,
    projects,
    crewParticipants: [
      { id: 'captain_picard', name: 'Captain Picard', role: 'Strategic Leadership', emoji: '👨‍✈️' },
      { id: 'commander_data', name: 'Commander Data', role: 'Analytics & AI/ML', emoji: '🤖' },
      { id: 'geordi_la_forge', name: 'Geordi La Forge', role: 'Infrastructure', emoji: '🔧' },
      { id: 'counselor_troi', name: 'Counselor Troi', role: 'User Experience', emoji: '💜' },
      { id: 'quark', name: 'Quark', role: 'Business Intelligence', emoji: '💰' },
    ],
    generatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'YouTube Projects API',
    usage: 'POST with { url: "YouTube URL", context?: "optional context" }',
    example: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      context: 'Focus on B2B SaaS opportunities',
    },
  });
}
