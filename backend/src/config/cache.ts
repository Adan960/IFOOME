import { createClient } from 'redis';

const redis = createClient({url: 'redis://localhost:6380'});

redis.on('error', error => console.error(`Redis redis error:`, error));
redis.connect().then().catch(err => console.log(err));

export default redis;