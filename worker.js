addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Example YouTube channel ID
  const channelId = 'YOUTUBE_KANAL_ID';
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    // Fetch the RSS feed
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    // Get the XML as a string
    const xmlText = await response.text();

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

    // Extract the href attribute value
    const hrefStart = linkTag.indexOf('href="');
    if (hrefStart === -1) {
      throw new Error('No href attribute in <link> tag');
    }
    const hrefStartIndex = hrefStart + 6; // Skip past 'href="'
    const hrefEnd = linkTag.indexOf('"', hrefStartIndex);
    if (hrefEnd === -1) {
      throw new Error('Malformed href attribute');
    }
    const latestVideoUrl = linkTag.substring(hrefStartIndex, hrefEnd);

    // Redirect to the latest video URL
    return Response.redirect(latestVideoUrl, 302);
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
