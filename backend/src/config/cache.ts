import { createClient } from 'redis';

const redis = createClient({url: 'redis://localhost:6380'});

redis.on('error', (error: any) => console.error(`Redis redis error:`, error));
redis.connect().then().catch((err: any) => console.log(err));

export default redis;