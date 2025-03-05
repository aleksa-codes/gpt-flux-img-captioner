export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ollamaUrl = url.searchParams.get('url') || 'http://localhost:11434';

    // Make a request to Ollama server root endpoint
    const response = await fetch(ollamaUrl, {
      method: 'HEAD',
      // Set a short timeout to avoid waiting too long for unreachable servers
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      return new Response(JSON.stringify({ status: 'running' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ status: 'error', message: response.statusText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error checking Ollama status:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect to Ollama server',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
