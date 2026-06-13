import PQueue from 'p-queue';

// General-purpose queue — concurrency 10
const generalQueue = new PQueue({ concurrency: 10 });

// Campaign dispatch queue — rate limited: 100 per 60 seconds
const campaignQueue = new PQueue({
  concurrency: 10,
  intervalCap: 100,
  interval: 60000,
});

export { generalQueue, campaignQueue };
