async function handleRequest(request) {
  const channelId = 'YT-Channel-ID'; // Your channel ID
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    // Fetch the YouTube RSS feed
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    // Get the RSS feed content as text
    const xmlText = await response.text();

    // Extract the latest video URL and video ID
    const { videoUrl, videoId } = parseXmlToGetLatestUrl(xmlText);

    // Construct the YouTube deep link (for Android)
    const deepLink = `vnd.youtube://watch?v=${videoId}`;
    // Standard URL as fallback
    const fallbackUrl = videoUrl;

    // Create an HTML page with a script to attempt deep link and fallback
    const html = `
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <script>
    function redirectToYouTube() {
      // Try the deep link first
      window.location.href = "${deepLink}";
      
      // Set a timeout to fall back to the standard URL if deep link fails
      setTimeout(function() {
        window.location.href = "${fallbackUrl}";
      }, 500); // 500ms delay to give the app a chance to open
    }
  </script>
</head>
<body onload="redirectToYouTube()">
  <p>Redirecting to the latest video...</p>
  <p>If not redirected, <a href="${fallbackUrl}">click here</a>.</p>
</body>
</html>
`;

    // Return the HTML page as the response
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}

function parseXmlToGetLatestUrl(xmlText) {
  // Locate the first <entry> tag
  const entryStart = xmlText.indexOf('<entry>');
  if (entryStart === -1) {
    throw new Error('No <entry> tag found in RSS feed');
  }
  const entryEnd = xmlText.indexOf('</entry>', entryStart);
  if (entryEnd === -1) {
    throw new Error('Malformed RSS feed: missing </entry> tag');
  }
  const entryXml = xmlText.substring(entryStart, entryEnd + 8);

  // Find the <link> tag within the entry
  const linkStart = entryXml.indexOf('<link ');
  if (linkStart === -1) {
    throw new Error('No <link> tag found in first <entry>');
  }
  const linkEnd = entryXml.indexOf('>', linkStart);
  if (linkEnd === -1) {
    throw new Error('Malformed <link> tag');
  }
  const linkTag = entryXml.substring(linkStart, linkEnd + 1);

  // Extract the href attribute value (full URL)
  const hrefStart = linkTag.indexOf('href="');
  if (hrefStart === -1) {
    throw new Error('No href attribute in <link> tag');
  }
  const hrefStartIndex = hrefStart + 6; // Skip past 'href="'
  const hrefEnd = linkTag.indexOf('"', hrefStartIndex);
  if (hrefEnd === -1) {
    throw new Error('Malformed href attribute');
  }
  const videoUrl = linkTag.substring(hrefStartIndex, hrefEnd);

  // Extract the video ID from the URL
  const videoIdMatch = videoUrl.match(/[?&]v=([^&]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }

  return { videoUrl, videoId };
}

// Add the event listener for the fetch event
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
