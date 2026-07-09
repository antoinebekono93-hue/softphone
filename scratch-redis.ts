import { Redis } from '@upstash/redis';

const url = 'https://gcp-us-east4.memory.redis.io';
const token = 'mem1_GIU73kyucU-s7ssA4GvTSdahmigI_Bw9TVLRO45Ci9e8sipXrawVlOfe-dmFA9xeaiwxUxGakBjqeXYvdfKhD49TdwxNbLLuq5MXvvXJbYxIuT7XUj4Cp349fNSmSsE-JU71-m0XT9y8pqfG7Q==';

const redis = new Redis({
  url,
  token,
});

async function main() {
  try {
    console.log("Setting value...");
    await redis.set("test_agent_memory", "hello world");
    console.log("Getting value...");
    const val = await redis.get("test_agent_memory");
    console.log("Value:", val);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
