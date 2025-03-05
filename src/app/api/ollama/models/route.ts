export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // Get URL from the query parameter or use default
    const url = new URL(req.url);
    const ollamaUrl = url.searchParams.get('url') || 'http://localhost:11434';

    // Fetch models from Ollama
    const res = await fetch(`${ollamaUrl}/api/tags`);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch models' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the response properly
    const data = await res.json();

    // Return the models data in the expected format
    return new Response(JSON.stringify({ models: data.models || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return new Response(JSON.stringify({ error: 'Failed to connect to Ollama server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
