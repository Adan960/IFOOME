import express from 'express';

import middleware from '../middleware/userAuth';

const router = express.Router();

router.get("/backend/", middleware,(_,res) => {
    res.send("Hello world");
});

export default router;