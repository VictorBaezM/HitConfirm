async function test() {
  try {
    const res = await fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json');
    console.log('Status:', res.status);
    console.log('Access-Control-Allow-Origin:', res.headers.get('access-control-allow-origin'));
    const json = await res.json();
    console.log('Title:', json.title);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
