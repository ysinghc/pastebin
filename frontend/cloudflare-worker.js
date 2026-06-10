//generated using gemma 4 31b
export default {
  async scheduled(event, env, ctx) {
    const TARGET_URL = "https://ysinghc-pastebin-api.hf.space/health";

    console.log(`Pinging keep-alive endpoint: ${TARGET_URL}`);

    try {
      const response = await fetch(TARGET_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Cloudflare-KeepAlive-Worker',
        },
      });

      if (response.ok) {
        console.log(`Successfully pinged API. Status: ${response.status}`);
      } else {
        console.error(`API responded with error. Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error pinging API: ${error.message}`);
    }
  },
};
