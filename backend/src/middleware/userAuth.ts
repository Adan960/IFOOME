import jwt from 'jsonwebtoken';

const jwtSecret: string = process.env.JWT_SECRET || "";

function userAuth(req: any, res: any, next: any): void {
    if(req.headers['authorization'] && typeof(req.headers['authorization'].split(" ")[1]) == "string") {
        const token: string = req.headers['authorization'].split(" ")[1];
        if(token) {
            jwt.verify(token, jwtSecret, function(err: any, decoded: any): void {
                if(err == null && typeof(decoded.id) == "number") {
                    next();
                } else {
                    res.sendStatus(401);
                }
            }); 
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
}

export default userAuth;