import express from 'express';

const router = express.Router();

router.get("/backend/",(_,res) => {
    res.send("Hello world");
});

export default router;